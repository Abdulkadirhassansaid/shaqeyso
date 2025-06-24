'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  PlusCircle,
  Edit,
  Trash2,
  Wand2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { User, FreelancerProfile, Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateServiceDescription } from '@/app/actions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { LoadingDots } from '@/components/loading-dots';

export default function MyServicesPage() {
  const { user, isLoading, updateUserProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { toast } = useToast();

  // Auth guard
  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== 'freelancer')) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  const [freelancerProfile, setFreelancerProfile] =
    React.useState<FreelancerProfile | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);

  // State for Service Dialog
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(
    null
  );
  const [serviceTitle, setServiceTitle] = React.useState('');
  const [serviceDesc, setServiceDesc] = React.useState('');
  const [servicePrice, setServicePrice] = React.useState('');
  const [isGeneratingServiceDesc, setIsGeneratingServiceDesc] =
    React.useState(false);
  const [serviceImages, setServiceImages] = React.useState<string[]>([]);
  const [serviceFiles, setServiceFiles] = React.useState<File[]>([]);
  const serviceImageInputRef = React.useRef<HTMLInputElement>(null);
  const [isServiceSaving, setIsServiceSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(
      doc(db, 'freelancerProfiles', user.id),
      (doc) => {
        if (doc.exists()) {
          const profileData = {
            ...doc.data(),
            userId: doc.id,
          } as FreelancerProfile;
          setFreelancerProfile(profileData);
          setServices(profileData.services || []);
        }
      }
    );
    return () => unsub();
  }, [user]);

  const handleGenerateServiceDesc = async () => {
    if (!serviceTitle) {
      toast({
        title: 'Service Title Required',
        description: 'Please enter a title for your service first.',
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
    setServiceFiles([]);
    setIsServiceDialogOpen(true);
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
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
      images: allImageUrls,
    };

    let updatedServices;
    if (editingService) {
      updatedServices = services.map((s) =>
        s.id === editingService.id ? newService : s
      );
    } else {
      updatedServices = [...services, newService];
    }

    const success = await updateUserProfile(user.id, {}, { services: updatedServices });

    if (success) {
      toast({
        title: editingService ? 'Service Updated' : 'Service Added',
        description: 'Your list of services has been saved.',
      });
      setIsServiceDialogOpen(false);
    } else {
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    }
    setIsServiceSaving(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!user) return;
    const updatedServices = services.filter((s) => s.id !== serviceId);
    const success = await updateUserProfile(user.id, {}, { services: updatedServices });

    if (success) {
      toast({
        title: 'Service Removed',
        description: 'The service has been removed from your profile.',
      });
    } else {
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    }
  };

  const handleServiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setServiceFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeServiceImage = (type: 'file' | 'url', value: string) => {
    if (type === 'file') {
      setServiceFiles((prev) => prev.filter((file) => file.name !== value));
    } else {
      setServiceImages((prev) => prev.filter((url) => url !== value));
    }
  };

  const resetServiceDialog = () => {
    setEditingService(null);
    setServiceTitle('');
    setServiceDesc('');
    setServicePrice('');
    setServiceFiles([]);
    setServiceImages([]);
  };

  if (isLoading || !user || user.role !== 'freelancer') {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.profile}
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{t.myServicesPageTitle}</CardTitle>
                <CardDescription>{t.myServicesPageDesc}</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsServiceDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.addService}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.length > 0 ? (
                  services.map((service) => (
                    <div key={service.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{service.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditService(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t.deleteServiceTitle}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.deleteServiceDesc}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteService(service.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {t.delete}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {service.images && service.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {service.images.map((img, index) => (
                            <Image
                              data-ai-hint="portfolio image"
                              key={index}
                              src={img}
                              alt={`${service.title} image ${index + 1}`}
                              width={100}
                              height={100}
                              className="rounded-md object-cover aspect-square"
                            />
                          ))}
                        </div>
                      )}
                      <div className="text-right mt-2">
                        <Badge>${service.price}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t.noServicesYet}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={isServiceDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) resetServiceDialog();
              setIsServiceDialogOpen(isOpen);
            }}
          >
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSaveService}>
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? t.editService : t.addService}
                  </DialogTitle>
                  <DialogDescription>
                    {editingService ? t.editServiceDesc : t.addServiceDesc}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-title">{t.serviceTitle}</Label>
                    <Input
                      id="service-title"
                      value={serviceTitle}
                      onChange={(e) => setServiceTitle(e.target.value)}
                      placeholder={t.serviceTitlePlaceholder}
                      required
                      disabled={isServiceSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="service-desc">{t.serviceDescription}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateServiceDesc}
                        disabled={
                          isGeneratingServiceDesc || !serviceTitle || isServiceSaving
                        }
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
                      <Textarea
                        id="service-desc"
                        value={serviceDesc}
                        onChange={(e) => setServiceDesc(e.target.value)}
                        placeholder={t.serviceDescPlaceholder}
                        required
                        disabled={isServiceSaving}
                      />
                    )}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="service-price">{t.servicePrice}</Label>
                    <Input
                      id="service-price"
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="e.g., 150"
                      required
                      disabled={isServiceSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-images">{t.serviceImages}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => serviceImageInputRef.current?.click()}
                      disabled={isServiceSaving}
                    >
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
                      {serviceImages.map((url) => (
                        <div key={url} className="relative group">
                          <Image
                            src={url}
                            alt="Service image"
                            width={100}
                            height={100}
                            className="rounded-md object-cover aspect-square"
                          />
                          <button
                            type="button"
                            onClick={() => removeServiceImage('url', url)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                            disabled={isServiceSaving}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {serviceFiles.map((file) => (
                        <div key={file.name} className="relative group">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            width={100}
                            height={100}
                            className="rounded-md object-cover aspect-square"
                          />
                          <button
                            type="button"
                            onClick={() => removeServiceImage('file', file.name)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                            disabled={isServiceSaving}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isServiceSaving}
                    >
                      {t.cancel}
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isServiceSaving}>
                    {isServiceSaving ? t.saving : t.save}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
