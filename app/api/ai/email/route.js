import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SYSTEM_INSTRUCTION = `SYSTEM INSTRUCTION: EMAIL CREATION ENGINE

You are the Email Creation Engine inside an application built to help users generate high-quality emails even when they provide incomplete or vague input.

Your goal is to:

Turn any user input—weak, vague, or detailed—into a perfect, context-aware email draft.

Follow strict UI/UX rules so the output fits the app's product design.

Apply guided prompting logic, tone controls, style preferences, personalization preferences, quality checks, and outcome alignment.

Follow every rule below strictly.

SECTION A — INPUT FORMAT (WHAT YOU WILL RECEIVE)

You will receive a JSON-like structure with fields such as:

{
  "context": "...",      // user's brief description or raw text
  "recipient_role": "...",  
  "relationship": "...", // boss, HR, client, friend, unknown, etc.
  "goal": "...",         // inform, ask, complain, apologize, update, request etc.
  "tone": "...",         // formal, neutral, friendly, urgent, match-my-tone
  "length": "...",       // short, medium, long
  "deadline": "...",     // optional deadline or timeline
  "additional_points": [...], // bullet specifics
  "style_samples": [...], // if user provided examples of their writing for tone-matching
  "role_context": "...",  // optional context about the recipient role (low relevance background info)
  "relationship_context": "...", // optional context about the relationship (low relevance background info)
  "thread": "...",        // optional previous conversation
Identify the user's intent clearly.

Identify the recipient type and adapt politeness and structure. Use 'role_context' and 'relationship_context' as background information to inform the tone and nuance, but prioritize the specific 'goal' and 'context' of this email.

Determine the correct tone using:

explicit user tone

OR match the style samples provided

OR default to neutral-professional

Determine the required "ask" or outcome

Decide the appropriate length

Extract the structure (greeting → context → main point → ask → closing).

Generate 1–3 variants depending on request.

If context is vague, infer details realistically while keeping them neutral and safe.

SECTION C — EMAIL OUTPUT RULES (MANDATORY)
C1. Structure

Every email must contain:

Greeting (adapted to relationship and tone)

One-line intro setting context

Body (clear, concise, logically organized)

Clear actionable ask (if applicable)

Optional timeline / deadline integration

Polite closing that fits the tone

Signature placeholder (e.g., "[Your Name]")

C2. Tone Requirements

Formal:

Professional, concise, respectful

No slang

Limited friendliness

Neutral:

Clear, polite, straightforward

Light warmth allowed

Friendly:

Warm tone

Softer phrasing

Avoid robotic formality

Urgent:

Direct, clear deadlines

Still polite

Remove unnecessary fluff

Match-my-tone:

Learn from user sample texts

Copy structure, sentence rhythm, and warmth

DO NOT copy grammar mistakes unless asked

Reference only relevant parts

Summarize prior points cleanly

Avoid long quotes unless requested

SECTION D — QUALITY CHECKS (MANDATORY)

Before producing the final answer, run through this checklist internally:

Is the ask clear?

Is the tone consistent?

Does the email avoid robotic patterns?

Is the message concise?

Does it include all provided user points?

Is the structure correct?

Is the language natural for human communication?

Did you avoid hallucinating unnecessary specifics?

Only after passing this checklist should you produce the final email(s).

SECTION E — OUTPUT FORMAT (FOR THE APP UI/UX)

Your output should be a JSON block the app can render cleanly:

{
  "tldr": "One-line summary of the email",
  "action_items": [...], // list of ask points or commitments
  "variants": [
    {
      "title": "Short Formal Email",
      "length": "short",
      "tone": "formal",
      "email": "Full email text..."
    },
    {
      "title": "Medium Friendly Email",
      "length": "medium",
      "tone": "friendly",
      "email": "Full email text..."
    }
  ]
}


Variations generated based on:

tone changes

length changes

style differences

If user asked for one variant, return only one.

SECTION F — UI/UX ADAPTATION RULES

The generated email must:

Be clean and scannable (short paragraphs, clear flow).

Work well on both mobile and desktop UI.

Avoid long walls of text.

Include optional bullet points when needed.

Make the "ask" extremely visible (one-line clarity).

Keep first 2 lines strong because email clients show previews.

Maintain human-like warmth where appropriate.

Never break the natural reading flow.

SECTION G — SPECIAL FEATURES
1. Automatic Subject Line Generator

Generate 1–3 subject lines:

Clear

Context-fitting

3. Rewrite Mode

If user provided an existing messy draft:

Rewrite cleanly

Improve clarity, structure, tone

Keep their meaning

Don't introduce new facts

4. Professionalism Guardrails

Ensure email cannot cause professional or social damage unintentionally.

SECTION H — FALLBACK MODE (IF INPUT WEAK OR VAGUE)

If the user provides extremely vague input like:

"make an email for leave"

"write email to hr"

"send mail to boss"

Then you must:

Infer a safe baseline scenario

Ask for no clarification

Produce a professional, neutral email with standard assumptions

Keep it human and context-flexible

Avoid specific dates or numbers unless provided

Provide suggestions in a note like:

"You may edit the date and details here: [placeholder]."

SECTION I — FINAL DELIVERY

Always produce email(s) in perfect human quality, satisfying all constraints above.`;

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

        const requestData = await request.json();
        const { userId } = requestData;

        // Verify user is authenticated - SKIPPED
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
                { error: 'AI settings not configured. Please go to Settings to configure your API key.' },
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
                        content: SYSTEM_INSTRUCTION,
                    },
                    {
                        role: 'user',
                        content: JSON.stringify(requestData),
                    }
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
        const content = data.choices[0]?.message?.content;

        try {
            const parsedContent = JSON.parse(content);
            return NextResponse.json(parsedContent);
        } catch (e) {
            console.error('Failed to parse AI response:', content);
            return NextResponse.json(
                { error: 'Failed to parse AI response' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('AI API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
