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
import { Wand2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { generateFreelancerBio } from '@/app/actions';
import { LoadingDots } from './loading-dots';

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
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);

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
      setPopoverOpen(false);
  }

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillInput(value);
    if (value.trim().length > 0 && !popoverOpen) {
        setPopoverOpen(true);
    } else if (value.trim().length === 0 && popoverOpen) {
        setPopoverOpen(false);
    }
  }

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const availableSkills = React.useMemo(() => {
    if (!skillInput) return [];
    return commonSkills.filter(s => 
        !skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())
    );
  }, [skills, skillInput]);

  const handleGenerateBio = async () => {
    if (skills.length === 0) {
      toast({
        title: 'Add Skills First',
        description: 'Please add some skills before generating a bio.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingBio(true);
    try {
      const result = await generateFreelancerBio({
        name: name,
        skills: skills,
      });
      setBio(result.bio);
    } catch (error) {
      console.error('Error generating freelancer bio:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate your bio at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBio(false);
    }
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving || isGeneratingBio} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor="bio">Your Bio</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateBio}
                    disabled={isSaving || isGeneratingBio}
                >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isGeneratingBio ? 'Generating...' : 'Generate with AI'}
                </Button>
            </div>
            {isGeneratingBio ? (
                <div className="flex items-center justify-center rounded-md border border-dashed min-h-[96px]">
                    <LoadingDots />
                </div>
            ) : (
                <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell clients about yourself, or use the AI to generate a bio based on your skills."
                    disabled={isSaving}
                />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input id="hourlyRate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} disabled={isSaving || isGeneratingBio} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="skill-input">Your Skills</Label>
             <Popover open={popoverOpen && availableSkills.length > 0} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div 
                    className="flex flex-wrap items-center w-full gap-2 p-1.5 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring"
                    onClick={() => document.getElementById('skill-input')?.focus()}
                >
                    {skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                            {skill}
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveSkill(skill); }} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    <Input
                        id="skill-input"
                        placeholder={skills.length === 0 ? "Type to add skills..." : ""}
                        value={skillInput}
                        onChange={handleSkillInputChange}
                        onKeyDown={handleSkillInputKeyDown}
                        disabled={isSaving || isGeneratingBio}
                        className="flex-grow h-8 p-1 bg-transparent border-0 shadow-none outline-none focus:ring-0 focus-visible:ring-0"
                    />
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-1"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex flex-col gap-1">
                    {availableSkills.map(skill => (
                        <Button
                            key={skill}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => handleAddSkill(skill)}
                            disabled={isSaving || isGeneratingBio}
                        >
                            {skill}
                        </Button>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
            {skillInput && availableSkills.length === 0 && !commonSkills.some(s => s.toLowerCase() === skillInput.toLowerCase()) && (
                <p className="text-sm text-muted-foreground italic">Press Enter to add "{skillInput}".</p>
            )}
          </div>
          <Button type="submit" disabled={isSaving || isGeneratingBio}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
