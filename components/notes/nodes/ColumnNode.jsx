'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function ColumnNode({ data, isConnectable }) {
  const [title, setTitle] = useState(data.title || 'Column');
  const [cards, setCards] = useState(data.cards || []);

  const addCard = () => {
    const newCards = [...cards, { id: Date.now(), text: 'New Card' }];
    setCards(newCards);
    updateData(title, newCards);
  };

  const updateCard = (id, text) => {
    const newCards = cards.map(c => c.id === id ? { ...c, text } : c);
    setCards(newCards);
    updateData(title, newCards);
  };

  const deleteCard = (id) => {
    const newCards = cards.filter(c => c.id !== id);
    setCards(newCards);
    updateData(title, newCards);
  };

  const updateData = (newTitle, newCards) => {
    if (data.onUpdate) {
      data.onUpdate(data.itemId, { 
        content: { title: newTitle, cards: newCards } 
      });
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 min-w-[280px] flex flex-col max-h-[500px]">
      <div className="p-3 border-b border-gray-200 flex justify-between items-center drag-handle">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            updateData(e.target.value, cards);
          }}
          className="bg-transparent font-bold text-gray-700 outline-none w-full"
          placeholder="Column Title"
        />
        <button 
          onClick={() => data.onDelete && data.onDelete(data.itemId)}
          className="text-gray-400 hover:text-red-500"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        {cards.map((card) => (
          <div key={card.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 group relative">
            <textarea
              value={card.text}
              onChange={(e) => updateCard(card.id, e.target.value)}
              className="w-full resize-none outline-none text-sm text-gray-700 bg-transparent"
              rows={2}
            />
            <button 
              onClick={() => deleteCard(card.id)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={addCard}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-200 rounded transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Card</span>
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
