'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const TAG_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export function TagManager({ workspaceId, snippetId = null, onTagsChange }) {
  const [tags, setTags] = useState([]);
  const [attachedTags, setAttachedTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const loadTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');

    if (!error && data) {
      setTags(data);
    }
  };

  const loadSnippetTags = async () => {
    const { data, error } = await supabase
      .from('snippet_tags')
      .select('tag_id, tags(*)')
      .eq('snippet_id', snippetId);

    if (!error && data) {
      setAttachedTags(data.map(st => st.tags));
    }
  };

  useEffect(() => {
    loadTags();
    if (snippetId) {
      loadSnippetTags();
    }
  }, [workspaceId, snippetId, loadTags, loadSnippetTags]);

  const createTag = async () => {
    if (!newTagName.trim()) return;

    const { data, error } = await supabase
      .from('tags')
      .insert([{
        name: newTagName.trim(),
        color: selectedColor,
        workspace_id: workspaceId
      }])
      .select()
      .single();

    if (!error && data) {
      setTags([...tags, data]);
      setNewTagName('');
      setShowTagInput(false);
      if (snippetId) {
        await attachTag(data.id);
      }
    }
  };

  const attachTag = async (tagId) => {
    if (!snippetId) return;

    const { error } = await supabase
      .from('snippet_tags')
      .insert([{ snippet_id: snippetId, tag_id: tagId }]);

    if (!error) {
      await loadSnippetTags();
      onTagsChange?.();
    }
  };

  const detachTag = async (tagId) => {
    if (!snippetId) return;

    const { error } = await supabase
      .from('snippet_tags')
      .delete()
      .eq('snippet_id', snippetId)
      .eq('tag_id', tagId);

    if (!error) {
      await loadSnippetTags();
      onTagsChange?.();
    }
  };

  const deleteTag = async (tagId) => {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (!error) {
      setTags(tags.filter(t => t.id !== tagId));
      setAttachedTags(attachedTags.filter(t => t.id !== tagId));
    }
  };

  const availableTags = tags.filter(
    tag => !attachedTags.find(at => at.id === tag.id)
  );

  return (
    <div className="space-y-3">
      {/* Attached Tags */}
      {snippetId && attachedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedTags.map(tag => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color }}
              className="text-white flex items-center gap-1 px-2 py-1 hover:opacity-90 transition-opacity"
            >
              {tag.name}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => detachTag(tag.id)}
                className="h-4 w-4 p-0 hover:bg-white/20 rounded-full ml-1"
              >
                <XMarkIcon className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Available Tags */}
      {snippetId && availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <Button
              key={tag.id}
              variant="outline"
              size="sm"
              onClick={() => attachTag(tag.id)}
              className="h-7 text-xs"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              <PlusIcon className="w-3 h-3 mr-1" />
              {tag.name}
            </Button>
          ))}
        </div>
      )}

      {/* Create New Tag */}
      {showTagInput ? (
        <div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/50">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createTag()}
            placeholder="Tag name"
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button
              onClick={createTag}
              size="sm"
              className="h-8"
            >
              Add
            </Button>
            <Button
              onClick={() => setShowTagInput(false)}
              variant="outline"
              size="sm"
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTagInput(true)}
          className="h-8 text-xs"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          New Tag
        </Button>
      )}

      {/* All Workspace Tags (for management) */}
      {!snippetId && tags.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">All Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white flex items-center gap-1 px-2 py-1 hover:opacity-90 transition-opacity"
              >
                {tag.name}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTag(tag.id)}
                  className="h-4 w-4 p-0 hover:bg-white/20 rounded-full ml-1"
                >
                  <XMarkIcon className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
