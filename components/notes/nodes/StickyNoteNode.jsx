'use client';

import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, SwatchIcon } from '@heroicons/react/24/outline';

const colorPresets = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Orange', value: '#fed7aa' },
];

export default function StickyNoteNode({ data, isConnectable }) {
  const [text, setText] = useState(data.text || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
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

  const handleColorChange = (color) => {
    if (data.onUpdate) {
      data.onUpdate(data.itemId, { 
        style: { ...data.style, backgroundColor: color } 
      });
    }
    setShowColorPicker(false);
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(data.itemId);
    }
  };

  const backgroundColor = data.style?.backgroundColor || '#fef08a';
  const textColor = data.style?.color || '#000000';

  return (
    <div 
      className="relative group"
      style={{ width: '100%', height: '100%' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      
      <div 
        className="w-full h-full p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
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
            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
            style={{ color: textColor }}
            placeholder="Type your note..."
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="w-full h-full text-sm whitespace-pre-wrap break-words cursor-text overflow-auto"
          >
            {text || 'Click to edit...'}
          </div>
        )}

        {/* Toolbar - appears on hover */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a] p-1 flex gap-1">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
              title="Change color"
            >
              <SwatchIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              title="Delete note"
            >
              <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Color picker */}
        {showColorPicker && (
          <div className="absolute -top-20 left-0 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a] p-2">
            <div className="flex gap-1">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </div>
  );
}
