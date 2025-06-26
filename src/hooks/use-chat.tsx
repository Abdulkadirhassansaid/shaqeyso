
'use client';

import * as React from 'react';
import type { User } from '@/lib/types';

interface ChatContextType {
  isChatOpen: boolean;
  chattingWith: User | null;
  openChat: (user: User) => void;
  closeChat: () => void;
}

const ChatContext = React.createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chattingWith, setChattingWith] = React.useState<User | null>(null);

  const openChat = (user: User) => setChattingWith(user);
  const closeChat = () => setChattingWith(null);

  const value = React.useMemo(() => ({
    isChatOpen: !!chattingWith,
    chattingWith,
    openChat,
    closeChat,
  }), [chattingWith]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = React.useContext(ChatContext);
  if (context === null) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
