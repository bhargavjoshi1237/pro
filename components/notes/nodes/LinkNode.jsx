'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, LinkIcon as LinkIconOutline } from '@heroicons/react/24/outline';

export default function LinkNode({ data, isConnectable }) {
  const [url, setUrl] = useState(data.url || '');
  const [title, setTitle] = useState(data.title || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleUrlBlur = () => {
    setIsEditingUrl(false);
    if (url !== data.url && data.onUpdate) {
      data.onUpdate(data.itemId, { content: { url, title } });
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== data.title && data.onUpdate) {
      data.onUpdate(data.itemId, { content: { url, title } });
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
      className="relative group"
      style={{ width: '100%', height: '100%' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      
      <div 
        className="w-full h-full p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-[#3a3a3a] flex flex-col gap-2"
        style={{ 
          backgroundColor,
          color: textColor,
        }}
      >
        <div className="flex items-center gap-2">
          <LinkIconOutline className="w-5 h-5 text-blue-500" />
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none font-medium text-sm"
              style={{ color: textColor }}
              placeholder="Link title"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="flex-1 font-medium text-sm cursor-text truncate"
            >
              {title || 'Click to add title...'}
            </h3>
          )}
        </div>

        {isEditingUrl ? (
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-xs"
            style={{ color: textColor }}
            placeholder="https://example.com"
          />
        ) : url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        ) : (
          <p
            onClick={() => setIsEditingUrl(true)}
            className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            Click to add URL...
          </p>
        )}

        {/* Toolbar - appears on hover */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a] p-1">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              title="Delete link"
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
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </div>
  );
}
