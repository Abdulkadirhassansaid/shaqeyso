
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
import type { User, DirectMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from './../hooks/use-language';
import { Send } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import { collection, onSnapshot, addDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DirectChatDialogProps {
  otherUser: User;
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export function DirectChatDialog({ otherUser, isOpen, onClose, initialMessage }: DirectChatDialogProps) {
  const { user: currentUser, markDirectMessagesAsRead } = useAuth();
  const { users } = useUsers();
  const { t } = useLanguage();
  const [directMessages, setDirectMessages] = React.useState<DirectMessage[]>([]);

  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && initialMessage) {
        setNewMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  React.useEffect(() => {
    if (isOpen && currentUser) {
        markDirectMessagesAsRead(otherUser.id);
    }
  }, [isOpen, currentUser, otherUser.id, markDirectMessagesAsRead]);

  React.useEffect(() => {
    if (!currentUser?.id || !otherUser.id || !db) {
        setDirectMessages([]);
        return;
    };

    const sortedIds = [currentUser.id, otherUser.id].sort();

    const q = query(
        collection(db, 'directMessages'), 
        where('participantIds', '==', sortedIds)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
      } as DirectMessage));
      
      messagesData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      setDirectMessages(messagesData);
    }, (error) => {
        console.error("Error fetching direct messages:", error);
    });

    return () => unsubscribe();
  }, [currentUser?.id, otherUser.id]);


  const addDirectMessage = React.useCallback(async (messageData: Omit<DirectMessage, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!messageData.text?.trim() || !db) {
        return false;
    }
    try {
        await addDoc(collection(db, 'directMessages'), {
            ...messageData,
            timestamp: serverTimestamp(),
        });
        return true;
    } catch(error) {
        console.error("Error adding direct message:", error);
        return false;
    }
  }, []);

  if (!currentUser) return null;

  const conversationMessages = directMessages;

  const dialogTitle = `${t.chatWith} ${otherUser.name}`;
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    
    addDirectMessage({
      participantIds: [currentUser.id, otherUser.id].sort(),
      senderId: currentUser.id,
      text: newMessage,
    });
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
                conversationMessages.map((message) => {
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
                        key={message.id}
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
