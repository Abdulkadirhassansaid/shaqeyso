'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { mockFreelancerProfiles } from '@/lib/mock-data';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface FreelancerProfilePageProps {
  user: User;
}

export function FreelancerProfilePage({ user }: FreelancerProfilePageProps) {
  const { updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const freelancerProfile = mockFreelancerProfiles.find(p => p.userId === user.id);

  const [name, setName] = React.useState(user.name);
  const [bio, setBio] = React.useState(freelancerProfile?.bio || '');
  const [hourlyRate, setHourlyRate] = React.useState(freelancerProfile?.hourlyRate || 0);
  const [skills, setSkills] = React.useState<string[]>(freelancerProfile?.skills || []);
  const [currentSkill, setCurrentSkill] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(currentSkill.trim())) {
        setSkills([...skills, currentSkill.trim()]);
      }
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const profileData = {
        bio,
        hourlyRate,
        skills,
    };
    
    const success = await updateUserProfile(user.id, { name }, profileData);

    if (success) {
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved.',
      });
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
        <CardTitle>Your Freelancer Profile</CardTitle>
        <CardDescription>This is how clients will see you. Make it count!</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Your Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell clients about yourself..." disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input id="hourlyRate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} disabled={isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input 
                id="skills" 
                placeholder="Add a skill and press Enter" 
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyDown={handleAddSkill}
                disabled={isSaving}
            />
            <div className="flex flex-wrap gap-2 pt-2">
                {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                           <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
