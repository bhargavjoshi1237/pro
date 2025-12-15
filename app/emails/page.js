'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import {
    SparklesIcon,
    PaperAirplaneIcon,
    ClipboardDocumentIcon,
    ArrowPathIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useEntities } from '@/hooks/useEntities';
import { EntitySelector } from '@/components/emails/EntitySelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TemplateSelector } from '@/components/emails/TemplateSelector';
import { HistoryPanel } from '@/components/emails/HistoryPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AppLayout from '@/components/layout/AppLayout';

export default function EmailsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
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
        variant_count: "1"
    });


    const [templates, setTemplates] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [mobileTab, setMobileTab] = useState('input');

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

            // Fetch user profile for AppLayout
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, display_name')
                .eq('id', session.user.id)
                .single();

            if (profile) setUserProfile(profile);

            // Fetch workspace ID
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

    const handleValueChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEntityChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateEntity = async (name, type, context) => {
        if (!workspaceId) return null;
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
            const roleEntity = entities.find(e => e.name === formData.recipient_role && e.type === 'Role');
            const relEntity = entities.find(e => e.name === formData.relationship && e.type === 'Relationship');

            const apiData = {
                ...formData,
                additional_points: formData.additional_points ? formData.additional_points.split('\n').filter(line => line.trim()) : [],
                style_samples: formData.style_samples ? [formData.style_samples] : [],
                constraints: formData.constraints ? formData.constraints.split('\n').filter(line => line.trim()) : [],
                variant_count: parseInt(formData.variant_count) || 1,
                userId: user?.id,
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
            setMobileTab('output');
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

    return (
        <ThemeProvider>
            <AppLayout
                title="Email Engine"
                description="Turn brief ideas into professional, context-aware emails instantly."
                user={user}
                userProfile={userProfile}
                disableScroll={true}
                disablePadding={true}
                actions={
                    <Sheet open={showHistory} onOpenChange={setShowHistory}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <ArrowPathIcon className="w-4 h-4" />
                                History
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
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
                }
            >
                {loading ? (
                    <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 h-full">
                        <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                            <div className="space-y-6">
                                <div className="h-64 bg-muted rounded-lg" />
                                <div className="h-32 bg-muted rounded-lg" />
                                <div className="h-48 bg-muted rounded-lg" />
                            </div>
                            <div className="space-y-6">
                                <div className="h-96 bg-muted rounded-lg" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 h-full">
                        <div className="max-w-7xl mx-auto h-full flex flex-col">
                            {/* Mobile Tabs */}
                            <div className="lg:hidden flex border-b border-border bg-card mb-4 min-h-[48px] shrink-0">
                                <button
                                    onClick={() => setMobileTab('input')}
                                    className={`flex-1 flex items-center justify-center text-sm font-medium border-b-2 transition-colors py-3 ${mobileTab === 'input'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Input Details
                                </button>
                                <button
                                    onClick={() => setMobileTab('output')}
                                    className={`flex-1 flex items-center justify-center text-sm font-medium border-b-2 transition-colors py-3 ${mobileTab === 'output'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Generated Email
                                    {generatedResult && <span className="ml-2 w-2 h-2 rounded-full bg-green-500" />}
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                                {/* Input Form */}
                                <div className={`flex-col h-full overflow-hidden ${mobileTab === 'input' ? 'flex' : 'hidden'} lg:flex`}>
                                    <ScrollArea className="h-full pr-4">
                                        <div className="space-y-6 pb-6">
                                            <div className="rounded-lg p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h2 className="text-lg font-medium text-foreground">Email Details</h2>
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
                                                        <Label className="mb-1.5" htmlFor="context">Context / Description</Label>
                                                        <Textarea
                                                            id="context"
                                                            name="context"
                                                            value={formData.context}
                                                            onChange={handleInputChange}
                                                            placeholder="e.g., I need to ask for a sick leave for 2 days due to fever..."
                                                            rows={4}
                                                            className="resize-none mt-4"
                                                            style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="mb-1.5" htmlFor="recipient_role">Recipient Role</Label>
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
                                                            <Label className="mb-1.5" htmlFor="relationship">Relationship</Label>
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
                                                        <Label className="mb-1.5" htmlFor="goal">Goal</Label>
                                                        <Input
                                                            id="goal"
                                                            type="text"
                                                            name="goal"
                                                            value={formData.goal}
                                                            onChange={handleInputChange}
                                                            placeholder="e.g., Request leave, Apologize for delay"
                                                            className="mt-4"
                                                            style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="mb-1.5" htmlFor="tone">Tone</Label>
                                                            <Select
                                                                value={formData.tone}
                                                                onValueChange={(val) => handleValueChange('tone', val)}
                                                            >
                                                                <SelectTrigger className="w-full mt-4" style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectValue placeholder="Select tone" />
                                                                </SelectTrigger>
                                                                <SelectContent style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectItem value="formal">Formal</SelectItem>
                                                                    <SelectItem value="neutral">Neutral</SelectItem>
                                                                    <SelectItem value="friendly">Friendly</SelectItem>
                                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                                    <SelectItem value="match-my-tone">Match my tone</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="mb-1.5" htmlFor="length">Length</Label>
                                                            <Select
                                                                value={formData.length}
                                                                onValueChange={(val) => handleValueChange('length', val)}
                                                            >
                                                                <SelectTrigger className="w-full mt-4" style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectValue placeholder="Select length" />
                                                                </SelectTrigger>
                                                                <SelectContent style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectItem value="short">Short</SelectItem>
                                                                    <SelectItem value="medium">Medium</SelectItem>
                                                                    <SelectItem value="long">Long</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="mb-1.5" htmlFor="language">Language</Label>
                                                            <Select
                                                                value={formData.language}
                                                                onValueChange={(val) => handleValueChange('language', val)}
                                                            >
                                                                <SelectTrigger className="w-full mt-4" style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectValue placeholder="Select language" />
                                                                </SelectTrigger>
                                                                <SelectContent style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectItem value="English">English</SelectItem>
                                                                    <SelectItem value="Spanish">Spanish</SelectItem>
                                                                    <SelectItem value="French">French</SelectItem>
                                                                    <SelectItem value="German">German</SelectItem>
                                                                    <SelectItem value="Italian">Italian</SelectItem>
                                                                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                                                                    <SelectItem value="Chinese">Chinese</SelectItem>
                                                                    <SelectItem value="Japanese">Japanese</SelectItem>
                                                                    <SelectItem value="Hindi">Hindi</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="mb-1.5" htmlFor="variant_count">Variants</Label>
                                                            <Select
                                                                value={String(formData.variant_count)}
                                                                onValueChange={(val) => handleValueChange('variant_count', parseInt(val))}
                                                            >
                                                                <SelectTrigger className="w-full mt-4" style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectValue placeholder="Select variants" />
                                                                </SelectTrigger>
                                                                <SelectContent style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                    <SelectItem value="1">1 Variant</SelectItem>
                                                                    <SelectItem value="2">2 Variants</SelectItem>
                                                                    <SelectItem value="3">3 Variants</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1.5" htmlFor="deadline">Deadline (Optional)</Label>
                                                        <Input
                                                            id="deadline"
                                                            type="text"
                                                            name="deadline"
                                                            value={formData.deadline}
                                                            onChange={handleInputChange}
                                                            placeholder="e.g., By Friday 5 PM"
                                                            className="mt-4"
                                                            style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1.5" htmlFor="additional_points">Additional Points (one per line)</Label>
                                                        <Textarea
                                                            id="additional_points"
                                                            name="additional_points"
                                                            value={formData.additional_points}
                                                            onChange={handleInputChange}
                                                            placeholder="- Mention the attached report&#10;- Ask for a meeting"
                                                            rows={3}
                                                            className="resize-none mt-4"
                                                            style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                                                        />
                                                    </div>

                                                    {formData.tone === 'match-my-tone' && (
                                                        <div>
                                                            <Label className="mb-1.5" htmlFor="style_samples">Style Sample</Label>
                                                            <Textarea
                                                                id="style_samples"
                                                                name="style_samples"
                                                                value={formData.style_samples}
                                                                onChange={handleInputChange}
                                                                placeholder="Paste a previous email you wrote to match your style..."
                                                                rows={3}
                                                                className="resize-none mt-4"
                                                                style={{ backgroundColor: 'rgb(23, 23, 23)', color: 'rgb(250, 250, 250)', borderColor: 'rgb(64, 64, 64)' }}
                                                            />
                                                        </div>
                                                    )}

                                                    <Button
                                                        onClick={handleGenerate}
                                                        disabled={generating}
                                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                                    >
                                                        {generating ? (
                                                            <>
                                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <SparklesIcon className="w-5 h-5 mr-2" />
                                                                Generate Email
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Output Area */}
                                <div className={`flex-col h-full overflow-hidden ${mobileTab === 'output' ? 'flex' : 'hidden'} lg:flex`}>
                                    <ScrollArea className="h-full pr-4">
                                        <div className="space-y-6 pb-6">
                                            {generatedResult ? (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    {/* Summary Card */}
                                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-100 dark:border-purple-900/20 rounded-lg p-6" style={{ backgroundColor: 'rgb(30, 23, 40)', borderColor: 'rgb(88, 64, 120)' }}>
                                                        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wider mb-2" style={{ color: 'rgb(196, 181, 253)' }}>
                                                            TLDR
                                                        </h3>
                                                        <p className="text-foreground mb-4" style={{ color: 'rgb(250, 250, 250)' }}>
                                                            {generatedResult.tldr || generatedResult.summary}
                                                        </p>
                                                        {generatedResult.action_items && generatedResult.action_items.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" style={{ color: 'rgb(163, 163, 163)' }}>
                                                                    Action Items
                                                                </h4>
                                                                <ul className="list-disc list-inside space-y-1">
                                                                    {generatedResult.action_items.map((item, idx) => (
                                                                        <li key={idx} className="text-sm text-foreground" style={{ color: 'rgb(250, 250, 250)' }}>
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Variants */}
                                                    {generatedResult.variants.map((variant, idx) => (
                                                        <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'rgb(23, 23, 23)', borderColor: 'rgb(64, 64, 64)' }}>
                                                            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30" style={{ backgroundColor: 'rgb(30, 30, 30)', borderColor: 'rgb(64, 64, 64)' }}>
                                                                <div>
                                                                    <h3 className="font-semibold text-foreground" style={{ color: 'rgb(250, 250, 250)' }}>
                                                                        {variant.title || `Option ${idx + 1}`}
                                                                    </h3>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full capitalize" style={{ backgroundColor: 'rgb(38, 38, 38)', color: 'rgb(163, 163, 163)' }}>
                                                                            {variant.tone}
                                                                        </span>
                                                                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full capitalize" style={{ backgroundColor: 'rgb(38, 38, 38)', color: 'rgb(163, 163, 163)' }}>
                                                                            {variant.length}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => openInMailApp(generatedResult.tldr, variant.email)}
                                                                        title="Open in Mail App"
                                                                    >
                                                                        <EnvelopeIcon className="w-5 h-5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => copyToClipboard(variant.email)}
                                                                        title="Copy to clipboard"
                                                                    >
                                                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="p-6">
                                                                <div className="whitespace-pre-wrap text-foreground font-sans leading-relaxed" style={{ color: 'rgb(250, 250, 250)' }}>
                                                                    {variant.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-card border border-border border-dashed rounded-lg min-h-[400px]" style={{ backgroundColor: 'rgb(23, 23, 23)', borderColor: 'rgb(64, 64, 64)' }}>
                                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgb(38, 38, 38)' }}>
                                                        <PaperAirplaneIcon className="w-8 h-8 text-muted-foreground" style={{ color: 'rgb(163, 163, 163)' }} />
                                                    </div>
                                                    <h3 className="text-lg font-medium text-foreground mb-2" style={{ color: 'rgb(250, 250, 250)' }}>
                                                        Ready to Generate
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground max-w-sm" style={{ color: 'rgb(163, 163, 163)' }}>
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
                )}
            </AppLayout>
        </ThemeProvider>
    );
}
