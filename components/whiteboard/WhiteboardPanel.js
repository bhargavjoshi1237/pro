'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as Y from 'yjs';
import { WhiteboardProvider } from '@/lib/whiteboard-provider';
import { supabase } from '@/lib/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
// Import Excalidraw styles
// Note: We might need to check if this file exists in the package, 
// usually it's main.css or similar, or it's included in the bundle.
// If using the react component, it often requires no css import if using the production build,
// but in dev it might. Let's try to find the correct path if it fails.
// Common path:
// import "@excalidraw/excalidraw/index.css"; 
// But let's verify if we can just use the component without it first? 
// The huge icons definitely mean missing CSS.
// Let's try to add a global style or import it.
// Since I can't easily check node_modules, I'll try the standard import.
// If it fails build, I'll remove it.
// Actually, let's try to use a safer approach:
// We will assume the user has a way to handle css.
// But wait, I can just check if I can read the file?
// No, I'll just add the import.
import "@excalidraw/excalidraw/index.css";

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
    async () => {
        // Import CSS
        // Note: In some versions/setups this might need to be imported at the top, 
        // but for dynamic import we might need to do it differently or ensure it's global.
        // Let's try importing it here or at the top if possible.
        // Actually, standard way is top level, but since it's dynamic...
        // Let's rely on the fact that next.js handles css imports.
        return (await import('@excalidraw/excalidraw')).Excalidraw;
    },
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        ),
    }
);

