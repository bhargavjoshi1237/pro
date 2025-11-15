import { useState, useEffect, useCallback, useRef } from 'react';
import { ClockIcon, DocumentDuplicateIcon, CheckCircleIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import ActiveUsers from '@/components/workspace/ActiveUsers';

export default function TabEditor({ snippet, onUpdate, onCreateFinalVersion, hasFinalVersion, finalVersion, onOpenSnippet, user }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  // Final version state
  const [finalTitle, setFinalTitle] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [finalLastSaved, setFinalLastSaved] = useState(null);
  const [finalIsSaving, setFinalIsSaving] = useState(false);

  // Realtime collaboration
  const { activeSessions, userColor, updateCursorPosition } = useRealtimeCollaboration(
    snippet?.workspace_id,
    snippet?.id,
    user?.id
  );

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

  if (showSplitView && hasFinalVersion && finalVersion) {
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
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-[#2a2a2a] text-blue-600 focus:ring-blue-500"
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
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-3 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
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
          
          {!snippet?.is_final && (
            <button
              onClick={hasFinalVersion ? () => setShowSplitView(true) : handleCreateOrViewFinal}
              className={`p-2 rounded transition-colors ${
                hasFinalVersion 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={hasFinalVersion ? 'View final version (split view)' : 'Create final version'}
            >
              {hasFinalVersion ? (
                <CheckCircleIcon className="w-4 h-4 text-white" />
              ) : (
                <DocumentDuplicateIcon className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your story..."
          className="w-full h-full px-3 sm:px-6 py-4 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-[#e7e7e7] text-sm sm:text-base leading-relaxed font-serif placeholder-gray-400 dark:placeholder-gray-600"
          style={{ minHeight: '100%' }}
        />
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
