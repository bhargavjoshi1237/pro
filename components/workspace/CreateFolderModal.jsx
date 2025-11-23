'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FolderIcon } from '@heroicons/react/24/outline';

export default function CreateFolderModal({ isOpen, onClose, onCreateFolder }) {
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState('');

    const handleClose = () => {
        setFolderName('');
        setError('');
        onClose();
    };

    const handleCreate = () => {
        // Validate folder name
        if (!folderName.trim()) {
            setError('Folder name cannot be empty');
            return;
        }

        // Sanitize folder name
        const sanitized = folderName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
        if (!sanitized) {
            setError('Invalid folder name. Use only letters, numbers, spaces, hyphens, and underscores.');
            return;
        }

        // Call the create function
        onCreateFolder(sanitized);
        handleClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCreate();
        } else if (e.key === 'Escape') {
            handleClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 text-white" showCloseButton={true}>
                <DialogTitle className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                    <FolderIcon className="w-6 h-6 text-yellow-500" />
                    Create New Folder
                </DialogTitle>

                {/* Input Field */}
                <div className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="folderName" className="block text-sm font-medium text-gray-300 mb-2">
                            Folder Name
                        </label>
                        <input
                            id="folderName"
                            type="text"
                            value={folderName}
                            onChange={(e) => {
                                setFolderName(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter folder name..."
                            autoFocus
                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-400">{error}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-400">
                            Only letters, numbers, spaces, hyphens, and underscores are allowed.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <FolderIcon className="w-4 h-4" />
                        Create Folder
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
