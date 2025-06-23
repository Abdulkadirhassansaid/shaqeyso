'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import type { Language } from '@/lib/translations';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [isSaving, setIsSaving] = React.useState(false);
  
  // States for new features
  const [jobAlerts, setJobAlerts] = React.useState(true);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // In a real app, you'd save these settings to the user's profile or a settings store.
    // For now, we'll just show a toast notification.
    setTimeout(() => {
      toast({
        title: t.settingsSaved,
        description: t.settingsSavedDesc,
      });
      setIsSaving(false);
    }, 1000);
  };
  
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder logic
    toast({ title: "Password Updated (Simulated)", description: "In a real app, your password would be changed." });
    setCurrentPassword('');
    setNewPassword('');
  }

  const handleDeleteAccount = () => {
    // Placeholder logic
    toast({ title: "Account Deleted (Simulated)", description: "Your account has been removed.", variant: "destructive" });
    logout();
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Button asChild variant="outline" size="sm">
                <Link href={user.role === 'admin' ? '/admin/dashboard' : '/'}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {user.role === 'admin' ? t.adminDashboard : t.backToHome}
                </Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t.settingsTitle}</CardTitle>
              <CardDescription>{t.settingsDescription}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Preferences Section */}
              <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t.language}</Label>
                    <Select
                      value={language}
                      onValueChange={(value) => setLanguage(value as Language)}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder={t.selectLanguage} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t.english}</SelectItem>
                        <SelectItem value="so">{t.somali}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        {t.languageDescription}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t.darkMode}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t.darkModeDescription}
                        </p>
                      </div>
                      <Switch
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                        disabled={isSaving}
                      />
                  </div>
              </div>
              
              <Separator />
              
              {/* Notifications Section */}
              <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t.notifications}</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                              <Label className="text-base">{t.emailNotifications}</Label>
                              {user.role === 'freelancer' ? (
                                  <p className="text-sm text-muted-foreground">{t.jobAlertsDesc}</p>
                              ) : (
                                  <p className="text-sm text-muted-foreground">{t.proposalUpdatesDesc}</p>
                              )}
                          </div>
                          <Switch
                              checked={jobAlerts}
                              onCheckedChange={setJobAlerts}
                              disabled={isSaving}
                          />
                      </div>
                  </div>
              </div>

              <Separator />

              {/* Account Section */}
              <div className="space-y-6">
                  <h3 className="text-lg font-medium">{t.account}</h3>
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-base">{t.changePassword}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <form onSubmit={handleUpdatePassword} className="space-y-4">
                              <div className="space-y-2">
                                  <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                                  <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="newPassword">{t.newPassword}</Label>
                                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                              </div>
                              <Button type="submit">{t.updatePassword}</Button>
                          </form>
                      </CardContent>
                  </Card>
                  <Card className="border-destructive">
                      <CardHeader>
                          <CardTitle className="text-base text-destructive">{t.deleteAccount}</CardTitle>
                          <CardDescription>{t.deleteAccountDesc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive">{t.deleteAccount}</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>{t.deleteAccountConfirmTitle}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      {t.deleteAccountConfirmDesc}
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">{t.deleteAccount}</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </CardContent>
                  </Card>
              </div>

              <Separator />

              <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? t.savingSettings : t.saveSettings}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
