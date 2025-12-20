'use client';

import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function StickyNoteNode({ data, isConnectable }) {
  const [text, setText] = useState(data.text || '');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== data.text && data.onUpdate) {
      data.onUpdate(data.itemId, { content: { text } });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(data.itemId);
    }
  };

  const backgroundColor = data.style?.backgroundColor || '#2a2a2a';
  const textColor = data.style?.color || '#9ca3af';

  return (
    <div 
      className="relative group"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Handles on all sides, but invisible */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-top-2" />
      <Handle type="source" position={Position.Top} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-top-2" />
      <Handle type="target" position={Position.Right} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-right-2" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-right-2" />
      <Handle type="target" position={Position.Bottom} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-bottom-2" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-bottom-2" />
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-left-2" />
      <Handle type="source" position={Position.Left} isConnectable={isConnectable} className="!opacity-0 !w-4 !h-4 !-left-2" />
      
      <div 
        className="w-full h-full p-8 rounded shadow-lg transition-shadow flex items-center justify-center text-center"
        style={{ 
          backgroundColor,
          color: textColor,
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-lg text-center"
            style={{ color: textColor }}
            placeholder="Start typing..."
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="w-full h-full text-lg whitespace-pre-wrap break-words cursor-text flex items-center justify-center"
          >
            {text || 'Start typing...'}
          </div>
        )}

        {/* Toolbar - appears on hover */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-[#2a2a2a] rounded-lg shadow-lg border border-[#3a3a3a] p-1 flex gap-1">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-red-900/20 transition-colors"
              title="Delete note"
            >
              <TrashIcon className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
