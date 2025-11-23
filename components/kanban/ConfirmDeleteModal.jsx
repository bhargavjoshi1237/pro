'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, description }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-[#e7e7e7]">{title || "Are you sure?"}</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        {description || "This action cannot be undone."}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300">
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
