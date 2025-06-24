
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
import { Wand2, X, Camera, Star, BadgeCheck, PlusCircle, Edit, Trash2, UploadCloud } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { generateFreelancerBio, generateServiceDescription } from '@/app/actions';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import Image from 'next/image';


interface FreelancerProfilePageProps {
  user: User;
}

const commonSkills = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'UI/UX Design', 
  'Graphic Design', 'Content Writing', 'SEO', 'Shopify', 'Mobile Development',
  'Project Management', 'Marketing', 'Illustration'
];

export function FreelancerProfilePage({ user }: FreelancerProfilePageProps) {
  const { updateUserProfile } = useAuth();
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
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [bio, setBio] = React.useState('');
  const [hourlyRate, setHourlyRate] = React.useState(0);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [skillInput, setSkillInput] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);

  // State for Service Dialog
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [serviceTitle, setServiceTitle] = React.useState('');
  const [serviceDesc, setServiceDesc] = React.useState('');
  const [servicePrice, setServicePrice] = React.useState('');
  const [isGeneratingServiceDesc, setIsGeneratingServiceDesc] = React.useState(false);
  const [serviceImages, setServiceImages] = React.useState<string[]>([]);
  const [serviceFiles, setServiceFiles] = React.useState<File[]>([]);
  const serviceImageInputRef = React.useRef<HTMLInputElement>(null);
  const [isServiceSaving, setIsServiceSaving] = React.useState(false);


  React.useEffect(() => {
    if (freelancerProfile) {
        setName(user.name);
        setBio(freelancerProfile.bio || '');
        setHourlyRate(freelancerProfile.hourlyRate || 0);
        setSkills(freelancerProfile.skills || []);
        setServices(freelancerProfile.services || []);
    }
  }, [user, freelancerProfile]);

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

  const handleGenerateServiceDesc = async () => {
    if (!serviceTitle) {
      toast({
        title: "Service Title Required",
        description: "Please enter a title for your service first.",
        variant: 'destructive',
      });
      return;
    }
    setIsGeneratingServiceDesc(true);
    try {
      const result = await generateServiceDescription({
        title: serviceTitle,
      });
      if (result.success) {
        setServiceDesc(result.data.description);
      } else {
        toast({
            title: t.generationFailed,
            description: result.error,
            variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating service description:', error);
      toast({
        title: t.generationFailed,
        description: (error as Error).message || t.generationFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingServiceDesc(false);
    }
  };
  
  const handleEditService = (service: Service) => {
      setEditingService(service);
      setServiceTitle(service.title);
      setServiceDesc(service.description);
      setServicePrice(String(service.price));
      setServiceImages(service.images || []);
      setIsServiceDialogOpen(true);
  };

  const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }
  
  const handleSaveService = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!serviceTitle || !serviceDesc || !servicePrice) {
          toast({ title: t.missingFieldsTitle, variant: 'destructive' });
          return;
      }
      setIsServiceSaving(true);

      const newImageUrls = await Promise.all(serviceFiles.map(fileToDataUrl));
      const allImageUrls = [...serviceImages, ...newImageUrls];
      
      const newService = {
          id: editingService?.id || `service-${Date.now()}`,
          title: serviceTitle,
          description: serviceDesc,
          price: Number(servicePrice),
          images: allImageUrls
      };

      let updatedServices;
      if (editingService) {
          updatedServices = services.map(s => s.id === editingService.id ? newService : s);
      } else {
          updatedServices = [...services, newService];
      }
      
      const success = await updateUserProfile(user.id, {}, { services: updatedServices });

      if (success) {
        toast({ title: "Services Updated", description: "Your list of services has been saved." });
        setIsServiceDialogOpen(false);
      } else {
         toast({ title: t.updateFailed, description: t.updateFailedDesc, variant: 'destructive' });
      }
      setIsServiceSaving(false);
  };
  
  const handleDeleteService = async (serviceId: string) => {
      const updatedServices = services.filter(s => s.id !== serviceId);
      const success = await updateUserProfile(user.id, {}, { services: updatedServices });

      if (success) {
          toast({ title: "Service Removed", description: "The service has been removed from your profile." });
      } else {
          toast({ title: t.updateFailed, description: t.updateFailedDesc, variant: 'destructive' });
      }
  }

  const handleServiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setServiceFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeServiceImage = (type: 'file' | 'url', value: string) => {
    if (type === 'file') {
      setServiceFiles(prev => prev.filter(file => file.name !== value));
    } else {
      setServiceImages(prev => prev.filter(url => url !== value));
    }
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const profileData = {
        bio,
        hourlyRate,
        skills,
        services,
    };
    
    const userData = { 
      name,
      ...(avatar && { avatarUrl: avatar })
    };
    
    const success = await updateUserProfile(user.id, userData, profileData);

    if (success) {
      toast({
        title: t.profileUpdated,
        description: t.freelancerProfileUpdatedDesc,
      });
    } else {
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const resetServiceDialog = () => {
    setEditingService(null);
    setServiceTitle('');
    setServiceDesc('');
    setServicePrice('');
    setServiceFiles([]);
    setServiceImages([]);
  };

  return (
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
                    <AvatarImage src={avatar || user.avatarUrl} alt={user.name} />
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

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t.myServices}</CardTitle>
                        <CardDescription>{t.myServicesDesc}</CardDescription>
                    </div>
                    <Button type="button" size="sm" onClick={() => setIsServiceDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t.addService}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {services.length > 0 ? (
                            services.map(service => (
                                <div key={service.id} className="border p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold">{service.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t.deleteServiceTitle}</AlertDialogTitle>
                                                        <AlertDialogDescription>{t.deleteServiceDesc}</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteService(service.id)} className="bg-destructive hover:bg-destructive/90">{t.delete}</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    {service.images && service.images.length > 0 && (
                                        <div className="mt-3 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {service.images.map((img, index) => (
                                                <Image data-ai-hint="portfolio image" key={index} src={img} alt={`${service.title} image ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                                            ))}
                                        </div>
                                    )}
                                    <div className="text-right mt-2">
                                        <Badge>${service.price}</Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">{t.noServicesYet}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isServiceDialogOpen} onOpenChange={(isOpen) => {
                if (!isOpen) resetServiceDialog();
                setIsServiceDialogOpen(isOpen);
            }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSaveService}>
                        <DialogHeader>
                            <DialogTitle>{editingService ? t.editService : t.addService}</DialogTitle>
                            <DialogDescription>{editingService ? t.editServiceDesc : t.addServiceDesc}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="service-title">{t.serviceTitle}</Label>
                                <Input id="service-title" value={serviceTitle} onChange={e => setServiceTitle(e.target.value)} placeholder={t.serviceTitlePlaceholder} required disabled={isServiceSaving} />
                            </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="service-desc">{t.serviceDescription}</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateServiceDesc}
                                        disabled={isGeneratingServiceDesc || !serviceTitle || isServiceSaving}
                                    >
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        {isGeneratingServiceDesc ? t.generating : t.generateWithAI}
                                    </Button>
                                </div>
                                {isGeneratingServiceDesc ? (
                                    <div className="flex items-center justify-center rounded-md border border-dashed min-h-[96px]">
                                        <LoadingDots />
                                    </div>
                                ) : (
                                    <Textarea id="service-desc" value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} placeholder={t.serviceDescPlaceholder} required disabled={isServiceSaving} />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="service-images">{t.serviceImages}</Label>
                                <Button type="button" variant="outline" onClick={() => serviceImageInputRef.current?.click()} disabled={isServiceSaving}>
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    {t.uploadImages}
                                </Button>
                                <input
                                    type="file"
                                    ref={serviceImageInputRef}
                                    className="hidden"
                                    accept="image/png, image/jpeg"
                                    multiple
                                    onChange={handleServiceImageChange}
                                    disabled={isServiceSaving}
                                />
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {serviceImages.map(url => (
                                        <div key={url} className="relative group">
                                            <Image src={url} alt="Service image" width={100} height={100} className="rounded-md object-cover aspect-square"/>
                                            <button type="button" onClick={() => removeServiceImage('url', url)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100" disabled={isServiceSaving}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {serviceFiles.map(file => (
                                        <div key={file.name} className="relative group">
                                            <Image src={URL.createObjectURL(file)} alt={file.name} width={100} height={100} className="rounded-md object-cover aspect-square"/>
                                             <button type="button" onClick={() => removeServiceImage('file', file.name)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100" disabled={isServiceSaving}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="service-price">{t.servicePrice}</Label>
                                <Input id="service-price" type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="e.g., 150" required disabled={isServiceSaving} />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost" disabled={isServiceSaving}>{t.cancel}</Button></DialogClose>
                            <Button type="submit" disabled={isServiceSaving}>{isServiceSaving ? t.saving : t.save}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
  );
}
