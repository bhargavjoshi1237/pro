'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function SecuritySettings({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!supabase) return;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-1">Security Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage your password and security preferences</p>
      </div>

      {/* Change Password */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] flex items-center gap-2">
          <LockClosedIcon className="w-4 h-4" />
          Change Password
        </h4>

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>



        <Button
          onClick={handleChangePassword}
          disabled={saving || !newPassword || !confirmPassword}
          className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
        >
          {saving ? 'Updating...' : 'Update Password'}
        </Button>
      </div>

      {/* Active Sessions */}
      <Separator />
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-[#e7e7e7]">Active Sessions</h4>
        <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Current Session</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last active: Just now</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
