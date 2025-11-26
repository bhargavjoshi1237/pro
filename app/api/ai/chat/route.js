import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cookieStore = await cookies();

    // Create Supabase client with SSR package (Next.js 15 compatible)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { messages, conversationHistory, userId } = await request.json();

    // Verify user is authenticated - SKIPPED as per user request
    // const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!userId) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'User ID is missing'
      }, { status: 401 });
    }

    // Get user's AI settings from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', userId)
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
