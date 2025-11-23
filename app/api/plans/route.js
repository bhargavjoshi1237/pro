import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: plans, error } = await supabase
            .from('plans')
            .select('*')
            .eq('active', true)
            .order('price', { ascending: true });

        if (error) {
            console.error('Error fetching plans:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform plans to match the expected format if necessary
        // But returning the raw DB rows is usually fine if the frontend adapts

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Server error fetching plans:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
