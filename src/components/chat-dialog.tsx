
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
import type { Job, SubmittedFile, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from './../hooks/use-language';
import { Send, Paperclip, FileText, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { useUsers } from '@/hooks/use-users';
import { collection, onSnapshot, addDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ChatDialogProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDialog({ job, isOpen, onClose }: ChatDialogProps) {
  const { user } = useAuth();
  const { users } = useUsers();
  const { t } = useLanguage();
  const [messages, setMessages] = React.useState<Message[]>([]);

  const [newMessage, setNewMessage] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!job.id || !db) return;

    const q = query(collection(db, 'messages'), where('jobId', '==', job.id), orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
      } as Message));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [job.id]);

  const addMessage = React.useCallback(async (messageData: Omit<Message, 'id' | 'timestamp'>): Promise<boolean> => {
    if ((!messageData.text?.trim() && (!messageData.files || messageData.files.length === 0)) || !db) {
        return false;
    }
    try {
        await addDoc(collection(db, 'messages'), {
            ...messageData,
            timestamp: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error adding message:", error);
        return false;
    }
  }, []);

  let dialogTitle: string;
  if (user?.role === 'admin') {
    const client = users.find(u => u.id === job.clientId);
    const freelancer = users.find(u => u.id === job.hiredFreelancerId);
    dialogTitle = `Chat: ${client?.name} & ${freelancer?.name}`;
  } else {
    const otherUserId = user?.id === job.clientId ? job.hiredFreelancerId : job.clientId;
    const otherUser = users.find(u => u.id === otherUserId);
    dialogTitle = otherUser ? `${t.chatWith} ${otherUser.name}` : 'Chat';
  }
  
  const canSendMessages = job.status === 'InProgress' || (user?.role === 'admin' && job.hiredFreelancerId);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && files.length === 0) || !user) return;

    const fileData: SubmittedFile[] = files.map(f => ({ 
        name: f.name, 
        url: URL.createObjectURL(f), // Create a temporary blob URL for local display
        type: f.type,
        size: f.size
    }));
    
    addMessage({
      jobId: job.id,
      senderId: user.id,
      text: newMessage,
      files: fileData.length > 0 ? fileData : undefined,
    });
    setNewMessage('');
    setFiles([]);
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl grid-rows-[auto_1fr_auto] p-0 h-[80vh] max-h-[700px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 bg-secondary/50" ref={scrollAreaRef}>
          <div className="p-4 space-y-6">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{t.noMessagesYet}</p>
                </div>
            ) : (
                messages.map((message) => {
                    const senderDetails = users.find(u => u.id === message.senderId);
                    const isSender = message.senderId === user?.id;
                    const isAdminMessage = senderDetails?.role === 'admin';
                    
                    const messageBgClass = isSender
                      ? 'bg-primary text-primary-foreground'
                      : isAdminMessage
                        ? 'bg-card border'
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
                            <div className="flex items-center gap-2 px-1">
                                <p className="text-sm font-semibold">{senderDetails?.name}</p>
                                {isAdminMessage && (
                                    <Badge variant="outline" className="h-5 text-xs">Admin</Badge>
                                )}
                            </div>
                            <div
                                className={cn(
                                    'px-4 py-3 shadow-md',
                                    messageBgClass,
                                    bubbleShape
                                )}
                            >
                                {message.text && <p className="leading-relaxed text-base">{message.text}</p>}
                                {message.files && message.files.length > 0 && (
                                    <div className={cn("space-y-2", message.text && "mt-2")}>
                                        {message.files.map((file, index) => (
                                            <a
                                                key={index}
                                                href={file.url}
                                                download={file.name}
                                                className={cn("flex items-center gap-3 p-2 rounded-md", isSender ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-secondary hover:bg-secondary/80")}
                                            >
                                                <FileText className="h-6 w-6 shrink-0" />
                                                <div className="overflow-hidden">
                                                    <p className="font-medium truncate">{file.name}</p>
                                                    <p className={cn("text-xs", isSender ? "text-primary-foreground/80" : "text-muted-foreground")}>{(file.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
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
        
        <DialogFooter className="p-4 border-t flex-col items-stretch gap-2">
            {canSendMessages ? (
                <>
                    <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                        <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t.typeYourMessage}
                        autoComplete="off"
                        className="h-12 text-base"
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-12 w-12" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="h-5 w-5" />
                            <span className="sr-only">{t.attachFile}</span>
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />
                        <Button type="submit" variant="accent" size="icon" className="h-12 w-12" disabled={!newMessage.trim() && files.length === 0}>
                        <Send className="h-5 w-5" />
                        <span className="sr-only">{t.sendMessage}</span>
                        </Button>
                    </form>
                    {files.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">{t.filesToSend}:</p>
                             <div className="flex flex-wrap gap-2">
                                {files.map(file => (
                                    <Badge key={file.name} variant="secondary" className="pl-2 pr-1 gap-1">
                                        {file.name}
                                        <button onClick={() => removeFile(file.name)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                 </>
            ) : (
                <div className="text-center text-sm text-muted-foreground p-4 italic">
                    {t.chatArchived}
                </div>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
