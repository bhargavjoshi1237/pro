'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import SettingsDialog from '@/components/settings/SettingsDialog';

export default function UserMenu({ user, userProfile }) {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (!supabase) return;
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/');
    };

    if (!user) return null;

    return (
        <>
            {/* User Menu - Bottom Left (All Screens) */}
            <div className="fixed bottom-4 left-4 z-40">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 lg:w-10 lg:h-10 rounded-full bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] flex items-center justify-center font-semibold shadow-lg transition-all hover:scale-110 active:scale-95 overflow-hidden"
                >
                    {userProfile?.avatar_url ? (
                        <img
                            src={userProfile.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-sm lg:text-base">
                            {user?.email?.charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>

                {showUserMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setShowUserMenu(false)}
                        />
                        <div className="absolute bottom-14 lg:bottom-12 left-0 w-56 bg-white dark:bg-[#212121] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a2a2a] z-40">
                            <div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                                <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] truncate">
                                    {userProfile?.display_name || user?.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setShowSettings(true);
                                        setShowUserMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                                >
                                    <Cog6ToothIcon className="w-4 h-4" />
                                    Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loggingOut ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Logging out...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                            Logout
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Settings Dialog */}
            <SettingsDialog
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                user={user}
            />
        </>
    );
}
