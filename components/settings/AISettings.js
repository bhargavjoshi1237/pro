'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { SparklesIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AISettings({ user }) {
  const [settings, setSettings] = useState({
    apiUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: 'You are a helpful writing assistant. Help users with their creative writing, provide feedback, and answer questions about storytelling, character development, plot structure, and more.',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadSettings = async () => {
    if (!supabase || !user) return;

    const { data } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', user.id)
      .single();

    if (data?.ai_settings) {
      setSettings({ ...settings, ...data.ai_settings });
    }
  };

  const saveSettings = async () => {
    if (!supabase || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ai_settings: settings })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('AI settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.apiKey) {
      toast.error('Please enter an API key');
      return;
    }

    if (!settings.apiUrl) {
      toast.error('Please enter an API URL');
      return;
    }

    setTesting(true);
    try {
      const apiUrl = settings.apiUrl.endsWith('/') 
        ? settings.apiUrl.slice(0, -1) 
        : settings.apiUrl;
      
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message.',
            },
          ],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Connection failed');
      }

      toast.success('Connection successful! Provider is working.');
    } catch (error) {
      console.error('Test error:', error);
      toast.error(error.message || 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
      <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">
            AI Assistant Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure OpenAI-compatible inference provider
          </p>
        </div>
      </div>

      {/* API URL */}
      <div className="space-y-2">
        <Label htmlFor="apiUrl" className="text-gray-900 dark:text-[#e7e7e7]">API Base URL</Label>
        <Input
          id="apiUrl"
          type="text"
          value={settings.apiUrl}
          onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
          className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Base URL for your OpenAI-compatible provider (e.g., OpenAI, Cerebras, Together AI, etc.)
        </p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey" className="text-gray-900 dark:text-[#e7e7e7]">API Key</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="sk-... or your provider's API key"
              className="pr-10 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded"
            >
              {showApiKey ? (
                <EyeSlashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <EyeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={!settings.apiKey || !settings.apiUrl || testing}
            className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
          >
            {testing ? 'Testing...' : 'Test'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Examples: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">OpenAI</a>, <a href="https://cerebras.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Cerebras</a>, <a href="https://together.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Together AI</a>
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model" className="text-gray-900 dark:text-[#e7e7e7]">Model Name</Label>
        <Input
          id="model"
          type="text"
          value={settings.model}
          onChange={(e) => setSettings({ ...settings, model: e.target.value })}
          placeholder="gpt-4, llama-3.1-70b, zai-glm-4.6, etc."
          className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Model name from your provider (e.g., gpt-4, llama-3.1-70b, zai-glm-4.6)
        </p>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label htmlFor="temperature" className="text-gray-900 dark:text-[#e7e7e7]">
          Temperature: {settings.temperature}
        </Label>
        <input
          id="temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
          className="w-full accent-purple-600 dark:accent-purple-400"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Controls randomness. Lower values (0.3) are more focused, higher values (1.5) are more creative.
        </p>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <Label htmlFor="maxTokens" className="text-gray-900 dark:text-[#e7e7e7]">Max Tokens</Label>
        <Input
          id="maxTokens"
          type="number"
          min="100"
          max="40960"
          step="100"
          value={settings.maxTokens}
          onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
          className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Maximum length of the AI response. 1 token ≈ 4 characters. (Some providers support up to 40K tokens)
        </p>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="systemPrompt" className="text-gray-900 dark:text-[#e7e7e7]">Default System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={settings.systemPrompt}
          onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
          placeholder="You are a helpful writing assistant..."
          className="min-h-[120px] bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This prompt defines the AI&apos;s behavior and personality in the chat.
        </p>
      </div>

      {/* Provider Examples */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Provider Examples:</h4>
        <div className="space-y-2 text-xs text-blue-800 dark:text-blue-400">
          <div>
            <strong>OpenAI:</strong> <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">https://api.openai.com/v1</code> | Model: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">gpt-4</code>
          </div>
          <div>
            <strong>Cerebras:</strong> <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">https://api.cerebras.ai/v1</code> | Model: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">llama-3.1-70b</code>
          </div>
          <div>
            <strong>Together AI:</strong> <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">https://api.together.xyz/v1</code> | Model: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">meta-llama/Llama-3-70b-chat-hf</code>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={!settings.apiKey || !settings.apiUrl || testing}
          className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
      </div>
    </ScrollArea>
  );
}
