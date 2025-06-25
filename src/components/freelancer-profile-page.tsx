
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, FreelancerProfile, Review, Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Wand2, X, Camera, Star, BadgeCheck, ArrowLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { generateFreelancerBio } from '@/app/actions';
import { LoadingDots } from './loading-dots';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useReviews } from '@/hooks/use-reviews';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { StarRating } from './star-rating';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { ImageCropper } from './image-cropper';


interface FreelancerProfilePageProps {
  user: User;
}

const commonSkills = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'UI/UX Design', 
  'Graphic Design', 'Content Writing', 'SEO', 'Shopify', 'Mobile Development',
  'Project Management', 'Marketing', 'Illustration'
];

export function FreelancerProfilePage({ user }: FreelancerProfilePageProps) {
  const { updateUserProfile, uploadFile } = useAuth();
  const { reviews } = useReviews();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [freelancerProfiles, setFreelancerProfiles] = React.useState<FreelancerProfile[]>([]);
  const [reviewers, setReviewers] = React.useState<User[]>([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = React.useState(true);
  
  React.useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'freelancerProfiles'), (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as FreelancerProfile));
      setFreelancerProfiles(profilesData);
    });
    return () => unsub();
  }, []);

  const freelancerProfile = freelancerProfiles.find(p => p.userId === user.id);
  const freelancerReviews = reviews.filter(r => r.revieweeId === user.id);
  const averageRating = freelancerReviews.length > 0
    ? freelancerReviews.reduce((acc, r) => acc + r.rating, 0) / freelancerReviews.length
    : 0;
  
  React.useEffect(() => {
    const fetchReviewers = async () => {
        if (freelancerReviews.length === 0 || !db) {
            setIsLoadingReviewers(false);
            return;
        };

        const reviewerIds = [...new Set(freelancerReviews.map(r => r.reviewerId))];
        
        if (reviewerIds.length > 0) {
            try {
                const q = query(collection(db, "users"), where("id", "in", reviewerIds.slice(0, 30)));
                const querySnapshot = await getDocs(q);
                const fetchedReviewers = querySnapshot.docs.map(d => d.data() as User);
                setReviewers(fetchedReviewers);
            } catch (error) {
                console.error("Error fetching reviewers:", error);
            }
        }
        setIsLoadingReviewers(false);
    };

    fetchReviewers();
  }, [freelancerReviews]);


  const [name, setName] = React.useState(user.name);
  const [avatarPreview, setAvatarPreview] = React.useState<string>(user.avatarUrl);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [newAvatarFile, setNewAvatarFile] = React.useState<File | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [bio, setBio] = React.useState('');
  const [hourlyRate, setHourlyRate] = React.useState(0);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);


  React.useEffect(() => {
    if (freelancerProfile) {
        setName(user.name);
        setBio(freelancerProfile.bio || '');
        setHourlyRate(freelancerProfile.hourlyRate || 0);
        setSkills(freelancerProfile.skills || []);
    }
  }, [user, freelancerProfile]);

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
        title: t.addSkillsFirst,
        description: t.addSkillsFirstDesc,
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
      if (result.success) {
        setBio(result.data.bio);
        toast({ title: "Bio Generated", description: "AI has written a bio for you. Don't forget to save changes." });
      } else {
        toast({
          title: t.generationFailed,
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating freelancer bio:', error);
      toast({
        title: t.generationFailed,
        description: (error as Error).message || t.generationFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBio(false);
    }
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      let avatarUrl = user.avatarUrl;
      if (newAvatarFile) {
        const filePath = `avatars/${user.id}/${Date.now()}-avatar`;
        avatarUrl = await uploadFile(filePath, newAvatarFile);
      }

      const profileData = {
        bio,
        hourlyRate,
        skills,
      };

      const userData = {
        name,
        avatarUrl: avatarUrl,
      };

      const success = await updateUserProfile(user.id, userData, profileData);

      if (success) {
        toast({
          title: t.profileUpdated,
          description: t.freelancerProfileUpdatedDesc,
        });
        setNewAvatarFile(null);
      } else {
        throw new Error('Profile update failed');
      }
    } catch (error) {
      console.error('Error saving freelancer profile:', error);
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
          <div>
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
              </Button>
          </div>
          <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                  <Card>
                      <CardHeader>
                          <div className="flex items-center gap-2">
                              <CardTitle>{t.freelancerProfileTitle}</CardTitle>
                              {user.verificationStatus === 'verified' && (
                                  <BadgeCheck className="h-6 w-6 text-primary" />
                              )}
                          </div>
                          <CardDescription>{t.freelancerProfileDesc}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                      <div className="flex items-center gap-4">
                          <Avatar className="h-24 w-24">
                          <AvatarImage src={avatarPreview} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                          <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={isSaving || isGeneratingBio}>
                              <Camera className="mr-2 h-4 w-4" />
                              {t.uploadPhoto}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">{t.uploadPhotoDesc}</p>
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
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving || isGeneratingBio} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="email">{t.emailLabel}</Label>
                          <Input id="email" value={user.email} disabled />
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <Label htmlFor="bio">{t.yourBio}</Label>
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGenerateBio}
                                  disabled={isSaving || isGeneratingBio}
                              >
                                  <Wand2 className="mr-2 h-4 w-4" />
                                  {isGeneratingBio ? t.generatingBio : t.generateBioWithAI}
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
                                  placeholder={t.bioPlaceholder}
                                  disabled={isSaving}
                              />
                          )}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="hourlyRate">{t.hourlyRateLabel}</Label>
                          <Input id="hourlyRate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} disabled={isSaving || isGeneratingBio} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="skill-input">{t.yourSkills}</Label>
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
                                      placeholder={skills.length === 0 ? t.addSkillsPlaceholder : ""}
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
                              <p className="text-sm text-muted-foreground italic">{t.addSkillPrompt.replace('{skill}', skillInput)}</p>
                          )}
                      </div>
                      </CardContent>
                      <CardFooter>
                          <Button type="submit" disabled={isSaving || isGeneratingBio}>
                              {isSaving ? t.saving : t.saveChanges}
                          </Button>
                      </CardFooter>
                  </Card>
              </div>
              
              <div className="md:col-span-1 space-y-6">
                  <Card>
                      <CardHeader>
                          <CardTitle>{t.ratingsAndReviews}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          {freelancerReviews.length > 0 ? (
                              <div className="space-y-4">
                                  <div className="text-center">
                                      <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
                                      <div className="flex justify-center">
                                          <StarRating rating={averageRating} size={20} />
                                      </div>
                                      <p className="text-sm text-muted-foreground">({freelancerReviews.length} {t.ratingsAndReviews.toLowerCase()})</p>
                                  </div>
                                  <Separator />
                                  {isLoadingReviewers ? (
                                      <div className="space-y-4">
                                          <Skeleton className="h-10 w-full" />
                                          <Skeleton className="h-10 w-full" />
                                      </div>
                                  ) : (
                                      <div className="space-y-4 max-h-96 overflow-y-auto">
                                          {freelancerReviews.map(review => {
                                              const reviewer = reviewers.find(u => u.id === review.reviewerId);
                                              return (
                                                  <div key={review.id} className="space-y-2">
                                                      <div className="flex items-center gap-2">
                                                          <Avatar className="h-8 w-8">
                                                              <AvatarImage src={reviewer?.avatarUrl} />
                                                              <AvatarFallback>{reviewer?.name.charAt(0)}</AvatarFallback>
                                                          </Avatar>
                                                          <div>
                                                              <p className="text-sm font-medium">{reviewer?.name}</p>
                                                              <StarRating rating={review.rating} />
                                                          </div>
                                                      </div>
                                                      <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                                                      <p className="text-xs text-muted-foreground text-right">{format(new Date(review.date), 'dd MMM yyyy')}</p>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  )}
                              </div>
                          ) : (
                              <p className="text-sm text-muted-foreground text-center">{t.noReviewsYet}</p>
                          )}
                      </CardContent>
                  </Card>
              </div>
          </form>
      </div>
      <ImageCropper
        image={imageToCrop}
        onClose={() => setImageToCrop(null)}
        onCropComplete={(croppedImage) => {
          setNewAvatarFile(croppedImage);
          setAvatarPreview(URL.createObjectURL(croppedImage));
          setImageToCrop(null);
        }}
      />
    </>
  );
}
