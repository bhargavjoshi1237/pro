import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

export default function MobileUserMenu({ user, onSettingsClick }) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const loadUserProfile = async () => {
            if (!supabase || !user?.id) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, display_name')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserProfile(profile);
            }
        };

        loadUserProfile();
    }, [user?.id]);

    const handleLogout = async () => {
        if (!supabase) return;

        await supabase.auth.signOut();
        router.push('/login');
    };

    const getInitials = (email) => {
        return email?.charAt(0).toUpperCase() || 'U';
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] flex items-center justify-center font-semibold shadow-sm transition-colors overflow-hidden"
            >
                {userProfile?.avatar_url ? (
                    <img
                        src={userProfile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    getInitials(user?.email)
                )}
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-50"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="fixed top-16 right-4 w-56 bg-white dark:bg-[#212121] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a2a2a] z-50">
                        <div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                            <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] truncate">
                                {user?.email}
                            </p>
                        </div>
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    onSettingsClick();
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                            >
                                <Cog6ToothIcon className="w-4 h-4" />
                                Settings
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                            >
                                <UserCircleIcon className="w-4 h-4" />
                                Dashboard
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                            >
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
