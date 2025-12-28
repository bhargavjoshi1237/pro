'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, UserCircleIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

export default function CommentNode({ data, isConnectable }) {
  const [text, setText] = useState(data.text || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onUpdate) {
      data.onUpdate(data.itemId, { content: { text } });
    }
  };

  return (
    <div className="relative group bg-yellow-50 rounded-lg shadow-md border border-yellow-200 max-w-[250px] min-w-[200px]">
      <div className="p-3 flex gap-3">
        <div className="flex-shrink-0">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold text-gray-500">User</span>
            <button 
              onClick={() => data.onDelete && data.onDelete(data.itemId)}
              className="text-gray-300 hover:text-red-500"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            placeholder="Write a comment..."
            className="w-full bg-transparent outline-none text-sm text-gray-800 resize-none"
            rows={3}
          />
        </div>
      </div>

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
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          borderRadius: '50%',
          zIndex: 50
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair"
        isConnectable={isConnectable}
      >
        <ArrowUpRightIcon className="w-3 h-3 text-white" />
      </Handle>
    </div>
  );
}
