'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/hooks/use-language';

export function NotificationHandler() {
    const { user } = useAuth();
    const { users } = useUsers();
    const { toast } = useToast();
    const { t } = useLanguage();
    
    // Use a ref to track if it's the initial data load. This ref persists across re-renders.
    const isInitialLoad = React.useRef(true);
    
    // Use a ref to store the unsubscribe function. This avoids re-subscribing on every render.
    const unsubscribeRef = React.useRef<(() => void) | null>(null);

    React.useEffect(() => {
        // If the user logs out or there's no DB, clean up and do nothing.
        if (!user || user.role === 'admin' || !db) {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            return;
        }

        // Only set up the listener once per user login
        if (unsubscribeRef.current) {
            return;
        }
        
        isInitialLoad.current = true;

        const q = query(
            collection(db, 'directMessages'),
            where('participantIds', 'array-contains', user.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // The first snapshot contains all existing data. We use docChanges() to process it,
            // but we use the isInitialLoad flag to ignore this first batch for notifications.
            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                // We only care about new messages being added AFTER the initial load.
                if (change.type === 'added') {
                    const message = change.doc.data();
                    
                    // Find sender details
                    const sender = users.find(u => u.id === message.senderId);

                    // If the message is from an admin and not from the current user
                    if (sender && sender.role === 'admin' && message.senderId !== user.id) {
                         toast({
                            title: t.newMessageFromAdminTitle,
                            description: `${sender.name}: ${message.text}`,
                         });
                    }
                }
            });
        });
        
        unsubscribeRef.current = unsubscribe;

        // Cleanup on unmount or if the user logs out (the initial check in the effect handles this)
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };

    // We depend on user to reset the subscription only when the user actually changes.
    // We also depend on users, toast, and t because they are used inside the effect.
    }, [user, users, toast, t]);

    return null; // This component renders nothing
}
