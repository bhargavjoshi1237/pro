import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderIcon, DocumentTextIcon, PlusIcon, TrashIcon, MoonIcon, SunIcon, ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, CheckCircleIcon, SparklesIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';
import WorkspaceMembers from './WorkspaceMembers';

export default function Sidebar({
  workspace,
  folders,
  snippets,
  openTabs,
  activeTabId,
  onCreateFolder,
  onCreateSnippet,
  onOpenSnippet,
  onDeleteSnippet,
  onDeleteFolder,
  onReorderSnippets,
  onMoveSnippetToFolder
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewSnippet, setShowNewSnippet] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newSnippetTitle, setNewSnippetTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingSnippet, setCreatingSnippet] = useState(false);

  const handleCreateFolder = async () => {
    if (newFolderName.trim() && !creatingFolder) {
      setCreatingFolder(true);
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
      setCreatingFolder(false);
    }
  };

  const handleCreateSnippet = async () => {
    if (newSnippetTitle.trim() && !creatingSnippet) {
      setCreatingSnippet(true);
      await onCreateSnippet(newSnippetTitle.trim(), selectedFolderId);
      setNewSnippetTitle('');
      setShowNewSnippet(false);
      setSelectedFolderId(null);
      setCreatingSnippet(false);
    }
  };

  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverId, setDraggedOverId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) && !s.is_final
  );

  const finalVersions = snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) && s.is_final
  );

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippets.some(s => s.folder_id === f.id && s.title.toLowerCase().includes(searchQuery.toLowerCase()) && !s.is_final)
  );

  const unfiledSnippets = filteredSnippets.filter(s => !s.folder_id);

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetId, targetType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverId(targetId);
  };

  const handleDrop = async (e, targetId, targetType) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const { item: draggedSnippet, type: draggedType } = draggedItem;
    
    if (draggedType === 'snippet' && targetType === 'snippet' && draggedSnippet.id !== targetId) {
      // Reorder snippets within the same folder
      const targetSnippet = snippets.find(s => s.id === targetId);
      if (targetSnippet && draggedSnippet.folder_id === targetSnippet.folder_id && onReorderSnippets) {
        const sameFolder = snippets.filter(s => s.folder_id === draggedSnippet.folder_id && !s.is_final);
        const draggedIndex = sameFolder.findIndex(s => s.id === draggedSnippet.id);
        const targetIndex = sameFolder.findIndex(s => s.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newOrder = [...sameFolder];
          const [removed] = newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, removed);
          onReorderSnippets(newOrder);
        }
      }
    } else if (draggedType === 'snippet' && targetType === 'folder' && onMoveSnippetToFolder) {
      // Move snippet to a different folder
      if (draggedSnippet.folder_id !== targetId) {
        onMoveSnippetToFolder(draggedSnippet.id, targetId);
      }
    }
    
    setDraggedItem(null);
    setDraggedOverId(null);
  };

  const handleDragLeave = () => {
    setDraggedOverId(null);
  };

  return (
    <div className="w-full lg:w-64 bg-[#fafafa] dark:bg-[#191919] border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <HomeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">
            {workspace?.name || 'Workspace'}
          </h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors shrink-0"
        >
          {theme === 'light' ? (
            <MoonIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <SunIcon className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#212121] text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5 border-b border-gray-200 dark:border-[#2a2a2a]">
        <button
          onClick={() => setShowNewSnippet(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Snippet
        </button>
        <button
          onClick={() => setShowNewFolder(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded text-sm transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New Folder
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {unfiledSnippets.length > 0 && (
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase mb-1 px-2">Unfiled</h3>
            {unfiledSnippets.map(snippet => {
              const hasFinalVersion = snippets.some(s => s.draft_id === snippet.id && s.is_final);
              return (
                <SnippetItem
                  key={snippet.id}
                  snippet={snippet}
                  isActive={activeTabId === snippet.id}
                  isOpen={openTabs.some(tab => tab.id === snippet.id)}
                  onSelect={onOpenSnippet}
                  onDragStart={handleDragStart}
                  onDragOver={(e) => handleDragOver(e, snippet.id, 'snippet')}
                  onDrop={(e) => handleDrop(e, snippet.id, 'snippet')}
                  onDragLeave={handleDragLeave}
                  isDraggedOver={draggedOverId === snippet.id}
                  setDeleteConfirm={setDeleteConfirm}
                  hasFinalVersion={hasFinalVersion}
                />
              );
            })}
          </div>
        )}

        {filteredFolders.map(folder => {
          const folderSnippets = filteredSnippets.filter(s => s.folder_id === folder.id);
          const isExpanded = expandedFolders.has(folder.id);

          if (folderSnippets.length === 0 && searchQuery) return null;

          return (
            <div key={folder.id} className="mb-1">
              <div 
                className={`flex items-center gap-0.5 group ${
                  draggedOverId === folder.id ? 'bg-blue-100 dark:bg-blue-900/30 rounded' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, folder.id, 'folder')}
                onDrop={(e) => handleDrop(e, folder.id, 'folder')}
                onDragLeave={handleDragLeave}
              >
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex-1 flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-3 h-3 text-gray-500" />
                  )}
                  <FolderIcon className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-[#e7e7e7]">{folder.name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{folderSnippets.length}</span>
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: 'folder', id: folder.id, name: folder.name })}
                  className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all shrink-0"
                >
                  <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>

              {isExpanded && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {folderSnippets.map(snippet => {
                    const hasFinalVersion = snippets.some(s => s.draft_id === snippet.id && s.is_final);
                    return (
                      <SnippetItem
                        key={snippet.id}
                        snippet={snippet}
                        isActive={activeTabId === snippet.id}
                        isOpen={openTabs.some(tab => tab.id === snippet.id)}
                        onSelect={onOpenSnippet}
                        onDragStart={handleDragStart}
                        onDragOver={(e) => handleDragOver(e, snippet.id, 'snippet')}
                        onDrop={(e) => handleDrop(e, snippet.id, 'snippet')}
                        onDragLeave={handleDragLeave}
                        isDraggedOver={draggedOverId === snippet.id}
                        setDeleteConfirm={setDeleteConfirm}
                        hasFinalVersion={hasFinalVersion}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Workspace Members - Above bottom */}
      <div className="mt-auto">
        <WorkspaceMembers workspaceId={workspace?.id} />
      </div>

      {showNewFolder && (
        <Modal onClose={() => !creatingFolder && setShowNewFolder(false)}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Folder</h3>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !creatingFolder && handleCreateFolder()}
            placeholder="Folder name"
            disabled={creatingFolder}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-1"
            >
              {creatingFolder ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
            <button
              onClick={() => setShowNewFolder(false)}
              disabled={creatingFolder}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-1">
                Delete {deleteConfirm.type === 'folder' ? 'Folder' : 'Snippet'}?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {deleteConfirm.type === 'folder' 
                  ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
                  : `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
                }
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'folder') {
                      onDeleteFolder(deleteConfirm.id);
                    } else {
                      onDeleteSnippet(deleteConfirm.id);
                    }
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showNewSnippet && (
        <Modal onClose={() => !creatingSnippet && setShowNewSnippet(false)}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Snippet</h3>
          <input
            type="text"
            value={newSnippetTitle}
            onChange={(e) => setNewSnippetTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !creatingSnippet && handleCreateSnippet()}
            placeholder="Snippet title"
            disabled={creatingSnippet}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 outline-none mb-2 disabled:opacity-50"
            autoFocus
          />
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            disabled={creatingSnippet}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          >
            <option value="">No folder</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateSnippet}
              disabled={creatingSnippet || !newSnippetTitle.trim()}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-1"
            >
              {creatingSnippet ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
            <button
              onClick={() => setShowNewSnippet(false)}
              disabled={creatingSnippet}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SnippetItem({ snippet, isActive, isOpen, onSelect, onDragStart, onDragOver, onDrop, onDragLeave, isDraggedOver, setDeleteConfirm, hasFinalVersion }) {
  return (
    <div 
      className={`flex items-center gap-1 group px-2 py-1 rounded transition-colors cursor-move ${
        isDraggedOver ? 'bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500' : 
        isActive ? 'bg-blue-50 dark:bg-[#2a2a2a]' : 'hover:bg-gray-200 dark:hover:bg-[#212121]'
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, snippet, 'snippet')}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      <button
        onClick={() => onSelect(snippet)}
        className="flex-1 flex items-center gap-1.5 text-left min-w-0"
      >
        <DocumentTextIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-[#e7e7e7]'
          }`}>
            {snippet.title}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{snippet.word_count || 0} words</p>
        </div>
        {hasFinalVersion && (
          <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
        )}
        {isOpen && !isActive && !hasFinalVersion && (
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
      </button>
      <button
        onClick={() => setDeleteConfirm({ type: 'snippet', id: snippet.id, name: snippet.title })}
        className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all shrink-0"
      >
        <TrashIcon className="w-3.5 h-3.5 text-red-500" />
      </button>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-[#212121] rounded-lg p-5 w-80 max-w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
