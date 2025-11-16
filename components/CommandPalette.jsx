'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export function CommandPalette({ workspaces = [], currentWorkspaceId = null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command) => {
    setOpen(false);
    command();
  }, [setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <HomeIcon className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          {currentWorkspaceId && (
            <>
              <CommandItem onSelect={() => runCommand(() => router.push(`/workspace/${currentWorkspaceId}`))}>
                <FolderIcon className="mr-2 h-4 w-4" />
                <span>Go to Workspace</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push(`/workspace/${currentWorkspaceId}/people`))}>
                <UserGroupIcon className="mr-2 h-4 w-4" />
                <span>View People</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push(`/workspace/${currentWorkspaceId}/chat`))}>
                <ChatBubbleLeftIcon className="mr-2 h-4 w-4" />
                <span>Open Chat</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspaces">
          {workspaces.slice(0, 5).map((workspace) => (
            <CommandItem
              key={workspace.id}
              onSelect={() => runCommand(() => router.push(`/workspace/${workspace.id}`))}
            >
              <FolderIcon className="mr-2 h-4 w-4" />
              <span>{workspace.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => {
            // Trigger new workspace modal
            window.dispatchEvent(new CustomEvent('openNewWorkspace'));
          })}>
            <PlusIcon className="mr-2 h-4 w-4" />
            <span>Create New Workspace</span>
          </CommandItem>
          {currentWorkspaceId && (
            <CommandItem onSelect={() => runCommand(() => {
              // Trigger new snippet modal
              window.dispatchEvent(new CustomEvent('openNewSnippet'));
            })}>
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              <span>Create New Snippet</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => {
            window.dispatchEvent(new CustomEvent('openSettings'));
          })}>
            <Cog6ToothIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            window.dispatchEvent(new CustomEvent('openNotifications'));
          })}>
            <BellIcon className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
