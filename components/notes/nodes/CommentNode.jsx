'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';

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
    <div className="bg-yellow-50 rounded-lg shadow-md border border-yellow-200 max-w-[250px] min-w-[200px]">
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

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
      <Handle type="source" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
      <Handle type="target" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
      <Handle type="target" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
      <Handle type="source" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-yellow-400" />
    </div>
  );
}
