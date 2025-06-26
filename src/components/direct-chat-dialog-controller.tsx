
'use client';

import * as React from 'react';
import { useChat } from '@/hooks/use-chat';
import { DirectChatDialog } from './direct-chat-dialog';

export function DirectChatDialogController() {
  const { chattingWith, closeChat } = useChat();
  
  if (!chattingWith) {
    return null;
  }

  return (
    <DirectChatDialog
      otherUser={chattingWith}
      isOpen={!!chattingWith}
      onClose={closeChat}
    />
  );
}
