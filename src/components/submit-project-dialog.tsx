
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/use-language';
import type { Job } from '@/lib/types';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';

interface SubmitProjectDialogProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobId: string, files: File[]) => void;
}

export function SubmitProjectDialog({ job, isOpen, onClose, onSubmit }: SubmitProjectDialogProps) {
  const { t } = useLanguage();
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };
  
  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(event.dataTransfer.files)]);
    }
  };

  const handleSubmit = () => {
    onSubmit(job.id, files);
  };

  // Reset files when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setFiles([]);
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.submitProject}: {job.title}</AlertDialogTitle>
          <AlertDialogDescription>{t.submitFiles}</AlertDialogDescription>
        </AlertDialogHeader>
        
        <div 
            className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <UploadCloud className="w-10 h-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">{t.dragAndDrop}</p>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
            />
        </div>

        {files.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map(file => (
              <div key={file.name} className="flex items-center justify-between p-2 text-sm border rounded-md">
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.name)}>
                    <X className="h-4 w-4"/>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground">{t.noFilesSelected}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={files.length === 0}>{t.submitForApproval}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
