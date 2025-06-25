'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { FileUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';

interface ClientVerificationFormProps {
  user: User;
}

export function ClientVerificationForm({ user }: ClientVerificationFormProps) {
  const { submitVerification } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const idInputRef = React.useRef<HTMLInputElement>(null);
  const certInputRef = React.useRef<HTMLInputElement>(null);

  const [idDoc, setIdDoc] = React.useState<File | null>(null);
  const [idDocPreview, setIdDocPreview] = React.useState<string | null>(null);
  const [certDoc, setCertDoc] = React.useState<File | null>(null);
  const [certDocPreview, setCertDocPreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idDoc || !certDoc) {
      toast({
        title: t.missingDocuments,
        description: t.missingDocumentsDescClient,
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        const idDocUrl = await fileToDataUrl(idDoc);
        const certDocUrl = await fileToDataUrl(certDoc);
        
        const success = await submitVerification(user.id, {
            passportOrIdUrl: idDocUrl,
            businessCertificateUrl: certDocUrl
        });

        if (success) {
            toast({
                title: t.verificationSubmitted,
                description: t.verificationSubmittedDesc,
            });
            router.push('/verify'); // Go to pending page
        } else {
            throw new Error("Verification submission failed");
        }
    } catch(error) {
        toast({
            title: t.submissionFailed,
            description: t.submissionFailedDesc,
            variant: 'destructive',
        });
        setIsSubmitting(false);
    }
  };

  const UploadBox = ({ title, onButtonClick, preview, file }: { title: string; onButtonClick: () => void; preview: string | null; file: File | null }) => (
    <div className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      <div className="flex items-center gap-4 rounded-lg border p-4">
        {preview ? (
          <div className="relative h-24 w-24 flex-shrink-0">
            <Image src={preview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" />
          </div>
        ) : (
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md bg-muted">
            <FileUp className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-grow">
          <Button type="button" variant="outline" onClick={onButtonClick} disabled={isSubmitting}>
            {t.uploadFile}
          </Button>
          {file ? (
            <div className="mt-2 flex items-center text-sm text-success">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span>{file.name}</span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">{t.uploadFileDesc}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{t.clientVerificationTitle}</CardTitle>
          <CardDescription>{t.clientVerificationDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {user.verificationStatus === 'rejected' && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t.verificationRejectedTitle}</AlertTitle>
                <AlertDescription>
                    <p>{t.verificationRejectedDesc}</p>
                    <p className="font-semibold mt-2">{user.verificationRejectionReason}</p>
                </AlertDescription>
            </Alert>
          )}
          <UploadBox 
            title={t.idUploadTitle} 
            onButtonClick={() => idInputRef.current?.click()}
            preview={idDocPreview}
            file={idDoc}
          />
           <input
            type="file"
            ref={idInputRef}
            className="hidden"
            accept="image/png, image/jpeg, application/pdf"
            onChange={(e) => handleFileChange(e, setIdDoc, setIdDocPreview)}
          />

          <UploadBox
            title={t.certUploadTitle}
            onButtonClick={() => certInputRef.current?.click()}
            preview={certDocPreview}
            file={certDoc}
          />
          <input
            type="file"
            ref={certInputRef}
            className="hidden"
            accept="image/png, image/jpeg, application/pdf"
            onChange={(e) => handleFileChange(e, setCertDoc, setCertDocPreview)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href="/">{t.backToHome}</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !idDoc || !certDoc}>
            {isSubmitting ? t.submitting : t.submitForVerification}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
