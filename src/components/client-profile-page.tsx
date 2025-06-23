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

interface ClientProfilePageProps {
  user: User;
}

export function ClientProfilePage({ user }: ClientProfilePageProps) {
  const { updateUserProfile, clientProfiles } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const clientProfile = clientProfiles.find(p => p.userId === user.id);

  const [companyName, setCompanyName] = React.useState(user.name);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // In a real app, you'd also update the clientProfile details
    const success = await updateUserProfile(user.id, { name: companyName });

    if (success) {
      toast({
        title: 'Profile Updated',
        description: 'Your company information has been saved.',
      });
      router.back();
    } else {
      toast({
        title: 'Update Failed',
        description: 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>Update your company's information here.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
