"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { MagnifyingGlassIcon, DocumentTextIcon, FolderIcon, UserIcon, HashtagIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function CommandPalette({
  isOpen,
  setIsOpen,
  snippets = [],
  folders = [],
  entities = [],
  tags = [],
  onOpenSnippet
}) {
  const router = useRouter();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#191919] rounded-xl shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full">
          <div className="flex items-center border-b border-gray-200 dark:border-[#333] px-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
            <Command.Input
              placeholder="Search files, folders, and more..."
              className="w-full px-4 py-4 text-base bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
            />
            <div className="text-xs text-gray-400 border border-gray-200 dark:border-[#333] px-2 py-1 rounded">ESC</div>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">No results found.</Command.Empty>

            {snippets.length > 0 && (
              <Command.Group heading="Snippets" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1">
                {snippets.map((snippet) => (
                  <Command.Item
                    key={snippet.id}
                    onSelect={() => {
                      onOpenSnippet(snippet);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] aria-selected:bg-gray-100 dark:aria-selected:bg-[#2a2a2a]"
                  >
                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                    <span>{snippet.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {folders.length > 0 && (
              <Command.Group heading="Folders" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1 mt-2">
                {folders.map((folder) => (
                  <Command.Item
                    key={folder.id}
                    onSelect={() => {
                      // Handle folder selection if needed
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] aria-selected:bg-gray-100 dark:aria-selected:bg-[#2a2a2a]"
                  >
                    <FolderIcon className="w-4 h-4 text-yellow-500" />
                    <span>{folder.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {entities.length > 0 && (
              <Command.Group heading="Entities" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1 mt-2">
                {entities.map((entity) => (
                  <Command.Item
                    key={entity.id}
                    onSelect={() => {
                      // Handle entity selection
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] aria-selected:bg-gray-100 dark:aria-selected:bg-[#2a2a2a]"
                  >
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <span>{entity.name}</span>
                    <span className="ml-auto text-xs text-gray-400 capitalize">{entity.type}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {tags.length > 0 && (
              <Command.Group heading="Tags" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1 mt-2">
                {tags.map((tag) => (
                  <Command.Item
                    key={tag.id}
                    onSelect={() => {
                      // Handle tag selection
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] aria-selected:bg-gray-100 dark:aria-selected:bg-[#2a2a2a]"
                  >
                    <HashtagIcon className="w-4 h-4 text-gray-400" />
                    <span>{tag.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="General" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1 mt-2">
              <Command.Item
                onSelect={() => {
                  router.push('/dashboard');
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a] aria-selected:bg-gray-100 dark:aria-selected:bg-[#2a2a2a]"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
