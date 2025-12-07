// Y.js provider for real-time whiteboard collaboration
import * as Y from 'yjs';
import { supabase } from './supabase';

class WhiteboardProvider {
    constructor(doc, workspaceId, whiteboardId, userId) {
        this.doc = doc;
        this.workspaceId = workspaceId;
        this.whiteboardId = whiteboardId;
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
            .channel(`whiteboard:${this.whiteboardId}`)
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
            .from('whiteboards')
            .select('yjs_state')
            .eq('id', this.whiteboardId)
            .single();

        if (data?.yjs_state) {
            const state = new Uint8Array(data.yjs_state);
            Y.applyUpdate(this.doc, state);
        }
    }

    async broadcastUpdate(update) {
        if (!this.channel) return;

        // Send to other clients immediately (fire and forget to avoid blocking)
        this.channel.send({
            type: 'broadcast',
            event: 'update',
            payload: {
                userId: this.userId,
                update: Array.from(update),
            },
        });

        // Debounce persistence to database
        this.saveToDatabase();
    }

    saveToDatabase = debounce(async () => {
        const state = Y.encodeStateAsUpdate(this.doc);
        await supabase
            .from('whiteboards')
            .update({ yjs_state: Array.from(state) })
            .eq('id', this.whiteboardId);
    }, 2000);

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

// Simple debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export { WhiteboardProvider };
