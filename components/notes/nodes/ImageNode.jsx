'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function ImageNode({ data, isConnectable }) {
  const [url, setUrl] = useState(data.url || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (url !== data.url && data.onUpdate) {
      data.onUpdate(data.itemId, { content: { url, alt: data.alt || 'Image' } });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(data.itemId);
    }
  };

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
      
      <div className="w-full h-full rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-[#3a3a3a] overflow-hidden bg-white dark:bg-[#2a2a2a]">
        {url ? (
          <img
            src={url}
            alt={data.alt || 'Image'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        <div 
          className={`w-full h-full flex flex-col items-center justify-center p-4 ${url ? 'hidden' : 'flex'}`}
          onClick={() => setIsEditing(true)}
        >
          <PhotoIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
          {isEditing ? (
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleBlur}
              autoFocus
              className="w-full px-2 py-1 text-sm bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#3a3a3a] rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter image URL..."
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
              Click to add image URL
            </p>
          )}
        </div>

        {/* Toolbar - appears on hover */}
        <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a] p-1 flex gap-1">
            {url && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors text-xs"
                title="Change URL"
              >
                Edit URL
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              title="Delete image"
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
