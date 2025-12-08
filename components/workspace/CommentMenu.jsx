'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * Comment Menu Component
 * Shows when user selects text in the editor
 */
export default function CommentMenu({ 
  position, 
  onAddComment, 
  onClose 
}) {
  const menuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for smooth animation when position changes
    const timer = setTimeout(() => {
      setIsVisible(!!position);
    }, position ? 10 : 0);
    
    return () => clearTimeout(timer);
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#383838] rounded-lg shadow-xl transition-all duration-150 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button
        onClick={onAddComment}
        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-[#e7e7e7] hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors whitespace-nowrap group"
      >
        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
          <ChatBubbleLeftIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span>Add Comment</span>
      </button>
    </div>
  );
}
