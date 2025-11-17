'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { XMarkIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';

export default function ShareWorkspaceDialog({ isOpen, onClose, workspace, members, onMembersUpdate }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleShare = async () => {
    if (!supabase || !email.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const emailToSearch = email.trim().toLowerCase();
      
      // First try to find user in profiles
      let { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', emailToSearch)
        .maybeSingle();

      // If not found in profiles, try using RPC to search auth.users
      if (!userData) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
          user_email: emailToSearch
        });

        if (rpcError) {
          console.error('RPC error:', rpcError);
          setMessage('User not found. Make sure they have signed up.');
          setLoading(false);
          return;
        }

        if (rpcData && rpcData.length > 0) {
          userData = { id: rpcData[0].id, email: emailToSearch };
        }
      }

      if (!userData) {
        setMessage('User not found. Make sure they have signed up.');
        setLoading(false);
        return;
      }

      // Check if already a member
      const existing = members.find(m => m.user_id === userData.id);
      if (existing) {
        setMessage('User is already a member');
        setLoading(false);
        return;
      }

      // Add member
      const { error: insertError } = await supabase
        .from('workspace_members')
        .insert([{
          workspace_id: workspace.id,
          user_id: userData.id,
          role: role
        }]);

      if (insertError) throw insertError;

      setMessage('User added successfully');
      setEmail('');
      onMembersUpdate();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (!error) {
        onMembersUpdate();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`rounded-lg shadow-2xl border w-full max-w-md ${
          theme === 'dark'
            ? 'bg-[#181818] border-[#2a2a2a]'
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-[#e7e7e7]' : 'text-gray-900'
          }`}>
            Share Workspace
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
            }`}
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-[#1c1c1c] border-[#2a2a2a] text-[#e7e7e7] placeholder-gray-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent outline-none`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-[#1c1c1c] border-[#2a2a2a] text-[#e7e7e7]'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent outline-none`}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleShare}
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#e7e7e7] dark:bg-[#282828] hover:bg-gray-300 dark:hover:bg-[#383838] border border-gray-300 dark:border-[#383838] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-[#e7e7e7] text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlusIcon className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add Member'}
          </button>

          {/* Current Members */}
          {members && members.length > 0 && (
            <div className="pt-4">
              <h3 className={`text-sm font-semibold mb-3 ${
                theme === 'dark' ? 'text-[#e7e7e7]' : 'text-gray-900'
              }`}>
                Current Members ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-[#1c1c1c]' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white text-sm font-semibold">
                        {member.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-[#e7e7e7]' : 'text-gray-900'
                        }`}>
                          {member.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
