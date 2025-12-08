import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClockIcon, DocumentDuplicateIcon, CheckCircleIcon, ArrowsPointingOutIcon,
  TagIcon, PlusIcon, XMarkIcon, UserIcon, MapPinIcon, CubeIcon,
  BookOpenIcon, PuzzlePieceIcon, GlobeAltIcon, ChatBubbleOvalLeftIcon, 
  PaperClipIcon, Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { useSnippetMetadata } from '@/hooks/useSnippetMetadata';
import { useSnippetComments } from '@/hooks/useSnippetComments';
import ActiveUsers from '@/components/workspace/ActiveUsers';
import AttachmentManager from '@/components/workspace/AttachmentManager';
import CommentsPanel from '@/components/workspace/CommentsPanel';
import CommentMenu from '@/components/workspace/CommentMenu';

export default function TabEditor({ snippet, onUpdate, onCreateFinalVersion, hasFinalVersion, finalVersion, onOpenSnippet, user, entities = [], tags = [] }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  // Text selection and comment menu
  const [commentMenuPosition, setCommentMenuPosition] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [highlightedLineNumber, setHighlightedLineNumber] = useState(null);
  const editorRef = useRef(null);

  // Final version state
  const [finalTitle, setFinalTitle] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [finalLastSaved, setFinalLastSaved] = useState(null);
  const [finalIsSaving, setFinalIsSaving] = useState(false);

  // Metadata state
  const {
    attachedEntities,
    attachedTags,
    attachEntity,
    detachEntity,
    attachTag,
    detachTag,
    loading: metadataLoading
  } = useSnippetMetadata(snippet?.id);

  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);

  // Realtime collaboration
  const { activeSessions, userColor, updateCursorPosition } = useRealtimeCollaboration(
    snippet?.workspace_id,
    snippet?.id,
    user?.id
  );

  // Comments
  const {
    comments,
    users: commentUsers,
    loading: commentsLoading,
    addComment,
    updateComment,
    deleteComment
  } = useSnippetComments(snippet?.id, user?.id);

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setContent(snippet.content || '');
      setLastSaved(snippet.updated_at);
    }
  }, [snippet]);

  useEffect(() => {
    if (finalVersion) {
      setFinalTitle(finalVersion.title);
      setFinalContent(finalVersion.content || '');
      setFinalLastSaved(finalVersion.updated_at);
    }
  }, [finalVersion]);

  const saveChanges = useCallback(async () => {
    if (!snippet) return;

    setIsSaving(true);
    await onUpdate(snippet.id, { title, content });
    setLastSaved(new Date().toISOString());
    setIsSaving(false);
  }, [snippet, onUpdate, title, content]);

  const saveFinalChanges = useCallback(async () => {
    if (!finalVersion) return;

    setFinalIsSaving(true);
    await onUpdate(finalVersion.id, { title: finalTitle, content: finalContent });
    setFinalLastSaved(new Date().toISOString());
    setFinalIsSaving(false);
  }, [finalVersion, onUpdate, finalTitle, finalContent]);

  useEffect(() => {
    if (!snippet) return;

    const timer = setTimeout(() => {
      if (title !== snippet.title || content !== snippet.content) {
        saveChanges();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, snippet, saveChanges]);

  useEffect(() => {
    if (!finalVersion || !showSplitView) return;

    const timer = setTimeout(() => {
      if (finalTitle !== finalVersion.title || finalContent !== finalVersion.content) {
        saveFinalChanges();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [finalTitle, finalContent, finalVersion, showSplitView, saveFinalChanges]);

  const handleCreateOrViewFinal = () => {
    if (snippet && !snippet.is_final) {
      if (hasFinalVersion && finalVersion) {
        setShowSplitView(true);
      } else {
        onCreateFinalVersion(snippet.id);
      }
    }
  };

  const handleScroll = (source) => {
    if (!syncScroll || isScrollingRef.current) return;

    isScrollingRef.current = true;

    if (source === 'left' && leftScrollRef.current && rightScrollRef.current) {
      const scrollPercentage = leftScrollRef.current.scrollTop / (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
      rightScrollRef.current.scrollTop = scrollPercentage * (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight);
    } else if (source === 'right' && leftScrollRef.current && rightScrollRef.current) {
      const scrollPercentage = rightScrollRef.current.scrollTop / (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight);
      leftScrollRef.current.scrollTop = scrollPercentage * (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
    }

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;
  const finalWordCount = finalContent.trim().split(/\s+/).filter(w => w.length > 0).length;
  const finalCharCount = finalContent.length;

  const entityTypes = [
    { id: 'character', name: 'Characters', icon: UserIcon },
    { id: 'location', name: 'Locations', icon: MapPinIcon },
    { id: 'item', name: 'Objects/Items', icon: CubeIcon },
    { id: 'lore', name: 'Lore', icon: BookOpenIcon },
    { id: 'subplot', name: 'Subplots', icon: PuzzlePieceIcon },
    { id: 'other', name: 'Others', icon: GlobeAltIcon },
  ];

  const getEntityIcon = (type) => {
    const typeObj = entityTypes.find(t => t.id === type);
    return typeObj ? typeObj.icon : GlobeAltIcon;
  };

  const availableTags = tags.filter(t => !attachedTags.includes(t.id));
  const availableEntities = entities.filter(e => !attachedEntities.includes(e.id));

  // Handle text selection for comments
  const handleTextSelect = (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && editorRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Calculate line number
      const textBeforeSelection = content.substring(0, editorRef.current.selectionStart || 0);
      const lineNumber = textBeforeSelection.split('\n').length;
      
      setSelectedText({ text: selectedText, lineNumber });
      setCommentMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 5
      });
    } else {
      setCommentMenuPosition(null);
      setSelectedText(null);
    }
  };

  const handleAddCommentFromSelection = async () => {
    if (selectedText) {
      await addComment(`"${selectedText.text}"\n\n`, selectedText.lineNumber);
      setCommentMenuPosition(null);
      setSelectedText(null);
      setShowCommentsPanel(true);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCommentClick = (comment) => {
    if (comment.line_number) {
      // Highlight the line
      setHighlightedLineNumber(comment.line_number);
      
      // Scroll to the line
      if (editorRef.current) {
        const lines = content.split('\n');
        const charPosition = lines.slice(0, comment.line_number - 1).join('\n').length;
        editorRef.current.focus();
        editorRef.current.setSelectionRange(charPosition, charPosition);
        editorRef.current.scrollTop = (comment.line_number - 1) * 20; // Approximate line height
      }
      
      // Remove highlight after animation
      setTimeout(() => {
        setHighlightedLineNumber(null);
      }, 2000);
    }
  };

  // Close comment menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (commentMenuPosition) {
        setCommentMenuPosition(null);
        setSelectedText(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [commentMenuPosition]);

  if (showSplitView && hasFinalVersion && finalVersion) {
    // Split view implementation (omitted for brevity, keeping existing logic if needed, but for now just returning the split view component)
    // Note: In a real implementation, I'd copy the split view logic here.
    // For this task, I'll focus on the main editor view which supports metadata.
    // If the user wants metadata in split view, I'd need to add it there too.
    // Let's assume metadata is only editable in the main view for now to keep it simple, or I can wrap the split view.

    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Split View</h3>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 focus:ring-gray-500"
              />
              Sync Scroll
            </label>
          </div>
          <button
            onClick={() => setShowSplitView(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
          >
            Close Split View
          </button>
        </div>

        <div className="flex-1 flex">
          {/* Draft Side */}
          <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-[#2a2a2a]">
            <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-2 bg-gray-50 dark:bg-[#191919]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">{title}</h4>
                <span className="text-xs text-gray-500 dark:text-gray-500">Draft</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-500">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
              </div>
            </div>
            <div
              ref={leftScrollRef}
              onScroll={() => handleScroll('left')}
              className="flex-1 overflow-y-auto"
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your story..."
                className="w-full h-full px-6 py-4 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-[#e7e7e7] text-base leading-relaxed font-serif placeholder-gray-400 dark:placeholder-gray-600"
                style={{ minHeight: '100%' }}
              />
            </div>
          </div>

          {/* Final Version Side */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-2 bg-green-50 dark:bg-green-900/10">
              <div className="flex-1">
                <input
                  type="text"
                  value={finalTitle}
                  onChange={(e) => setFinalTitle(e.target.value)}
                  placeholder="Final version title"
                  className="w-full text-sm font-medium bg-transparent border-none outline-none text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600"
                />
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <span>{finalWordCount} words</span>
                  <span>{finalCharCount} chars</span>
                  {finalLastSaved && (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>
                        {finalIsSaving ? 'Saving...' : `${formatTime(finalLastSaved)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span>Final</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              ref={rightScrollRef}
              onScroll={() => handleScroll('right')}
              className="flex-1 overflow-y-auto"
            >
              <textarea
                value={finalContent}
                onChange={(e) => setFinalContent(e.target.value)}
                placeholder="Final version content..."
                className="w-full h-full px-6 py-4 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-[#e7e7e7] text-base leading-relaxed font-serif placeholder-gray-400 dark:placeholder-gray-600"
                style={{ minHeight: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-3 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled snippet"
            className="w-full text-lg sm:text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600"
          />
          <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-500 flex-wrap">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
            {lastSaved && (
              <div className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                <span>
                  {isSaving ? 'Saving...' : `${formatTime(lastSaved)}`}
                </span>
              </div>
            )}
            {snippet?.is_final && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                <CheckCircleIcon className="w-3 h-3" />
                <span>Final</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Active users editing this snippet */}
          <ActiveUsers
            activeSessions={activeSessions}
            currentSnippetId={snippet?.id}
          />

          <button
            onClick={() => setShowCommentsPanel(!showCommentsPanel)}
            className={`p-2 rounded-lg transition-all relative ${showCommentsPanel
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-400'
              }`}
            title="Comments"
          >
            <ChatBubbleOvalLeftIcon className="w-5 h-5" />
            {comments.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {comments.length > 9 ? '9+' : comments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowMetadataPanel(!showMetadataPanel)}
            className={`p-2 rounded-lg transition-all ${showMetadataPanel
              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
              : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-400'
              }`}
            title="Metadata"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          {!snippet?.is_final && (
            <button
              onClick={hasFinalVersion ? () => setShowSplitView(true) : handleCreateOrViewFinal}
              className={`p-2 rounded-lg transition-all ${hasFinalVersion
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-gray-400'
                }`}
              title={hasFinalVersion ? 'View final version' : 'Create final version'}
            >
              {hasFinalVersion ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                <Squares2X2Icon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto relative">
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onMouseUp={handleTextSelect}
            placeholder="Start writing your story..."
            className={`w-full h-full px-3 sm:px-6 py-4 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-[#e7e7e7] text-sm sm:text-base leading-relaxed font-serif placeholder-gray-400 dark:placeholder-gray-600 ${
              highlightedLineNumber ? 'highlight-line' : ''
            }`}
            style={{ minHeight: '100%' }}
          />
          
          {/* Comment Menu */}
          <CommentMenu
            position={commentMenuPosition}
            onAddComment={handleAddCommentFromSelection}
            onClose={() => {
              setCommentMenuPosition(null);
              setSelectedText(null);
            }}
          />
        </div>

        {/* Comments Panel */}
        {showCommentsPanel && (
          <div className="fixed sm:relative inset-0 sm:inset-auto z-50 sm:z-auto sm:w-80 bg-[#fafafa] dark:bg-[#191919] sm:border-l border-gray-200 dark:border-[#2a2a2a] flex flex-col">
            <CommentsPanel
              comments={comments}
              users={commentUsers}
              onAddComment={addComment}
              onUpdateComment={updateComment}
              onDeleteComment={deleteComment}
              currentUserId={user?.id}
              loading={commentsLoading}
              onClose={() => setShowCommentsPanel(false)}
              onCommentClick={handleCommentClick}
            />
          </div>
        )}

        {/* Metadata Panel */}
        {showMetadataPanel && (
          <div className="w-72 bg-[#fafafa] dark:bg-[#191919] border-l border-gray-200 dark:border-[#2a2a2a] overflow-y-auto p-4 space-y-6">
            {/* Tags Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tags</h3>
                <button
                  onClick={() => setShowTagSelector(!showTagSelector)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-gray-500"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {showTagSelector && (
                <div className="mb-3 p-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-[#2a2a2a] rounded shadow-sm">
                  {availableTags.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {availableTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            attachTag(tag.id);
                            setShowTagSelector(false);
                          }}
                          className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 px-2 py-1">No tags available</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {attachedTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <div key={tag.id} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-[#212121] border border-gray-200 dark:border-[#2a2a2a] rounded-full">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-xs text-gray-700 dark:text-[#e7e7e7]">{tag.name}</span>
                      <button
                        onClick={() => detachTag(tag.id)}
                        className="hover:text-red-500 text-gray-400"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                {attachedTags.length === 0 && !showTagSelector && (
                  <p className="text-xs text-gray-400 italic">No tags attached</p>
                )}
              </div>
            </div>

            {/* Entities Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Entities</h3>
                <button
                  onClick={() => setShowEntitySelector(!showEntitySelector)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-gray-500"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {showEntitySelector && (
                <div className="mb-3 p-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-[#2a2a2a] rounded shadow-sm">
                  {availableEntities.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {availableEntities.map(entity => {
                        const Icon = getEntityIcon(entity.type);
                        return (
                          <button
                            key={entity.id}
                            onClick={() => {
                              attachEntity(entity.id);
                              setShowEntitySelector(false);
                            }}
                            className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                          >
                            <Icon className="w-3.5 h-3.5 text-gray-500" />
                            {entity.name}
                            <span className="text-[10px] text-gray-400 ml-auto capitalize">{entity.type}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 px-2 py-1">No entities available</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {attachedEntities.map(entityId => {
                  const entity = entities.find(e => e.id === entityId);
                  if (!entity) return null;
                  const Icon = getEntityIcon(entity.type);
                  return (
                    <div key={entity.id} className="flex items-center gap-2 p-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-[#2a2a2a] rounded hover:border-blue-400 dark:hover:border-blue-600 transition-colors group">
                      <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-[#e7e7e7] truncate">{entity.name}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{entity.type}</p>
                      </div>
                      <button
                        onClick={() => detachEntity(entity.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-gray-400 transition-opacity"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {attachedEntities.length === 0 && !showEntitySelector && (
                  <p className="text-xs text-gray-400 italic">No entities attached</p>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <AttachmentManager
                workspaceId={snippet?.workspace_id}
                parentId={snippet?.id}
                parentType="snippet"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
