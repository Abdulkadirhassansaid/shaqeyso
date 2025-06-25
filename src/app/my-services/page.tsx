
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  PlusCircle,
  Edit,
  Trash2,
  Wand2,
  UploadCloud,
  X,
  Link,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { FreelancerProfile, Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateServiceDescription } from '@/app/actions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { LoadingDots } from '@/components/loading-dots';
import { ImageCropper } from '@/components/image-cropper';
import { fileToDataUrl } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

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
  const [isServicesLoading, setIsServicesLoading] = React.useState(true);

  // State for Service Dialog
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [serviceTitle, setServiceTitle] = React.useState('');
  const [serviceDesc, setServiceDesc] = React.useState('');
  const [servicePrice, setServicePrice] = React.useState('');
  const [deliveryTime, setDeliveryTime] = React.useState('');
  const [hasFastDelivery, setHasFastDelivery] = React.useState(false);
  const [fastDeliveryDays, setFastDeliveryDays] = React.useState('');
  const [fastDeliveryPrice, setFastDeliveryPrice] = React.useState('');
  const [isGeneratingServiceDesc, setIsGeneratingServiceDesc] = React.useState(false);
  const [serviceImages, setServiceImages] = React.useState<(string | File)[]>([]);
  const serviceImageInputRef = React.useRef<HTMLInputElement>(null);
  const [isServiceSaving, setIsServiceSaving] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  
  const [isServiceImageUrlDialogOpen, setIsServiceImageUrlDialogOpen] = React.useState(false);
  const [serviceImageUrl, setServiceImageUrl] = React.useState('');

  React.useEffect(() => {
    if (!user || !db) {
      setIsServicesLoading(false);
      return;
    }
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
        } else {
          setServices([]);
        }
        setIsServicesLoading(false);
      },
      (error) => {
        console.error("Error fetching services:", error);
        setIsServicesLoading(false);
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
    setIsGeneratingServiceDesc(false);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceTitle(service.title);
    setServiceDesc(service.description);
    setServicePrice(String(service.price));
    setDeliveryTime(String(service.deliveryTime));
    setServiceImages(service.images || []);
    if (service.fastDelivery) {
        setHasFastDelivery(true);
        setFastDeliveryDays(String(service.fastDelivery.days));
        setFastDeliveryPrice(String(service.fastDelivery.price));
    }
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!serviceTitle || !serviceDesc || !servicePrice || !deliveryTime) {
      toast({ title: t.missingFieldsTitle, variant: 'destructive' });
      return;
    }
    setIsServiceSaving(true);

    try {
      const serviceId = editingService?.id || `service-${Date.now()}`;
      
      const imagePromises = serviceImages.map(image => {
        if (typeof image === 'string') {
          return Promise.resolve(image); // It's already a URL (http or data)
        }
        return fileToDataUrl(image); // Convert newly uploaded File to data URL
      });

      const allImageUrls = await Promise.all(imagePromises);

      const newService: Service = {
        id: serviceId,
        title: serviceTitle,
        description: serviceDesc,
        price: Number(servicePrice),
        deliveryTime: Number(deliveryTime),
        images: allImageUrls,
      };

      if (hasFastDelivery && fastDeliveryDays && fastDeliveryPrice) {
          newService.fastDelivery = {
              days: Number(fastDeliveryDays),
              price: Number(fastDeliveryPrice),
          }
      }

      let updatedServices;
      if (editingService) {
        updatedServices = services.map((s) =>
          s.id === editingService.id ? newService : s
        );
      } else {
        updatedServices = [...services, newService];
      }

      const success = await updateUserProfile(
        user.id,
        {},
        { services: updatedServices }
      );

      if (success) {
        toast({
          title: editingService ? 'Service Updated' : 'Service Added',
          description: 'Your list of services has been saved.',
        });
        setIsServiceDialogOpen(false);
      } else {
        throw new Error('Failed to update profile.');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsServiceSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!user) return;
    const updatedServices = services.filter((s) => s.id !== serviceId);
    const success = await updateUserProfile(
      user.id,
      {},
      { services: updatedServices }
    );

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

  const handleServiceImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files.length > 1) {
          toast({ title: "One image at a time", description: "You can crop and upload one image at a time for your service." });
      }
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
          setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (serviceImageInputRef.current) {
      serviceImageInputRef.current.value = '';
    }
  };

  const removeServiceImage = (indexToRemove: number) => {
    setServiceImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };
  
  const handleAddServiceImageUrl = () => {
    if (!serviceImageUrl) return;
    setServiceImages(prev => [...prev, serviceImageUrl]);
    setServiceImageUrl('');
    setIsServiceImageUrlDialogOpen(false);
  }

  const resetServiceDialog = () => {
    setEditingService(null);
    setServiceTitle('');
    setServiceDesc('');
    setServicePrice('');
    setDeliveryTime('');
    setHasFastDelivery(false);
    setFastDeliveryDays('');
    setFastDeliveryPrice('');
    setServiceImages([]);
  };

  if (isLoading || !user || user.role !== 'freelancer') {
    return null;
  }

  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
            <Button
              type="button"
              onClick={() => setIsServiceDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t.addService}
            </Button>
          </div>

           <header>
            <h1 className="text-3xl font-bold tracking-tight">{t.myServicesPageTitle}</h1>
            <p className="text-muted-foreground mt-1">{t.myServicesPageDesc}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isServicesLoading ? (
              <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
              </>
            ) : services.length > 0 ? (
              services.map((service) => (
                <Card key={service.id} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
                  <div className="aspect-video bg-muted relative">
                      {service.images && service.images.length > 0 ? (
                          <Image
                              data-ai-hint="portfolio image"
                              src={service.images[0]}
                              alt={service.title}
                              fill
                              className="object-cover"
                          />
                      ) : (
                          <div className="flex h-full w-full items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          </div>
                      )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                      <div className="flex justify-between items-start gap-4">
                          <h4 className="font-semibold text-lg line-clamp-2">{service.title}</h4>
                          <Badge variant="secondary" className="text-base shrink-0">${service.price.toFixed(2)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{service.deliveryTime} {t.days} {t.deliveryTime}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-grow">{service.description}</p>
                      
                      {service.images && service.images.length > 1 && (
                          <div className="flex gap-2 mt-4">
                              {service.images.slice(1, 5).map((img, index) => (
                                  <div key={index} className="relative h-12 w-12 rounded-md overflow-hidden">
                                      <Image
                                          src={img}
                                          alt={`${service.title} thumbnail ${index + 1}`}
                                          fill
                                          className="object-cover"
                                      />
                                  </div>
                              ))}
                              {service.images.length > 5 && (
                                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                      +{service.images.length - 5}
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/50">
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditService(service)}
                      >
                          <Edit className="mr-2 h-4 w-4" />
                          {t.edit}
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t.delete}
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
                              <AlertDialogCancel>
                                {t.cancel}
                              </AlertDialogCancel>
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
              </Card>
              ))
            ) : (
              <Card className="md:col-span-2">
                <CardContent className="p-8 text-center text-muted-foreground">
                  {t.noServicesYet}
                </CardContent>
              </Card>
            )}
          </div>

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
                      <Label htmlFor="service-desc">
                        {t.serviceDescription}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateServiceDesc}
                        disabled={
                          isGeneratingServiceDesc ||
                          !serviceTitle ||
                          isServiceSaving
                        }
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isGeneratingServiceDesc
                          ? t.generating
                          : t.generateWithAI}
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
                  
                  <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium">{t.standardDelivery}</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="delivery-time">{t.standardDeliveryTime}</Label>
                            <Input id="delivery-time" type="number" placeholder="e.g., 7" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} required disabled={isServiceSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service-price">{t.standardPrice}</Label>
                            <Input id="service-price" type="number" placeholder="e.g., 150" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} required disabled={isServiceSaving} />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium">{t.fastDeliveryOption}</h4>
                            <p className="text-sm text-muted-foreground">Offer an expedited option for a higher price.</p>
                        </div>
                        <Switch checked={hasFastDelivery} onCheckedChange={setHasFastDelivery} disabled={isServiceSaving} />
                    </div>
                    {hasFastDelivery && (
                        <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fast-delivery-days">{t.fastDeliveryTime}</Label>
                                <Input id="fast-delivery-days" type="number" placeholder="e.g., 2" value={fastDeliveryDays} onChange={(e) => setFastDeliveryDays(e.target.value)} required={hasFastDelivery} disabled={isServiceSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fast-delivery-price">{t.fastDeliveryPrice}</Label>
                                <Input id="fast-delivery-price" type="number" placeholder="e.g., 250" value={fastDeliveryPrice} onChange={(e) => setFastDeliveryPrice(e.target.value)} required={hasFastDelivery} disabled={isServiceSaving} />
                            </div>
                        </div>
                        </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-images">{t.serviceImages}</Label>
                    <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => serviceImageInputRef.current?.click()}
                          disabled={isServiceSaving}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {t.uploadImages}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsServiceImageUrlDialogOpen(true)}
                          disabled={isServiceSaving}
                        >
                            <Link className="mr-2 h-4 w-4" />
                            {t.addFromUrl}
                        </Button>
                    </div>
                    <input
                      type="file"
                      ref={serviceImageInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg"
                      onChange={handleServiceImageChange}
                      disabled={isServiceSaving}
                    />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {serviceImages.map((image, index) => {
                        const imageUrl =
                          typeof image === 'string'
                            ? image
                            : URL.createObjectURL(image);
                        return (
                          <div key={index} className="relative group">
                            <Image
                              data-ai-hint="portfolio image"
                              src={imageUrl}
                              alt="Service image"
                              width={100}
                              height={100}
                              className="rounded-md object-cover aspect-square"
                            />
                            <button
                              type="button"
                              onClick={() => removeServiceImage(index)}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                              disabled={isServiceSaving}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
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
        <ImageCropper
           image={imageToCrop}
           aspect={16 / 9}
           onClose={() => setImageToCrop(null)}
           onCropComplete={(croppedImage) => {
             setServiceImages((prev) => [...prev, croppedImage]);
             setImageToCrop(null);
           }}
        />
      </main>
    </div>
    <Dialog open={isServiceImageUrlDialogOpen} onOpenChange={setIsServiceImageUrlDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.addImageFromUrl}</DialogTitle>
                <DialogDescription>{t.addImageFromUrlDesc}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="service-image-url">{t.imageUrl}</Label>
                    <Input
                        id="service-image-url"
                        value={serviceImageUrl}
                        onChange={(e) => setServiceImageUrl(e.target.value)}
                        placeholder="https://..."
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsServiceImageUrlDialogOpen(false)}>{t.cancel}</Button>
                <Button type="button" onClick={handleAddServiceImageUrl} disabled={!serviceImageUrl}>
                    {t.addImage}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
