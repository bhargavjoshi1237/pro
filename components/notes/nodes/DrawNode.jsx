'use client';

import { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { TrashIcon, PencilIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

export default function DrawNode({ data, isConnectable }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState(data.paths || []);
  const [currentPath, setCurrentPath] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';

    paths.forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });

    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }
  }, [paths, currentPath]);

  const startDrawing = (e) => {
    e.stopPropagation(); // Prevent node dragging
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.stopPropagation();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const newPaths = [...paths, currentPath];
      setPaths(newPaths);
      setCurrentPath([]);
      if (data.onUpdate) {
        data.onUpdate(data.itemId, { content: { paths: newPaths } });
      }
    }
  };

  return (
    <div className="relative group bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center drag-handle">
        <span className="font-medium text-gray-700 text-sm flex items-center gap-2">
          <PencilIcon className="w-4 h-4" /> Drawing
        </span>
        <button 
          onClick={() => data.onDelete && data.onDelete(data.itemId)}
          className="text-gray-400 hover:text-red-500"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      
      <div className="bg-white cursor-crosshair" onMouseDown={(e) => e.stopPropagation()}>
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="block"
        />
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
