'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  ChatBubbleLeftIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function CommentsPanel({
  comments,
  users = {},
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  currentUserId,
  loading,
  onClose,
  onCommentClick
}) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const textareaRef = useRef(null);

  const overallComments = comments.filter(c => c.line_number === null);
  const lineComments = comments.filter(c => c.line_number !== null);

  const userList = useMemo(() => Object.values(users), [users]);

  const commentsByLine = lineComments.reduce((acc, comment) => {
    if (!acc[comment.line_number]) {
      acc[comment.line_number] = [];
    }
    acc[comment.line_number].push(comment);
    return acc;
  }, {});

  const handleInputChange = (e) => {
    const value = e.target.value;
    const newCursorPosition = e.target.selectionStart;

    setNewComment(value);
    setCursorPosition(newCursorPosition);

    // Detect if we are typing a mention
    const textBeforeCursor = value.slice(0, newCursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbolIndex !== -1) {
      const isAtStart = lastAtSymbolIndex === 0;
      const isPrecededBySpace = textBeforeCursor[lastAtSymbolIndex - 1] === ' ' || textBeforeCursor[lastAtSymbolIndex - 1] === '\n';

      if (isAtStart || isPrecededBySpace) {
        const query = textBeforeCursor.slice(lastAtSymbolIndex + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionQuery(query);
          setShowMentions(true);
          return;
        }
      }
    }
    setShowMentions(false);
  };

  const handleSelectUser = (user) => {
    const textBeforeCursor = newComment.slice(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newComment.slice(cursorPosition);

    const userName = getUserName(user.id); // Use the helper to get the display name
    // Replace the query with the username
    const newText = textBeforeCursor.slice(0, lastAtSymbolIndex) + `@${userName} ` + textAfterCursor;

    setNewComment(newText);
    setShowMentions(false);

    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPosition = lastAtSymbolIndex + userName.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return userList;
    return userList.filter(user => {
      const name = user.full_name || user.email || '';
      return name.toLowerCase().includes(mentionQuery.toLowerCase());
    });
  }, [userList, mentionQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await onAddComment(newComment.trim(), null);
    setNewComment('');
    setShowMentions(false);
  };

  const getUserName = (userId) => {
    const user = users[userId];
    if (!user) {
      return userId === currentUserId ? 'You' : 'Loading...';
    }
    return user?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = (userId) => {
    const user = users[userId];
    if (!user) {
      return userId === currentUserId ? 'ME' : '??';
    }
    const name = getUserName(userId);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, showLineNumber = false }) => {
    const isEditing = editingId === comment.id;
    const isOwner = comment.user_id === currentUserId;
    const user = users[comment.user_id];

    return (
      <div
        className={cn(
          "group relative flex gap-3 p-3 rounded-xl transition-all",
          "hover:bg-gray-100/50 dark:hover:bg-white/5",
          "border border-transparent hover:border-gray-200 dark:hover:border-white/10"
        )}
      >
        <Avatar className="w-8 h-8 border border-gray-200 dark:border-gray-800">
          <AvatarImage src={user?.avatar_url} alt={getUserName(comment.user_id)} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-bold">
            {getUserInitials(comment.user_id)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {getUserName(comment.user_id)}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {formatTime(comment.created_at)}
              </span>
              {showLineNumber && comment.line_number && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md font-medium">
                  Line {comment.line_number}
                </span>
              )}
            </div>

            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}>
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirm(comment.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setEditContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!editContent.trim()) return;
                    const success = await onUpdateComment(comment.id, editContent.trim());
                    if (success) {
                      setEditingId(null);
                      setEditContent('');
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed cursor-pointer"
              onClick={() => onCommentClick?.(comment)}
            >
              {comment.content.split(/(@\w+(?:\s\w+)?)/g).map((part, i) => {
                // Determine if this part is a mention
                // This is a naive check; ideally we'd link to user IDs
                if (part.startsWith('@')) {
                  return <span key={i} className="text-blue-600 dark:text-blue-400 font-medium">{part}</span>;
                }
                return part;
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <LoadingSpinner size="md" color="gray" />
        <p className="text-sm text-gray-500">Loading discussion...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fbfbfb] dark:bg-[#121212]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <ChatBubbleLeftIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Discussion</h3>
            <p className="text-[10px] text-gray-500 font-medium">{comments.length} comments</p>
          </div>
        </div>

        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <XMarkIcon className="w-4 h-4 dark:text-white " />
          </Button>
        )}
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1 w-full p-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No comments yet</h4>
            <p className="text-xs text-gray-500 max-w-[200px]">
              Start the conversation by adding a comment below.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Comments */}
            {overallComments.length > 0 && (
              <div className="space-y-4">
                {overallComments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}

            {/* Line Comments */}
            {Object.keys(commentsByLine).length > 0 && (
              <div className="space-y-4">
                {overallComments.length > 0 && <div className="h-px bg-gray-200 dark:bg-gray-800 my-4" />}
                {Object.entries(commentsByLine)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([lineNumber, lineComments]) => (
                    <div key={lineNumber} className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          Line {lineNumber}
                        </span>
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                      </div>
                      {lineComments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} showLineNumber />
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 backdrop-blur-xl relative z-20">
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800 text-[10px] font-medium text-gray-400 uppercase">
              Suggested Users
            </div>
            <ScrollArea className="max-h-48">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                    <AvatarFallback className="text-[10px]">{getUserInitials(user.id)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {user.full_name || 'Unknown User'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {user.email}
                    </span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Plus Button */}
          <button
            type="button"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <div className="relative flex items-center w-full rounded-full bg-gray-100 dark:bg-[#1a1a1a] border border-transparent dark:border-white/10 focus-within:border-gray-300 dark:focus-within:border-gray-700 transition-all overflow-hidden h-[40px]">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newComment.trim()) handleSubmit(e);
                  }
                }}
                placeholder="Send a message..."
                className="w-full h-full py-[10px] px-4 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 resize-none leading-5 scrollbar-hide"
                style={{ height: '40px', minHeight: '40px', maxHeight: '40px' }}
                rows={1}
              />
              {/* Waveform/Voice Icon Placeholder */}
              <div className="absolute right-3 flex items-center gap-2">
                <button
                  type="button"
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C11.4477 2 11 2.44772 11 3V21C11 21.5523 11.4477 22 12 22C12.5523 22 13 21.5523 13 21V3C13 2.44772 12.5523 2 12 2Z" />
                    <path d="M7 6C6.44772 6 6 6.44772 6 7V17C6 17.5523 6.44772 18 7 18C7.55228 18 8 17.5523 8 17V7C8 6.44772 7.55228 6 7 6Z" />
                    <path d="M17 6C16.4477 6 16 6.44772 16 7V17C16 17.5523 16.4477 18 17 18C17.5523 18 18 17.5523 18 17V7C18 6.44772 17.5523 6 17 6Z" />
                    <path d="M2 9C1.44772 9 1 9.44772 1 10V14C1 14.5523 1.44772 15 2 15C2.55228 15 3 14.5523 3 14V10C3 9.44772 2.55228 9 2 9Z" />
                    <path d="M22 9C21.4477 9 21 9.44772 21 10V14C21 14.5523 21.4477 15 22 15C22.5523 15 23 14.5523 23 14V10C23 9.44772 22.5523 9 22 9Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Hidden submit button to allow Enter to submit naturally if we wanted standard form behavior, but we have onKeyDown */}
            <button type="submit" className="hidden" />
          </div>
        </form>
        <p className="text-[10px] text-center mt-2 text-gray-400">
          Markdown supported • Press Enter to send
        </p>
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (deleteConfirm) {
            await onDeleteComment(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
