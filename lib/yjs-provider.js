// Y.js provider for real-time collaboration
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { supabase } from './supabase';

class SupabaseProvider {
  constructor(doc, workspaceId, snippetId, userId) {
    this.doc = doc;
    this.workspaceId = workspaceId;
    this.snippetId = snippetId;
    this.userId = userId;
    this.channel = null;
    this.awareness = new Map();
    this.synced = false;
    
    this.connect();
  }

  connect() {
    if (!supabase) return;

    // Subscribe to realtime updates
    this.channel = supabase
      .channel(`snippet:${this.snippetId}`)
      .on('broadcast', { event: 'update' }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          Y.applyUpdate(this.doc, new Uint8Array(payload.update));
        }
      })
      .on('broadcast', { event: 'awareness' }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          this.awareness.set(payload.userId, payload.state);
          this.emit('awareness-update', { added: [payload.userId], updated: [], removed: [] });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.loadInitialState();
          this.synced = true;
          this.emit('synced', { synced: true });
        }
      });

    // Listen to local document updates
    this.doc.on('update', (update, origin) => {
      if (origin !== this) {
        this.broadcastUpdate(update);
      }
    });
  }

  async loadInitialState() {
    const { data } = await supabase
      .from('snippets')
      .select('content, yjs_state')
      .eq('id', this.snippetId)
      .single();

    if (data?.yjs_state) {
      const state = new Uint8Array(data.yjs_state);
      Y.applyUpdate(this.doc, state);
    }
  }

  async broadcastUpdate(update) {
    if (!this.channel) return;

    await this.channel.send({
      type: 'broadcast',
      event: 'update',
      payload: {
        userId: this.userId,
        update: Array.from(update),
      },
    });

    // Persist to database
    const state = Y.encodeStateAsUpdate(this.doc);
    await supabase
      .from('snippets')
      .update({ yjs_state: Array.from(state) })
      .eq('id', this.snippetId);
  }

  broadcastAwareness(state) {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'awareness',
      payload: {
        userId: this.userId,
        state,
      },
    });
  }

  destroy() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
  }

  emit(event, data) {
    if (this[`on${event}`]) {
      this[`on${event}`](data);
    }
  }
}

export { SupabaseProvider };
