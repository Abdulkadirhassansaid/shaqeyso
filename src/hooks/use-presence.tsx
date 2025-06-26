'use client';

import * as React from 'react';
import { useAuth } from './use-auth';

const PRESENCE_KEY_PREFIX = 'user-presence-';
const PRESENCE_INTERVAL = 10000; // Report presence every 10 seconds
const ONLINE_THRESHOLD = 15000; // Consider offline after 15 seconds

interface PresenceContextType {
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = React.createContext<PresenceContextType | null>(null);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // This state is just to force re-renders in components that use the hook
  const [tick, setTick] = React.useState(0); 

  React.useEffect(() => {
    let presenceInterval: NodeJS.Timeout | null = null;
    let tickInterval: NodeJS.Timeout | null = null;

    if (user) {
      const reportPresence = () => {
        try {
          localStorage.setItem(`${PRESENCE_KEY_PREFIX}${user.id}`, new Date().toISOString());
        } catch (error) {
          console.error("Could not write to localStorage for presence.", error);
        }
      };
      
      reportPresence();
      presenceInterval = setInterval(reportPresence, PRESENCE_INTERVAL);
      
      // This interval forces components using the hook to re-check online statuses
      tickInterval = setInterval(() => setTick(t => t + 1), 5000); 

    }

    return () => {
      if (presenceInterval) clearInterval(presenceInterval);
      if (tickInterval) clearInterval(tickInterval);
      if (user) {
        // Optional: remove presence on logout/cleanup
        // localStorage.removeItem(`${PRESENCE_KEY_PREFIX}${user.id}`);
      }
    };
  }, [user]);

  const isUserOnline = React.useCallback((userId: string): boolean => {
    try {
        const lastSeen = localStorage.getItem(`${PRESENCE_KEY_PREFIX}${userId}`);
        if (!lastSeen) return false;

        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        
        return (now.getTime() - lastSeenDate.getTime()) < ONLINE_THRESHOLD;
    } catch (error) {
        return false;
    }
  }, []);

  const value = React.useMemo(() => ({ isUserOnline }), [isUserOnline, tick]);

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}

export const usePresence = () => {
  const context = React.useContext(PresenceContext);
  if (context === null) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
