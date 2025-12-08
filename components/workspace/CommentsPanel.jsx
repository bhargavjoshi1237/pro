'use client';

import { useState, useRef } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const textareaRef = useRef(null);

  const overallComments = comments.filter(c => c.line_number === null);
  const lineComments = comments.filter(c => c.line_number !== null);

  // Group line comments by line number
  const commentsByLine = lineComments.reduce((acc, comment) => {
    if (!acc[comment.line_number]) {
      acc[comment.line_number] = [];
    }
    acc[comment.line_number].push(comment);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await onAddComment(newComment.trim(), null);
    setNewComment('');
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;
    
    const success = await onUpdateComment(commentId, editContent.trim());
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (commentId) => {
    setDeleteConfirm(commentId);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await onDeleteComment(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getUserName = (userId) => {
    const user = users[userId];
    if (!user) {
      // If user data not loaded yet, show "Loading..." instead of "Anonymous"
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

  const getAvatarColor = (userId) => {
    // Generate consistent color based on userId
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = userId ? userId.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const CommentItem = ({ comment, showLineNumber = false }) => {
    const isEditing = editingId === comment.id;
    const isOwner = comment.user_id === currentUserId;
    const avatarColor = getAvatarColor(comment.user_id);

    return (
      <div 
        className="group p-2.5 bg-white dark:bg-[#212121] border border-gray-200 dark:border-[#2a2a2a] rounded hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
        onClick={() => onCommentClick?.(comment)}
      >
        <div className="flex items-start gap-2">
          {/* User Avatar */}
          <div className={`w-7 h-7 rounded-full ${avatarColor} text-white flex items-center justify-center text-[10px] font-medium shrink-0`}>
            {getUserInitials(comment.user_id)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-xs font-medium text-gray-900 dark:text-[#e7e7e7]">
                  {getUserName(comment.user_id)}
                </span>
                {showLineNumber && comment.line_number && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    Line {comment.line_number}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {formatTime(comment.created_at)}
                </span>
                {comment.updated_at !== comment.created_at && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">• edited</span>
                )}
              </div>
              {isOwner && !isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded transition-all"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(comment);
                    }}>
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(comment.id);
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#191919] border border-gray-300 dark:border-[#383838] rounded resize-none text-gray-900 dark:text-[#e7e7e7] focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(comment.id);
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="px-2.5 py-1 text-xs bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap wrap-break-word">
                {comment.content}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-xs text-gray-400">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-[#191919]">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">
            Comments
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({comments.length})
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-gray-500 transition-colors"
            title="Close comments"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <ChatBubbleLeftIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-xs text-gray-400 dark:text-gray-500">No comments yet</p>
          </div>
        ) : (
          <>
            {/* Overall Comments Section */}
            {overallComments.length > 0 && (
              <div className="space-y-2">
                {overallComments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}

            {/* Line Comments Section */}
            {Object.keys(commentsByLine).length > 0 && (
              <div className="space-y-2">
                {Object.entries(commentsByLine)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([lineNumber, lineComments]) => (
                    <div key={lineNumber} className="space-y-2">
                      {lineComments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} showLineNumber />
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="p-3 border-t border-gray-200 dark:border-[#2a2a2a]">
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-2.5 py-2 text-xs bg-white dark:bg-[#212121] border border-gray-300 dark:border-[#383838] rounded resize-none text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (newComment.trim()) {
                  handleSubmit(e);
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="w-full px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-300 dark:disabled:bg-[#2a2a2a] disabled:cursor-not-allowed text-white dark:text-gray-900 rounded transition-colors"
          >
            Add Comment
          </button>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Confirm to delete comment"
        message="This is permanent! Are you sure you want to delete this comment?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
