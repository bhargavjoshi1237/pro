'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  XMarkIcon, 
  PlusIcon,
  UserGroupIcon,
  Square2StackIcon,
  PhotoIcon,
  LinkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import StickyNoteNode from './nodes/StickyNoteNode';
import TextCardNode from './nodes/TextCardNode';
import ImageNode from './nodes/ImageNode';
import LinkNode from './nodes/LinkNode';

const nodeTypes = {
  sticky: StickyNoteNode,
  text: TextCardNode,
  image: ImageNode,
  link: LinkNode,
};

const colorPresets = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Orange', value: '#fed7aa' },
];

export default function NotesBoard({ boardId, workspaceId, userId, onClose }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [board, setBoard] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToolbar, setShowToolbar] = useState(false);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Fetch board data
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const { data, error } = await supabase
          .from('notes_boards')
          .select('*')
          .eq('id', boardId)
          .single();

        if (error) throw error;
        setBoard(data);
      } catch (err) {
        console.error('Error fetching board:', err);
      }
    };

    fetchBoard();
  }, [boardId]);

  // Fetch notes items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('notes_items')
          .select('*')
          .eq('board_id', boardId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const flowNodes = (data || []).map(item => ({
          id: item.id,
          type: item.type,
          position: { x: item.position_x, y: item.position_y },
          data: {
            ...item.content,
            itemId: item.id,
            style: item.style,
            onUpdate: handleUpdateItem,
            onDelete: handleDeleteItem,
          },
          style: {
            width: item.width,
            height: item.height,
            zIndex: item.z_index,
          }
        }));

        setNodes(flowNodes);
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [boardId]);

  // Fetch connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const { data, error } = await supabase
          .from('notes_connections')
          .select('*')
          .eq('board_id', boardId);

        if (error) throw error;

        const flowEdges = (data || []).map(conn => ({
          id: conn.id,
          source: conn.source_id,
          target: conn.target_id,
          type: conn.type,
          style: conn.style,
        }));

        setEdges(flowEdges);
      } catch (err) {
        console.error('Error fetching connections:', err);
      }
    };

    fetchConnections();
  }, [boardId]);

  // Track active users
  useEffect(() => {
    if (!userId || !boardId) return;

    const trackPresence = async () => {
      // Update or create session
      const { data: existingSession } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('notes_board_id', boardId)
        .maybeSingle();

      if (existingSession) {
        await supabase
          .from('active_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingSession.id);
      } else {
        await supabase
          .from('active_sessions')
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            notes_board_id: boardId,
            last_active: new Date().toISOString()
          });
      }
    };

    trackPresence();
    const interval = setInterval(trackPresence, 10000); // Update every 10 seconds

    // Fetch active users
    const fetchActiveUsers = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('active_sessions')
        .select(`
          user_id,
          users:user_id (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('notes_board_id', boardId)
        .gte('last_active', fiveMinutesAgo);

      if (!error && data) {
        setActiveUsers(data.map(s => s.users).filter(Boolean));
      }
    };

    fetchActiveUsers();
    const usersInterval = setInterval(fetchActiveUsers, 5000); // Poll every 5 seconds

    // Subscribe to realtime session changes
    const channel = supabase
      .channel(`notes_board_sessions_${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `notes_board_id=eq.${boardId}`
        },
        () => {
          fetchActiveUsers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      clearInterval(usersInterval);
      supabase.removeChannel(channel);

      // Clean up session on unmount
      supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('notes_board_id', boardId)
        .then();
    };
  }, [userId, boardId, workspaceId]);

  // Subscribe to realtime changes for items
  useEffect(() => {
    const channel = supabase
      .channel(`notes_items_${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes_items',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNode = {
              id: payload.new.id,
              type: payload.new.type,
              position: { x: payload.new.position_x, y: payload.new.position_y },
              data: {
                ...payload.new.content,
                itemId: payload.new.id,
                style: payload.new.style,
                onUpdate: handleUpdateItem,
                onDelete: handleDeleteItem,
              },
              style: {
                width: payload.new.width,
                height: payload.new.height,
                zIndex: payload.new.z_index,
              }
            };
            setNodes((nds) => [...nds, newNode]);
          } else if (payload.eventType === 'UPDATE') {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === payload.new.id
                  ? {
                      ...node,
                      position: { x: payload.new.position_x, y: payload.new.position_y },
                      data: { ...node.data, ...payload.new.content, style: payload.new.style },
                      style: {
                        width: payload.new.width,
                        height: payload.new.height,
                        zIndex: payload.new.z_index,
                      }
                    }
                  : node
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNodes((nds) => nds.filter((node) => node.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  // Subscribe to realtime changes for connections
  useEffect(() => {
    const channel = supabase
      .channel(`notes_connections_${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes_connections',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEdge = {
              id: payload.new.id,
              source: payload.new.source_id,
              target: payload.new.target_id,
              type: payload.new.type,
              style: payload.new.style,
            };
            setEdges((eds) => [...eds, newEdge]);
          } else if (payload.eventType === 'DELETE') {
            setEdges((eds) => eds.filter((edge) => edge.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const onConnect = useCallback(
    async (params) => {
      try {
        const { data, error } = await supabase
          .from('notes_connections')
          .insert({
            board_id: boardId,
            source_id: params.source,
            target_id: params.target,
            type: 'default',
            style: {}
          })
          .select()
          .single();

        if (error) throw error;
      } catch (err) {
        console.error('Error creating connection:', err);
      }
    },
    [boardId]
  );

  const handleNodeDragStop = useCallback(
    async (event, node) => {
      try {
        await supabase
          .from('notes_items')
          .update({
            position_x: node.position.x,
            position_y: node.position.y,
          })
          .eq('id', node.id);
      } catch (err) {
        console.error('Error updating node position:', err);
      }
    },
    []
  );

  const handleUpdateItem = useCallback(async (itemId, updates) => {
    try {
      await supabase
        .from('notes_items')
        .update(updates)
        .eq('id', itemId);
    } catch (err) {
      console.error('Error updating item:', err);
    }
  }, []);

  const handleDeleteItem = useCallback(async (itemId) => {
    try {
      await supabase
        .from('notes_items')
        .delete()
        .eq('id', itemId);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  }, []);

  const addNewItem = useCallback(
    async (type) => {
      if (!reactFlowInstance) return;

      const center = reactFlowInstance.getViewport();
      const position = reactFlowInstance.project({
        x: window.innerWidth / 2 - center.x,
        y: window.innerHeight / 2 - center.y,
      });

      const defaultContent = {
        sticky: { text: 'New note' },
        text: { title: 'Title', text: 'Start typing...' },
        image: { url: '', alt: 'Image' },
        link: { url: '', title: 'Link' },
      };

      const defaultStyles = {
        sticky: { backgroundColor: colorPresets[0].value, color: '#000000' },
        text: { backgroundColor: '#ffffff', color: '#000000' },
        image: {},
        link: { backgroundColor: '#ffffff', color: '#000000' },
      };

      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('notes_items')
          .insert({
            board_id: boardId,
            type: type,
            content: defaultContent[type],
            position_x: position.x,
            position_y: position.y,
            width: type === 'sticky' ? 200 : type === 'image' ? 300 : 250,
            height: type === 'sticky' ? 200 : type === 'image' ? 300 : 150,
            z_index: 0,
            style: defaultStyles[type],
            created_by: user?.id
          });

        setShowToolbar(false);
      } catch (err) {
        console.error('Error adding item:', err);
      }
    },
    [boardId, reactFlowInstance]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-[#191919]">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50 dark:bg-[#191919]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.data?.style?.backgroundColor || '#ffffff';
          }}
          className="bg-white dark:bg-[#2a2a2a]"
        />
        
        <Panel position="top-left" className="flex items-center gap-3 bg-white dark:bg-[#2a2a2a] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">
            {board?.name || 'Notes Board'}
          </h2>
          
          {/* Active Users */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-[#3a3a3a]">
              <UserGroupIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 5).map((user, index) => (
                  <div
                    key={user.id}
                    className="relative w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white dark:border-[#2a2a2a] flex items-center justify-center text-xs font-medium text-white"
                    title={user.full_name || user.email}
                    style={{ zIndex: 5 - index }}
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (user.full_name || user.email || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
                {activeUsers.length > 5 && (
                  <div className="relative w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#2a2a2a] flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200">
                    +{activeUsers.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors"
            title="Close board"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </Panel>

        <Panel position="top-right" className="relative">
          {showToolbar ? (
            <div className="bg-white dark:bg-[#2a2a2a] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-[#3a3a3a] space-y-1">
              <button
                onClick={() => addNewItem('sticky')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded transition-colors"
              >
                <Square2StackIcon className="w-4 h-4" />
                Sticky Note
              </button>
              <button
                onClick={() => addNewItem('text')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded transition-colors"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Text Card
              </button>
              <button
                onClick={() => addNewItem('image')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded transition-colors"
              >
                <PhotoIcon className="w-4 h-4" />
                Image
              </button>
              <button
                onClick={() => addNewItem('link')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Link
              </button>
              <div className="pt-1 border-t border-gray-200 dark:border-[#3a3a3a]">
                <button
                  onClick={() => setShowToolbar(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowToolbar(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
              title="Add item"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
