'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import SettingsDialog from '@/components/settings/SettingsDialog';

const CORNERS = {
    'left-top': { top: '5%', left: '5%', bottom: 'auto', right: 'auto' },
    'left-bottom': { bottom: '5%', left: '5%', top: 'auto', right: 'auto' },
    'right-bottom': { bottom: '5%', right: '5%', top: 'auto', left: 'auto' },
    'right-top': { top: '5%', right: '5%', bottom: 'auto', left: 'auto' },
};

export default function UserMenu({ user, userProfile }) {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [position, setPosition] = useState('bottom-left');
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const buttonRef = useRef(null);
    const dragStartTime = useRef(null);

    // Load saved position from localStorage
    useEffect(() => {
        const savedPosition = localStorage.getItem('userMenuPosition');
        if (savedPosition && CORNERS[savedPosition]) {
            setPosition(savedPosition);
        } else {
            setPosition('left-bottom'); // Default position
        }
    }, []);

    const handleMouseDown = (e) => {
        if (showUserMenu) return; // Don't drag when menu is open
        
        dragStartTime.current = Date.now();
        setIsDragging(true);
        
        const rect = buttonRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleTouchStart = (e) => {
        if (showUserMenu) return;
        
        dragStartTime.current = Date.now();
        setIsDragging(true);
        
        const touch = e.touches[0];
        const rect = buttonRef.current.getBoundingClientRect();
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        });
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (clientX, clientY) => {
            if (!buttonRef.current) return;

            const button = buttonRef.current;
            
            // Calculate new position
            const x = clientX - dragOffset.x;
            const y = clientY - dragOffset.y;

            // Apply position directly during drag with transform instead of changing positioning
            button.style.transform = `translate(${x - button.offsetLeft}px, ${y - button.offsetTop}px)`;
        };

        const handleMouseMove = (e) => {
            e.preventDefault();
            handleMove(e.clientX, e.clientY);
        };

        const handleTouchMove = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        };

        const handleEnd = (e) => {
            if (!buttonRef.current) return;
            
            const dragDuration = Date.now() - dragStartTime.current;
            
            // If drag was very short (< 150ms), treat it as a click
            if (dragDuration < 150) {
                buttonRef.current.style.transform = '';
                setIsDragging(false);
                setShowUserMenu(true);
                return;
            }

            // Get final position
            const rect = buttonRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Determine closest corner
            const isLeft = centerX < windowWidth / 2;
            const isTop = centerY < windowHeight / 2;

            let newPosition;
            if (isTop && isLeft) newPosition = 'left-top';
            else if (isTop && !isLeft) newPosition = 'right-top';
            else if (!isTop && isLeft) newPosition = 'left-bottom';
            else newPosition = 'right-bottom';

            // Reset transform immediately
            buttonRef.current.style.transform = '';
            
            // Update position state
            setPosition(newPosition);
            localStorage.setItem('userMenuPosition', newPosition);
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, dragOffset]);

    const getMenuPosition = () => {
        const isTop = position.includes('top');
        const isLeft = position.startsWith('left');
        
        return {
            [isTop ? 'top' : 'bottom']: '3.5rem',
            [isLeft ? 'left' : 'right']: '0',
        };
    };

    const handleLogout = async () => {
        if (!supabase) return;
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/');
    };

    if (!user) return null;

    return (
        <>
            {/* User Menu - Draggable to Any Corner */}
            <div 
                ref={buttonRef}
                className="fixed z-40 touch-none"
                style={{
                    ...CORNERS[position],
                    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
            >
                <button
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className={`w-10 h-10 lg:w-10 lg:h-10 rounded-full bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] text-gray-900 dark:text-[#e7e7e7] flex items-center justify-center font-semibold shadow-lg transition-all overflow-hidden ${
                        isDragging ? 'scale-110' : 'hover:scale-110 active:scale-95'
                    }`}
                >
                    {userProfile?.avatar_url ? (
                        <img
                            src={userProfile.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover pointer-events-none"
                        />
                    ) : (
                        <span className="text-sm lg:text-base pointer-events-none">
                            {user?.email?.charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>

                {showUserMenu && !isDragging && (
                    <>
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setShowUserMenu(false)}
                        />
                        <div 
                            className="absolute w-56 bg-white dark:bg-[#212121] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a2a2a] z-40"
                            style={getMenuPosition()}
                        >
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
