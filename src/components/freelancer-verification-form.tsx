
'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { FileUp, CheckCircle2, AlertTriangle, File as FileIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';
import { ImageCropper } from './image-cropper';
import { fileToDataUrl } from '@/lib/utils';

interface FreelancerVerificationFormProps {
  user: User;
}

export function FreelancerVerificationForm({ user }: FreelancerVerificationFormProps) {
  const { submitVerification } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [idDoc, setIdDoc] = React.useState<File | null>(null);
  const [idDocUrl, setIdDocUrl] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        fileToDataUrl(file).then(dataUrl => setImageToCrop(dataUrl));
      } else if (file.type === 'application/pdf') {
        fileToDataUrl(file).then(dataUrl => {
            setIdDoc(file);
            setIdDocUrl(dataUrl);
        });
      } else {
        toast({ title: 'Unsupported File Type', description: 'Please upload a PNG, JPG, or PDF file.', variant: 'destructive'});
      }
    }
    // Reset input value to allow re-uploading the same file
    if(e.target) e.target.value = '';
  };
  
  const handleCropComplete = (croppedImage: File) => {
    fileToDataUrl(croppedImage).then(dataUrl => {
        setIdDoc(croppedImage);
        setIdDocUrl(dataUrl);
        setImageToCrop(null);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idDocUrl) {
      toast({
        title: t.missingDocuments,
        description: t.missingDocumentsDescFreelancer,
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        const success = await submitVerification(user.id, { type: 'personalId', url: idDocUrl });

        if (success) {
            toast({
                title: t.verificationSubmitted,
                description: t.verificationSubmittedDesc,
            });
            router.push('/verify');
        } else {
            throw new Error("Verification submission failed");
        }
    } catch(error) {
        toast({
            title: t.submissionFailed,
            description: (error as Error).message || t.submissionFailedDesc,
            variant: 'destructive',
        });
        setIsSubmitting(false);
    }
  };

  return (
    <>
    <Card className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{t.freelancerVerificationTitle}</CardTitle>
          <CardDescription>{t.freelancerVerificationDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="space-y-2">
                <h3 className="font-medium">{t.idUploadTitle}</h3>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                    {idDocUrl && idDoc?.type.startsWith('image/') ? (
                    <div className="relative h-24 w-24 flex-shrink-0">
                        <Image src={idDocUrl} alt="ID Preview" layout="fill" objectFit="cover" className="rounded-md" />
                    </div>
                    ) : (
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    )}
                    <div className="flex-grow">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                        {t.uploadFile}
                    </Button>
                    {idDoc ? (
                         <div className="mt-2 flex items-center text-sm text-success gap-2">
                            {idDoc.type.startsWith('image/') ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <FileIcon className="mr-2 h-4 w-4 text-muted-foreground" />}
                            <span className="truncate max-w-[200px]">{idDoc.name}</span>
                        </div>
                    ) : (
                        <p className="mt-2 text-xs text-muted-foreground">{t.uploadFileDesc}</p>
                    )}
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, application/pdf"
                    onChange={handleFileChange}
                />
            </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href="/">{t.backToHome}</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !idDocUrl}>
            {isSubmitting ? t.submitting : t.submitForVerification}
          </Button>
        </CardFooter>
      </form>
    </Card>
     <ImageCropper 
      image={imageToCrop}
      onClose={() => setImageToCrop(null)}
      onCropComplete={handleCropComplete}
      aspect={4/3}
    />
    </>
  );
}
