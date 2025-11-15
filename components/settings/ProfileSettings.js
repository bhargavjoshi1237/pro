'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user metadata
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
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user metadata
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
    <div className="space-y-8">
      {/* Profile Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Profile Information</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal information and profile picture</p>
      </div>

      {/* Avatar Section */}
      <div className="flex items-start gap-6 p-6 bg-gray-50 dark:bg-[#1c1c1c] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
        <Avatar className="w-24 h-24 ring-4 ring-white dark:ring-[#2a2a2a]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback className="bg-blue-600 text-white text-3xl font-semibold">
              {getInitials(user?.email)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] mb-1">Profile Picture</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">JPG, PNG or GIF. Max size 2MB</p>
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
            className="bg-white dark:bg-[#212121]"
          >
            {uploading ? 'Uploading...' : 'Change Avatar'}
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7]">Personal Information</h4>
        
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-sm">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="bg-white dark:bg-[#1c1c1c]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50 dark:bg-[#1c1c1c]"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
        </div>
      </div>

 
      

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
