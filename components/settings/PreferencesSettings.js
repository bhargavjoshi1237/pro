'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function PreferencesSettings({ userId }) {
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveDelay, setAutoSaveDelay] = useState(1000);
  const { theme, toggleTheme } = useTheme();

  const handleThemeChange = (newTheme) => {
    if ((theme === 'light' && newTheme === 'dark') || (theme === 'dark' && newTheme === 'light')) {
      toggleTheme();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7] mb-1">Preferences</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Customize your experience</p>
      </div>

      {/* Theme */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">Appearance</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 border-2 rounded-lg transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
            }`}
          >
            <SunIcon className="w-6 h-6 text-gray-900 dark:text-[#e7e7e7] mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Light</p>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 border-2 rounded-lg transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
            }`}
          >
            <MoonIcon className="w-6 h-6 text-gray-900 dark:text-[#e7e7e7] mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Dark</p>
          </button>
        </div>
      </div>

      {/* Editor Settings */}
      <div className="pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] mb-4">Editor</h4>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Auto-save</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Automatically save changes as you type</p>
            </div>
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-[#2a2a2a] rounded focus:ring-blue-500"
            />
          </label>

          {autoSave && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-save Delay (ms)
              </label>
              <input
                type="number"
                value={autoSaveDelay}
                onChange={(e) => setAutoSaveDelay(Number(e.target.value))}
                min="500"
                max="5000"
                step="500"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Changes will be saved after {autoSaveDelay}ms of inactivity
              </p>
            </div>
          )}

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Spell Check</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Check spelling as you type</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-[#2a2a2a] rounded focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Word Count</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Show word count in editor</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-[#2a2a2a] rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Language */}
      <div className="pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e7e7e7] mb-3">Language & Region</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-[#e7e7e7] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm">
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
      </div>
    </div>
  );
}
