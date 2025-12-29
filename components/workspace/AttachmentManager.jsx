'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    PaperClipIcon,
    XMarkIcon,
    ArrowDownTrayIcon,
    DocumentIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import UploadModal from './UploadModal';
import LoadingSpinner from '../LoadingSpinner';

export default function AttachmentManager({ workspaceId, parentId, parentType }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const bucketName = 'workspace-files';
    const folderPath = `${workspaceId}/attachments/${parentType}/${parentId}`;

    useEffect(() => {
        fetchFiles();
    }, [workspaceId, parentId, parentType]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list(folderPath, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' },
                });

            if (error) {
                // If bucket doesn't exist or other error, just show empty or log
                console.error('Error fetching files:', error);
                // toast.error('Failed to load attachments');
            } else {
                setFiles(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadFiles = async (files) => {
        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            try {
                const filePath = `${folderPath}/${file.name}`;

                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file, {
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
                    successCount++;
                }
            } catch (error) {
                console.error(`Upload error for ${file.name}:`, error);
                failCount++;
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} file(s)`);
            fetchFiles();
        }
        if (failCount > 0) {
            toast.error(`Failed to upload ${failCount} file(s)`);
        }
    };

    const handleDownload = async (fileName) => {
        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .download(`${folderPath}/${fileName}`);

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

    const handleDelete = async (fileName) => {
        if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

        try {
            const { error } = await supabase.storage
                .from(bucketName)
                .remove([`${folderPath}/${fileName}`]);

            if (error) throw error;

            toast.success('File deleted');
            setFiles(files.filter(f => f.name !== fileName));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Delete failed');
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Attachments</h3>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-gray-500 transition-colors"
                >
                    <PlusIcon className="w-3.5 h-3.5" />
                </button>
            </div>

            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUploadFiles}
            />

            {loading ? (
                <div className="flex justify-center py-4">
                      <LoadingSpinner  />
                </div>
            ) : files.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No attachments</div>
            ) : (
                <div className="space-y-2">
                    {files.map((file) => (
                        <div
                            key={file.id || file.name}
                            className="flex items-center gap-2 p-2 bg-white dark:bg-[#212121] border border-gray-200 dark:border-[#2a2a2a] rounded hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                        >
                            <DocumentIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 dark:text-[#e7e7e7] truncate" title={file.name}>
                                    {file.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {formatSize(file.metadata?.size || 0)}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDownload(file.name)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Download"
                                >
                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(file.name)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#333] rounded text-gray-500 hover:text-red-500"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
