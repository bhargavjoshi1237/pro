import { supabase } from '@/lib/supabase';

// Generate a simple UUID v4 compatible token
function generateToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hexStr = Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hexStr.slice(0, 8)}-${hexStr.slice(8, 12)}-${hexStr.slice(12, 16)}-${hexStr.slice(16, 20)}-${hexStr.slice(20)}`;
}

export async function POST(request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { snippet_id, folder_id, workspace_id, share_type, allowed_emails, access_level } = body;

    if (!workspace_id || (!snippet_id && !folder_id) || !share_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    if (!['public', 'email'].includes(share_type)) {
      return new Response(JSON.stringify({ error: 'Invalid share_type' }), { status: 400 });
    }

    if (!['view', 'edit'].includes(access_level)) {
      return new Response(JSON.stringify({ error: 'Invalid access_level' }), { status: 400 });
    }

    // Generate unique share token
    const share_token = generateToken();

    const { data, error } = await supabase
      .from('shares')
      .insert([{
        snippet_id: snippet_id || null,
        folder_id: folder_id || null,
        workspace_id,
        share_token,
        shared_by: user.id,
        share_type,
        allowed_emails: share_type === 'email' ? allowed_emails || [] : null,
        access_level
      }])
      .select()
      .single();

    if (error) {
      console.error('Share creation error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (error) {
    console.error('Share POST error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