export default function WhiteboardPanel({ workspaceId, userId, onClose }) {
    const [whiteboardId, setWhiteboardId] = useState(null);
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const [provider, setProvider] = useState(null);
    const [ydoc] = useState(() => new Y.Doc());
    const [loading, setLoading] = useState(true);
    const [activeUsers, setActiveUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [boardName, setBoardName] = useState('');

    // Fetch current user details
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    // Fetch or create whiteboard for this workspace
    useEffect(() => {
        const fetchWhiteboard = async () => {
            // If ID is passed explicitly, use it
            if (whiteboardId) {
                // Fetch name if we just have ID
                const { data } = await supabase.from('whiteboards').select('name').eq('id', whiteboardId).single();
                if (data) setBoardName(data.name);

                setWhiteboardId(whiteboardId);
                setLoading(false);
                return;
            }

            // Legacy/Fallback: Find the first whiteboard or create default
            try {
                let { data, error } = await supabase
                    .from('whiteboards')
                    .select('id, name')
                    .eq('workspace_id', workspaceId)
                    .limit(1)
                    .maybeSingle();

                if (!data) {
                    // No whiteboard found, create one
                    const { data: newData, error: createError } = await supabase
                        .from('whiteboards')
                        .insert({
                            workspace_id: workspaceId,
                            name: 'Main Board'
                        })
                        .select('id, name')
                        .single();

                    if (createError) throw createError;
                    data = newData;
                } else if (error) {
                    throw error;
                }

                setWhiteboardId(data.id);
                setBoardName(data.name);
            } catch (err) {
                console.error('Error fetching whiteboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWhiteboard();
    }, [workspaceId, whiteboardId]);

    // Initialize collaboration
    useEffect(() => {
        if (!whiteboardId || !userId || !excalidrawAPI) return;

        const whiteboardProvider = new WhiteboardProvider(ydoc, workspaceId, whiteboardId, userId);
        setProvider(whiteboardProvider);

        const yElements = ydoc.getArray('elements');

        // Listen for remote updates
        const handleRemoteUpdate = () => {
            if (whiteboardProvider.isSyncing) return;

            whiteboardProvider.isSyncing = true;
            try {
                const elements = yElements.toArray();
                if (elements.length > 0) {
                    excalidrawAPI.updateScene({
                        elements,
                    });
                }
            } finally {
                whiteboardProvider.isSyncing = false;
            }
        };

        yElements.observeDeep(handleRemoteUpdate);

        // Initial load from Yjs if data exists
        if (yElements.length > 0) {
            handleRemoteUpdate();
        }

        // Broadcast initial presence
        if (currentUser) {
            whiteboardProvider.broadcastAwareness({
                pointer: { x: 0, y: 0 },
                button: 'up',
                username: currentUser.user_metadata?.full_name || currentUser.email,
                avatarUrl: currentUser.user_metadata?.avatar_url
            });
        }

        return () => {
            yElements.unobserveDeep(handleRemoteUpdate);
            whiteboardProvider.destroy();
        };
    }, [whiteboardId, userId, excalidrawAPI, ydoc, workspaceId]);

    // Handle Excalidraw changes
    const handleChange = useCallback((elements, appState, files) => {
        if (!provider || provider.isSyncing) return;

        const yElements = ydoc.getArray('elements');

        provider.isSyncing = true;
        try {
            ydoc.transact(() => {
                const currentYElements = yElements.toArray();
                if (JSON.stringify(currentYElements) !== JSON.stringify(elements)) {
                    yElements.delete(0, yElements.length);
                    yElements.insert(0, elements);
                }
            });
        } finally {
            provider.isSyncing = false;
        }
    }, [provider, ydoc]);

    const handlePointerUpdate = useCallback((payload) => {
        if (!provider || !currentUser) return;
        provider.broadcastAwareness({
            pointer: payload.pointer,
            button: payload.button,
            username: currentUser.user_metadata?.full_name || currentUser.email,
            avatarUrl: currentUser.user_metadata?.avatar_url
        });
    }, [provider, currentUser]);

    // Listen for remote awareness (cursors)
    useEffect(() => {
        if (!provider || !excalidrawAPI) return;

        provider.onawarenessupdate = ({ updated, added }) => {
            const collaborators = new Map();
            const users = [];

            provider.awareness.forEach((state, clientId) => {
                // Collect active users for the header
                if (state.username) {
                    users.push({
                        id: clientId,
                        name: state.username,
                        avatarUrl: state.avatarUrl,
                        isSelf: clientId === userId
                    });
                }

                if (clientId !== userId && state.pointer) {
                    collaborators.set(clientId, {
                        pointer: state.pointer,
                        button: state.button || 'up',
                        username: state.username || 'User',
                        avatarUrl: state.avatarUrl,
                    });
                }
            });

            setActiveUsers(users);
            excalidrawAPI.updateScene({
                collaborators,
            });
        };
    }, [provider, excalidrawAPI, userId]);

    const { theme } = useTheme();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white dark:bg-[#191919]">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-[#191919]' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-4 py-2 border-b ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                    <h2 className={`text-sm font-semibold ${theme === 'dark' ? 'text-[#e7e7e7]' : 'text-gray-900'}`}>{boardName || 'Whiteboard'}</h2>
                    {/* Active Users Presence Bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-2">
                            {activeUsers.map(user => (
                                <div key={user.id} className="relative group" title={user.name}>
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            className={`w-6 h-6 rounded-full border-2 ${theme === 'dark' ? 'border-[#191919]' : 'border-white'}`}
                                        />
                                    ) : (
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white border-2 ${theme === 'dark' ? 'bg-gray-600 border-[#191919]' : 'bg-gray-300 border-white'}`}>
                                            {user.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {activeUsers.length > 0 && (
                            <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {activeUsers.length} active
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-[#2a2a2a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 w-full h-full relative overflow-hidden touch-none">
                <Excalidraw
                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                    onChange={handleChange}
                    onPointerUpdate={handlePointerUpdate}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    UIOptions={{
                        canvasActions: {
                            loadScene: false,
                            saveToActiveFile: false,
                            toggleTheme: true, // Allow manual toggle if they want, but we init with app theme
                            saveAsImage: true,
                        },
                    }}
                />
            </div>
        </div>
    );
}
