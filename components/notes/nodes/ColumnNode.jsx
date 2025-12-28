'use client';

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, PlusIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

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
    <div className="relative group bg-gray-100 rounded-lg shadow-sm border border-gray-200 min-w-[280px] flex flex-col max-h-[500px]">
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

function XMarkIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
