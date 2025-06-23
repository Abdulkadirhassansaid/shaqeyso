'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera } from 'lucide-react';

interface ClientProfilePageProps {
  user: User;
}

export function ClientProfilePage({ user }: ClientProfilePageProps) {
  const { updateUserProfile, clientProfiles } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  
  const clientProfile = clientProfiles.find(p => p.userId === user.id);

  const [companyName, setCompanyName] = React.useState(user.name);
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const userData = { 
      name: companyName,
      ...(avatar && { avatarUrl: avatar })
    };
    
    const success = await updateUserProfile(user.id, userData);

    if (success) {
      toast({
        title: t.profileUpdated,
        description: t.profileUpdatedDesc,
      });
      router.back();
    } else {
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t.companyProfile}</CardTitle>
        <CardDescription>{t.companyProfileDesc}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatar || user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={isSaving}>
                <Camera className="mr-2 h-4 w-4" />
                {t.uploadLogo}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">{t.uploadLogoDesc}</p>
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
            <Label htmlFor="companyName">{t.companyName}</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.emailLabel}</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t.saving : t.saveChanges}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
