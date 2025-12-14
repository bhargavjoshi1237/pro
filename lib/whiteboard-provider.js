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
        this.clientID = doc.clientID; // Unique ID for this Yjs instance

        this.connect();
    }

    connect() {
        if (!supabase) return;

        // Subscribe to realtime updates
        this.channel = supabase
            .channel(`whiteboard:${this.whiteboardId}`)
            .on('broadcast', { event: 'update' }, ({ payload }) => {
                // Filter out our own updates based on clientID (allows same user in multiple tabs)
                if (payload.clientID !== this.clientID) {
                    Y.applyUpdate(this.doc, new Uint8Array(payload.update));
                }
            })
            .on('broadcast', { event: 'awareness' }, ({ payload }) => {
                if (payload.clientID !== this.clientID) {
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
        try {
            const { data, error } = await supabase
                .from('whiteboards')
                .select('yjs_state')
                .eq('id', this.whiteboardId)
                .single();

            if (error) throw error;

            if (data?.yjs_state) {
                let state = data.yjs_state;

                // Handle different formats
                // 1. PostgreSQL Hex format (begins with \x)
                if (typeof state === 'string' && state.startsWith('\\x')) {
                    // Remove \x prefix
                    const hexAsString = state.substring(2);
                    // Convert hex string to Uint8Array
                    const bytes = new Uint8Array(Math.ceil(hexAsString.length / 2));
                    for (let i = 0; i < bytes.length; i++) {
                        bytes[i] = parseInt(hexAsString.substr(i * 2, 2), 16);
                    }
                    state = bytes;
                }
                // 2. Regular JSON array or stringified JSON
                else if (typeof state === 'string') {
                    try {
                        const parsed = JSON.parse(state);
                        if (Array.isArray(parsed) || (parsed.type === 'Buffer' && Array.isArray(parsed.data))) {
                            state = new Uint8Array(parsed.data || parsed);
                        } else {
                            // Maybe it is just a string? Warning.
                        }
                    } catch (e) {
                        // Not JSON, ignore
                    }
                }

                // 3. Regular Array
                if (Array.isArray(state)) {
                    state = new Uint8Array(state);
                }

                if (state instanceof Uint8Array && state.byteLength > 0) {
                    Y.applyUpdate(this.doc, state);
                }
            }
        } catch (err) {
            console.warn('Failed to load whiteboard state (possibly corrupted):', err);
            // If data is corrupted, we should probably reset it in the DB to avoid persistent errors on reload
            // We overwrite with the current (empty) doc state
            this.saveToDatabase();
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
                clientID: this.clientID,
                update: Array.from(update),
            },
        });

        // Debounce persistence to database
        this.saveToDatabase();
    }

    saveToDatabase = debounce(async () => {
        const state = Y.encodeStateAsUpdate(this.doc);
        // Convert to Postgres HEX format for BYTEA: \xDEADBEEF...
        const hexString = '\\x' + Array.from(state).map(b => b.toString(16).padStart(2, '0')).join('');

        await supabase
            .from('whiteboards')
            .update({ yjs_state: hexString })
            .eq('id', this.whiteboardId);
    }, 2000);

    broadcastAwareness(state) {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'awareness',
            payload: {
                userId: this.userId,
                clientID: this.clientID,
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
