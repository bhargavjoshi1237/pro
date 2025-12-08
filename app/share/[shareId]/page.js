'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DocumentTextIcon, FolderIcon, ExclamationTriangleIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId;

  const [share, setShare] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAccessLevel, setEditAccessLevel] = useState('view');
  const [editShareType, setEditShareType] = useState('public');
  const [editEmails, setEditEmails] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const loadShare = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/shares/${shareId}`);

        if (!response.ok) {
          if (response.status === 403) {
            setError('Access denied. Please check your email access or contact the share owner.');
          } else if (response.status === 404) {
            setError('Share not found or has been revoked.');
          } else {
            setError('Failed to load share');
          }
          return;
        }

        const data = await response.json();
        setShare(data.share);
        setContent(data.content);
        setEditAccessLevel(data.share.access_level);
        setEditShareType(data.share.share_type);
        setEditEmails(data.share.allowed_emails?.join(', ') || '');

        // Check if user is owner
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        if (authUser?.id === data.share.shared_by) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error('Error loading share:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadShare();
    }
  }, [shareId]);

  const handleUpdateShare = async () => {
    try {
      setEditLoading(true);
      const emailsArray = editEmails
        .split(',')
        .map(e => e.trim())
        .filter(e => e && e.includes('@'));

      const response = await fetch(`/api/shares/${shareId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          share_type: editShareType,
          allowed_emails: editShareType === 'email' ? emailsArray : null,
          access_level: editAccessLevel
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setShare(updated);
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating share:', error);
      alert('Failed to update share settings');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#191919] dark:to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading share...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#191919] dark:to-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 border-red-200 dark:border-red-900/30">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">Access Denied</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={() => router.push('/')} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!share || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#191919] dark:to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Share not found</p>
        </div>
      </div>
    );
  }

  const isSnippet = !!share.snippet_id;
  const isFolder = !!share.folder_id;
  const canEdit = share.access_level === 'edit' && user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#191919] dark:to-[#0a0a0a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {isSnippet ? (
              <DocumentTextIcon className="w-8 h-8 text-blue-500" />
            ) : (
              <FolderIcon className="w-8 h-8 text-yellow-500" />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[#e7e7e7]">
                {content.title || content.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Shared {isSnippet ? 'snippet' : 'folder'}
              </p>
            </div>
            {isOwner && (
              <Button onClick={() => setEditDialogOpen(true)} variant="outline">
                <ShareIcon className="w-4 h-4 mr-2" />
                Edit Share
              </Button>
            )}
          </div>

          {/* Share Info Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {share.share_type === 'public' ? '🔗 Public Link' : '📧 Email Only'}
            </Badge>
            <Badge variant="secondary">
              {share.access_level === 'view' ? '👁️ View Only' : '✏️ Can Edit'}
            </Badge>
            {share.share_type === 'email' && share.allowed_emails?.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {share.allowed_emails.length} email(s)
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Content */}
        <div className="mt-8">
          {isSnippet ? (
            // Snippet Content
            <div className="bg-white dark:bg-[#212121] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Content</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <div className="bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded border border-gray-200 dark:border-[#2a2a2a] font-mono text-sm text-gray-900 dark:text-[#e7e7e7] whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {content.content || <span className="text-gray-400">No content yet...</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Word Count</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-[#e7e7e7]">
                    {content.word_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900 dark:text-[#e7e7e7]">
                    {new Date(content.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Folder Content
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Folder Contents</h2>
              {content.snippets && content.snippets.length > 0 ? (
                <div className="grid gap-3">
                  {content.snippets.map(snippet => (
                    <Card
                      key={snippet.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-[#2a2a2a]"
                    >
                      <div className="flex items-start gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-[#e7e7e7]">{snippet.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {snippet.word_count || 0} words
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center border-gray-200 dark:border-[#2a2a2a]">
                  <p className="text-gray-600 dark:text-gray-400">This folder is empty</p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This share was created on {new Date(share.created_at).toLocaleDateString()}
            {isOwner && (
              <>
                <br />
                <Button
                  onClick={() => setEditDialogOpen(true)}
                  variant="link"
                  className="text-xs"
                >
                  Manage share settings
                </Button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Edit Share Dialog */}
      {isOwner && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Share Settings</DialogTitle>
              <DialogDescription>Update how this content is shared</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Share Type */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">
                  Share Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditShareType('public')}
                    className={`p-3 border-2 rounded-lg transition-all text-sm ${
                      editShareType === 'public'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">Public</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Anyone with link</div>
                  </button>
                  <button
                    onClick={() => setEditShareType('email')}
                    className={`p-3 border-2 rounded-lg transition-all text-sm ${
                      editShareType === 'email'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">Email Only</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Specific emails</div>
                  </button>
                </div>
              </div>

              {/* Email Input */}
              {editShareType === 'email' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">
                    Allowed Emails
                  </label>
                  <textarea
                    value={editEmails}
                    onChange={(e) => setEditEmails(e.target.value)}
                    placeholder="user1@example.com, user2@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Separate multiple emails with commas
                  </p>
                </div>
              )}

              {/* Access Level */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">
                  Access Level
                </label>
                <Select value={editAccessLevel} onValueChange={setEditAccessLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdateShare} disabled={editLoading} className="flex-1">
                  {editLoading ? 'Updating...' : 'Update Settings'}
                </Button>
                <Button onClick={() => setEditDialogOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
