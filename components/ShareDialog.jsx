'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  LinkIcon,
  TrashIcon,
  CheckIcon,
  ClipboardIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export function ShareDialog({ isOpen, onClose, itemId, itemType, itemTitle, workspaceId }) {
  const [shareType, setShareType] = useState('public');
  const [accessLevel, setAccessLevel] = useState('view');
  const [emailInput, setEmailInput] = useState('');
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [isOpen]);

  const loadShares = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq(itemType === 'snippet' ? 'snippet_id' : 'folder_id', itemId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setShares(data);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  }, [itemId, itemType]);

  useEffect(() => {
    if (isOpen && itemId) {
      loadShares();
    }
  }, [isOpen, itemId, loadShares]);

  const handleAddEmail = () => {
    const email = emailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && emailRegex.test(email) && !allowedEmails.includes(email)) {
      setAllowedEmails([...allowedEmails, email]);
      setEmailInput('');
    } else if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
    }
  };

  const handleRemoveEmail = (email) => {
    setAllowedEmails(allowedEmails.filter(e => e !== email));
  };

  const handleCreateShare = async () => {
    if (shareType === 'email' && allowedEmails.length === 0) {
      alert('Please add at least one email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [itemType === 'snippet' ? 'snippet_id' : 'folder_id']: itemId,
          workspace_id: workspaceId,
          share_type: shareType,
          allowed_emails: shareType === 'email' ? allowedEmails : null,
          access_level: accessLevel
        })
      });

      if (response.ok) {
        const newShare = await response.json();
        setShares([newShare, ...shares]);
        setActiveTab('links');
        setEmailInput('');
        setAllowedEmails([]);
      }
    } catch (error) {
      console.error('Error creating share:', error);
      alert('Failed to create share');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShare = async (shareToken) => {
    if (!confirm('Are you sure you want to revoke this share?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/shares/${shareToken}`, { method: 'DELETE' });
      if (response.ok) {
        setShares(shares.filter(s => s.share_token !== shareToken));
      }
    } catch (error) {
      console.error('Error deleting share:', error);
      alert('Failed to delete share');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShare = async (shareToken, updates) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shares/${shareToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updated = await response.json();
        setShares(shares.map(s => s.share_token === shareToken ? updated : s));
      }
    } catch (error) {
      console.error('Error updating share:', error);
      alert('Failed to update share');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareUrl = (shareToken) => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2a2a2a] shadow-2xl rounded-xl">
        <DialogHeader className="pb-3 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-gray-100 dark:bg-[#2a2a2a]">
                <LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7]">
                  Share {itemTitle}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  Share this {itemType} with others via link or email
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-[#2a2a2a] p-0.5 rounded-lg">
            <TabsTrigger
              value="create"
              className="border-none data-[state=active]:bg-white dark:data-[state=active]:bg-[#191919] data-[state=active]:shadow-sm rounded-md transition-all text-gray-700 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#e7e7e7]"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <PlusIcon className="w-3.5 h-3.5" />
                New Share
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="links"
              className="border-none data-[state=active]:bg-white dark:data-[state=active]:bg-[#191919] data-[state=active]:shadow-sm rounded-md transition-all text-gray-700 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#e7e7e7]"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <LinkIcon className="w-3.5 h-3.5" />
                Active Shares ({shares.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Create Share Tab */}
          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Share Type Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
                Share Type
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setShareType('public')}
                  className={`p-3 border rounded-lg transition-all duration-200 text-left ${shareType === 'public'
                    ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-[#212121]'
                    : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#333] bg-white dark:bg-[#191919]'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${shareType === 'public' ? 'bg-gray-200 dark:bg-[#2a2a2a]' : 'bg-gray-100 dark:bg-[#212121]'}`}>
                      <GlobeAltIcon className={`w-4 h-4 ${shareType === 'public' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`} />
                    </div>
                    <div>
                      <div className={`font-medium text-xs ${shareType === 'public' ? 'text-gray-900 dark:text-[#e7e7e7]' : 'text-gray-700 dark:text-gray-400'}`}>
                        Public Link
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Anyone with the link</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShareType('email')}
                  className={`p-3 border rounded-lg transition-all duration-200 text-left ${shareType === 'email'
                    ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-[#212121]'
                    : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#333] bg-white dark:bg-[#191919]'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${shareType === 'email' ? 'bg-gray-200 dark:bg-[#2a2a2a]' : 'bg-gray-100 dark:bg-[#212121]'}`}>
                      <EnvelopeIcon className={`w-4 h-4 ${shareType === 'email' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`} />
                    </div>
                    <div>
                      <div className={`font-medium text-xs ${shareType === 'email' ? 'text-gray-900 dark:text-[#e7e7e7]' : 'text-gray-700 dark:text-gray-400'}`}>
                        Email Restricted
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Specific emails only</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-[#2a2a2a]" />

            {/* Email Addresses (for email share type) */}
            {shareType === 'email' && (
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
                  Allowed Email Addresses
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    className="flex-1 text-sm bg-white dark:bg-[#191919] border-gray-300 dark:border-[#2a2a2a] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 text-gray-900 dark:text-[#e7e7e7]"
                  />
                  <Button
                    onClick={handleAddEmail}
                    variant="secondary"
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-[#2a2a2a] dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] text-xs"
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1.5" />
                    Add
                  </Button>
                </div>

                {/* Email Tags */}
                {allowedEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allowedEmails.map(email => (
                      <div
                        key={email}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-[#333]"
                      >
                        <span className="text-xs">{email}</span>
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="hover:text-gray-900 dark:hover:text-[#e7e7e7] transition-colors"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 dark:text-gray-500">
                  Add email addresses of people you want to share with
                </p>
              </div>
            )}

            <Separator className="bg-gray-200 dark:bg-[#2a2a2a]" />

            {/* Access Level */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wide">
                Access Level
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setAccessLevel('view')}
                  className={`p-3 border rounded-lg transition-all duration-200 text-left ${accessLevel === 'view'
                    ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-[#212121]'
                    : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#333] bg-white dark:bg-[#191919]'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${accessLevel === 'view' ? 'bg-gray-200 dark:bg-[#2a2a2a]' : 'bg-gray-100 dark:bg-[#212121]'}`}>
                      <EyeIcon className={`w-4 h-4 ${accessLevel === 'view' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`} />
                    </div>
                    <div>
                      <div className={`font-medium text-xs ${accessLevel === 'view' ? 'text-gray-900 dark:text-[#e7e7e7]' : 'text-gray-700 dark:text-gray-400'}`}>
                        View Only
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Can view only</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setAccessLevel('edit')}
                  className={`p-3 border rounded-lg transition-all duration-200 text-left ${accessLevel === 'edit'
                    ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-[#212121]'
                    : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#333] bg-white dark:bg-[#191919]'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${accessLevel === 'edit' ? 'bg-gray-200 dark:bg-[#2a2a2a]' : 'bg-gray-100 dark:bg-[#212121]'}`}>
                      <PencilIcon className={`w-4 h-4 ${accessLevel === 'edit' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`} />
                    </div>
                    <div>
                      <div className={`font-medium text-xs ${accessLevel === 'edit' ? 'text-gray-900 dark:text-[#e7e7e7]' : 'text-gray-700 dark:text-gray-400'}`}>
                        Can Edit
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">View and edit</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Create Button */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateShare}
                disabled={loading || (shareType === 'email' && allowedEmails.length === 0)}
                className="flex-1 bg-[#e7e7e7] hover:bg-gray-300 dark:bg-[#282828] dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] font-medium text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 mr-1.5 border-2 border-gray-900 dark:border-[#e7e7e7] border-t-transparent rounded-full"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                    Create Share Link
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#212121] rounded-lg text-gray-700 dark:text-gray-400 text-xs"
              >
                Cancel
              </Button>
            </div>
          </TabsContent>

          {/* Shared Links Tab */}
          <TabsContent value="links" className="space-y-3 mt-4">
            {loading ? (
              <div className="py-12 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-400 dark:border-gray-600 border-t-transparent rounded-full mb-3"></div>
                <p className="text-xs text-gray-600 dark:text-gray-500">Loading shares...</p>
              </div>
            ) : shares.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 dark:bg-[#212121] rounded-lg border border-dashed border-gray-300 dark:border-[#2a2a2a]">
                <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">No active shares</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Create your first share to get started</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('create')}
                  className="mt-3 text-xs border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                >
                  <PlusIcon className="w-3.5 h-3.5 mr-1.5" />
                  Create Share
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="group p-3 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#191919] hover:border-gray-300 dark:hover:border-[#333] transition-all duration-200 space-y-3"
                  >
                    {/* Share Info Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <Badge variant={share.share_type === 'public' ? 'default' : 'secondary'}
                            className={`text-[10px] font-medium px-2 py-0.5 ${share.share_type === 'public'
                              ? 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#333]'
                              : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#333]'
                              }`}
                          >
                            {share.share_type === 'public' ? (
                              <>
                                <GlobeAltIcon className="w-2.5 h-2.5 mr-1" />
                                Public
                              </>
                            ) : (
                              <>
                                <EnvelopeIcon className="w-2.5 h-2.5 mr-1" />
                                Email Only
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline"
                            className="text-[10px] border px-2 py-0.5 border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 bg-white dark:bg-[#191919]"
                          >
                            {share.access_level === 'view' ? (
                              <>
                                <EyeIcon className="w-2.5 h-2.5 mr-1" />
                                View Only
                              </>
                            ) : (
                              <>
                                <PencilIcon className="w-2.5 h-2.5 mr-1" />
                                Can Edit
                              </>
                            )}
                          </Badge>
                        </div>

                        {share.share_type === 'email' && share.allowed_emails?.length > 0 && (
                          <div className="mb-1.5">
                            <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-1 font-medium">Allowed emails:</p>
                            <div className="flex flex-wrap gap-1">
                              {share.allowed_emails.map(email => (
                                <span
                                  key={email}
                                  className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded"
                                >
                                  {email}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteShare(share.share_token)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Share Link</Label>
                        <Button
                          onClick={() => copyToClipboard(getShareUrl(share.share_token))}
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-gray-500 hover:text-gray-900 dark:hover:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                        >
                          {copied ? (
                            <>
                              <CheckIcon className="w-3 h-3 mr-1 text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <ClipboardIcon className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-[#212121] rounded border border-gray-200 dark:border-[#2a2a2a]">
                        <p className="text-[10px] font-mono text-gray-700 dark:text-gray-400 truncate">
                          {getShareUrl(share.share_token)}
                        </p>
                      </div>
                    </div>

                    {/* Edit Access Level and Type */}
                    {currentUser?.id === share.shared_by && (
                      <div className="pt-2.5 border-t border-gray-200 dark:border-[#2a2a2a] space-y-2">
                        <Label className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Manage Share</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-medium text-gray-600 dark:text-gray-500">Access Level</Label>
                            <Select
                              value={share.access_level}
                              onValueChange={(value) =>
                                handleUpdateShare(share.share_token, { access_level: value })
                              }
                            >
                              <SelectTrigger className="text-xs h-7 bg-white dark:bg-[#191919] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#191919] border-gray-200 dark:border-[#2a2a2a]">
                                <SelectItem value="view" className="text-xs">View Only</SelectItem>
                                <SelectItem value="edit" className="text-xs">Can Edit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-medium text-gray-600 dark:text-gray-500">Share Type</Label>
                            <Select
                              value={share.share_type}
                              onValueChange={(value) =>
                                handleUpdateShare(share.share_token, { share_type: value })
                              }
                            >
                              <SelectTrigger className="text-xs h-7 bg-white dark:bg-[#191919] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-[#e7e7e7]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#191919] border-gray-200 dark:border-[#2a2a2a]">
                                <SelectItem value="public" className="text-xs">Public Link</SelectItem>
                                <SelectItem value="email" className="text-xs">Email Restricted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Created info */}
                    <div className="pt-2.5 border-t border-gray-200 dark:border-[#2a2a2a]">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-500">
                        <CalendarIcon className="w-3 h-3" />
                        <span>Created {new Date(share.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>{new Date(share.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
