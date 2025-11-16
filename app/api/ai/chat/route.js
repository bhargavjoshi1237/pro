import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, conversationHistory } = await request.json();

    // Get user's AI settings from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', session.user.id)
      .single();

    if (!profile?.ai_settings?.apiKey) {
      return NextResponse.json(
        { error: 'AI settings not configured' },
        { status: 400 }
      );
    }

    const settings = profile.ai_settings;
    const apiUrl = settings.apiUrl?.endsWith('/') 
      ? settings.apiUrl.slice(0, -1) 
      : (settings.apiUrl || 'https://api.openai.com/v1');

    // Call AI provider
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: settings.systemPrompt || 'You are a helpful writing assistant.',
          },
          ...conversationHistory,
          ...messages,
        ],
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'AI request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
