import { supabase } from './supabase';

export async function exportWorkspace(workspaceId) {
  try {
    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) throw workspaceError;

    // Get folders
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (foldersError) throw foldersError;

    // Get snippets
    const { data: snippets, error: snippetsError } = await supabase
      .from('snippets')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (snippetsError) throw snippetsError;

    // Get tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (tagsError) throw tagsError;

    // Get snippet tags
    const snippetIds = snippets.map(s => s.id);
    const { data: snippetTags, error: snippetTagsError } = await supabase
      .from('snippet_tags')
      .select('*')
      .in('snippet_id', snippetIds);

    if (snippetTagsError) throw snippetTagsError;

    // Create export object
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      workspace: {
        name: workspace.name,
        description: workspace.description,
        settings: workspace.settings,
      },
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        created_at: f.created_at,
      })),
      snippets: snippets.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        folder_id: s.folder_id,
        word_count: s.word_count,
        is_final: s.is_final,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })),
      snippetTags: snippetTags.map(st => ({
        snippet_id: st.snippet_id,
        tag_id: st.tag_id,
      })),
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workspace.name.replace(/[^a-z0-9]/gi, '_')}_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
}

export async function importWorkspace(file, userId) {
  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate import data
    if (!importData.version || !importData.workspace) {
      throw new Error('Invalid import file format');
    }

    // Create new workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{
        name: `${importData.workspace.name} (Imported)`,
        description: importData.workspace.description,
        settings: importData.workspace.settings,
        owner_id: userId,
      }])
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // Add user as owner
    await supabase
      .from('workspace_members')
      .insert([{
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
      }]);

    // Create ID mapping for folders
    const folderIdMap = {};
    for (const folder of importData.folders || []) {
      const { data: newFolder, error } = await supabase
        .from('folders')
        .insert([{
          name: folder.name,
          workspace_id: workspace.id,
        }])
        .select()
        .single();

      if (!error && newFolder) {
        folderIdMap[folder.id] = newFolder.id;
      }
    }

    // Create ID mapping for tags
    const tagIdMap = {};
    for (const tag of importData.tags || []) {
      const { data: newTag, error } = await supabase
        .from('tags')
        .insert([{
          name: tag.name,
          color: tag.color,
          workspace_id: workspace.id,
        }])
        .select()
        .single();

      if (!error && newTag) {
        tagIdMap[tag.id] = newTag.id;
      }
    }

    // Create ID mapping for snippets
    const snippetIdMap = {};
    for (const snippet of importData.snippets || []) {
      const { data: newSnippet, error } = await supabase
        .from('snippets')
        .insert([{
          title: snippet.title,
          content: snippet.content,
          folder_id: folderIdMap[snippet.folder_id] || null,
          workspace_id: workspace.id,
          word_count: snippet.word_count,
          is_final: snippet.is_final,
        }])
        .select()
        .single();

      if (!error && newSnippet) {
        snippetIdMap[snippet.id] = newSnippet.id;
      }
    }

    // Import snippet tags
    for (const snippetTag of importData.snippetTags || []) {
      const newSnippetId = snippetIdMap[snippetTag.snippet_id];
      const newTagId = tagIdMap[snippetTag.tag_id];

      if (newSnippetId && newTagId) {
        await supabase
          .from('snippet_tags')
          .insert([{
            snippet_id: newSnippetId,
            tag_id: newTagId,
          }]);
      }
    }

    return { success: true, workspaceId: workspace.id };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: error.message };
  }
}
