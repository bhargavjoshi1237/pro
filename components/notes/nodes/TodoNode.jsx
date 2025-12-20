'use client';

import { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TodoNode({ data, isConnectable }) {
  const [items, setItems] = useState(data.items || [{ id: 1, text: 'Task 1', checked: false }]);
  const [title, setTitle] = useState(data.title || 'To-do List');

  const handleAddItem = () => {
    const newItems = [...items, { id: Date.now(), text: 'New Task', checked: false }];
    setItems(newItems);
    updateData(title, newItems);
  };

  const handleToggleItem = (id) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);
    updateData(title, newItems);
  };

  const handleTextChange = (id, text) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, text } : item
    );
    setItems(newItems);
    updateData(title, newItems);
  };

  const handleDeleteItem = (id) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    updateData(title, newItems);
  };

  const updateData = (newTitle, newItems) => {
    if (data.onUpdate) {
      data.onUpdate(data.itemId, { 
        content: { title: newTitle, items: newItems } 
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 min-w-[250px] overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center drag-handle">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            updateData(e.target.value, items);
          }}
          className="bg-transparent font-medium text-gray-700 outline-none w-full"
          placeholder="List Title"
        />
        <button 
          onClick={() => data.onDelete && data.onDelete(data.itemId)}
          className="text-gray-400 hover:text-red-500"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleToggleItem(item.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleTextChange(item.id, e.target.value)}
              className={`flex-1 bg-transparent outline-none text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
            />
            <button 
              onClick={() => handleDeleteItem(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <button
          onClick={handleAddItem}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mt-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add item</span>
        </button>
      </div>

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}

function XMarkIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
