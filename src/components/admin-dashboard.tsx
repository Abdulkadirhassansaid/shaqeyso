'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-jobs';
import { useLanguage } from '@/hooks/use-language';
import type { Job } from '@/lib/types';
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
import { MoreVertical, Slash, UserCheck, DollarSign, Users, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export function AdminDashboard() {
  const { users, toggleUserBlockStatus } = useAuth();
  const { jobs } = useJobs();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    await toggleUserBlockStatus(userId);
    toast({
        title: isBlocked ? t.userUnblocked : t.userBlocked,
        description: isBlocked ? t.userUnblockedDesc : t.userBlockedDesc,
    });
  }
  
  const adminUser = users.find(u => u.role === 'admin');

  const getStatusVariant = (status: Job['status'] | undefined) => {
    switch (status) {
        case 'Open': return 'default';
        case 'Completed': return 'default';
        default: return 'secondary';
    }
  };

  return (
    <div>
        <header className='mb-6'>
            <h1 className="text-3xl font-bold tracking-tight">{t.adminDashboard}</h1>
            <p className="text-muted-foreground mt-1">{t.adminDashboardDesc}</p>
        </header>
        <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analytics">{t.analytics}</TabsTrigger>
                <TabsTrigger value="users">{t.users}</TabsTrigger>
                <TabsTrigger value="jobs">{t.jobs}</TabsTrigger>
            </TabsList>
            <TabsContent value="analytics" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${adminUser?.balance?.toFixed(2) || '0.00'}</div>
                            <p className="text-xs text-muted-foreground">{t.fromCompletedJobs}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.filter(u => u.role !== 'admin').length}</div>
                            <p className="text-xs text-muted-foreground">{users.filter(u => u.role === 'client').length} {t.clients}, {users.filter(u => u.role === 'freelancer').length} {t.freelancers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.totalJobs}</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{jobs.length}</div>
                            <p className="text-xs text-muted-foreground">{jobs.filter(j => j.status === 'Completed').length} {t.completed.toLowerCase()}</p>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
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
             <TabsContent value="jobs" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.manageJobs}</CardTitle>
                        <CardDescription>{t.manageJobsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.jobTitle}</TableHead>
                                    <TableHead>{t.client}</TableHead>
                                    <TableHead>{t.freelancer}</TableHead>
                                    <TableHead>{t.budget}</TableHead>
                                    <TableHead>{t.status}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => {
                                    const client = users.find(u => u.id === job.clientId);
                                    const freelancer = job.hiredFreelancerId ? users.find(u => u.id === job.hiredFreelancerId) : null;
                                    const status = job.status || 'Unknown';
                                    return (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.title}</TableCell>
                                            <TableCell>{client?.name}</TableCell>
                                            <TableCell>{freelancer?.name || 'N/A'}</TableCell>
                                            <TableCell>${job.budget.toFixed(2)}</TableCell>
                                            <TableCell>
                                                 <Badge variant={getStatusVariant(job.status)}>{t[status.toLowerCase() as keyof typeof t] || status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
