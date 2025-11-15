import { useState, useEffect, useCallback } from 'react';
import { ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Editor({ snippet, onUpdate }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setContent(snippet.content || '');
      setLastSaved(snippet.updated_at);
    } else {
      setTitle('');
      setContent('');
      setLastSaved(null);
    }
  }, [snippet]);

  const saveChanges = useCallback(async () => {
    if (!snippet) return;

    setIsSaving(true);
    await onUpdate(snippet.id, { title, content });
    setLastSaved(new Date().toISOString());
    setIsSaving(false);
  }, [snippet, onUpdate, title, content]);

  useEffect(() => {
    if (!snippet) return;

    const timer = setTimeout(() => {
      if (title !== snippet.title || content !== snippet.content) {
        saveChanges();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, snippet, saveChanges]);

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;

  if (!snippet) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#212121]">
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Select a snippet to start writing</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#212121]">
      <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6 py-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled snippet"
          className="w-full text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600"
        />
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your story..."
          className="w-full h-full px-6 py-4 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-[#e7e7e7] text-base leading-relaxed font-serif placeholder-gray-400 dark:placeholder-gray-600"
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
