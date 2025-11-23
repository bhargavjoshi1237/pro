'use client';

import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { XMarkIcon, DocumentIcon, CloudArrowUpIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function UploadModal({ isOpen, onClose, onUpload, maxFileSize = 5 * 1024 * 1024 }) { // 5MB default
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const validateFile = (file) => {
        if (file.size > maxFileSize) {
            toast.error(`File ${file.name} is too large. Max size is ${maxFileSize / 1024 / 1024}MB`);
            return false;
        }
        return true;
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const newFiles = Array.from(e.dataTransfer.files).filter(validateFile);
            setFiles(prev => [...prev, ...newFiles]);
        }
    }, [maxFileSize]);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const newFiles = Array.from(e.target.files).filter(validateFile);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        try {
            await onUpload(files);
            setFiles([]);
            onClose();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
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
        <Dialog open={isOpen} onOpenChange={(open) => !uploading && onClose(open)}>
            <DialogContent className="sm:max-w-[500px] bg-[#1c1c1c] border border-[#333] text-white p-0 overflow-hidden shadow-2xl rounded-2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-xl font-semibold text-white tracking-tight">Upload Files</DialogTitle>

                    </div>

                    {/* Drop Zone */}
                    <div
                        className={cn(
                            "relative border border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center group cursor-pointer",
                            dragActive
                                ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                                : "border-[#444] hover:border-[#666] bg-[#252525] hover:bg-[#2a2a2a]"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleChange}
                            disabled={uploading}
                        />

                        <div className="w-14 h-14 rounded-full bg-[#333] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#3a3a3a] transition-all duration-300 shadow-lg">
                            <CloudArrowUpIcon className="w-7 h-7 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>

                        <p className="text-base font-medium text-white mb-1">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                            Maximum file size: {maxFileSize / 1024 / 1024}MB
                        </p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                            {files.map((file, index) => (
                                <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[#252525] border border-[#333] group hover:border-[#444] transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#333] flex items-center justify-center shrink-0">
                                        <PaperClipIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatSize(file.size)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                                        disabled={uploading}
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#222] border-t border-[#333] flex justify-end gap-3">
                    <button
                        onClick={() => onClose(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload Files'
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
