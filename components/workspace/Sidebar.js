import { useState } from 'react';
import {
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  TagIcon,
  UserGroupIcon,
  MapIcon,
  CubeIcon,
  BookmarkIcon,
  SunIcon,
  MoonIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDoubleLeftIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';
import WorkspaceMembers from './WorkspaceMembers';
import { ShareDialog } from '@/components/ShareDialog';

export default function Sidebar({
  workspace,
  folders,
  snippets,
  entities,
  tags,
  openTabs,
  activeTabId,
  onCreateFolder,
  onCreateSnippet,
  onCreateEntity,
  onCreateTag,
  onOpenSnippet,
  onDeleteSnippet,
  onDeleteFolder,
  onDeleteEntity,
  onDeleteTag,
  onReorderSnippets,
  onMoveSnippetToFolder,
  onToggleSidebar
}) {
  const { theme, toggleTheme } = useTheme();
  const [activeSidebarTab, setActiveSidebarTab] = useState('files'); // 'files' | 'world'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set(['tags']));

  // Creation states
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewSnippet, setShowNewSnippet] = useState(false);
  const [newSnippetTitle, setNewSnippetTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [showNewEntity, setShowNewEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState('character');
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverId, setDraggedOverId] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);
  const [pendingMoveProcessing, setPendingMoveProcessing] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);

  const entityTypes = [
    { id: 'character', name: 'Characters', icon: UserGroupIcon },
    { id: 'location', name: 'Locations', icon: MapIcon },
    { id: 'item', name: 'Items', icon: CubeIcon },
    { id: 'lore', name: 'Lore', icon: BookmarkIcon },
  ];

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() && !creating) {
      setCreating(true);
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
      setCreating(false);
    }
  };

  const handleCreateSnippet = async () => {
    if (newSnippetTitle.trim() && !creating) {
      setCreating(true);
      await onCreateSnippet(newSnippetTitle.trim(), selectedFolderId);
      setNewSnippetTitle('');
      setShowNewSnippet(false);
      setSelectedFolderId(null);
      setCreating(false);
    }
  };
  const handleCreateEntity = async () => {
    if (newEntityName.trim() && !creating) {
      setCreating(true);
      await onCreateEntity(newEntityName.trim(), newEntityType);
      setNewEntityName('');
      setShowNewEntity(false);
      setCreating(false);
    }
  };

  const handleCreateTag = async () => {
    if (newTagName.trim() && !creating) {
      setCreating(true);
      await onCreateTag(newTagName.trim());
      setNewTagName('');
      setShowNewTag(false);
      setCreating(false);
    }
  };

  // Filtering
  const filteredSnippets = snippets.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) && !s.is_final
  );

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippets.some(s => s.folder_id === f.id && s.title.toLowerCase().includes(searchQuery.toLowerCase()) && !s.is_final)
  );

  const unfiledSnippets = filteredSnippets.filter(s => !s.folder_id);

  const filterEntities = (type) => {
    return entities.filter(e =>
      e.type === type &&
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Drag and Drop Handlers (Files only for now)
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
      if (draggedSnippet.folder_id !== targetId) {
        // Ask for confirmation before moving the snippet to another folder
        setPendingMove({ snippetId: draggedSnippet.id, fromFolderId: draggedSnippet.folder_id, toFolderId: targetId, title: draggedSnippet.title });
      }
    }

    setDraggedItem(null);
    setDraggedOverId(null);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggedOverId(null);
  };

  return (
    <div className="w-full bg-[#fafafa] dark:bg-[#191919] border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <a
            href="/dashboard"
            className="w-6 h-6 flex items-center justify-center shrink-0 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded transition-colors"
            title="Go to Dashboard"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </a>
          <span className="font-semibold text-sm text-gray-900 dark:text-[#e7e7e7] truncate">
            {workspace?.name || 'Prodigy'}
          </span>
        </div>
        <div className="flex items-center gap-1">
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
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors shrink-0"
            title="Collapse Sidebar"
          >
            <ChevronDoubleLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 dark:border-[#2a2a2a]">
        <button
          onClick={() => setActiveSidebarTab('files')}
          className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${activeSidebarTab === 'files'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Files
        </button>
        <button
          onClick={() => setActiveSidebarTab('world')}
          className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${activeSidebarTab === 'world'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          World
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#212121] text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400 dark:placeholder-gray-600 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-2 space-y-1.5 border-b border-gray-200 dark:border-[#2a2a2a]">
        {activeSidebarTab === 'files' && (
          <>
            <button
              onClick={() => setShowNewSnippet(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] rounded text-sm transition-colors"
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
          </>
        )}
        {activeSidebarTab === 'world' && (
          <>
            <button
              onClick={() => setShowNewEntity(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] rounded text-sm transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              New Entity
            </button>
            <button
              onClick={() => setShowNewTag(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded text-sm transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              New Tag
            </button>
          </>
        )}
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {activeSidebarTab === 'files' ? (
          // Files View
          <>
            {unfiledSnippets.length > 0 && (
              <div className="mb-3">
                <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase mb-1 px-2">Unfiled</h3>
                {unfiledSnippets.map(snippet => (
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
                    hasFinalVersion={snippets.some(s => s.draft_id === snippet.id && s.is_final)}
                    onShare={(snippet) => {
                      setShareItem({ id: snippet.id, type: 'snippet', title: snippet.title });
                      setShareDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {filteredFolders.map(folder => {
              const folderSnippets = filteredSnippets.filter(s => s.folder_id === folder.id);
              const isExpanded = expandedFolders.has(folder.id);

              if (folderSnippets.length === 0 && searchQuery) return null;

              return (
                <div key={folder.id} className="mb-1">
                  <div
                    className={`flex items-center gap-0.5 group ${draggedOverId === folder.id ? 'bg-gray-200 dark:bg-[#2a2a2a] rounded' : ''
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
                      onClick={() => {
                        setShareItem({ id: folder.id, type: 'folder', title: folder.name });
                        setShareDialogOpen(true);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-all shrink-0"
                      title="Share folder"
                    >
                      <ShareIcon className="w-3.5 h-3.5 text-blue-500" />
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
                      {folderSnippets.map(snippet => (
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
                          hasFinalVersion={snippets.some(s => s.draft_id === snippet.id && s.is_final)}
                          onShare={(snippet) => {
                            setShareItem({ id: snippet.id, type: 'snippet', title: snippet.title });
                            setShareDialogOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          // World View
          <>
            {/* Tags Section */}
            <div className="mb-1">
              <div className="flex items-center gap-0.5 group">
                <button
                  onClick={() => toggleCategory('tags')}
                  className="flex-1 flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded transition-colors"
                >
                  {expandedCategories.has('tags') ? (
                    <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-3 h-3 text-gray-500" />
                  )}
                  <TagIcon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-[#e7e7e7]">Tags</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{filteredTags.length}</span>
                </button>
              </div>

              {expandedCategories.has('tags') && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {filteredTags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-1 group px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-[#212121]">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-xs text-gray-700 dark:text-[#e7e7e7] flex-1 truncate">{tag.name}</span>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'tag', id: tag.id, name: tag.name })}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all shrink-0"
                      >
                        <TrashIcon className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Entity Categories */}
            {entityTypes.map(type => {
              const typeEntities = filterEntities(type.id);
              if (typeEntities.length === 0 && searchQuery) return null;

              const Icon = type.icon;
              const isExpanded = expandedCategories.has(type.id);

              return (
                <div key={type.id} className="mb-1">
                  <div className="flex items-center gap-0.5 group">
                    <button
                      onClick={() => toggleCategory(type.id)}
                      className="flex-1 flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="w-3 h-3 text-gray-500" />
                      )}
                      <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-[#e7e7e7]">{type.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{typeEntities.length}</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5">
                      {typeEntities.map(entity => (
                        <div key={entity.id} className="flex items-center gap-1 group px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-[#212121]">
                          <span className="text-xs text-gray-700 dark:text-[#e7e7e7] flex-1 truncate">{entity.name}</span>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'entity', id: entity.id, name: entity.name })}
                            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all shrink-0"
                          >
                            <TrashIcon className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Workspace Members */}
      <div className="mt-auto">
        <WorkspaceMembers workspaceId={workspace?.id} />
      </div>

      {/* Modals */}
      {
        showNewFolder && (
          <Modal onClose={() => !creating && setShowNewFolder(false)}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreateFolder()}
              placeholder="Folder name"
              disabled={creating}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCreateFolder}
                disabled={creating || !newFolderName.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 text-gray-900 dark:text-[#e7e7e7] rounded transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowNewFolder(false)}
                disabled={creating}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )
      }
      {
        pendingMove && (
          <Modal onClose={() => !pendingMoveProcessing && setPendingMove(null)}>
            <div className="flex items-start gap-3">
              <FolderIcon className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-1">Move Snippet?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Move "{pendingMove.title}" to "{(folders.find(f => f.id === pendingMove.toFolderId) || {}).name || 'Folder'}"?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        setPendingMoveProcessing(true);
                        await onMoveSnippetToFolder(pendingMove.snippetId, pendingMove.toFolderId);
                        setPendingMove(null);
                      } catch (err) {
                        console.error('Error moving snippet:', err);
                      } finally {
                        setPendingMoveProcessing(false);
                        setDraggedItem(null);
                        setDraggedOverId(null);
                      }
                    }}
                    disabled={pendingMoveProcessing}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
                  >
                    {pendingMoveProcessing ? 'Moving...' : 'Move'}
                  </button>
                  <button
                    onClick={() => !pendingMoveProcessing && setPendingMove(null)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )
      }

      {
        showNewSnippet && (
          <Modal onClose={() => !creating && setShowNewSnippet(false)}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Snippet</h3>
            <input
              type="text"
              value={newSnippetTitle}
              onChange={(e) => setNewSnippetTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreateSnippet()}
              placeholder="Snippet title"
              disabled={creating}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 outline-none mb-2"
              autoFocus
            />
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value || null)}
              disabled={creating}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 outline-none"
            >
              <option value="">No folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCreateSnippet}
                disabled={creating || !newSnippetTitle.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 text-gray-900 dark:text-[#e7e7e7] rounded transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowNewSnippet(false)}
                disabled={creating}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )
      }

      {
        showNewEntity && (
          <Modal onClose={() => !creating && setShowNewEntity(false)}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Entity</h3>
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreateEntity()}
              placeholder="Entity name"
              disabled={creating}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 outline-none mb-2"
              autoFocus
            />
            <select
              value={newEntityType}
              onChange={(e) => setNewEntityType(e.target.value)}
              disabled={creating}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 outline-none"
            >
              {entityTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCreateEntity}
                disabled={creating || !newEntityName.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 text-gray-900 dark:text-[#e7e7e7] rounded transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowNewEntity(false)}
                disabled={creating}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )
      }

      {
        showNewTag && (
          <Modal onClose={() => !creating && setShowNewTag(false)}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">New Tag</h3>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreateTag()}
              placeholder="Tag name"
              disabled={creating}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#191919] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCreateTag}
                disabled={creating || !newTagName.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 text-gray-900 dark:text-[#e7e7e7] rounded transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowNewTag(false)}
                disabled={creating}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )
      }

      {
        deleteConfirm && (
          <Modal onClose={() => setDeleteConfirm(null)}>
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#e7e7e7] mb-1">
                  Delete {deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)}?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (deleteConfirm.type === 'folder') onDeleteFolder(deleteConfirm.id);
                      else if (deleteConfirm.type === 'snippet') onDeleteSnippet(deleteConfirm.id);
                      else if (deleteConfirm.type === 'entity') onDeleteEntity(deleteConfirm.id);
                      else if (deleteConfirm.type === 'tag') onDeleteTag(deleteConfirm.id);
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
        )
      }

      {/* Share Dialog */}
      {shareItem && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setShareItem(null);
          }}
          itemId={shareItem.id}
          itemType={shareItem.type}
          itemTitle={shareItem.title}
          workspaceId={workspace?.id}
        />
      )}
    </div >
  );
}


function SnippetItem({ snippet, isActive, isOpen, onSelect, onDragStart, onDragOver, onDrop, onDragLeave, isDraggedOver, setDeleteConfirm, hasFinalVersion, onShare }) {
  return (
    <div
      className={`flex items-center gap-1 group px-2 py-1 rounded transition-colors cursor-move ${isDraggedOver ? 'bg-gray-200 dark:bg-[#2a2a2a] border-l-2 border-gray-400 dark:border-gray-600' :
        isActive ? 'bg-gray-100 dark:bg-[#2a2a2a]' : 'hover:bg-gray-200 dark:hover:bg-[#212121]'
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
        <DocumentTextIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isActive ? 'text-gray-900 dark:text-[#e7e7e7]' : 'text-gray-700 dark:text-[#e7e7e7]'
            }`}>
            {snippet.title}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{snippet.word_count || 0} words</p>
        </div>
        {hasFinalVersion && (
          <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
        )}
        {isOpen && !isActive && !hasFinalVersion && (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 shrink-0" />
        )}
      </button>
      <button
        onClick={() => onShare?.(snippet)}
        className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-all shrink-0"
        title="Share snippet"
      >
        <ShareIcon className="w-3.5 h-3.5 text-blue-500" />
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
