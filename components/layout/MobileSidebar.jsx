'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
    HomeIcon,
    SparklesIcon,
    EnvelopeIcon,
    MoonIcon,
    SunIcon
} from '@heroicons/react/24/outline';
import { ToolCase, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from '@/context/ThemeContext';

export default function MobileSidebar({ open, setOpen, user, userProfile }) {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: HomeIcon },
        { path: '/ai-chat', label: 'AI Chat', icon: SparklesIcon },
        { path: '/emails', label: 'Emails', icon: EnvelopeIcon },
        { path: '/proper6k', label: 'Proper 6K', icon: ToolCase },
    ];

    const handleNavigation = (path) => {
        router.push(path);
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="w-[260px] p-0 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-r border-gray-200 dark:border-[#2a2a2a]">
                <SheetHeader className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a]">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Prodigy</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            {theme === 'light' ? (
                                <MoonIcon className="w-4 h-4 text-gray-600" />
                            ) : (
                                <SunIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>
                </SheetHeader>

                <nav className="p-2 space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path || (pathname?.startsWith(item.path + '/') && item.path !== '/dashboard');

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'text-gray-900 dark:text-[#e7e7e7] bg-gray-100 dark:bg-[#2a2a2a]'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User Info in Drawer */}
                {user && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-[#2a2a2a] bg-white/50 dark:bg-[#181818]/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                {userProfile?.avatar_url ? (
                                    <img
                                        src={userProfile.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 dark:text-[#e7e7e7] truncate">
                                    {userProfile?.display_name || 'User'}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
