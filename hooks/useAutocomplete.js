import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Mock function to simulate AI completion
 */
const mockFetchCompletion = async (context) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock simple continuation based on last few words
            const endings = [
                "is a critical component of the system architecture.",
                "requires further analysis to ensure scalability.",
                "should be optimized for better performance.",
                "demonstrates the effectiveness of this approach.",
                "needs to be refactored for better readability."
            ];
            const randomEnding = endings[Math.floor(Math.random() * endings.length)];
            resolve(randomEnding);
        }, 800);
    });
};

export function useAutocomplete(editor) {
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const typingTimerRef = useRef(null);
    const [enabled, setEnabled] = useState(false);
    const [delay, setDelay] = useState(5000);

    // Load settings
    useEffect(() => {
        const loadSettings = () => {
            const savedEnabled = localStorage.getItem('autoCompleteEnabled') === 'true';
            const savedDelay = Number(localStorage.getItem('autoCompleteDelay')) || 5000;
            setEnabled(savedEnabled);
            setDelay(savedDelay);
        };

        loadSettings();
        // Listen for storage events (optional, but good for persistence sync if needed)
        window.addEventListener('storage', loadSettings);
        return () => window.removeEventListener('storage', loadSettings);
    }, []);

    const clearSuggestion = useCallback(() => {
        setSuggestion(null);
    }, []);

    const triggerCompletion = useCallback(async () => {
        if (!editor || !enabled) return;

        // Don't autocomplete if empty
        const text = editor.getText();
        if (text.length < 10) return;

        setLoading(true);
        try {
            // Get last 100 tokens approx (last 500 chars)
            const context = text.slice(-500);
            const completion = await mockFetchCompletion(context);
            setSuggestion(completion);
        } catch (err) {
            console.error("Autocomplete error:", err);
        } finally {
            setLoading(false);
        }
    }, [editor, enabled]);

    // Handle typing activity
    useEffect(() => {
        if (!editor || !enabled) return;

        const handleUpdate = () => {
            clearSuggestion();
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
            }

            typingTimerRef.current = setTimeout(() => {
                // Only trigger if cursor is at the end or we have a valid context
                const { selection } = editor.state;
                if (selection.empty) {
                    triggerCompletion();
                }
            }, delay);
        };

        editor.on('update', handleUpdate);
        editor.on('selectionUpdate', clearSuggestion); // Clear on moving cursor

        return () => {
            editor.off('update', handleUpdate);
            editor.off('selectionUpdate', clearSuggestion);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
    }, [editor, enabled, delay, triggerCompletion, clearSuggestion]);

    const acceptSuggestion = useCallback(() => {
        if (suggestion && editor) {
            editor.commands.insertContent(suggestion);
            setSuggestion(null);
        }
    }, [editor, suggestion]);

    return {
        suggestion,
        loading,
        acceptSuggestion,
        clearSuggestion
    };
}
