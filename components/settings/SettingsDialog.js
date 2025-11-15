'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/ThemeContext';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import PreferencesSettings from './PreferencesSettings';

export default function SettingsDialog({ isOpen, onClose, user }) {
  const { theme } = useTheme();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2a2a2a]">
        <DialogHeader className="border-b pb-4 border-gray-200 dark:border-[#2a2a2a]">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-[#e7e7e7]">
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start h-auto p-0 rounded-none bg-transparent overflow-x-auto">
            <TabsTrigger 
              value="profile"
              className="rounded-none border-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#e7e7e7] data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1c1c1c] whitespace-nowrap"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="rounded-none border-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#e7e7e7] data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1c1c1c] whitespace-nowrap"
            >
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="rounded-none border-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#e7e7e7] data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1c1c1c] whitespace-nowrap"
            >
              Preferences
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="profile" className="mt-0 p-4 sm:p-6 focus-visible:outline-none focus-visible:ring-0">
              <ProfileSettings user={user} />
            </TabsContent>
            <TabsContent value="security" className="mt-0 p-4 sm:p-6 focus-visible:outline-none focus-visible:ring-0">
              <SecuritySettings user={user} />
            </TabsContent>
            <TabsContent value="preferences" className="mt-0 p-4 sm:p-6 focus-visible:outline-none focus-visible:ring-0">
              <PreferencesSettings userId={user?.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
