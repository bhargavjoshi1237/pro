import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

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

    // Fetch share and related content - allows public access
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('share_token', id)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check access permissions
    const { data: { user } } = await supabase.auth.getUser();

    if (share.share_type === 'email' && user) {
      if (!share.allowed_emails.includes(user.email)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (share.share_type === 'email' && !user) {
      return NextResponse.json({ error: 'Please login to access this share' }, { status: 403 });
    }

    // Use admin client to bypass RLS for content fetching
    // This is safe because we've already validated the share existence and permissions above
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch snippet or folder content
    let content = null;
    if (share.snippet_id) {
      const { data: snippet } = await adminSupabase
        .from('snippets')
        .select('*')
        .eq('id', share.snippet_id)
        .single();
      content = snippet;
    } else if (share.folder_id) {
      const { data: folder } = await adminSupabase
        .from('folders')
        .select('*')
        .eq('id', share.folder_id)
        .single();
      content = folder;

      // Also fetch snippets in folder
      const { data: snippets } = await adminSupabase
        .from('snippets')
        .select('*')
        .eq('folder_id', share.folder_id)
        .eq('is_final', false);
      if (snippets) {
        content.snippets = snippets;
      }
    }

    return NextResponse.json({ share, content }, { status: 200 });
  } catch (error) {
    console.error('Share GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { share_type, allowed_emails, access_level } = body;

    // Verify user owns this share
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('share_token', id)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (share.shared_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update share
    const updates = {};
    if (share_type) updates.share_type = share_type;
    if (allowed_emails !== undefined) updates.allowed_emails = allowed_emails;
    if (access_level) updates.access_level = access_level;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('shares')
      .update(updates)
      .eq('share_token', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Share PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this share
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('share_token', id)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (share.shared_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('shares')
      .delete()
      .eq('share_token', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Share DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
