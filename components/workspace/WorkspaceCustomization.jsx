'use client';

import { useState, useRef } from 'react';
import { 
  PhotoIcon, 
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { WORKSPACE_ICONS, DEFAULT_ICON, getIconById } from './WorkspaceIcons';

export default function WorkspaceCustomization({ 
  workspace, 
  onUpdate, 
  onClose 
}) {
  const [icon, setIcon] = useState(workspace?.icon || DEFAULT_ICON);
  const [coverImage, setCoverImage] = useState(workspace?.cover_image || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${workspace.id}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('workspace-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert(`Failed to upload: ${uploadError.message}. Please check storage bucket permissions.`);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('workspace-assets')
        .getPublicUrl(filePath);

      console.log('✅ Upload successful!');
      console.log('📁 File path:', filePath);
      console.log('🔗 Public URL:', publicUrl);
      console.log('💡 If image doesn\'t show, make sure bucket is PUBLIC in Supabase Dashboard');

      setCoverImage(publicUrl);
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert(`Failed to upload cover image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverImage('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving workspace customization...');
      console.log('📝 Workspace ID:', workspace.id);
      console.log('🎨 Icon:', icon);
      console.log('🖼️ Cover Image:', coverImage);
      console.log('📦 Update payload:', {
        icon,
        cover_image: coverImage || null
      });

      const { data, error } = await supabase
        .from('workspaces')
        .update({
          icon,
          cover_image: coverImage || null
        })
        .eq('id', workspace.id)
        .select();

      if (error) {
        console.error('❌ Save error:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          alert('⚠️ Database columns missing!\n\nPlease run this SQL in Supabase:\n\nALTER TABLE workspaces \nADD COLUMN IF NOT EXISTS cover_image TEXT,\nADD COLUMN IF NOT EXISTS icon TEXT;\n\nSee RUN_THIS_NOW.sql file for details.');
        } else {
          alert(`Failed to save: ${error.message}`);
        }
        throw error;
      }

      console.log('✅ Saved successfully:', data);
      
      if (data && data.length > 0) {
        console.log('📊 Saved data:', {
          id: data[0].id,
          name: data[0].name,
          icon: data[0].icon,
          cover_image: data[0].cover_image
        });
        
        // Use the data returned from database to ensure consistency
        onUpdate?.(data[0]);
      } else {
        console.warn('⚠️ No data returned from save, using local state');
        onUpdate?.({ ...workspace, icon, cover_image: coverImage });
      }
      
      onClose?.();
    } catch (error) {
      console.error('Error updating workspace:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-[#212121] rounded-none sm:rounded-lg shadow-xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between sticky top-0 bg-white dark:bg-[#212121] z-10 shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-[#e7e7e7]">
            Personalise Workspace
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Cover Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-[#e7e7e7] mb-2 sm:mb-3">
              Cover Image
            </label>
            
            {coverImage ? (
              <div className="relative group">
                <img
                  src={coverImage}
                  alt="Workspace cover"
                  className="w-full h-32 sm:h-48 object-cover rounded-lg"
                />
                {/* Mobile: Always show buttons, Desktop: Show on hover */}
                <div className="absolute inset-0 bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-white text-gray-900 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleRemoveCover}
                    className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 sm:h-48 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-600 transition-colors active:border-blue-500"
              >
                <PhotoIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-4 text-center">
                  {uploading ? 'Uploading...' : 'Tap to upload cover image'}
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG up to 5MB
                </span>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Icon Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-[#e7e7e7] mb-2 sm:mb-3">
              Workspace Icon
            </label>
            
            {/* Preview */}
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-[#1c1c1c] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shrink-0">
                {(() => {
                  const IconComponent = getIconById(icon);
                  return <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-gray-900" />;
                })()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-[#e7e7e7] truncate">
                  {workspace.name}
                </p>
                <p className="text-xs text-gray-500">Preview</p>
              </div>
            </div>

            {/* Icon Picker - Scrollable Grid */}
            <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-2 sm:p-3 bg-white dark:bg-[#212121] max-h-[50vh] sm:max-h-64 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
                {WORKSPACE_ICONS.map((iconOption) => {
                  const IconComponent = iconOption.Icon;
                  return (
                    <button
                      key={iconOption.id}
                      onClick={() => setIcon(iconOption.id)}
                      className={`p-2 sm:p-3 flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-lg transition-all active:scale-95 ${
                        icon === iconOption.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                          : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] active:bg-gray-200 dark:active:bg-[#333]'
                      }`}
                      title={iconOption.name}
                    >
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                      <span className="text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-400 text-center leading-tight line-clamp-1">
                        {iconOption.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-[#2a2a2a] flex items-center justify-end gap-2 sm:gap-3 sticky bottom-0 bg-white dark:bg-[#212121] shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] active:bg-gray-200 dark:active:bg-[#333] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-3 sm:px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-[#2a2a2a] text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <SparklesIcon className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
                <span className="sm:hidden">Save...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
