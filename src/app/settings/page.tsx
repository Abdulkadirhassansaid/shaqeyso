'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Language } from '@/lib/translations';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

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
      router.back();
    }, 1000);
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t.settingsTitle}</CardTitle>
            <CardDescription>{t.settingsDescription}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveSettings}>
            <CardContent className="space-y-6">
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

              <Button type="submit" disabled={isSaving}>
                {isSaving ? t.savingSettings : t.saveSettings}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}
