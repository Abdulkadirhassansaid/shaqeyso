
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
}

export function DirectChatDialog({ otherUser, isOpen, onClose }: DirectChatDialogProps) {
  const { user: currentUser } = useAuth();
  const { users } = useUsers();
  const { t } = useLanguage();
  const [directMessages, setDirectMessages] = React.useState<DirectMessage[]>([]);

  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!currentUser?.id || !otherUser.id || !db) {
        setDirectMessages([]);
        return;
    };

    const q = query(
        collection(db, 'directMessages'), 
        where('participantIds', 'array-contains', currentUser.id),
        orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
      } as DirectMessage));
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

  const conversationMessages = directMessages.filter((m) => {
    return m.participantIds.includes(otherUser.id);
  });

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
                      : 'bg-muted';
                    
                    return (
                    <div
                        key={message.id}
                        className={cn(
                        'flex items-start gap-3',
                        isSender ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {!isSender && (
                            <Avatar className="h-8 w-8 self-start">
                                <AvatarImage src={senderDetails?.avatarUrl} />
                                <AvatarFallback>{senderDetails?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                          "flex flex-col gap-1",
                          isSender ? 'items-end' : 'items-start'
                        )}>
                            <p className="text-sm font-semibold">{senderDetails?.name}</p>
                            <div
                              className={cn(
                                  'max-w-xs md:max-w-md rounded-lg px-3 py-2 text-sm',
                                  messageBgClass
                              )}
                            >
                                <p className="leading-relaxed">{message.text}</p>
                                <p className={cn("text-xs mt-1 text-right", isSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                         {isSender && (
                            <Avatar className="h-8 w-8 self-start">
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
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
                <span className="sr-only">{t.sendMessage}</span>
                </Button>
            </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
