'use client';

import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getIconById, DEFAULT_ICON } from './WorkspaceIcons';

/**
 * Workspace Header Component
 * Collapsible cover image banner at the top of the editor
 */
export default function WorkspaceHeader({ workspace }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!workspace?.cover_image) return null;

  const IconComponent = getIconById(workspace.icon || DEFAULT_ICON);

  return (
    <div className="relative w-full border-b border-gray-200 dark:border-[#2a2a2a] shrink-0 transition-all duration-300">
      {/* Collapsible Cover Image */}
      <div 
        className={`relative w-full overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'h-0' : 'h-24 sm:h-32'
        }`}
      >
        {/* Cover Image - Duller with overlay */}
        <img
          src={workspace.cover_image}
          alt={`${workspace.name} cover`}
          className="w-full h-full object-cover opacity-70"
        />
        
        {/* Dull overlay */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-[#191919]/80" />
        
        {/* Workspace Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Workspace Icon */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 dark:text-white" />
            </div>
            
            {/* Workspace Name */}
            <div>
              <h1 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white drop-shadow-md">
                {workspace.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-900 transition-all"
        title={isCollapsed ? 'Show cover image' : 'Hide cover image'}
      >
        {isCollapsed ? (
          <ChevronDownIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        ) : (
          <ChevronUpIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        )}
      </button>
    </div>
  );
}
