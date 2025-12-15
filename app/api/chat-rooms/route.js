import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { otherUserId, workspaceId, name } = body;

        // Determine chat type
        const isWorkspaceChat = !!workspaceId;

        if (isWorkspaceChat) {
            // Create workspace chat
            const { data: room, error: roomError } = await supabase
                .from('chat_rooms')
                .insert({
                    type: 'workspace',
                    workspace_id: workspaceId,
                    name: name || 'Workspace Chat',
                })
                .select()
                .single();

            if (roomError) {
                return NextResponse.json({ error: roomError.message }, { status: 500 });
            }

            // Add current user as member
            const { error: memberError } = await supabase
                .from('chat_room_members')
                .insert({
                    room_id: room.id,
                    user_id: user.id,
                });

            if (memberError) {
                return NextResponse.json({ error: memberError.message }, { status: 500 });
            }

            return NextResponse.json({ room });
        } else if (otherUserId) {
            // Use the helper function to create or get direct chat
            const { data, error } = await supabase
                .rpc('get_or_create_direct_chat', { other_user_id: otherUserId });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ roomId: data });
        } else {
            return NextResponse.json(
                { error: 'Either otherUserId or workspaceId is required' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error creating chat room:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get all chat rooms for the current user
export async function GET(request) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all rooms where user is a member
        const { data: memberships, error: memberError } = await supabase
            .from('chat_room_members')
            .select('room_id')
            .eq('user_id', user.id);

        if (memberError) {
            return NextResponse.json({ error: memberError.message }, { status: 500 });
        }

        const roomIds = memberships.map(m => m.room_id);

        if (roomIds.length === 0) {
            return NextResponse.json({ rooms: [] });
        }

        // Get room details
        const { data: rooms, error: roomsError } = await supabase
            .from('chat_rooms')
            .select('*')
            .in('id', roomIds)
            .order('updated_at', { ascending: false });

        if (roomsError) {
            return NextResponse.json({ error: roomsError.message }, { status: 500 });
        }

        return NextResponse.json({ rooms });
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
