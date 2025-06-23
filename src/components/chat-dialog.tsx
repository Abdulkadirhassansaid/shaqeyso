
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
import { useMessages } from '@/hooks/use-messages';
import type { Job } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from './../hooks/use-language';
import { Send } from 'lucide-react';

interface ChatDialogProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDialog({ job, isOpen, onClose }: ChatDialogProps) {
  const { user } = useAuth();
  const { messages, addMessage } = useMessages();
  const { users } = useAuth();
  const { t } = useLanguage();
  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const jobMessages = messages.filter((m) => m.jobId === job.id).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const otherUserId = user?.id === job.clientId ? job.hiredFreelancerId : job.clientId;
  const otherUser = users.find(u => u.id === otherUserId);
  const dialogTitle = otherUser ? `${t.chatWith} ${otherUser.name}` : 'Chat';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    addMessage({
      jobId: job.id,
      senderId: user.id,
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
  }, [jobMessages, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl grid-rows-[auto_1fr_auto] p-0 h-[70vh] max-h-[700px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {jobMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{t.noMessagesYet}</p>
                </div>
            ) : (
                jobMessages.map((message) => {
                    const isSender = message.senderId === user?.id;
                    const senderDetails = users.find(u => u.id === message.senderId);
                    return (
                    <div
                        key={message.id}
                        className={cn(
                        'flex items-end gap-2',
                        isSender ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {!isSender && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={senderDetails?.avatarUrl} />
                                <AvatarFallback>{senderDetails?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div
                        className={cn(
                            'max-w-xs md:max-w-md rounded-lg px-3 py-2',
                            isSender
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                        >
                        <p className="text-sm">{message.text}</p>
                        <p className={cn("text-xs mt-1", isSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </p>
                        </div>
                         {isSender && (
                            <Avatar className="h-8 w-8">
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
