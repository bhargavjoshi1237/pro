import { useState } from 'react';
import { FolderIcon, DocumentTextIcon, PlusIcon, TrashIcon, MoonIcon, SunIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Sidebar({
  folders,
  snippets,
  activeSnippet,
  onCreateFolder,
  onCreateSnippet,
  onSelectSnippet,
  onDeleteSnippet,
  onDeleteFolder,
  theme,
  onToggleTheme,
  loading
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewSnippet, setShowNewSnippet] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newSnippetTitle, setNewSnippetTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleCreateSnippet = () => {
    if (newSnippetTitle.trim()) {
      onCreateSnippet(newSnippetTitle.trim(), selectedFolderId);
      setNewSnippetTitle('');
      setShowNewSnippet(false);
      setSelectedFolderId(null);
    }
  };

  const unfiledSnippets = snippets.filter(s => !s.folder_id);

  return (
    <div className="w-64 bg-[#fafafa] dark:bg-[#191919] border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col">
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7]">Snippets</h1>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
        >
          {theme === 'light' ? (
            <MoonIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <SunIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
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
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-xs text-center py-4">Loading...</p>
        ) : (
          <>
            {unfiledSnippets.length > 0 && (
              <div className="mb-3">
                <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase mb-1 px-2">Unfiled</h3>
                {unfiledSnippets.map(snippet => (
                  <SnippetItem
                    key={snippet.id}
                    snippet={snippet}
                    isActive={activeSnippet?.id === snippet.id}
                    onSelect={onSelectSnippet}
                    onDelete={onDeleteSnippet}
                  />
                ))}
              </div>
            )}

            {folders.map(folder => {
              const folderSnippets = snippets.filter(s => s.folder_id === folder.id);
              const isExpanded = expandedFolders.has(folder.id);

              return (
                <div key={folder.id} className="mb-1">
                  <div className="flex items-center gap-0.5 group">
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="flex-1 flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="w-3 h-3 text-gray-500 dark:text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="w-3 h-3 text-gray-500 dark:text-gray-500" />
                      )}
                      <FolderIcon className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                      <span className="text-xs font-medium text-gray-700 dark:text-[#e7e7e7]">{folder.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{folderSnippets.length}</span>
                    </button>
                    <button
                      onClick={() => onDeleteFolder(folder.id)}
                      className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5">
                      {folderSnippets.map(snippet => (
                        <SnippetItem
                          key={snippet.id}
                          snippet={snippet}
                          isActive={activeSnippet?.id === snippet.id}
                          onSelect={onSelectSnippet}
                          onDelete={onDeleteSnippet}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {showNewFolder && (
        <Modal onClose={() => setShowNewFolder(false)}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Folder</h3>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            placeholder="Folder name"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateFolder}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewFolder(false)}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {showNewSnippet && (
        <Modal onClose={() => setShowNewSnippet(false)}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Snippet</h3>
          <input
            type="text"
            value={newSnippetTitle}
            onChange={(e) => setNewSnippetTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSnippet()}
            placeholder="Snippet title"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            autoFocus
          />
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">No folder</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateSnippet}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewSnippet(false)}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SnippetItem({ snippet, isActive, onSelect, onDelete }) {
  return (
    <div className={`flex items-center gap-1 group px-2 py-1 rounded transition-colors cursor-pointer ${
      isActive ? 'bg-blue-50 dark:bg-[#2a2a2a]' : 'hover:bg-gray-200 dark:hover:bg-[#212121]'
    }`}>
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
      </button>
      <button
        onClick={() => onDelete(snippet.id)}
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
