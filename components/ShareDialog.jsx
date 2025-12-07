'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LinkIcon, TrashIcon, CheckIcon, ClipboardIcon, GlobeAltIcon, EnvelopeIcon, LockClosedIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function ShareDialog({ isOpen, onClose, itemId, itemType, itemTitle, workspaceId }) {
  const [shareType, setShareType] = useState('public');
  const [accessLevel, setAccessLevel] = useState('view');
  const [emailInput, setEmailInput] = useState('');
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, itemId, itemType]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq(itemType === 'snippet' ? 'snippet_id' : 'folder_id', itemId);

      if (!error && data) {
        setShares(data);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = () => {
    if (emailInput.trim() && !allowedEmails.includes(emailInput.trim())) {
      setAllowedEmails([...allowedEmails, emailInput.trim()]);
      setEmailInput('');
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
        setShares([...shares, newShare]);
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
      <DialogContent className="max-w-2xl bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] shadow-xl">
        <DialogHeader className="pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-[#e7e7e7] flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-blue-500" />
            Share "{itemTitle}"
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Control how this {itemType} is shared with others
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-lg">
            <TabsTrigger value="create" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2a2a2a] rounded-md transition-all">
              <span className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Create Share
              </span>
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2a2a2a] rounded-md transition-all">
              <span className="flex items-center gap-2">
                <GlobeAltIcon className="w-4 h-4" />
                Shared Links ({shares.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Create Share Tab */}
          <TabsContent value="create" className="space-y-6 mt-6">
            {/* Share Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-900 dark:text-[#e7e7e7] flex items-center gap-2">
                <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                Sharing Method
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShareType('public')}
                  className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                    shareType === 'public'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-[#2a2a2a] hover:border-blue-300 dark:hover:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a]'
                  }`}
                >
                  <GlobeAltIcon className={`w-5 h-5 mb-2 ${shareType === 'public' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className={`font-semibold text-sm ${shareType === 'public' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-[#e7e7e7]'}`}>
                    Public Link
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Anyone with link</div>
                </button>
                <button
                  onClick={() => setShareType('email')}
                  className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                    shareType === 'email'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                      : 'border-gray-200 dark:border-[#2a2a2a] hover:border-purple-300 dark:hover:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a]'
                  }`}
                >
                  <EnvelopeIcon className={`w-5 h-5 mb-2 ${shareType === 'email' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <div className={`font-semibold text-sm ${shareType === 'email' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-[#e7e7e7]'}`}>
                    Email Only
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Specific emails</div>
                </button>
              </div>
            </div>

            <Separator className="dark:bg-[#2a2a2a]" />

            {/* Email Addresses (for email share type) */}
            {shareType === 'email' && (
              <div className="space-y-3 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-900/30">
                <Label htmlFor="email-input" className="text-sm font-bold text-gray-900 dark:text-[#e7e7e7] flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-purple-500" />
                  Allowed Email Addresses
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="user@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    className="flex-1 bg-white dark:bg-[#0f0f0f] border-gray-300 dark:border-[#3a3a3a] focus:ring-2 focus:ring-purple-500"
                  />
                  <Button 
                    onClick={handleAddEmail} 
                    variant="outline"
                    className="border-purple-200 dark:border-[#3a3a3a] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    Add
                  </Button>
                </div>

                {/* Email Tags */}
                {allowedEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {allowedEmails.map(email => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-200 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200">
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator className="dark:bg-[#2a2a2a]" />

            {/* Access Level */}
            <div className="space-y-3">
              <Label htmlFor="access-level" className="text-sm font-bold text-gray-900 dark:text-[#e7e7e7] flex items-center gap-2">
                <LockClosedIcon className="w-4 h-4 text-green-500" />
                Access Permissions
              </Label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger id="access-level" className="bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#2a2a2a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                  <SelectItem value="view" className="flex items-center gap-2">
                    <span>👁️ View Only</span>
                  </SelectItem>
                  <SelectItem value="edit">
                    <span>✏️ Can Edit</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {accessLevel === 'view' ? 'Recipients can view but not modify content' : 'Recipients can view and edit content'}
              </p>
            </div>

            <Separator className="dark:bg-[#2a2a2a]" />

            {/* Create Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateShare}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </TabsContent>

          {/* Shared Links Tab */}
          <TabsContent value="links" className="space-y-4 mt-6">
            {shares.length === 0 ? (
              <div className="py-12 text-center bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
                <LinkIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No shares created yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create one above to share this {itemType}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#1a1a1a] hover:shadow-md transition-all duration-200 space-y-3"
                  >
                    {/* Share Info Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`${
                            share.share_type === 'public' 
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                              : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          }`}>
                            {share.share_type === 'public' ? '🔗 Public' : '📧 Email Only'}
                          </Badge>
                          <Badge className={`${
                            share.access_level === 'view'
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                              : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                          }`}>
                            {share.access_level === 'view' ? '👁️ View' : '✏️ Edit'}
                          </Badge>
                        </div>
                        {share.share_type === 'email' && share.allowed_emails?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {share.allowed_emails.map(email => (
                              <Badge key={email} variant="outline" className="text-xs bg-gray-50 dark:bg-[#0f0f0f]">
                                {email}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteShare(share.share_token)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2 bg-gray-50 dark:bg-[#0f0f0f] p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Share Link</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={getShareUrl(share.share_token)}
                          className="text-xs bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#3a3a3a] font-mono"
                        />
                        <Button
                          onClick={() => copyToClipboard(getShareUrl(share.share_token))}
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-gray-300 dark:border-[#2a2a2a] hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          {copied ? (
                            <CheckIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <ClipboardIcon className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Edit Access Level and Type */}
                    {currentUser?.id === share.shared_by && (
                      <div className="pt-3 border-t border-gray-200 dark:border-[#2a2a2a] space-y-3">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          Manage Share
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`access-${share.id}`} className="text-xs font-semibold">Access</Label>
                            <Select
                              value={share.access_level}
                              onValueChange={(value) =>
                                handleUpdateShare(share.share_token, { access_level: value })
                              }
                            >
                              <SelectTrigger id={`access-${share.id}`} className="text-xs bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#2a2a2a]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                                <SelectItem value="view">View Only</SelectItem>
                                <SelectItem value="edit">Can Edit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`type-${share.id}`} className="text-xs font-semibold">Type</Label>
                            <Select
                              value={share.share_type}
                              onValueChange={(value) =>
                                handleUpdateShare(share.share_token, { share_type: value })
                              }
                            >
                              <SelectTrigger id={`type-${share.id}`} className="text-xs bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-[#2a2a2a]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="email">Email Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Created info */}
                    <div className="pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Created {new Date(share.created_at).toLocaleDateString()} at {new Date(share.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
