'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function ProfileSettings({ user }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (event) => {
    if (!supabase || !user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;

    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (email) => {
    return email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-6">
      {/* Header */}
      <div>
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Profile Information</h3>
        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal information and profile picture</p>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 dark:bg-[#1c1c1c] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white dark:ring-[#2a2a2a] shadow-sm shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl sm:text-2xl font-bold">
              {getInitials(user?.email)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0 w-full">
          <h4 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] mb-1">Profile Picture</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">JPG, PNG or GIF. Max size 2MB</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('avatar-upload')?.click()}
              disabled={uploading}
              className="bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 border-gray-300 dark:border-[#333] text-xs sm:text-sm"
            >
              {uploading ? 'Uploading...' : 'Upload New'}
            </Button>
            {avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAvatarUrl('')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

      {/* Personal Information */}
      <div className="space-y-4 lg:space-y-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Personal Details</h4>

        <div className="grid gap-4 lg:gap-6 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-xs lg:text-sm text-gray-700 dark:text-gray-300">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] border-gray-300 dark:border-[#333] h-10 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs lg:text-sm text-gray-700 dark:text-gray-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50 dark:bg-[#181818] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#2a2a2a] select-none cursor-not-allowed h-10 text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500">Email address cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Save Button - Sticky on mobile */}
      <div className="flex justify-end pt-4 lg:pt-6 border-t border-gray-200 dark:border-[#2a2a2a] sticky bottom-0 bg-white dark:bg-[#121212] lg:static lg:bg-transparent -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 pb-4 lg:pb-0">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] w-full sm:w-auto text-sm h-10"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
