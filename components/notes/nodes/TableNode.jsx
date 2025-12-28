'use client';

import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, PlusIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

export default function TableNode({ data, isConnectable }) {
  const [rows, setRows] = useState(data.rows || 3);
  const [cols, setCols] = useState(data.cols || 2);
  const [content, setContent] = useState(data.tableContent || {});

  const handleCellChange = (row, col, value) => {
    const newContent = { ...content, [`${row}-${col}`]: value };
    setContent(newContent);
    if (data.onUpdate) {
      data.onUpdate(data.itemId, { 
        content: { ...data.content, tableContent: newContent, rows, cols } 
      });
    }
  };

  const addRow = () => {
    setRows(rows + 1);
    if (data.onUpdate) {
      data.onUpdate(data.itemId, { 
        content: { ...data.content, rows: rows + 1 } 
      });
    }
  };

  const addCol = () => {
    setCols(cols + 1);
    if (data.onUpdate) {
      data.onUpdate(data.itemId, { 
        content: { ...data.content, cols: cols + 1 } 
      });
    }
  };

  return (
    <div className="relative group bg-white rounded-lg shadow-md border border-gray-200 min-w-[300px] overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center drag-handle">
        <span className="font-medium text-gray-700 text-sm">Table</span>
        <button 
          onClick={() => data.onDelete && data.onDelete(data.itemId)}
          className="text-gray-400 hover:text-red-500"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={`${r}-${c}`} className="border border-gray-200 p-0 min-w-[80px]">
                    <input
                      type="text"
                      value={content[`${r}-${c}`] || ''}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      className="w-full h-full p-2 outline-none bg-transparent focus:bg-blue-50"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="flex gap-2 mt-2">
          <button onClick={addRow} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <PlusIcon className="w-3 h-3" /> Row
          </button>
          <button onClick={addCol} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <PlusIcon className="w-3 h-3" /> Column
          </button>
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
