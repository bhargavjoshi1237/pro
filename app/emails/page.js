'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import {
    SparklesIcon,
    HomeIcon,
    EnvelopeIcon,
    PaperAirplaneIcon,
    ClipboardDocumentIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useEntities } from '@/hooks/useEntities';
import { EntitySelector } from '@/components/emails/EntitySelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TemplateSelector } from '@/components/emails/TemplateSelector';
import { HistoryPanel } from '@/components/emails/HistoryPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function EmailsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState(null);
    const [workspaceId, setWorkspaceId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        context: '',
        recipient_role: '',
        relationship: '',
        goal: '',
        tone: 'neutral',
        length: 'medium',
        language: 'English',
        deadline: '',
        additional_points: '',
        style_samples: '',
        constraints: '',
        variant_count: 1
    });

    // New State
    const [templates, setTemplates] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Entity Hook
    const { entities, createEntity } = useEntities(workspaceId);

    useEffect(() => {
        const checkAuth = async () => {
            if (!supabase) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            setUser(session.user);

            // Fetch workspace ID (assuming single workspace for now or getting first one)
            // In a real app, this might come from context or URL
            const { data: members } = await supabase
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', session.user.id)
                .limit(1)
                .single();

            if (members) {
                setWorkspaceId(members.workspace_id);
            }

            setLoading(false);
            fetchTemplates();
            fetchHistory();
        };

        checkAuth();
    }, [router]);

    const fetchTemplates = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error) setTemplates(data || []);
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('email_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error) setHistory(data || []);
        setHistoryLoading(false);
    };

    const handleSaveTemplate = async (name) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('email_templates')
            .insert({
                user_id: user.id,
                name,
                ...formData
            })
            .select()
            .single();

        if (error) {
            toast.error('Failed to save template');
        } else {
            setTemplates([data, ...templates]);
            toast.success('Template saved');
        }
    };

    const handleDeleteTemplate = async (id) => {
        const { error } = await supabase
            .from('email_templates')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete template');
        } else {
            setTemplates(templates.filter(t => t.id !== id));
            toast.success('Template deleted');
        }
    };

    const handleLoadTemplate = (template) => {
        const { id, user_id, created_at, updated_at, name, ...data } = template;
        setFormData(prev => ({ ...prev, ...data }));
        toast.success(`Loaded template: ${name}`);
    };

    const handleLoadHistory = (item) => {
        setFormData(item.input_data);
        setGeneratedResult(item.generated_output);
        toast.success('Loaded from history');
        setShowHistory(false);
    };

    const saveToHistory = async (input, output) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('email_history')
            .insert({
                user_id: user.id,
                input_data: input,
                generated_output: output
            })
            .select()
            .single();

        if (data) {
            setHistory([data, ...history]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEntityChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateEntity = async (name, type, context) => {
        if (!workspaceId) return null;
        // Create entity with type and description (context)
        return await createEntity(name, type, context);
    };

    const handleGenerate = async () => {
        if (!formData.context && !formData.goal) {
            toast.error('Please provide at least a context or a goal.');
            return;
        }

        setGenerating(true);
        setGeneratedResult(null);

        try {
            // Find selected entities to pass their context if available
            const roleEntity = entities.find(e => e.name === formData.recipient_role && e.type === 'Role');
            const relEntity = entities.find(e => e.name === formData.relationship && e.type === 'Relationship');

            // Prepare data for API
            const apiData = {
                ...formData,
                additional_points: formData.additional_points ? formData.additional_points.split('\n').filter(line => line.trim()) : [],
                style_samples: formData.style_samples ? [formData.style_samples] : [],
                constraints: formData.constraints ? formData.constraints.split('\n').filter(line => line.trim()) : [],
                variant_count: parseInt(formData.variant_count) || 1,
                userId: user?.id, // Pass userId for API to use if auth check is skipped
                // Pass entity context if available
                role_context: roleEntity?.description,
                relationship_context: relEntity?.description
            };

            const response = await fetch('/api/ai/email', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate email');
            }

            const data = await response.json();
            setGeneratedResult(data);
            saveToHistory(apiData, data);
            toast.success('Email generated successfully!');

        } catch (error) {
            console.error('Generation Error:', error);
            toast.error(error.message || 'Failed to generate email');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const openInMailApp = (subject, body) => {
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject || 'Draft Email')}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
    };

    if (loading) {
        return (
            <ThemeProvider>
                <div className="flex h-screen items-center justify-center bg-[#f8f9fa] dark:bg-[#1c1c1c]">
                    <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-purple-600 dark:border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-2">Loading...</h3>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <div className="flex h-screen bg-[#f8f9fa] dark:bg-[#1c1c1c]">
                {/* Sidebar */}
                <div className="hidden lg:flex lg:w-64 bg-white dark:bg-[#181818] border-r border-gray-200 dark:border-[#2a2a2a] flex-col">
                    <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Prodigy</span>
                        </div>
                    </div>

                    <nav className="flex-1 p-3 space-y-1">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        >
                            <HomeIcon className="w-5 h-5" />
                            Home
                        </button>
                        <button
                            onClick={() => router.push('/ai-chat')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        >
                            <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            AI Chat
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 dark:text-[#e7e7e7] bg-gray-100 dark:bg-[#2a2a2a] rounded-lg">
                            <EnvelopeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Emails
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#181818] border-b border-gray-200 dark:border-[#2a2a2a]">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <HomeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] truncate flex-1 flex items-center gap-2">
                            <EnvelopeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Emails
                        </h1>
                    </div>

                    <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto h-full flex flex-col">
                            <div className="mb-6 flex-shrink-0 flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-[#e7e7e7]">Email Creation Engine</h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Turn brief ideas into professional, context-aware emails instantly.
                                    </p>
                                </div>
                                <Sheet open={showHistory} onOpenChange={setShowHistory}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="gap-2">
                                            <ArrowPathIcon className="w-4 h-4" />
                                            History
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a]">
                                        <SheetHeader>
                                            <SheetTitle>Email History</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-4 h-[calc(100vh-100px)]">
                                            <HistoryPanel
                                                history={history}
                                                loading={historyLoading}
                                                onLoad={handleLoadHistory}
                                            />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                                {/* Input Form - Scrollable if needed, but usually fixed height container */}
                                <div className="flex flex-col h-full overflow-hidden">
                                    <ScrollArea className="h-full pr-4">
                                        <div className="space-y-6 pb-6">
                                            <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h2 className="text-lg font-medium text-gray-900 dark:text-[#e7e7e7]">Email Details</h2>
                                                    <div className="w-[200px]">
                                                        <TemplateSelector
                                                            templates={templates}
                                                            onSelect={handleLoadTemplate}
                                                            onSave={handleSaveTemplate}
                                                            onDelete={handleDeleteTemplate}
                                                            disabled={!user}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Context / Description
                                                        </label>
                                                        <textarea
                                                            name="context"
                                                            value={formData.context}
                                                            onChange={handleInputChange}
                                                            placeholder="e.g., I need to ask for a sick leave for 2 days due to fever..."
                                                            rows={4}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Recipient Role
                                                            </label>
                                                            <EntitySelector
                                                                value={formData.recipient_role}
                                                                onChange={(val) => handleEntityChange('recipient_role', val)}
                                                                placeholder="Select or create role..."
                                                                type="Role"
                                                                entities={entities}
                                                                onCreateEntity={handleCreateEntity}
                                                                disabled={!workspaceId}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Relationship
                                                            </label>
                                                            <EntitySelector
                                                                value={formData.relationship}
                                                                onChange={(val) => handleEntityChange('relationship', val)}
                                                                placeholder="Select or create relationship..."
                                                                type="Relationship"
                                                                entities={entities}
                                                                onCreateEntity={handleCreateEntity}
                                                                disabled={!workspaceId}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Goal
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="goal"
                                                            value={formData.goal}
                                                            onChange={handleInputChange}
                                                            placeholder="e.g., Request leave, Apologize for delay"
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Tone
                                                            </label>
                                                            <select
                                                                name="tone"
                                                                value={formData.tone}
                                                                onChange={handleInputChange}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                            >
                                                                <option value="formal">Formal</option>
                                                                <option value="neutral">Neutral</option>
                                                                <option value="friendly">Friendly</option>
                                                                <option value="urgent">Urgent</option>
                                                                <option value="match-my-tone">Match my tone</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Length
                                                            </label>
                                                            <select
                                                                name="length"
                                                                value={formData.length}
                                                                onChange={handleInputChange}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                            >
                                                                <option value="short">Short</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="long">Long</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Language
                                                            </label>
                                                            <select
                                                                name="language"
                                                                value={formData.language}
                                                                onChange={handleInputChange}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                            >
                                                                <option value="English">English</option>
                                                                <option value="Spanish">Spanish</option>
                                                                <option value="French">French</option>
                                                                <option value="German">German</option>
                                                                <option value="Italian">Italian</option>
                                                                <option value="Portuguese">Portuguese</option>
                                                                <option value="Chinese">Chinese</option>
                                                                <option value="Japanese">Japanese</option>
                                                                <option value="Hindi">Hindi</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Variants
                                                            </label>
                                                            <select
                                                                name="variant_count"
                                                                value={formData.variant_count}
                                                                onChange={handleInputChange}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                            >
                                                                <option value={1}>1 Variant</option>
                                                                <option value={2}>2 Variants</option>
                                                                <option value={3}>3 Variants</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Deadline (Optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="deadline"
                                                            value={formData.deadline}
                                                            onChange={handleInputChange}
                                                            placeholder="e.g., By Friday 5 PM"
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Additional Points (one per line)
                                                        </label>
                                                        <textarea
                                                            name="additional_points"
                                                            value={formData.additional_points}
                                                            onChange={handleInputChange}
                                                            placeholder="- Mention the attached report&#10;- Ask for a meeting"
                                                            rows={3}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                                        />
                                                    </div>

                                                    {formData.tone === 'match-my-tone' && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Style Sample
                                                            </label>
                                                            <textarea
                                                                name="style_samples"
                                                                value={formData.style_samples}
                                                                onChange={handleInputChange}
                                                                placeholder="Paste a previous email you wrote to match your style..."
                                                                rows={3}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                                            />
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={handleGenerate}
                                                        disabled={generating}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {generating ? (
                                                            <>
                                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <SparklesIcon className="w-5 h-5" />
                                                                Generate Email
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Output Area - Constrained to match input height */}
                                <div className="flex flex-col h-full overflow-hidden">
                                    <ScrollArea className="h-full pr-4">
                                        <div className="space-y-6 pb-6">
                                            {generatedResult ? (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    {/* Summary Card */}
                                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-100 dark:border-purple-900/20 rounded-lg p-6">
                                                        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wider mb-2">
                                                            TLDR
                                                        </h3>
                                                        <p className="text-gray-800 dark:text-gray-200 mb-4">
                                                            {generatedResult.tldr || generatedResult.summary}
                                                        </p>
                                                        {generatedResult.action_items && generatedResult.action_items.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                                    Action Items
                                                                </h4>
                                                                <ul className="list-disc list-inside space-y-1">
                                                                    {generatedResult.action_items.map((item, idx) => (
                                                                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Variants */}
                                                    {generatedResult.variants.map((variant, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between bg-gray-50 dark:bg-[#212121]">
                                                                <div>
                                                                    <h3 className="font-semibold text-gray-900 dark:text-[#e7e7e7]">
                                                                        {variant.title || `Option ${idx + 1}`}
                                                                    </h3>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-gray-300 rounded-full capitalize">
                                                                            {variant.tone}
                                                                        </span>
                                                                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-[#333] text-gray-700 dark:text-gray-300 rounded-full capitalize">
                                                                            {variant.length}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => openInMailApp(generatedResult.tldr, variant.email)}
                                                                        className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                                                                        title="Open in Mail App"
                                                                    >
                                                                        <EnvelopeIcon className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => copyToClipboard(variant.email)}
                                                                        className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                                                                        title="Copy to clipboard"
                                                                    >
                                                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="p-6">
                                                                <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                                                                    {variant.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] border-dashed rounded-lg min-h-[400px]">
                                                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#212121] rounded-full flex items-center justify-center mb-4">
                                                        <PaperAirplaneIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-[#e7e7e7] mb-2">
                                                        Ready to Generate
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                                        Fill in the details on the left and click Generate to create professional emails instantly.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </ThemeProvider >
    );
}
