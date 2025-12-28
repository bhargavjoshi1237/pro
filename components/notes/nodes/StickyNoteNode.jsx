'use client';

import { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { TrashIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

export default function StickyNoteNode({ id, data, isConnectable, selected }) {
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
      data.onUpdate(id, { content: { text } });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const backgroundColor = data.style?.backgroundColor || '#2a2a2a';
  const textColor = data.style?.color || '#9ca3af';

  return (
    <div 
      className="relative group w-full h-full"
    >
      <NodeResizer 
        color="#3b82f6" 
        isVisible={selected} 
        minWidth={200} 
        minHeight={80} 
      />

      {/* Target handles on all sides (invisible) */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!opacity-0 !w-full !h-2 !-top-1" />
      <Handle type="target" position={Position.Bottom} isConnectable={isConnectable} className="!opacity-0 !w-full !h-2 !-bottom-1" />
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!opacity-0 !w-2 !h-full !-left-1" />
      <Handle type="target" position={Position.Right} isConnectable={isConnectable} className="!opacity-0 !w-2 !h-full !-right-1" />

      {/* Connection Point (Source) - Top Right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          top: '0',
          right: '0',
          transform: 'translate(50%, -50%)',
          background: '#3b82f6',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          borderRadius: '50%',
          zIndex: 50,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        className={`transition-opacity cursor-crosshair ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        isConnectable={isConnectable}
      >
        <ArrowUpRightIcon className="w-4 h-4 text-white" />
      </Handle>
      
      <div 
        className="w-full h-full p-6 rounded shadow-lg transition-shadow flex items-center justify-center text-center"
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

        {/* Toolbar - appears on hover or when selected */}
        <div className={`absolute -top-12 left-0 right-0 flex items-center justify-center gap-1 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="bg-[#2a2a2a] rounded-lg shadow-lg border border-[#3a3a3a] p-1 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
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
