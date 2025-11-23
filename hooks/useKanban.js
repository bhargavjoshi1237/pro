import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useKanban(workspaceId) {
    const [boards, setBoards] = useState([]);
    const [activeBoard, setActiveBoard] = useState(null);
    const [columns, setColumns] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    // Refs to track current state in subscriptions without triggering re-renders
    const columnsRef = useRef([]);
    const cardsRef = useRef([]);

    // Update refs when state changes
    useEffect(() => {
        columnsRef.current = columns;
    }, [columns]);

    useEffect(() => {
        cardsRef.current = cards;
    }, [cards]);

    // Fetch boards
    useEffect(() => {
        if (!workspaceId) return;

        const fetchBoards = async () => {
            const { data, error } = await supabase
                .from('kanban_boards')
                .select(`
                    *,
                    kanban_columns (
                        id,
                        kanban_cards (count)
                    )
                `)
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching boards:', error);
                return;
            }

            // Process data to calculate total cards
            const boardsWithStats = data.map(board => ({
                ...board,
                column_count: board.kanban_columns.length,
                card_count: board.kanban_columns.reduce((sum, col) => sum + (col.kanban_cards?.[0]?.count || 0), 0)
            }));

            setBoards(boardsWithStats);
            setLoading(false);
        };

        fetchBoards();

        // Subscribe to board changes
        const subscription = supabase
            .channel(`kanban_boards:${workspaceId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'kanban_boards',
                filter: `workspace_id=eq.${workspaceId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setBoards(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'DELETE') {
                    setBoards(prev => prev.filter(b => b.id !== payload.old.id));
                    if (activeBoard?.id === payload.old.id) {
                        setActiveBoard(null);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    setBoards(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
                    if (activeBoard?.id === payload.new.id) {
                        setActiveBoard(payload.new);
                    }
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [workspaceId]); // Removed activeBoard from dependency to prevent re-subscribing

    // Fetch columns and cards when active board changes
    useEffect(() => {
        if (!activeBoard) {
            setColumns([]);
            setCards([]);
            return;
        }

        let isMounted = true;

        const fetchBoardData = async () => {
            // Fetch columns
            const { data: cols, error: colsError } = await supabase
                .from('kanban_columns')
                .select('*')
                .eq('board_id', activeBoard.id)
                .order('position', { ascending: true });

            if (colsError) {
                console.error('Error fetching columns:', colsError);
                return;
            }

            if (!isMounted) return;
            setColumns(cols);

            // Fetch cards
            const columnIds = cols.map(c => c.id);
            if (columnIds.length === 0) {
                setCards([]);
                return;
            }

            const { data: cardsData, error: cardsError } = await supabase
                .from('kanban_cards')
                .select(`
                  *,
                  tags:kanban_card_tags(tag_id),
                  entities:kanban_card_entities(entity_id)
                `)
                .in('column_id', columnIds)
                .order('position', { ascending: true });

            if (cardsError) {
                console.error('Error fetching cards:', cardsError);
                return;
            }

            if (!isMounted) return;
            setCards(cardsData);
        };

        fetchBoardData();

        // Subscribe to columns
        const colSubscription = supabase
            .channel(`kanban_columns:${activeBoard.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'kanban_columns',
                filter: `board_id=eq.${activeBoard.id}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setColumns(prev => [...prev, payload.new].sort((a, b) => a.position - b.position));
                } else if (payload.eventType === 'DELETE') {
                    setColumns(prev => prev.filter(c => c.id !== payload.old.id));
                    // Also remove cards associated with this column locally
                    setCards(prev => prev.filter(c => c.column_id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    setColumns(prev => prev.map(c => c.id === payload.new.id ? payload.new : c).sort((a, b) => a.position - b.position));
                }
            })
            .subscribe();

        // Subscribe to cards
        // We listen to all card changes and filter by whether they belong to our columns
        const cardSubscription = supabase
            .channel(`kanban_cards_board:${activeBoard.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'kanban_cards'
            }, async (payload) => {
                // Use refs to check against current state without closure staleness
                const currentColumnIds = columnsRef.current.map(c => c.id);

                if (payload.eventType === 'INSERT') {
                    if (currentColumnIds.includes(payload.new.column_id)) {
                        // Fetch the full card data including relations
                        const { data: newCard, error } = await supabase
                            .from('kanban_cards')
                            .select(`
                                *,
                                tags:kanban_card_tags(tag_id),
                                entities:kanban_card_entities(entity_id)
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && newCard) {
                            setCards(prev => {
                                if (prev.some(c => c.id === newCard.id)) return prev;
                                return [...prev, newCard].sort((a, b) => a.position - b.position);
                            });
                        }
                    }
                } else if (payload.eventType === 'DELETE') {
                    setCards(prev => prev.filter(c => c.id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    // If moved to a column not in this board, remove it
                    if (!currentColumnIds.includes(payload.new.column_id)) {
                        setCards(prev => prev.filter(c => c.id !== payload.new.id));
                        return;
                    }

                    // If it belongs to this board, update it
                    // We might need to fetch relations if they changed, but for position/title updates, payload is enough usually
                    // But payload doesn't have assignee/tags. So safe to fetch or merge.
                    // For drag and drop speed, we might want to just merge payload.
                    // But if we want consistency, fetching is safer.
                    // Let's try merging first, if it lacks data, we fetch.

                    setCards(prev => {
                        const existing = prev.find(c => c.id === payload.new.id);
                        if (!existing) {
                            // It might be a card moved INTO this board
                            // We should fetch it.
                            return prev;
                        }
                        return prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c).sort((a, b) => a.position - b.position);
                    });

                    // If it was a move or new card we didn't have, we might need to fetch to be sure
                    if (!cardsRef.current.some(c => c.id === payload.new.id)) {
                        const { data: newCard, error } = await supabase
                            .from('kanban_cards')
                            .select(`
                                *,
                                tags:kanban_card_tags(tag_id)
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && newCard) {
                            setCards(prev => [...prev, newCard].sort((a, b) => a.position - b.position));
                        }
                    }
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            colSubscription.unsubscribe();
            cardSubscription.unsubscribe();
        };
    }, [activeBoard]);

    const createBoard = async (name, description) => {
        const { data, error } = await supabase
            .from('kanban_boards')
            .insert([{ workspace_id: workspaceId, name, description }])
            .select()
            .single();

        if (error) {
            toast.error('Failed to create board');
            throw error;
        }

        // Create default columns
        const defaultColumns = [
            { board_id: data.id, title: 'To Do', position: 0 },
            { board_id: data.id, title: 'In Progress', position: 1 },
            { board_id: data.id, title: 'Done', position: 2 }
        ];

        await supabase.from('kanban_columns').insert(defaultColumns);

        // Refetch boards to update stats
        const { data: boardsData } = await supabase
            .from('kanban_boards')
            .select(`
                *,
                kanban_columns (
                    id,
                    kanban_cards (count)
                )
            `)
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (boardsData) {
            const boardsWithStats = boardsData.map(board => ({
                ...board,
                column_count: board.kanban_columns.length,
                card_count: board.kanban_columns.reduce((sum, col) => sum + (col.kanban_cards?.[0]?.count || 0), 0)
            }));
            setBoards(boardsWithStats);
        }

        return data;
    };

    const updateBoard = async (boardId, updates) => {
        const { error } = await supabase
            .from('kanban_boards')
            .update(updates)
            .eq('id', boardId);

        if (error) {
            toast.error('Failed to update board');
            throw error;
        }
    };

    const deleteBoard = async (boardId) => {
        const { error } = await supabase
            .from('kanban_boards')
            .delete()
            .eq('id', boardId);

        if (error) {
            toast.error('Failed to delete board');
            throw error;
        }

        // Refetch boards to update stats
        const { data } = await supabase
            .from('kanban_boards')
            .select(`
                *,
                kanban_columns (
                    id,
                    kanban_cards (count)
                )
            `)
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (data) {
            const boardsWithStats = data.map(board => ({
                ...board,
                column_count: board.kanban_columns.length,
                card_count: board.kanban_columns.reduce((sum, col) => sum + (col.kanban_cards?.[0]?.count || 0), 0)
            }));
            setBoards(boardsWithStats);
        }
    };

    const createColumn = async (boardId, title) => {
        const { data, error } = await supabase
            .from('kanban_columns')
            .insert([{ board_id: boardId, title, position: columns.length }])
            .select()
            .single();

        if (error) {
            toast.error('Failed to create column');
            throw error;
        }

        // Don't manually update state - let the subscription handle it to avoid duplicates
        return data;
    };

    const updateColumn = async (columnId, updates) => {
        const { error } = await supabase
            .from('kanban_columns')
            .update(updates)
            .eq('id', columnId);

        if (error) {
            toast.error('Failed to update column');
            throw error;
        }
    };

    const deleteColumn = async (columnId) => {
        const { error } = await supabase
            .from('kanban_columns')
            .delete()
            .eq('id', columnId);

        if (error) {
            toast.error('Failed to delete column');
            throw error;
        }
    };

    const createCard = async (columnId, title) => {
        // Get current max position
        const columnCards = cards.filter(c => c.column_id === columnId);
        const maxPos = columnCards.length > 0 ? Math.max(...columnCards.map(c => c.position)) : -1;

        const { data, error } = await supabase
            .from('kanban_cards')
            .insert([{ column_id: columnId, title, position: maxPos + 1 }])
            .select(`
                *,
                tags:kanban_card_tags(tag_id),
                entities:kanban_card_entities(entity_id)
            `)
            .single();

        if (error) {
            toast.error('Failed to create card');
            throw error;
        }

        // Don't manually update state - let the subscription handle it to avoid duplicates
        return data;
    };

    const updateCard = async (cardId, updates) => {
        // Optimistic update
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c));

        const { error } = await supabase
            .from('kanban_cards')
            .update(updates)
            .eq('id', cardId);

        if (error) {
            toast.error('Failed to update card');
            // Revert on error (simplified, ideally we'd have previous state)
            throw error;
        }
    };

    const deleteCard = async (cardId) => {
        // Optimistic update
        setCards(prev => prev.filter(c => c.id !== cardId));

        const { error } = await supabase
            .from('kanban_cards')
            .delete()
            .eq('id', cardId);

        if (error) {
            toast.error('Failed to delete card');
            throw error;
        }
    };

    const moveCard = async (cardId, sourceColumnId, destColumnId, newIndex) => {
        const cardToMove = cards.find(c => c.id === cardId);
        if (!cardToMove) return;

        // Optimistic update
        const newCards = [...cards];

        // Remove from source
        const sourceCards = newCards.filter(c => c.column_id === sourceColumnId).sort((a, b) => a.position - b.position);
        const cardIndex = sourceCards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return; // Should not happen

        // If moving within same column
        if (sourceColumnId === destColumnId) {
            // Remove
            sourceCards.splice(cardIndex, 1);
            // Insert
            sourceCards.splice(newIndex, 0, { ...cardToMove, position: newIndex });

            // Re-calculate positions for all in column
            const updates = sourceCards.map((c, i) => ({ ...c, position: i }));

            // Update state
            setCards(prev => {
                const others = prev.filter(c => c.column_id !== sourceColumnId);
                return [...others, ...updates];
            });

            // Send updates to DB
            // We update all affected cards to ensure consistency
            for (const card of updates) {
                if (card.position !== cards.find(c => c.id === card.id)?.position) {
                    await supabase.from('kanban_cards').update({ position: card.position }).eq('id', card.id);
                }
            }
        } else {
            // Moving to different column
            const destCards = newCards.filter(c => c.column_id === destColumnId).sort((a, b) => a.position - b.position);

            // Update card
            const updatedCard = { ...cardToMove, column_id: destColumnId, position: newIndex };

            // Insert into dest
            destCards.splice(newIndex, 0, updatedCard);

            // Re-calculate positions for dest
            const destUpdates = destCards.map((c, i) => ({ ...c, position: i }));

            // Update state
            setCards(prev => {
                const others = prev.filter(c => c.column_id !== sourceColumnId && c.column_id !== destColumnId);
                const sourceOthers = prev.filter(c => c.column_id === sourceColumnId && c.id !== cardId); // Remove from source
                return [...others, ...sourceOthers, ...destUpdates];
            });

            // Send update for the moved card first
            await supabase.from('kanban_cards').update({ column_id: destColumnId, position: newIndex }).eq('id', cardId);

            // Then update positions of others in dest if needed
            for (const card of destUpdates) {
                if (card.id !== cardId) { // Skip the one we just updated
                    await supabase.from('kanban_cards').update({ position: card.position }).eq('id', card.id);
                }
            }
        }
    };

    const reorderColumns = async (newColumnOrder) => {
        // Optimistically update
        setColumns(newColumnOrder);

        // Update positions in database
        for (let i = 0; i < newColumnOrder.length; i++) {
            if (newColumnOrder[i].position !== i) {
                await supabase
                    .from('kanban_columns')
                    .update({ position: i })
                    .eq('id', newColumnOrder[i].id);
            }
        }
    };

    return {
        boards,
        activeBoard,
        setActiveBoard,
        columns,
        cards,
        loading,
        createBoard,
        updateBoard,
        deleteBoard,
        createColumn,
        updateColumn,
        deleteColumn,
        reorderColumns,
        createCard,
        updateCard,
        deleteCard,
        moveCard
    };
}
