
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
import type { User, LiveChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from './../hooks/use-language';
import { Send } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import { LoadingDots } from './loading-dots';

interface DirectChatDialogProps {
  otherUser: User;
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export function DirectChatDialog({ otherUser, isOpen, onClose, initialMessage }: DirectChatDialogProps) {
  const { user: currentUser } = useAuth();
  const { users } = useUsers();
  const { t } = useLanguage();
  
  const [messages, setMessages] = React.useState<LiveChatMessage[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = React.useState(false);

  // Derive a consistent key for localStorage based on participant IDs
  const chatKey = React.useMemo(() => {
    if (!currentUser || !otherUser) return null;
    return `mock-chat-${[currentUser.id, otherUser.id].sort().join('-')}`;
  }, [currentUser, otherUser]);

  // Load messages and listen for real-time changes from other tabs
  React.useEffect(() => {
    if (!chatKey || !isOpen) return;

    const syncMessages = () => {
      try {
        const storedMessages = localStorage.getItem(chatKey);
        setMessages(storedMessages ? JSON.parse(storedMessages) : []);
      } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        setMessages([]);
      }
    };
    
    // Initial sync when chat opens
    syncMessages();
    setNewMessage(initialMessage || '');

    // Listen for changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === chatKey) {
        syncMessages();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [chatKey, isOpen, initialMessage]);

  // Save messages to localStorage whenever they change
  React.useEffect(() => {
    // We only save if the chat dialog is open to prevent background writes.
    if (chatKey && isOpen) {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, chatKey, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const userMessage: LiveChatMessage = {
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    const shouldReply = !messages.length || messages[messages.length - 1].senderId === currentUser.id;

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    
    if (shouldReply) {
        setIsTyping(true);
        // Simulate a response from the other user
        setTimeout(() => {
          const cannedResponse: LiveChatMessage = {
            senderId: otherUser.id,
            text: currentUser.role === 'admin'
              ? `Hi ${otherUser.name}, I have received your message and will look into it.`
              : `Hi ${currentUser.name}, thanks for reaching out to support! An admin is reviewing your message.`,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, cannedResponse]);
          setIsTyping(false);
        }, 1500);
    }
  };
  
  // Scroll to the bottom of the chat when new messages are added.
  React.useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isTyping]);
  
  if (!currentUser) return null;

  const dialogTitle = `${t.chatWith} ${otherUser.name}`;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl grid-rows-[auto_1fr_auto] p-0 h-[80vh] max-h-[700px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-6">
            {messages.length === 0 && !isTyping ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{t.noMessagesYet}</p>
                </div>
            ) : (
                messages.map((message, index) => {
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
            {isTyping && (
                <div className="flex items-center gap-3 justify-start">
                    <Avatar className="h-10 w-10 self-start border-2 border-background">
                        <AvatarImage src={otherUser.avatarUrl} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 w-fit max-w-md items-start">
                         <p className="text-sm font-semibold px-1">{otherUser.name}</p>
                         <div className="px-4 py-3 shadow-md rounded-t-2xl rounded-br-2xl bg-card">
                             <LoadingDots />
                         </div>
                    </div>
                </div>
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
