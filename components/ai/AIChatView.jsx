'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArrowPathIcon,
  PlusIcon,
  PaperClipIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import LoadingSpinner from '../LoadingSpinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Book, BookIcon, BookOpenIcon, Copy, Icon, MessageCircleIcon, PenLineIcon, SpaceIcon, TheaterIcon, WorkflowIcon, ClipboardList, Pencil, BookOpen, MessagesSquare, Drama, LayoutGrid } from 'lucide-react';
import { WORKSPACE_ICONS } from '../workspace/WorkspaceIcons';

export function AIChatView({ userId, messages, setMessages, aiSettings, userProfile }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const isMobile = useIsMobile();
  
  // Chat management
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Context management
  const [selectedContext, setSelectedContext] = useState([]);
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState(new Set());
  const [contextEntities, setContextEntities] = useState([]);
  const [filteredContextEntities, setFilteredContextEntities] = useState([]);
  const [contextSearch, setContextSearch] = useState('');
  const [selectedWorkspaceChips, setSelectedWorkspaceChips] = useState([]);
  
  // Mode dropdown
  const [selectedMode, setSelectedMode] = useState(null);

  // Load chat list for user
  useEffect(() => {
    const loadChatList = async () => {
      if (!supabase || !userId) return;

      try {
        setLoadingChats(true);
        // Get distinct conversations by grouping messages
        const { data, error } = await supabase
          .from('ai_chat_history')
          .select('id, content, created_at, role')
          .eq('user_id', userId)
          .eq('role', 'user')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          // Create chat list with first message as title
          const chats = data.map((msg, idx) => ({
            id: msg.id,
            title: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
            created_at: msg.created_at,
            timestamp: new Date(msg.created_at).toLocaleDateString()
          }));
          setChatList(chats);
        }
      } catch (err) {
        console.error('Error loading chat list:', err);
      } finally {
        setLoadingChats(false);
      }
    };

    loadChatList();
  }, [userId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Load user's workspaces
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!supabase || !userId) return;

      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, name, workspace_members!inner(user_id)')
          .eq('workspace_members.user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setWorkspaces(data);
        }
      } catch (err) {
        console.error('Error loading workspaces:', err);
      }
    };

    loadWorkspaces();
  }, [userId]);

  // Load entities and snippets for selected workspaces
  useEffect(() => {
    const loadContextItems = async () => {
      if (!supabase || selectedWorkspaces.size === 0) {
        setContextEntities([]);
        return;
      }

      try {
        const workspaceIds = Array.from(selectedWorkspaces);
        
        // Load entities
        const { data: entities } = await supabase
          .from('workspace_entities')
          .select('id, name, type, workspace_id')
          .in('workspace_id', workspaceIds);

        // Load snippets
        const { data: snippets } = await supabase
          .from('snippets')
          .select('id, title, workspace_id')
          .in('workspace_id', workspaceIds)
          .eq('is_final', false);

        const allItems = [
          ...(entities || []).map(e => ({
            id: e.id,
            name: e.name,
            type: 'entity',
            subType: e.type,
            workspaceId: e.workspace_id
          })),
          ...(snippets || []).map(s => ({
            id: s.id,
            name: s.title,
            type: 'snippet',
            workspaceId: s.workspace_id
          }))
        ];

        setContextEntities(allItems);
        setFilteredContextEntities(allItems);
      } catch (err) {
        console.error('Error loading context items:', err);
      }
    };

    loadContextItems();
  }, [selectedWorkspaces]);

  // Filter context entities based on search
  useEffect(() => {
    if (contextSearch.trim() === '') {
      setFilteredContextEntities(contextEntities);
    } else {
      const filtered = contextEntities.filter(item =>
        item.name.toLowerCase().includes(contextSearch.toLowerCase())
      );
      setFilteredContextEntities(filtered);
    }
  }, [contextSearch, contextEntities]);

  const toggleWorkspace = (workspaceId) => {
    const newSelected = new Set(selectedWorkspaces);
    if (newSelected.has(workspaceId)) {
      newSelected.delete(workspaceId);
      setSelectedWorkspaceChips(prev => prev.filter(w => w.id !== workspaceId));
    } else {
      newSelected.add(workspaceId);
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace) {
        setSelectedWorkspaceChips(prev => [...prev, workspace]);
      }
    }
    setSelectedWorkspaces(newSelected);
  };

  const addContextItem = (item) => {
    const alreadyAdded = selectedContext.some(c => c.id === item.id);
    if (!alreadyAdded) {
      setSelectedContext([...selectedContext, item]);
    }
  };

  const toggleContextItem = (item) => {
    const isSelected = selectedContext.some(c => c.id === item.id);
    if (isSelected) {
      setSelectedContext(selectedContext.filter(c => c.id !== item.id));
    } else {
      setSelectedContext([...selectedContext, item]);
    }
  };

  const removeContextItem = (itemId) => {
    setSelectedContext(selectedContext.filter(c => c.id !== itemId));
  };

  const addWorkspaceChip = (workspace) => {
    const alreadyAdded = selectedWorkspaceChips.some(w => w.id === workspace.id);
    if (!alreadyAdded) {
      setSelectedWorkspaceChips([...selectedWorkspaceChips, workspace]);
      const newSelected = new Set(selectedWorkspaces);
      newSelected.add(workspace.id);
      setSelectedWorkspaces(newSelected);
    }
  };

  const removeWorkspaceChip = (workspaceId) => {
    setSelectedWorkspaceChips(selectedWorkspaceChips.filter(w => w.id !== workspaceId));
    const newSelected = new Set(selectedWorkspaces);
    newSelected.delete(workspaceId);
    setSelectedWorkspaces(newSelected);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);

    const messageContent = input;
    const allContext = [
      ...selectedWorkspaceChips.map(w => ({ id: w.id, name: w.name, type: 'workspace' })),
      ...selectedContext
    ];

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString(),
      context: allContext.length > 0 ? allContext : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Save user message
      await supabase
        .from('ai_chat_history')
        .insert({
          user_id: userId,
          role: 'user',
          content: messageContent,
          metadata: allContext.length > 0 ? { context: allContext } : null
        });

      // Build comprehensive context with snippets and entities
      let contextString = '';
      if (allContext.length > 0) {
        contextString = '\n\n=== CONTEXT INFORMATION ===\n';
        
        // Fetch and include snippet content (first 1000 tokens)
        const snippetIds = selectedContext.filter(c => c.type === 'snippet').map(c => c.id);
        if (snippetIds.length > 0) {
          const { data: snippets } = await supabase
            .from('snippets')
            .select('id, title, content')
            .in('id', snippetIds);
          
          if (snippets && snippets.length > 0) {
            contextString += '\n📄 SNIPPETS:\n';
            snippets.forEach(snippet => {
              const truncatedContent = snippet.content ? 
                snippet.content.substring(0, 4000) + (snippet.content.length > 4000 ? '...' : '') 
                : 'No content';
              contextString += `\n--- ${snippet.title} ---\n${truncatedContent}\n`;
            });
          }
        }

        // Fetch and include entity details
        const entityIds = selectedContext.filter(c => c.type === 'entity').map(c => c.id);
        if (entityIds.length > 0) {
          const { data: entities } = await supabase
            .from('workspace_entities')
            .select('id, name, type, description, metadata')
            .in('id', entityIds);
          
          if (entities && entities.length > 0) {
            contextString += '\n🏷️ ENTITIES:\n';
            entities.forEach(entity => {
              contextString += `\n--- ${entity.name} (${entity.type}) ---\n`;
              if (entity.description) contextString += `Description: ${entity.description}\n`;
              if (entity.metadata) {
                const meta = typeof entity.metadata === 'string' ? JSON.parse(entity.metadata) : entity.metadata;
                Object.entries(meta).forEach(([key, value]) => {
                  contextString += `${key}: ${value}\n`;
                });
              }
            });
          }
        }

        // Include workspace info
        const workspaceIds = selectedWorkspaceChips.map(w => w.id);
        if (workspaceIds.length > 0) {
          contextString += '\n📁 WORKSPACES:\n';
          selectedWorkspaceChips.forEach(ws => {
            contextString += `- ${ws.name}\n`;
          });
        }

        contextString += '\n=== END CONTEXT ===\n';
      }

      // Mode-specific system prompts
      const modePrompts = {
        plan: `You are a creative writing assistant specialized in story planning and outlining. 
Your role is to help writers:
- Develop comprehensive story outlines and plot structures
- Create detailed scene breakdowns and chapter plans
- Establish clear story arcs and narrative progression
- Build cohesive timelines and story chronology
- Plan character development arcs
- Organize world-building elements systematically

Provide structured, organized responses with clear sections and actionable planning steps. Focus on helping the writer see the big picture while maintaining attention to detail.`,

        write: `You are a creative writing coach focused on the craft of prose and storytelling.
Your role is to help writers:
- Craft compelling prose with vivid descriptions and strong voice
- Develop engaging dialogue that reveals character
- Master show-don't-tell techniques
- Create atmospheric and immersive scenes
- Refine sentence structure, pacing, and rhythm
- Polish and elevate their writing quality

Provide specific examples, demonstrate techniques, and offer concrete suggestions for improvement. Be encouraging while maintaining high standards for craft.`,

        guide: `You are a knowledgeable writing mentor and literary guide.
Your role is to help writers:
- Understand literary techniques and storytelling principles
- Learn genre conventions and reader expectations
- Master narrative structures and plot devices
- Develop their unique voice and style
- Navigate the creative writing process
- Build foundational writing skills

Explain concepts clearly with examples from literature. Be educational, patient, and supportive. Break down complex ideas into understandable lessons.`,

        discuss: `You are a thoughtful literary discussion partner and creative collaborator.
Your role is to help writers:
- Explore themes, symbolism, and deeper meanings
- Brainstorm ideas and creative possibilities
- Analyze character motivations and relationships
- Discuss plot alternatives and story directions
- Examine narrative choices and their implications
- Think through story problems and challenges

Engage in thoughtful dialogue, ask probing questions, and offer multiple perspectives. Be collaborative and help the writer discover their own insights.`,

        simulate: `You are a versatile creative assistant who can roleplay characters and scenarios.
Your role is to help writers:
- Act out character interactions and dialogue
- Simulate scenes to test how they might unfold
- Embody different character voices and perspectives
- Explore "what if" scenarios in the story world
- Practice dialogue through interactive conversation
- Experience story moments from different viewpoints

Stay in character when roleplaying, adapt to the writer's creative vision, and provide authentic reactions. Help bring the story world to life through immersive interaction.`,

        default: `You are Polarity, a creative writing assistant specialized in novel and story writing.
Your role is to help writers craft compelling narratives, develop rich characters, build immersive worlds, and refine their prose. You understand story structure, character development, plot pacing, dialogue, description, and all aspects of the creative writing craft.

Be supportive, insightful, and practical. Provide specific, actionable guidance while respecting the writer's creative vision. Draw on your knowledge of literature and storytelling techniques to help writers bring their stories to life.`
      };

      const systemPrompt = modePrompts[selectedMode || 'default'];

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Build complete messages array in correct order:
      // 1. System prompt
      // 2. Conversation history
      // 3. Current user message with context
      const allMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...conversationHistory,
        {
          role: 'user',
          content: messageContent + contextString,
        },
      ];

      // Call our secure API route
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages,
          userId,
          mode: selectedMode || 'default'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message
      await supabase
        .from('ai_chat_history')
        .insert({
          user_id: userId,
          role: 'assistant',
          content: assistantMessage,
        });

    } catch (error) {
      console.error('AI Error:', error);
      toast.error(error.message || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const regenerateLastResponse = async () => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove last AI response
    const newMessages = messages.filter(m =>
      !(m.role === 'assistant' && new Date(m.created_at) > new Date(lastUserMessage.created_at))
    );
    setMessages(newMessages);

    // Delete from database
    await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'assistant')
      .gt('created_at', lastUserMessage.created_at);

    // Resend
    setInput(lastUserMessage.content);
    setTimeout(() => sendMessage(), 100);
  };

  const clearChat = async () => {
    if (!confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) return;

    try {
      // Delete all messages from database
      await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', userId);

      // Clear local state
      setMessages([]);
      setSelectedContext([]);
      setSelectedWorkspaceChips([]);
      setSelectedWorkspaces(new Set());
      setInput('');
      setSelectedMode(null);
      setCurrentChatId(null);
      setChatList([]);

      toast.success('Chat cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSelectedContext([]);
    setSelectedWorkspaceChips([]);
    setSelectedWorkspaces(new Set());
    setInput('');
    setSelectedMode(null);
    toast.success('New chat created');
  };

  const loadChat = async (chatId) => {
    if (!supabase) return;

    try {
      setLoading(true);
      // Find the first user message in this chat and load all related messages
      const { data: firstMsg } = await supabase
        .from('ai_chat_history')
        .select('created_at')
        .eq('id', chatId)
        .single();

      if (!firstMsg) return;

      // Load all messages from this conversation (from first message onwards)
      const { data: chatMessages, error } = await supabase
        .from('ai_chat_history')
        .select('id, role, content, created_at')
        .eq('user_id', userId)
        .gte('created_at', firstMsg.created_at)
        .lte('created_at', new Date(new Date(firstMsg.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (!error && chatMessages) {
        const formattedMessages = chatMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at
        }));
        setMessages(formattedMessages);
        setCurrentChatId(chatId);
        toast.success('Chat loaded');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="flex h-full bg-transparent flex-row-reverse overflow-hidden">
  

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 mb-28">
        {/* Header */}
        {/* <div className="px-6 py-4   flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="h-9 w-9 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
              title={showSidebar ? 'Hide chat list' : 'Show chat list'}
            >
              {showSidebar ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </Button>
            {currentChatId && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversation loaded</span>
              </div>
            )}
          </div>
        </div> */}

        {/* Messages */}
       <div className=''> <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-6 min-h-[90%]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full mt-4 text-center">
                <br />  <br />
                <br />  <br />

                <div className="p-5  rounded-2xl mb-4">
                  <img className='w-12 h-24' src="/polarity.png" alt="" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                  Polarity
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-8">
                  Your creative partner for storytelling, character development, and refining your prose.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('Help me develop a compelling protagonist for my novel')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Character Development</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Create compelling characters</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('What are some techniques to build tension in a thriller?')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Plot Structure</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Learn storytelling techniques</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('Review this paragraph and suggest improvements')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Get Feedback</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Improve your writing</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-left justify-start h-auto py-4 px-5 bg-white/50 dark:bg-[#1c1c1c]/50 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border-gray-200 dark:border-[#2a2a2a] hover:bg-white dark:hover:bg-[#2a2a2a] hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                    onClick={() => setInput('Help me overcome writer&apos;s block')}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1 text-gray-900 dark:text-[#e7e7e7] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Writer&apos;s Block</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Get unstuck and inspired</div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-5xl mx-auto">
                {messages.map((message, index) => {
                  const isLastMessage = index === messages.length - 1;
                  const isLastAssistantMessage = message.role === 'assistant' && isLastMessage;
                  
                  return (
                  <div key={message.id}>
                    <div
                      className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {message.role === 'user' && userProfile?.avatar_url ? (
                          <img 
                            src={userProfile.avatar_url} 
                            alt="User" 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <AvatarFallback className={message.role === 'user' ? 'bg-gray-700 dark:bg-gray-600 text-white' : 'bg-red-500'}>
                            {message.role === 'user' ? 'U' : (
                              <img src="/polarity.png" alt="Polarity" className="w-8 h-8 object-contain" />
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                        <div className=' '>
                          <div
                            className={`inline-block w-full px-4 py-3 rounded-lg ${message.role === 'user'
                              ? 'bg-gray-900 dark:bg-gray-700 text-white'
                              : 'bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-sm text-gray-900 dark:text-[#e7e7e7] border border-gray-200 dark:border-[#333]'
                              }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                          
                          <div className={`flex mt-1.5 ${message.role === 'user' ? 'text-right' : ''}`}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                toast.success('Copied to clipboard');
                              }}
                              className="inline-flex items-center ml-auto gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded transition-colors"
                              title="Copy message"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {isLastAssistantMessage && messages.length >= 2 && (
                            <div className=" ">
                              <button
                                onClick={regenerateLastResponse}
                                disabled={loading}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]   rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Regenerate response"
                              >
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          </div>
                         
                          
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-500 text-white">
                        <img src="/polarity.png" alt="Polarity" className="w-8 h-8 object-contain" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="inline-block px-4 py-3 rounded-lg bg-white/80 dark:bg-[#2a2a2a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#333]">
                        <LoadingSpinner className="h-5 w-5" size="sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
</div>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-lg safe-area-inset-bottom">
          <div className="p-3 space-y-3">
            {/* Context chips - scrollable horizontal */}
            {(selectedWorkspaceChips.length > 0 || selectedContext.length > 0) && (
              <div className='flex w-full justify-between items-center'> <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide ">
                {selectedWorkspaceChips.map(workspace => (
                  <Badge
                    key={workspace.id}
                    variant="secondary"
                    className="bg-white text-black dark:bg-[#1c1c1c] dark:text-[#e7e7e7] flex items-center gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0"
                  >
                    <span className="text-xs font-medium">{workspace.name}</span>
                    <button
                      onClick={() => removeWorkspaceChip(workspace.id)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {selectedContext.map(item => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="bg-black text-white dark:bg-white dark:text-black  flex items-center gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0 shadow-sm"
                  >
                    <span className="text-xs font-medium">{item.type === 'entity' ? '🏷️' : '📄'} {item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}</span>
                    <button
                      onClick={() => removeContextItem(item.id)}
                      className="hover:bg-purple-200/50 dark:hover:bg-purple-700/50 rounded-full p-0.5 transition-colors"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                
              </div>

</div>
            )}

            {/* Quick actions row */}
            <div className="flex items-center gap-2">
              {/* Mode button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 flex-shrink-0 bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] rounded-xl active:scale-95 transition-transform"
                  >
                    {selectedMode === 'plan' ? <ClipboardList className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      : selectedMode === 'write' ? <Pencil className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      : selectedMode === 'guide' ? <BookOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      : selectedMode === 'discuss' ? <MessagesSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      : selectedMode === 'simulate' ? <Drama className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      : <LayoutGrid className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="mb-2 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a]">
                  <DropdownMenuItem onClick={() => setSelectedMode(null)} className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer">
                    <LayoutGrid className="w-4 h-4 mr-2 inline" /> Default
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMode('plan')} className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer">
                    <ClipboardList className="w-4 h-4 mr-2 inline" /> Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMode('write')} className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer">
                    <Pencil className="w-4 h-4 mr-2 inline" /> Write
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMode('guide')} className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer">
                    <BookOpen className="w-4 h-4 mr-2 inline" /> Guide
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMode('discuss')} className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer">
                    <MessagesSquare className="w-4 h-4 mr-2 inline" /> Discuss
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMode('simulate')} className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer">
                    <Drama className="w-4 h-4 mr-2 inline" /> Simulate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sources button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 flex-shrink-0 bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] rounded-xl active:scale-95 transition-transform relative"
                  >
                    <span className="text-lg">
                      <WorkflowIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </span>
                    {selectedWorkspaces.size > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {selectedWorkspaces.size}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-72 mb-2 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a]">
                  <div className="p-3 space-y-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Workspaces</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {workspaces.length > 0 ? (
                        workspaces.map(workspace => (
                          <div key={workspace.id} className="flex items-center justify-between gap-2 py-1">
                            <label className="text-sm text-gray-700 dark:text-gray-300 flex-1">{workspace.name}</label>
                            <Switch
                              checked={selectedWorkspaces.has(workspace.id)}
                              onCheckedChange={() => toggleWorkspace(workspace.id)}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No workspaces available</p>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Context/Attachment button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowContextDialog(true)}
                disabled={selectedWorkspaces.size === 0}
                className="h-11 w-11 flex-shrink-0 bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] rounded-xl active:scale-95 transition-transform disabled:opacity-40"
              >
                <PaperClipIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Button>

              {/* Main input - takes remaining space */}
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={aiSettings?.apiKey ? "Type a message..." : "Configure API key first"}
                  disabled={loading || !aiSettings?.apiKey}
                  className="h-11 pr-11 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border border-gray-200 dark:border-[#2a2a2a] focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0 rounded-xl text-base"
                />
              </div>

              {/* Send button - positioned at bottom right */}
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading || !aiSettings?.apiKey}
                className="h-11 w-11 flex-shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white disabled:opacity-40 active:scale-95 transition-all p-0"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Secondary actions - collapsible */}
            
          </div>
        </div>
      )}
      
      {/* Context selection dialog */}
      <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
        <DialogContent className="max-w-xl w-[92vw] sm:w-full max-h-[88vh] sm:max-h-[80vh] bg-white dark:bg-[#191919] border-0 shadow-xl p-0 gap-0">
          <div className="p-4 sm:p-5 pb-3 border-b border-gray-100 dark:border-[#1a1a1a]">
            <DialogTitle className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
              Add Context
            </DialogTitle>
            {selectedContext.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {selectedContext.length} selected
              </p>
            )}
          </div>
          
          <div className="px-4 sm:px-5 pt-3 pb-0">
            {/* Search bar */}
            <div className="relative">
              <Input
                placeholder="Search..."
                value={contextSearch}
                onChange={(e) => setContextSearch(e.target.value)}
                className="h-9 pl-8 pr-8 text-sm bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-gray-200 border-0 focus:ring-1 focus:ring-purple-500/30 rounded-md transition-all placeholder:text-gray-400"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {contextSearch && (
                <button
                  onClick={() => setContextSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Context items list */}
          <ScrollArea className="h-[52vh] sm:h-[420px] px-4 sm:px-5 py-3">
            <div className="space-y-1">
              {filteredContextEntities.length > 0 ? (
                filteredContextEntities.map(item => {
                  const isSelected = selectedContext.some(c => c.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleContextItem(item)}
                      className={`group relative px-2.5 py-2 rounded-md cursor-pointer transition-all active:scale-[0.99] ${
                        isSelected
                          ? 'bg-black dark:bg-white'
                          : 'hover:bg-gray-50 dark:hover:bg-[#141414] active:bg-gray-100 dark:active:bg-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Minimal checkbox */}
                        <div className={`flex-shrink-0 w-4 h-4 rounded-sm flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-black'
                            : 'border border-gray-300 dark:border-[#333] group-hover:border-gray-400 dark:group-hover:border-[#444]'
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Item content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-normal truncate ${
                            isSelected
                              ? 'text-white dark:text-black'
                              : 'text-gray-900 dark:text-gray-200'
                          }`} title={item.name}>
                            {item.type === 'entity' ? '🏷️' : '📄'} {item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name}
                          </p>
                          {item.type === 'entity' && item.subType && (
                            <p className={`text-xs mt-0.5 truncate ${
                              isSelected
                                ? 'text-gray-300 dark:text-gray-700'
                                : 'text-gray-500 dark:text-gray-500'
                            }`}>
                              {item.subType}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <PaperClipIcon className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-900 dark:text-gray-300 mb-0.5">
                    {selectedWorkspaces.size === 0 ? 'No workspace selected' : 'No items found'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-600 text-center max-w-[280px]">
                    {selectedWorkspaces.size === 0
                      ? 'Select a workspace from Sources'
                      : 'Try a different search term'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Dialog actions */}
          <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-[#1a1a1a]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedContext(filteredContextEntities)}
              disabled={filteredContextEntities.length === 0}
              className="h-8 px-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#141414]"
            >
              Select All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedContext([]);
                  setShowContextDialog(false);
                }}
                className="h-8 px-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#141414]"
                >
                Clear
                </Button>
                <Button
                onClick={() => setShowContextDialog(false)}
                className="h-8 px-4 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-md font-normal shadow-none"
                >
                Done {selectedContext.length > 0 && `(${selectedContext.length})`}
                </Button>
              </div>
              </div>
            </DialogContent>
            </Dialog>
            </div>

            {!isMobile && (
            <div className="fixed ml-36 bottom-4 rounded-lg left-1/2  -translate-x-1/2 backdrop-blur-sm py-4 w-full max-w-4xl">
              <div className="px-4">
              {(selectedWorkspaceChips.length > 0 || selectedContext.length > 0) && (
                <div className="mb-3 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2 justify-center flex-wrap">
                  {selectedWorkspaceChips.map(workspace => (
                  <Badge
                    key={workspace.id}
                    variant="secondary"
                    className="bg-black text-white dark:bg-white dark:text-black flex items-center gap-2 rounded-full px-3 whitespace-nowrap flex-shrink-0"
                  >
                    {workspace.name}
                    <button
                    onClick={() => removeWorkspaceChip(workspace.id)}
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                    >
                    <XMarkIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                  ))}
                  {selectedContext.map(item => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="bg-black text-white dark:bg-white dark:text-black  flex items-center gap-2 rounded-full px-3 whitespace-nowrap flex-shrink-0 shadow-sm"
                  >
                    {item.type === 'entity' ? '🏷️' : '📄'} {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
                    <button
                    onClick={() => removeContextItem(item.id)}
                    className="ml-1 hover:bg-purple-200/50 dark:hover:bg-purple-700/50 rounded-full p-0.5 transition-colors"
                    >
                    <XMarkIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                  ))}
                </div>
                </div>
              )}
 
            <div className="flex gap-2 items-end">
              {/* Clear chat button */}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  disabled={loading}
                  title="Clear all messages"
                  className="h-10 w-10 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}

              {/* Mode dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors font-medium text-sm flex items-center gap-1.5"
                  >
                    {selectedMode === 'plan' ? (
                      <><ClipboardList className="w-4 h-4" /><span>Plan</span></>
                    ) : selectedMode === 'write' ? (
                      <><Pencil className="w-4 h-4" /><span>Write</span></>
                    ) : selectedMode === 'guide' ? (
                      <><BookOpen className="w-4 h-4" /><span>Guide</span></>
                    ) : selectedMode === 'discuss' ? (
                      <><MessagesSquare className="w-4 h-4" /><span>Discuss</span></>
                    ) : selectedMode === 'simulate' ? (
                      <><Drama className="w-4 h-4" /><span>Simulate</span></>
                    ) : (
                      <><LayoutGrid className="w-4 h-4" /><span>Mode</span></>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a]">
                  <DropdownMenuItem 
                    onClick={() => setSelectedMode(null)} 
                    className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />Default
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedMode('plan')} 
                    className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedMode('write')} 
                    className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 mr-2" />Write
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedMode('guide')} 
                    className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />Guide
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedMode('discuss')} 
                    className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                  >
                    <MessagesSquare className="w-4 h-4 mr-2" />Discuss
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedMode('simulate')} 
                    className="text-gray-900 dark:text-[#e7e7e7] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                  >
                    <Drama className="w-4 h-4 mr-2" />Simulate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sources dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors font-medium text-sm"
                  >
                    Sources {selectedWorkspaces.size > 0 && `(${selectedWorkspaces.size})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a]">
                  <div className="p-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">
                        Workspaces
                      </p>
                      <div className="space-y-2">
                        {workspaces.length > 0 ? (
                          workspaces.map(workspace => (
                            <div key={workspace.id} className="flex items-center justify-between gap-2">
                              <label className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                {workspace.name}
                              </label>
                              <Switch
                                checked={selectedWorkspaces.has(workspace.id)}
                                onCheckedChange={() => toggleWorkspace(workspace.id)}
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No workspaces available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Attachment/Context button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowContextDialog(true)}
                disabled={selectedWorkspaces.size === 0}
                title={selectedWorkspaces.size === 0 ? 'Select a workspace first' : 'Add context from workspace'}
                className="h-10 w-10 bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <PaperClipIcon className="w-4 h-4" />
              </Button>

              {/* Main input */}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={aiSettings?.apiKey ? "Ask me anything about writing..." : "Configure API key in Settings first"}
                disabled={loading || !aiSettings?.apiKey}
                className="flex-1 h-10 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border border-gray-200 dark:border-[#2a2a2a] focus:border-purple-500 dark:focus:border-purple-500 focus:ring-0 focus:outline-none rounded-lg transition-colors"
              />

              {/* Send button */}
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading || !aiSettings?.apiKey}
                className={`h-10 px-4 rounded-lg transition-all font-medium ${
                  loading
                    ? 'bg-purple-500 dark:bg-purple-600 text-white'
                    : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    </div>
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
