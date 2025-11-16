'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { SupabaseProvider } from '@/lib/yjs-provider';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

export function CollaborativeEditor({ 
  snippetId, 
  workspaceId, 
  userId, 
  initialContent,
  onChange,
  placeholder = 'Start writing...',
  onWordCountChange 
}) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false, // Disable default history, Y.js handles it
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: userId,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1c1c1c]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const words = text.split(/\s+/).filter(word => word.length > 0).length;
      const chars = text.length;
      
      setWordCount(words);
      setCharCount(chars);
      
      onChange?.(html, words);
      onWordCountChange?.(words, chars);
    },
  });

  useEffect(() => {
    if (!snippetId || !workspaceId || !userId) return;

    // Setup IndexedDB persistence
    const indexeddbProvider = new IndexeddbPersistence(snippetId, ydoc);
    
    // Setup Supabase provider for real-time sync
    const supabaseProvider = new SupabaseProvider(ydoc, workspaceId, snippetId, userId);
    setProvider(supabaseProvider);

    // Track awareness (who's online)
    supabaseProvider.onawarenessupdate = ({ added, updated, removed }) => {
      const users = Array.from(supabaseProvider.awareness.entries()).map(([id, state]) => ({
        id,
        ...state,
      }));
      setActiveUsers(users);
    };

    return () => {
      indexeddbProvider.destroy();
      supabaseProvider.destroy();
    };
  }, [snippetId, workspaceId, userId, ydoc]);

  // Broadcast cursor position
  useEffect(() => {
    if (!editor || !provider) return;

    const updateCursor = () => {
      const { from, to } = editor.state.selection;
      provider.broadcastAwareness({
        cursor: { from, to },
        name: userId,
      });
    };

    editor.on('selectionUpdate', updateCursor);
    return () => editor.off('selectionUpdate', updateCursor);
  }, [editor, provider, userId]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#252525] px-2 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
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
        </div>

        {/* Stats and Active Users */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>
          {activeUsers.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeUsers.length} online
            </Badge>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
