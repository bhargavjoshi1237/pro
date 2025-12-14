'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import { SparklesIcon, XMarkIcon, checkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useState, useRef } from 'react';

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }) {
  // Inline Input State
  const [showInlineInput, setShowInlineInput] = useState(false);
  const [inlineInputValue, setInlineInputValue] = useState('');
  const [inlineInputPos, setInlineInputPos] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1c1c1c]',
      },
      handleKeyDown: (view, event) => {
        // Ctrl+I for Inline Input
        if (event.ctrlKey && event.key === 'i') {
          event.preventDefault();
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          // Calculate relative position to editor container if possible, or just use absolute page coords
          // For simplicity, we'll use a fixed centered approach or try to position near cursor
          // But since we are inside a relative container, let's try to just open it.
          // We'll set generic position for now or handle it via UI.
          setShowInlineInput(true);
          setInlineInputValue('');
          return true;
        }
        // Tab to accept suggestion
        if (event.key === 'Tab' && suggestion) {
          event.preventDefault();
          acceptSuggestion();
          return true;
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      onChange?.(html, wordCount);
    },
  });

  const { suggestion, loading: aiLoading, acceptSuggestion, clearSuggestion } = useAutocomplete(editor);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle Inline Input Submit
  const handleInlineSubmit = async () => {
    if (!inlineInputValue.trim() || !editor) return;

    // Mock processing
    const prompt = inlineInputValue.trim();
    setShowInlineInput(false);
    setInlineInputValue('');

    // Insert a loading placeholder or just wait
    // For now, let's simulate insertion
    editor.chain().focus().insertContent(` [AI: ${prompt}] `).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden bg-white dark:bg-[#1c1c1c] relative">
      {/* Inline Input Dialog */}
      {showInlineInput && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-3/4 max-w-lg shadow-2xl rounded-xl border border-blue-500/30 bg-white/90 dark:bg-[#1c1c1c]/90 backdrop-blur-md p-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-600 animate-pulse" />
            <input
              autoFocus
              value={inlineInputValue}
              onChange={(e) => setInlineInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleInlineSubmit();
                }
                if (e.key === 'Escape') setShowInlineInput(false);
              }}
              placeholder="Ask AI to write something..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400"
            />
            <button onClick={handleInlineSubmit} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full text-blue-600">
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Suggestion Overlay */}
      {suggestion && (
        <div className="absolute bottom-4 right-4 z-40 max-w-sm bg-white dark:bg-[#252525] border border-purple-200 dark:border-purple-900/50 shadow-lg rounded-lg p-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Suggestion</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-2 font-serif">"{suggestion}"</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={acceptSuggestion}
                  className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium flex items-center gap-1"
                >
                  <span>Tab</span>
                  <span>Accept</span>
                </button>
                <button
                  onClick={clearSuggestion}
                  className="text-xs px-2 py-1 hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#252525] px-2 py-2 flex gap-1 flex-wrap">
        <Button
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className="h-8 w-8 p-0"
        >
          <BoldIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className="h-8 w-8 p-0"
        >
          <ItalicIcon className="w-4 h-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
          className="h-8 px-2 font-semibold text-sm"
        >
          H1
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className="h-8 px-2 font-semibold text-sm"
        >
          H2
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
          className="h-8 px-2 font-semibold text-sm"
        >
          H3
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className="h-8 w-8 p-0"
        >
          <ListBulletIcon className="w-4 h-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className="h-8 w-8 p-0"
        >
          <NumberedListIcon className="w-4 h-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
          className="h-8 px-2 text-sm"
        >
          &ldquo;
        </Button>
        <Button
          variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className="h-8 px-2 text-sm font-mono"
        >
          {'</>'}
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
