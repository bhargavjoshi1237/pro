'use client';

import { useState } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { TrashIcon, PhotoIcon, ArrowUpRightIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function ImageNode({ id, data, isConnectable, selected }) {
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
      className="relative group w-full h-full"
    >
      <NodeResizer 
        color="#3b82f6" 
        isVisible={selected} 
        minWidth={100} 
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

        {/* Toolbar - appears on hover or when selected */}
        <div className={`absolute -top-12 left-0 right-0 flex items-center justify-center gap-1 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a] p-1 flex gap-1">
            {url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors text-xs flex items-center gap-1"
                title="Change URL"
              >
                <PencilIcon className="w-3 h-3" />
                Edit URL
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
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
        className={`w-3 h-3 !bg-blue-500 border-2 border-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      />
    </div>
  );
}
