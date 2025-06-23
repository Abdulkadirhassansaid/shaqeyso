
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MoreVertical, Slash, UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';


export function AdminDashboard() {
  const { users, toggleUserBlockStatus } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    await toggleUserBlockStatus(userId);
    toast({
        title: isBlocked ? t.userUnblocked : t.userBlocked,
        description: isBlocked ? t.userUnblockedDesc : t.userBlockedDesc,
    });
  }

  return (
    <div>
        <header className='mb-6'>
            <h1 className="text-3xl font-bold tracking-tight">{t.adminDashboard}</h1>
            <p className="text-muted-foreground mt-1">{t.adminDashboardDesc}</p>
        </header>
        <Tabs defaultValue="users" className="w-full">
            <TabsList>
                <TabsTrigger value="users">{t.users}</TabsTrigger>
                <TabsTrigger value="jobs" disabled>{t.jobs}</TabsTrigger>
                <TabsTrigger value="analytics" disabled>{t.analytics}</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.manageUsers}</CardTitle>
                        <CardDescription>{t.manageUsersDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.user}</TableHead>
                                    <TableHead>{t.role}</TableHead>
                                    <TableHead>{t.status}</TableHead>
                                    <TableHead className="text-right">{t.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.filter(u => u.role !== 'admin').map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{t[user.role as keyof typeof t] || user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isBlocked ? 'destructive' : 'default'}>
                                                {user.isBlocked ? t.blocked : t.active}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleToggleBlock(user.id, !!user.isBlocked)}>
                                                        {user.isBlocked ? (
                                                            <>
                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                <span>{t.unblockUser}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Slash className="mr-2 h-4 w-4" />
                                                                <span>{t.blockUser}</span>
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
