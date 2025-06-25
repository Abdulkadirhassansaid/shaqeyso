
'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, ArrowLeft, Link } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageCropper } from './image-cropper';
import { fileToDataUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


interface AdminProfilePageProps {
  user: User;
}

export function AdminProfilePage({ user }: AdminProfilePageProps) {
  const { updateUserProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [name, setName] = React.useState(user.name);
  const [avatarPreview, setAvatarPreview] = React.useState<string>(user.avatarUrl);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const [isUrlDialogOpen, setIsUrlDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');

  React.useEffect(() => {
    const localAvatar = localStorage.getItem(`mock_avatar_${user.id}`);
    setAvatarPreview(localAvatar || user.avatarUrl);
  }, [user.id, user.avatarUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const userData: Partial<User> = {
        name: name,
      };
      
      if (avatarPreview !== user.avatarUrl) {
        if (avatarPreview.startsWith('http')) {
          userData.avatarUrl = avatarPreview;
          localStorage.removeItem(`mock_avatar_${user.id}`);
        } else if (avatarPreview.startsWith('data:image')) {
             // This is a mock upload, do not save to DB
            console.log("Mock avatar detected. Not saving to database.");
        }
      }

      const success = await updateUserProfile(user.id, userData);

      if (success) {
        toast({
          title: t.profileUpdated,
          description: t.adminProfileUpdatedDesc,
        });
      } else {
        throw new Error('Profile update failed');
      }
    } catch (error) {
      console.error('Error saving admin profile:', error);
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCropComplete = async (croppedImage: File) => {
    try {
        const dataUrl = await fileToDataUrl(croppedImage);
        localStorage.setItem(`mock_avatar_${user.id}`, dataUrl);
        setAvatarPreview(dataUrl);
        setImageToCrop(null);
    } catch (error) {
        toast({ title: "Error", description: "Could not process image." });
    }
  };
  
  const handleSetAvatarFromUrl = () => {
    if (!imageUrl || !user) return;
    setAvatarPreview(imageUrl);
    localStorage.removeItem(`mock_avatar_${user.id}`);
    setIsUrlDialogOpen(false);
    setImageUrl('');
  };


  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
          <div>
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
              </Button>
          </div>
        <Card>
          <CardHeader>
            <CardTitle>{t.adminProfileTitle}</CardTitle>
            <CardDescription>{t.adminProfileDesc}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={isSaving}>
                    <Camera className="mr-2 h-4 w-4" />
                    {t.uploadPhoto}
                  </Button>
                   <Button type="button" variant="outline" onClick={() => setIsUrlDialogOpen(true)} disabled={isSaving}>
                    <Link className="mr-2 h-4 w-4" />
                    {t.useUrl}
                  </Button>
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t.fullNameLabel}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input id="email" value={user.email} disabled />
              </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? t.saving : t.saveChanges}
                </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
       <ImageCropper
        image={imageToCrop}
        onClose={() => setImageToCrop(null)}
        onCropComplete={handleCropComplete}
       />
       <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.setImageFromUrl}</DialogTitle>
                <DialogDescription>{t.setImageFromUrlDesc}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="image-url">{t.imageUrl}</Label>
                    <Input
                        id="image-url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsUrlDialogOpen(false)}>{t.cancel}</Button>
                <Button type="button" onClick={handleSetAvatarFromUrl} disabled={!imageUrl}>
                    {t.setAvatar}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
