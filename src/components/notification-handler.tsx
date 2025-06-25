
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
    const isInitialLoad = React.useRef(true);

    React.useEffect(() => {
        // Reset initial load flag if user logs out/changes
        isInitialLoad.current = true;
    }, [user]);

    React.useEffect(() => {
        // Only run for logged-in, non-admin users
        if (!user || user.role === 'admin' || !db) {
            return;
        }

        const q = query(
            collection(db, 'directMessages'),
            where('participantIds', 'array-contains', user.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // On the very first snapshot, we do nothing to avoid notifying about old messages.
            if (isInitialLoad.current) {
                isInitialLoad.current = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                // We only care about new messages being added
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

        // Cleanup on unmount or if the user changes
        return () => {
            unsubscribe();
        };

    }, [user, users, toast, t]);

    return null; // This component renders nothing
}
