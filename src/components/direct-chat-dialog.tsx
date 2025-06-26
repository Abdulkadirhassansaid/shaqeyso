
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import type { User, LiveChat, LiveChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from './../hooks/use-language';
import { Send } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DirectChatDialogProps {
  otherUser: User;
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

const MESSAGE_LIMIT = 20;

export function DirectChatDialog({ otherUser, isOpen, onClose, initialMessage }: DirectChatDialogProps) {
  const { user: currentUser, sendDirectMessage, markAdminChatAsRead } = useAuth();
  const { users } = useUsers();
  const { t } = useLanguage();
  const [liveChat, setLiveChat] = React.useState<LiveChat | null>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && initialMessage) {
        setNewMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const chatId = React.useMemo(() => {
    if (!currentUser) return null;
    return currentUser.role === 'admin' ? otherUser.id : currentUser.id;
  }, [currentUser, otherUser]);

  React.useEffect(() => {
    if (isOpen && chatId) {
        markAdminChatAsRead(chatId);
    }
  }, [isOpen, chatId, markAdminChatAsRead]);

  React.useEffect(() => {
    if (!chatId || !db) {
        setLiveChat(null);
        return;
    };

    const chatDocRef = doc(db, 'liveChats', chatId);
    
    const unsubscribe = onSnapshot(chatDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const chatData = {
          id: snapshot.id,
          messages: data.messages || [],
          ...data,
        } as LiveChat;
        // Ensure messages are sorted client-side as a fallback
        chatData.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setLiveChat(chatData);
      } else {
        setLiveChat(null);
      }
    }, (error) => {
        console.error("Error fetching live chat:", error);
    });

    return () => unsubscribe();
  }, [chatId]);


  if (!currentUser) return null;

  const conversationMessages: LiveChatMessage[] = liveChat?.messages || [];

  const dialogTitle = `${t.chatWith} ${otherUser.name}`;
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId) return;
    
    sendDirectMessage(chatId, newMessage);
    setNewMessage('');
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [conversationMessages, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl grid-rows-[auto_1fr_auto] p-0 h-[80vh] max-h-[700px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-6">
            {conversationMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{t.noMessagesYet}</p>
                </div>
            ) : (
                conversationMessages.map((message, index) => {
                    const senderDetails = users.find(u => u.id === message.senderId);
                    const isSender = message.senderId === currentUser?.id;
                    
                    const messageBgClass = isSender
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card';
                    
                    const bubbleShape = isSender
                      ? 'rounded-t-2xl rounded-bl-2xl'
                      : 'rounded-t-2xl rounded-br-2xl';

                    return (
                    <div
                        key={`${message.timestamp}-${index}`}
                        className={cn(
                        'flex items-start gap-3',
                        isSender ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {!isSender && (
                            <Avatar className="h-10 w-10 self-start border-2 border-background">
                                <AvatarImage src={senderDetails?.avatarUrl} />
                                <AvatarFallback>{senderDetails?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                          "flex flex-col gap-1 w-fit max-w-md",
                          isSender ? 'items-end' : 'items-start'
                        )}>
                            <p className="text-sm font-semibold px-1">{senderDetails?.name}</p>
                            <div
                              className={cn(
                                  'px-4 py-3 shadow-md',
                                  messageBgClass,
                                  bubbleShape
                              )}
                            >
                                <p className="leading-relaxed text-base">{message.text}</p>
                            </div>
                             <p className={cn("text-xs mt-1 px-1", isSender ? 'text-right' : 'text-left', 'text-muted-foreground')}>
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                         {isSender && (
                            <Avatar className="h-10 w-10 self-start border-2 border-background">
                                <AvatarImage src={senderDetails?.avatarUrl} />
                                <AvatarFallback>{senderDetails?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                    );
                })
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t.typeYourMessage}
                autoComplete="off"
                className="h-12 text-base"
                />
                <Button type="submit" size="icon" className="h-12 w-12" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
                <span className="sr-only">{t.sendMessage}</span>
                </Button>
            </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
