'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';
import { WaveBackground } from '@/components/landing/wave/WaveBackground';

function Proper6kContent() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setUser(session.user);

            // Load user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, display_name')
                .eq('id', session.user.id)
                .single();

            if (profile) setUserProfile(profile);

            setLoading(false);
        }
        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#191919]">
                <WaveBackground />
            </div>
        );
    }

    return (
        <AppLayout
            title="Proper 6K"
            description="Manage your projects efficiently"
            user={user}
            userProfile={userProfile}
        >
            {/* Empty Content for now */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"> <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 16H5V5h14z" /><path fill="currentColor" d="M14.5 12.75L16.25 15H18l-2.25-3L18 9h-1.75l-1.75 2.25V9H13v6h1.5zM7.5 15H10c.55 0 1-.45 1-1v-1.5c0-.55-.45-1-1-1H8v-1h3V9H7.5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1m.5-2.5h1.5V14H8z" /></svg>
        </AppLayout>
    );
}

export default function Proper6kPage() {
    return (
        <ThemeProvider>
            <Proper6kContent />
        </ThemeProvider>
    );
}