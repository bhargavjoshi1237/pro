import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch share and related content - allows public access
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('share_token', id)
      .single();

    if (shareError || !share) {
      return new Response(JSON.stringify({ error: 'Share not found' }), { status: 404 });
    }

    // Check access permissions
    const { data: { user } } = await supabase.auth.getUser();

    if (share.share_type === 'email' && user) {
      if (!share.allowed_emails.includes(user.email)) {
        return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
      }
    } else if (share.share_type === 'email' && !user) {
      return new Response(JSON.stringify({ error: 'Please login to access this share' }), { status: 403 });
    }

    // Fetch snippet or folder content
    let content = null;
    if (share.snippet_id) {
      const { data: snippet } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', share.snippet_id)
        .single();
      content = snippet;
    } else if (share.folder_id) {
      const { data: folder } = await supabase
        .from('folders')
        .select('*')
        .eq('id', share.folder_id)
        .single();
      content = folder;

      // Also fetch snippets in folder
      const { data: snippets } = await supabase
        .from('snippets')
        .select('*')
        .eq('folder_id', share.folder_id)
        .eq('is_final', false);
      if (snippets) {
        content.snippets = snippets;
      }
    }

    return new Response(JSON.stringify({ share, content }), { status: 200 });
  } catch (error) {
    console.error('Share GET error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
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
      return new Response(JSON.stringify({ error: 'Share not found' }), { status: 404 });
    }

    if (share.shared_by !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
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
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Share PUT error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Verify user owns this share
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('share_token', id)
      .single();

    if (shareError || !share) {
      return new Response(JSON.stringify({ error: 'Share not found' }), { status: 404 });
    }

    if (share.shared_by !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    const { error } = await supabase
      .from('shares')
      .delete()
      .eq('share_token', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Share DELETE error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
