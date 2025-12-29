'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  SparklesIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  PencilSquareIcon,
  BoltIcon,
  Bars3BottomLeftIcon,
  AdjustmentsHorizontalIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import LoadingSpinner from '../LoadingSpinner';

export function AIAssistantPanel({ workspaceId, currentUserId }) {
  const [content, setContent] = useState('');
  const [instructions, setInstructions] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful writing assistant.');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiSettings, setAiSettings] = useState(null);

  useEffect(() => {
    loadAISettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const loadAISettings = async () => {
    if (!supabase || !currentUserId) return;

    const { data } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', currentUserId)
      .single();

    if (data?.ai_settings) {
      setAiSettings(data.ai_settings);
    }
  };

  const generateResponse = async () => {
    if (!content.trim() && !instructions.trim()) {
      toast.error('Please provide content or instructions');
      return;
    }

    if (!aiSettings?.apiKey) {
      toast.error('Please configure your OpenAI API key in Settings');
      return;
    }

    setLoading(true);
    setOutput('');

    try {
      const apiUrl = aiSettings.apiUrl?.endsWith('/')
        ? aiSettings.apiUrl.slice(0, -1)
        : (aiSettings.apiUrl || 'https://api.openai.com/v1');

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.apiKey}`,
        },
        body: JSON.stringify({
          model: aiSettings.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: `${instructions ? `Instructions: ${instructions}\n\n` : ''}${content ? `Content: ${content}` : ''}`,
            },
          ],
          temperature: aiSettings.temperature || 0.7,
          max_tokens: aiSettings.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate response');
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content || '';
      setOutput(generatedText);
      toast.success('Response generated!');
    } catch (error) {
      console.error('AI Error:', error);
      toast.error(error.message || 'Failed to generate response');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-[#2a2a2a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="font-semibold text-gray-900 dark:text-[#e7e7e7]">
            AI Assistant
          </h2>
          {aiSettings?.apiKey ? (
            <Badge variant="secondary" className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-auto bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 flex items-center gap-1 px-2 py-1 text-xs">
              <span className="text-xs">Connecting</span>
              <span className="ml-1"><LoadingSpinner size="sm" /></span>
            </Badge>
          )}
        </div>
      </div>

      {/* Main scrollable area using shadcn ScrollArea, responsive for mobile */}
      <ScrollArea className="flex-1 p-4 h-[calc(100dvh-56px)] sm:h-auto min-h-0">
        <div className="space-y-4">
          {/* Content */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your text here..."
              className="min-h-[150px] bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Instructions
            </label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="What do you want the AI to do? (e.g., 'Improve grammar', 'Make it more dramatic', 'Summarize this')"
              className="min-h-[100px] bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a]"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateResponse}
            disabled={loading || !aiSettings?.apiKey}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white relative overflow-hidden"
          >
            <div className={`flex items-center justify-center transition-opacity duration-400 ${!loading ? 'opacity-100' : 'opacity-0'}`}>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Response
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-400 ${loading ? 'opacity-100' : 'opacity-0'}`}>
              <LoadingSpinner />
            </div>
          </Button>

          {/* Output */}
          {output && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Output
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateResponse}
                    disabled={loading}
                    className="h-8 bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                <p className="text-sm text-gray-900 dark:text-[#e7e7e7] whitespace-pre-wrap">
                  {output}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Quick Actions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInstructions('Improve the grammar and spelling');
                  setSystemPrompt('You are a professional editor. Fix grammar and spelling errors while maintaining the author\'s voice.');
                }}
                className="text-xs bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-1"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Fix Grammar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInstructions('Make this more engaging and dramatic');
                  setSystemPrompt('You are a creative writing coach. Enhance the text to be more engaging and dramatic.');
                }}
                className="text-xs bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-1"
              >
                <BoltIcon className="w-4 h-4" />
                Enhance Drama
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInstructions('Summarize this in 2-3 sentences');
                  setSystemPrompt('You are a summarization expert. Create concise summaries.');
                }}
                className="text-xs bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-1"
              >
                <Bars3BottomLeftIcon className="w-4 h-4" />
                Summarize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInstructions('Expand this with more details and descriptions');
                  setSystemPrompt('You are a descriptive writer. Add vivid details and descriptions.');
                }}
                className="text-xs bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-1"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Expand
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInstructions('Make this more concise');
                  setSystemPrompt('You are an expert at concise writing. Shorten the text while preserving its meaning.');
                }}
                className="text-xs bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-1"
              >
                <SpeakerWaveIcon className="w-4 h-4" />
                Make Concise
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInstructions('Change the tone to be more formal');
                  setSystemPrompt('You are a professional editor. Rewrite the text to have a more formal tone.');
                }}
                className="text-xs bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center gap-1"
              >
                <SparklesIcon className="w-4 h-4" />
                Formal Tone
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
