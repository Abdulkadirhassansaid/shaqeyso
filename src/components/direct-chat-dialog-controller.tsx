
'use client';

import * as React from 'react';
import { useChat } from '@/hooks/use-chat';
import { useUsers } from '@/hooks/use-users';
import { DirectChatDialog } from './direct-chat-dialog';

export function DirectChatDialogController() {
  const { isChatOpen, closeChat } = useChat();
  const { users } = useUsers();
  
  const adminUser = users.find(u => u.role === 'admin');

  if (!adminUser) {
    return null;
  }

  return (
    <DirectChatDialog
      otherUser={adminUser}
      isOpen={isChatOpen}
      onClose={closeChat}
    />
  );
}
