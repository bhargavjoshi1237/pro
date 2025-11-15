import { useEffect, useState } from 'react';
import { XMarkIcon, DocumentDuplicateIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import TabEditor from './TabEditor';

export default function EditorTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onUpdateSnippet,
  onCreateFinalVersion,
  snippets,
  onOpenSnippet,
  onReorderTabs,
  user
}) {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const [draggedTabId, setDraggedTabId] = useState(null);
  const [dragOverTabId, setDragOverTabId] = useState(null);
  
  // Check if active tab has a finalized version
  const hasFinalVersion = activeTab && !activeTab.is_final && snippets.some(s => s.draft_id === activeTab.id && s.is_final);
  const finalVersion = activeTab && snippets.find(s => s.draft_id === activeTab.id && s.is_final);

  // Ctrl+W to close active tab
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          onCloseTab(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, onCloseTab]);

  const handleDragStart = (e, tabId) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, tabId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTabId(tabId);
  };

  const handleDrop = (e, targetTabId) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== targetTabId && onReorderTabs) {
      const draggedIndex = tabs.findIndex(t => t.id === draggedTabId);
      const targetIndex = tabs.findIndex(t => t.id === targetTabId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newTabs = [...tabs];
        const [removed] = newTabs.splice(draggedIndex, 1);
        newTabs.splice(targetIndex, 0, removed);
        onReorderTabs(newTabs);
      }
    }
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#212121]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2a2a2a] mb-4">
            <DocumentTextIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-base font-medium">No snippets open</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select a snippet from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#212121]">
      <div className="flex items-center bg-[#fafafa] dark:bg-[#191919] border-b border-gray-200 dark:border-[#2a2a2a] overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 px-2 sm:px-3 py-2 border-r border-gray-200 dark:border-[#2a2a2a] cursor-move group min-w-0 max-w-[120px] sm:max-w-[200px] ${
              dragOverTabId === tab.id && draggedTabId !== tab.id
                ? 'border-l-2 border-l-blue-500'
                : ''
            } ${
              activeTabId === tab.id
                ? 'bg-white dark:bg-[#212121] text-gray-900 dark:text-[#e7e7e7]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
            }`}
            onClick={() => onSelectTab(tab.id)}
          >
            <span className="text-xs truncate flex-1">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-[#303030] rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close (Ctrl+W)"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {activeTab && (
        <TabEditor
          snippet={activeTab}
          onUpdate={onUpdateSnippet}
          onCreateFinalVersion={onCreateFinalVersion}
          hasFinalVersion={hasFinalVersion}
          finalVersion={finalVersion}
          onOpenSnippet={onOpenSnippet}
          user={user}
        />
      )}
    </div>
  );
}
