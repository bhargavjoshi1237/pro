'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FolderIcon,
    DocumentIcon,
    ArrowUpIcon,
    HomeIcon,
    ArrowDownTrayIcon,
    TrashIcon,
    PlusIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import UploadModal from './UploadModal';
import CreateFolderModal from './CreateFolderModal';

export default function StoragePanel({ workspaceId }) {
    const [currentPath, setCurrentPath] = useState(''); // Relative to workspaceId
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('name-asc'); // name-asc, name-desc, size-asc, size-desc, date-asc, date-desc, type-folders, type-files
    const bucketName = 'workspace-files';

    // Base path for this workspace
    const basePath = `${workspaceId}`;

    useEffect(() => {
        fetchItems();
    }, [workspaceId, currentPath]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const path = currentPath ? `${basePath}/${currentPath}` : basePath;

            const { data, error } = await supabase.storage
                .from(bucketName)
                .list(path, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' },
                });

            if (error) {
                console.error('Error fetching files:', error);
                // toast.error('Failed to load files');
            } else {
                // Filter out .emptyFolder placeholders
                const filteredData = data?.filter(item => item.name !== '.emptyFolder') || [];

                // Fetch file metadata for files (not folders)
                const fileItems = filteredData.filter(item => item.metadata);
                if (fileItems.length > 0) {
                    const filePaths = fileItems.map(item =>
                        currentPath ? `${basePath}/${currentPath}/${item.name}` : `${basePath}/${item.name}`
                    );

                    const { data: metadataList } = await supabase
                        .from('workspace_file_metadata')
                        .select(`
                            file_path,
                            uploader:uploaded_by(id, email, avatar_url)
                        `)
                        .in('file_path', filePaths);

                    // Merge metadata with storage data
                    const enrichedItems = filteredData.map(item => {
                        if (!item.metadata) return item; // Folder, no metadata

                        const itemPath = currentPath ? `${basePath}/${currentPath}/${item.name}` : `${basePath}/${item.name}`;
                        const metadata = metadataList?.find(m => m.file_path === itemPath);

                        return {
                            ...item,
                            uploader: metadata?.uploader
                        };
                    });

                    setItems(enrichedItems);
                } else {
                    setItems(filteredData);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folderName) => {
        setCurrentPath(prev => prev ? `${prev}/${folderName}` : folderName);
    };

    const handleNavigateUp = () => {
        setCurrentPath(prev => {
            if (!prev) return '';
            const parts = prev.split('/');
            parts.pop();
            return parts.join('/');
        });
    };

    const handleBreadcrumbClick = (index) => {
        if (index === -1) {
            setCurrentPath('');
            return;
        }
        const parts = currentPath.split('/');
        const newPath = parts.slice(0, index + 1).join('/');
        setCurrentPath(newPath);
    };

    const handleUploadFiles = async (files) => {
        let successCount = 0;
        let failCount = 0;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        for (const file of files) {
            try {
                const path = currentPath ? `${basePath}/${currentPath}/${file.name}` : `${basePath}/${file.name}`;

                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    if (error.message.includes('Duplicate')) {
                        toast.error(`File ${file.name} already exists`);
                    } else {
                        console.error(`Upload error for ${file.name}:`, error);
                        failCount++;
                    }
                } else {
                    // Track file metadata
                    await supabase
                        .from('workspace_file_metadata')
                        .insert({
                            workspace_id: workspaceId,
                            file_path: path,
                            file_name: file.name,
                            file_size: file.size,
                            mime_type: file.type,
                            uploaded_by: user?.id
                        });
                    successCount++;
                }
            } catch (error) {
                console.error(`Upload error for ${file.name}:`, error);
                failCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} file(s)`);
            fetchItems();
        }
        if (failCount > 0) {
            toast.error(`Failed to upload ${failCount} file(s)`);
        }
    };

    const handleCreateFolder = async (folderName) => {
        if (!folderName) return;

        try {
            // Create a placeholder file to establish the folder
            const path = currentPath
                ? `${basePath}/${currentPath}/${folderName}/.emptyFolder`
                : `${basePath}/${folderName}/.emptyFolder`;

            const { error } = await supabase.storage
                .from(bucketName)
                .upload(path, new Blob(['']), {
                    upsert: false
                });

            if (error) {
                toast.error('Failed to create folder: ' + error.message);
            } else {
                toast.success('Folder created');
                fetchItems();
            }
        } catch (error) {
            console.error('Create folder error:', error);
            toast.error('Failed to create folder');
        }
    };

    const handleDownload = async (fileName) => {
        try {
            const path = currentPath ? `${basePath}/${currentPath}/${fileName}` : `${basePath}/${fileName}`;
            const { data, error } = await supabase.storage
                .from(bucketName)
                .download(path);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
        }
    };

    const deleteFolderRecursively = async (folderPath) => {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .list(folderPath);

        if (error) throw error;

        const filesToDelete = [];
        const foldersToRecurse = [];

        for (const item of data) {
            if (item.metadata) {
                filesToDelete.push(`${folderPath}/${item.name}`);
            } else {
                foldersToRecurse.push(`${folderPath}/${item.name}`);
            }
        }

        if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
                .from(bucketName)
                .remove(filesToDelete);
            if (deleteError) throw deleteError;
        }

        for (const folder of foldersToRecurse) {
            await deleteFolderRecursively(folder);
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;

        try {
            const path = currentPath ? `${basePath}/${currentPath}/${item.name}` : `${basePath}/${item.name}`;

            if (!item.metadata) {
                // It's a folder, delete recursively
                await deleteFolderRecursively(path);
            } else {
                // It's a file
                const { error } = await supabase.storage
                    .from(bucketName)
                    .remove([path]);

                if (error) throw error;

                // Also delete metadata
                await supabase
                    .from('workspace_file_metadata')
                    .delete()
                    .eq('file_path', path);
            }

            toast.success('Deleted successfully');
            setItems(items.filter(i => i.name !== item.name));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Delete failed');
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '-';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Filter and sort items
    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            const aIsFolder = !a.metadata;
            const bIsFolder = !b.metadata;

            switch (sortOption) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'size-asc':
                    if (aIsFolder && !bIsFolder) return -1;
                    if (!aIsFolder && bIsFolder) return 1;
                    return (a.metadata?.size || 0) - (b.metadata?.size || 0);
                case 'size-desc':
                    if (aIsFolder && !bIsFolder) return -1;
                    if (!aIsFolder && bIsFolder) return 1;
                    return (b.metadata?.size || 0) - (a.metadata?.size || 0);
                case 'date-asc':
                    return new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at);
                case 'date-desc':
                    return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
                case 'type-folders':
                    if (aIsFolder && !bIsFolder) return -1;
                    if (!aIsFolder && bIsFolder) return 1;
                    return a.name.localeCompare(b.name);
                case 'type-files':
                    if (aIsFolder && !bIsFolder) return 1;
                    if (!aIsFolder && bIsFolder) return -1;
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return result;
    }, [items, searchQuery, sortOption]);

    // Breadcrumbs
    const pathParts = currentPath ? currentPath.split('/') : [];

    return (
        <div className="flex flex-col h-full">
            {/* Header / Toolbar */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    <button
                        onClick={() => handleBreadcrumbClick(-1)}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] ${!currentPath ? 'text-gray-900 dark:text-[#e7e7e7] font-semibold' : 'text-gray-500'}`}
                    >
                        <HomeIcon className="w-4 h-4" />
                    </button>
                    {pathParts.map((part, index) => (
                        <div key={index} className="flex items-center gap-1 min-w-0">
                            <ChevronRightIcon className="w-3 h-3 text-gray-400 shrink-0" />
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`text-xs truncate hover:underline ${index === pathParts.length - 1 ? 'text-gray-900 dark:text-[#e7e7e7] font-semibold' : 'text-gray-500'}`}
                            >
                                {part}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2a2a2a] space-y-2">
                {/* Search and Sort Row */}
                <div className="flex gap-2">
                    {/* Search Input */}

                </div>

                {/* Action Buttons Row */}
                <div className="flex gap-2 justify-end">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-[#e7e7e7] placeholder-gray-400"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <FunnelIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="pl-8 pr-8 py-1.5 text-xs bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-[#e7e7e7] cursor-pointer appearance-none"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="size-asc">Size (Smallest)</option>
                            <option value="size-desc">Size (Largest)</option>
                            <option value="date-asc">Date (Oldest)</option>
                            <option value="date-desc">Date (Newest)</option>
                            <option value="type-folders">Type (Folders First)</option>
                            <option value="type-files">Type (Files First)</option>
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer transition-colors"
                    >
                        <PlusIcon className="w-3.5 h-3.5" />

                    </button>
                    <button
                        onClick={() => setShowCreateFolderModal(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-200 dark:bg-[#2a2a2a] hover:bg-gray-300 dark:hover:bg-[#303030] text-gray-700 dark:text-[#e7e7e7] rounded text-xs font-medium transition-colors"
                    >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <FolderIcon className="w-3.5 h-3.5" />

                    </button>
                </div>
            </div>

            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUploadFiles}
            />

            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onCreateFolder={handleCreateFolder}
            />

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">Loading...</div>
                ) : filteredAndSortedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <FolderIcon className="w-8 h-8 opacity-20" />
                        <span className="text-xs">
                            {searchQuery ? 'No files match your search' : 'Empty folder'}
                        </span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {currentPath && (
                            <button
                                onClick={handleNavigateUp}
                                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded text-left group"
                            >
                                <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">..</span>
                            </button>
                        )}
                        {filteredAndSortedItems.map((item) => {
                            const isFolder = !item.metadata; // Simple heuristic for Supabase list
                            return (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded group"
                                >
                                    <button
                                        onClick={() => isFolder ? handleNavigate(item.name) : null}
                                        className="flex-1 flex items-center gap-2 min-w-0 text-left"
                                    >
                                        {isFolder ? (
                                            <FolderIcon className="w-4 h-4 text-yellow-500 shrink-0" />
                                        ) : (
                                            <DocumentIcon className="w-4 h-4 text-blue-500 shrink-0" />
                                        )}
                                        <span className="text-xs text-gray-700 dark:text-[#e7e7e7] truncate">{item.name}</span>
                                    </button>

                                    {!isFolder && (
                                        <span className="text-[10px] text-gray-400 w-16 text-right shrink-0">
                                            {formatSize(item.metadata?.size)}
                                        </span>
                                    )}

                                    {/* Uploader Profile Picture */}
                                    {!isFolder && item.uploader && (
                                        <div
                                            className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[9px] text-white overflow-hidden shrink-0"
                                            title={`Uploaded by ${item.uploader.email}`}
                                        >
                                            {item.uploader.avatar_url ? (
                                                <img
                                                    src={item.uploader.avatar_url}
                                                    alt="Uploader"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerText = item.uploader.email[0].toUpperCase();
                                                    }}
                                                />
                                            ) : (
                                                item.uploader.email[0].toUpperCase()
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!isFolder && (
                                            <button
                                                onClick={() => handleDownload(item.name)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded text-gray-500 hover:text-blue-600"
                                                title="Download"
                                            >
                                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded text-gray-500 hover:text-red-500"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
