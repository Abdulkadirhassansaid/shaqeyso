
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-jobs';
import { useLanguage } from '@/hooks/use-language';
import type { Job, User } from '@/lib/types';
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
import { MoreVertical, Slash, UserCheck, DollarSign, Users, Briefcase, CalendarDays } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, startOfWeek, subDays, eachWeekOfInterval, parseISO, isThisMonth, subMonths, subYears, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval, startOfMonth, startOfYear } from 'date-fns';

export function AdminDashboard() {
  const { users, toggleUserBlockStatus } = useAuth();
  const { jobs } = useJobs();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [revenuePeriod, setRevenuePeriod] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    await toggleUserBlockStatus(userId);
    toast({
        title: isBlocked ? t.userUnblocked : t.userBlocked,
        description: isBlocked ? t.userUnblockedDesc : t.userBlockedDesc,
    });
  }
  
  const adminUser = users.find(u => u.role === 'admin');
  const adminTransactions = adminUser?.transactions || [];

  const totalRevenue = adminTransactions.reduce((acc, tx) => acc + tx.amount, 0);

  const thisMonthRevenue = adminTransactions
    .filter(tx => isThisMonth(parseISO(tx.date)))
    .reduce((acc, tx) => acc + tx.amount, 0);

  const revenueChartData = React.useMemo(() => {
    const dataMap = new Map<string, { total: number; date: Date }>();
    let interval: Date[];
    let dateFormat: string;
    let groupingFn: (date: Date) => Date;
    let intervalOptions: any = {};

    switch (revenuePeriod) {
      case 'daily':
        interval = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
        dateFormat = 'MMM d';
        groupingFn = (date: Date) => new Date(date.setHours(0, 0, 0, 0)); // Start of day
        interval.forEach(day => dataMap.set(format(day, dateFormat), { total: 0, date: day }));
        break;
      case 'monthly':
        interval = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() });
        dateFormat = 'MMM yyyy';
        groupingFn = startOfMonth;
        interval.forEach(month => dataMap.set(format(month, dateFormat), { total: 0, date: month }));
        break;
      case 'yearly':
        interval = eachYearOfInterval({ start: subYears(new Date(), 4), end: new Date() });
        dateFormat = 'yyyy';
        groupingFn = startOfYear;
        interval.forEach(year => dataMap.set(format(year, dateFormat), { total: 0, date: year }));
        break;
      case 'weekly':
      default:
        intervalOptions = { weekStartsOn: 1 };
        interval = eachWeekOfInterval({ start: subDays(new Date(), 12 * 7), end: new Date() }, intervalOptions);
        dateFormat = 'MMM d';
        groupingFn = (date: Date) => startOfWeek(date, intervalOptions);
        interval.forEach(week => dataMap.set(format(week, dateFormat), { total: 0, date: week }));
        break;
    }

    adminTransactions.forEach(tx => {
      const transactionDate = parseISO(tx.date);
      const keyDate = groupingFn(transactionDate);
      const key = format(keyDate, dateFormat);
      
      if (dataMap.has(key)) {
        const existing = dataMap.get(key)!;
        dataMap.set(key, { ...existing, total: existing.total + tx.amount });
      }
    });

    return Array.from(dataMap.values())
      .sort((a,b) => a.date.getTime() - b.date.getTime())
      .map(item => ({ date: format(item.date, dateFormat), revenue: item.total }));

  }, [adminTransactions, revenuePeriod]);


  const chartConfig = {
      revenue: {
        label: 'Revenue',
        color: 'hsl(var(--primary))',
      },
  };

  const recentTransactions = adminTransactions.slice(-5).reverse();

  const recentTransactionsWithUsers = recentTransactions.map(tx => {
    const jobTitleMatch = tx.description.match(/"(.*?)"/);
    if (!jobTitleMatch) return { ...tx, user: null };
    
    const jobTitle = jobTitleMatch[1];
    const job = jobs.find(j => j.title === jobTitle);
    if (!job) return { ...tx, user: null };
    
    const client = users.find(u => u.id === job.clientId);
    return { ...tx, user: client || null };
  });

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
            <TabsContent value="analytics" className="mt-6 space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{t.fromCompletedJobs}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${thisMonthRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Platform fees from this month.</p>
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
                 <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                             <CardDescription>View platform fee revenue by day, week, month, or year.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={revenuePeriod} onValueChange={(value) => setRevenuePeriod(value as any)}>
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="daily">Daily</TabsTrigger>
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <ChartContainer config={chartConfig} className="h-[300px] w-full pl-2">
                                <BarChart data={revenueChartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        stroke="#888888"
                                        fontSize={12}
                                        angle={revenuePeriod === 'daily' || revenuePeriod === 'weekly' ? -45 : 0}
                                        textAnchor={revenuePeriod === 'daily' || revenuePeriod === 'weekly' ? 'end' : 'middle'}
                                        height={revenuePeriod === 'daily' || revenuePeriod === 'weekly' ? 50 : 30}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        content={<ChartTooltipContent formatter={(value) => `$${Number(value).toFixed(2)}`} />}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>
                                {`You've received ${adminTransactions.length} platform fees in total.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-6">
                                {recentTransactionsWithUsers.map(tx => (
                                    <div key={tx.id} className="flex items-center">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={tx.user?.avatarUrl} alt="Avatar" />
                                            <AvatarFallback>{tx.user?.name.charAt(0) ?? 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{tx.user?.name ?? 'Unknown User'}</p>
                                            <p className="text-sm text-muted-foreground">{tx.description}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-green-500">+${tx.amount.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
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
