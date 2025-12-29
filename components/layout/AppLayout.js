'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    HomeIcon,
    SparklesIcon,
    EnvelopeIcon,
    MoonIcon,
    SunIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { ToolCase } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { WaveBackground } from '@/components/landing/wave/WaveBackground';
import MobileSidebar from '@/components/layout/MobileSidebar';
import UserMenu from '@/components/layout/UserMenu';


export default function AppLayout({
    children,
    user,
    userProfile,
    title,
    description
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showExperimentalFeatures, setShowExperimentalFeatures] = useState(false);

    useEffect(() => {
        // Check localStorage for experimental features setting
        const experimentalEnabled = localStorage.getItem('experimentalFeaturesEnabled') === 'true';
        setShowExperimentalFeatures(experimentalEnabled);

        // Listen for changes to experimental features setting
        const handleExperimentalFeaturesChange = (event) => {
            setShowExperimentalFeatures(event.detail.enabled);
        };

        window.addEventListener('experimentalFeaturesChanged', handleExperimentalFeaturesChange);

        return () => {
            window.removeEventListener('experimentalFeaturesChanged', handleExperimentalFeaturesChange);
        };
    }, []);

    return (
        <div className="relative h-full overflow-hidden">
            <div className="flex flex-col lg:flex-row h-full">
                <WaveBackground />

                {/* Blurred Overlay */}
                <div className="absolute inset-0 bg-white/40 dark:bg-[#191919]/40 backdrop-blur-xs z-0"></div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex lg:w-64 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border-r border-gray-200 dark:border-[#2a2a2a] flex-col relative z-10">
                    {/* Logo with Theme Toggle */}
                    <div className="px-3 py-2.5 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Prodigy</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            {theme === 'light' ? (
                                <MoonIcon className="w-4 h-4 text-gray-600" />
                            ) : (
                                <SunIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>

                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {[
                            { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
                            { path: '/ai-chat', label: 'AI Chat', icon: SparklesIcon },
                            { path: '/emails', label: 'Emails', icon: EnvelopeIcon },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path || (pathname?.startsWith(item.path + '/') && item.path !== '/dashboard');

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => router.push(item.path)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'text-gray-900 dark:text-[#e7e7e7] bg-gray-100 dark:bg-[#2a2a2a]'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-gray-500 dark:text-gray-500'
                                        }`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>


                </div>

                <MobileSidebar
                    open={mobileMenuOpen}
                    setOpen={setMobileMenuOpen}
                    user={user}
                    userProfile={userProfile}
                    showExperimentalFeatures={showExperimentalFeatures}
                />

                {/* Main Content */}
                <div className="flex-1 overflow-auto relative z-10 flex flex-col">
                    {/* Mobile Header Bar */}
                    <div className="lg:hidden sticky top-0 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#2a2a2a] px-3 py-2.5 flex items-center justify-between z-20">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <Bars3Icon className="w-5 h-5 text-gray-900 dark:text-[#e7e7e7]" />
                        </button>

                        <div className="flex items-center gap-1.5 -ml-2">
                            <SparklesIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Prodigy</span>
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="p-1.5 -mr-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            {theme === 'light' ? (
                                <MoonIcon className="w-4 h-4 text-gray-600" />
                            ) : (
                                <SunIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>

                    {/* Desktop Header */}
                    {(title || description) && (
                        <div className="hidden lg:block bg-white/80 dark:bg-[#181818]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#2a2a2a] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-shrink-0">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {title && <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-[#e7e7e7] truncate">{title}</h1>}
                                    {description && (
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:flex items-center gap-2">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="flex-1 relative">
                        {children}
                    </div>
                </div>

                {/* User Menu - Available on all pages */}
                <UserMenu user={user} userProfile={userProfile} />
            </div>
        </div>
    );
}
