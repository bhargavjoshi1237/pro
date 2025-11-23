'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">Preferences</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your workspace experience</p>
      </div>

      {/* Theme */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Appearance</h4>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 border rounded-xl transition-all flex flex-col items-center gap-3 ${theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                : 'border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444] bg-white dark:bg-[#1c1c1c]'
              }`}
          >
            <SunIcon className={`w-6 h-6 ${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>Light Mode</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 border rounded-xl transition-all flex flex-col items-center gap-3 ${theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                : 'border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444] bg-white dark:bg-[#1c1c1c]'
              }`}
          >
            <MoonIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>Dark Mode</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

      {/* Editor Settings */}
      <div className="space-y-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Editor</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-gray-900 dark:text-[#e7e7e7]">Auto-save</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatically save changes as you type</p>
          </div>
          <Switch checked={autoSave} onCheckedChange={setAutoSave} />
        </div>

        {autoSave && (
          <div className="space-y-2 pl-4 border-l-2 border-gray-100 dark:border-[#2a2a2a]">
            <Label className="text-sm text-gray-700 dark:text-gray-300">Auto-save Delay (ms)</Label>
            <Input
              type="number"
              value={autoSaveDelay}
              onChange={(e) => setAutoSaveDelay(Number(e.target.value))}
              min="500"
              max="5000"
              step="500"
              className="max-w-[200px] bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#333]"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Changes will be saved after {autoSaveDelay}ms of inactivity</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-gray-900 dark:text-[#e7e7e7]">Spell Check</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Check spelling as you type</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-gray-900 dark:text-[#e7e7e7]">Word Count</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Show word count in editor footer</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

      {/* Language */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7]">Language & Region</h4>
        <div className="space-y-2">
          <Label className="text-sm text-gray-700 dark:text-gray-300">Interface Language</Label>
          <Select defaultValue="en-US">
            <SelectTrigger className="w-full bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#333]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-UK">English (UK)</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
