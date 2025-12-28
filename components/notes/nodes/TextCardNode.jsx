'use client';

import { useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { TrashIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

export default function TextCardNode({ id, data, isConnectable, selected }) {
  const [title, setTitle] = useState(data.title || '');
  const [text, setText] = useState(data.text || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== data.title && data.onUpdate) {
      data.onUpdate(data.itemId, { content: { title, text } });
    }
  };

  const handleTextBlur = () => {
    setIsEditingText(false);
    if (text !== data.text && data.onUpdate) {
      data.onUpdate(data.itemId, { content: { title, text } });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(data.itemId);
    }
  };

  const backgroundColor = data.style?.backgroundColor || '#ffffff';
  const textColor = data.style?.color || '#000000';

  return (
    <div 
      className="relative group w-full h-full"
    >
      <NodeResizer 
        color="#3b82f6" 
        isVisible={selected} 
        minWidth={200} 
        minHeight={100} 
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
          top: 0, 
          right: 0, 
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
        className="w-full h-full rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-[#3a3a3a] overflow-hidden flex flex-col"
        style={{ 
          backgroundColor,
          color: textColor,
        }}
      >
        {/* Title */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-[#3a3a3a]">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              autoFocus
              className="w-full bg-transparent border-none outline-none font-semibold text-sm"
              style={{ color: textColor }}
              placeholder="Title"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="font-semibold text-sm cursor-text truncate"
            >
              {title || 'Click to add title...'}
            </h3>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 p-4 overflow-auto">
          {isEditingText ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleTextBlur}
              autoFocus
              className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
              style={{ color: textColor }}
              placeholder="Type your text..."
            />
          ) : (
            <div
              onClick={() => setIsEditingText(true)}
              className="w-full h-full text-sm whitespace-pre-wrap break-words cursor-text"
            >
              {text || 'Click to edit...'}
            </div>
          )}
        </div>

        {/* Toolbar - appears on hover or when selected */}
        <div className={`absolute -top-12 left-0 right-0 flex items-center justify-center gap-1 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a] p-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              title="Delete card"
            >
              <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className={`w-3 h-3 !bg-blue-500 border-2 border-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      />
    </div>
  );
}
