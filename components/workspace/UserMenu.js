import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

export default function UserMenu({ user, onSettingsClick }) {
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
    <div className="absolute bottom-4 left-4 z-10">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-semibold shadow-lg transition-colors overflow-hidden"
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
            className="fixed inset-0 z-20"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute bottom-12 left-0 w-56 bg-white dark:bg-[#212121] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a2a2a] z-30">
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
