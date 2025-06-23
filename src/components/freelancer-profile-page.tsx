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
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface FreelancerProfilePageProps {
  user: User;
}

const commonSkills = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'UI/UX Design', 
  'Graphic Design', 'Content Writing', 'SEO', 'Shopify', 'Mobile Development',
  'Project Management', 'Marketing', 'Illustration'
];

export function FreelancerProfilePage({ user }: FreelancerProfilePageProps) {
  const { updateUserProfile, freelancerProfiles } = useAuth();
  const { toast } = useToast();
  
  const freelancerProfile = freelancerProfiles.find(p => p.userId === user.id);

  const [name, setName] = React.useState(user.name);
  const [bio, setBio] = React.useState(freelancerProfile?.bio || '');
  const [hourlyRate, setHourlyRate] = React.useState(freelancerProfile?.hourlyRate || 0);
  const [skills, setSkills] = React.useState<string[]>(freelancerProfile?.skills || []);
  const [skillInput, setSkillInput] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const profile = freelancerProfiles.find(p => p.userId === user.id);
    if (profile) {
        setName(user.name);
        setBio(profile.bio);
        setHourlyRate(profile.hourlyRate);
        setSkills(profile.skills);
    }
  }, [user, freelancerProfiles]);

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prevSkills => prevSkills.filter(s => s !== skillToRemove));
  };
  
  const handleAddSkill = (skillToAdd: string) => {
      const trimmedSkill = skillToAdd.trim();
      if(trimmedSkill && !skills.includes(trimmedSkill)) {
          setSkills(prevSkills => [...prevSkills, trimmedSkill]);
      }
      setSkillInput('');
  }

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillInput(e.target.value);
  }

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const availableSkills = React.useMemo(() => {
    return commonSkills.filter(s => 
        !skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())
    );
  }, [skills, skillInput]);

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
           <div className="space-y-4">
            <div className="space-y-2">
                <Label>Your Skills</Label>
                <div className="p-3 border rounded-md min-h-[60px] bg-secondary/30">
                    {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                                    {skill}
                                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                       <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Add your skills below.</p>
                    )}
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-input">Add or find skills</Label>
              <Input
                id="skill-input"
                placeholder="Type a skill and press Enter, or select from the list below"
                value={skillInput}
                onChange={handleSkillInputChange}
                onKeyDown={handleSkillInputKeyDown}
                disabled={isSaving}
              />
            </div>
            <div className="flex flex-wrap gap-2">
                {availableSkills.map(skill => (
                    <Button
                        key={skill}
                        type="button"
                        variant={"outline"}
                        size="sm"
                        onClick={() => handleAddSkill(skill)}
                        disabled={isSaving}
                    >
                        {skill}
                    </Button>
                ))}
                 {availableSkills.length === 0 && skillInput && !commonSkills.includes(skillInput) && (
                    <p className="text-sm text-muted-foreground italic">No matching common skills. Press Enter to add "{skillInput}".</p>
                )}
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
