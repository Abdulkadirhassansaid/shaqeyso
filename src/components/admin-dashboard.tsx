
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-jobs';
import { useLanguage } from '@/hooks/use-language';
import type { Job, User, PaymentMethod } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Banknote, MoreVertical, Slash, UserCheck, DollarSign, Users, Briefcase, TrendingUp, MessageSquare, MessageCircle, Trash2, CreditCard, Smartphone, Wallet, BadgeCheck, AlertTriangle, ShieldQuestion, ExternalLink, FileText, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, startOfWeek, subDays, eachWeekOfInterval, parseISO, isThisMonth, subMonths, subYears, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval, startOfMonth, startOfYear } from 'date-fns';
import { ChatDialog } from './chat-dialog';
import { DirectChatDialog } from './direct-chat-dialog';
import { useProposals } from '@/hooks/use-proposals';
import { useReviews } from '@/hooks/use-reviews';
import { useDirectMessages } from '@/hooks/use-direct-messages';
import { useMessages } from '@/hooks/use-messages';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import Image from 'next/image';
import { Textarea } from './ui/textarea';

export function AdminDashboard() {
  const { users, toggleUserBlockStatus, deleteUser, addTransaction, approveVerification, rejectVerification } = useAuth();
  const { jobs, deleteJob, deleteJobsByClientId } = useJobs();
  const { deleteProposalsByJobId, deleteProposalsByFreelancerId } = useProposals();
  const { deleteMessagesByJobId } = useMessages();
  const { deleteReviewsByJobId, deleteReviewsForUser } = useReviews();
  const { deleteDirectMessagesForUser } = useDirectMessages();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [revenuePeriod, setRevenuePeriod] = useLocalStorageState<'daily' | 'weekly' | 'monthly' | 'yearly'>('admin-revenue-period', 'weekly');
  const [activeTab, setActiveTab] = useLocalStorageState('admin-active-tab', 'analytics');
  const [chattingJob, setChattingJob] = React.useState<Job | null>(null);
  const [chattingWithUser, setChattingWithUser] = React.useState<User | null>(null);
  const [reviewingUser, setReviewingUser] = React.useState<User | null>(null);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = React.useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = React.useState('');
  const [selectedWithdrawalMethodId, setSelectedWithdrawalMethodId] = React.useState<string | undefined>(undefined);

  const adminUser = users.find(u => u.role === 'admin');
  const adminTransactions = adminUser?.transactions || [];

  const platformBalance = adminTransactions.reduce((acc, tx) => acc + tx.amount, 0);

  const pendingVerifications = users.filter(u => u.verificationStatus === 'pending');
  
  const verificationSubmissions = users
    .filter(u => u.passportOrIdUrl && u.role !== 'admin')
    .sort((a, b) => {
        const order = { pending: 1, rejected: 2, verified: 3, unverified: 99 };
        return (order[a.verificationStatus] || 99) - (order[b.verificationStatus] || 99);
    });

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    await toggleUserBlockStatus(userId);
    toast({
        title: isBlocked ? t.userUnblocked : t.userBlocked,
        description: isBlocked ? t.userUnblockedDesc : t.userBlockedDesc,
    });
  }
  
  const handleConfirmWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    
    const amount = parseFloat(withdrawalAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({ title: t.invalidWithdrawalAmount, variant: 'destructive' });
      return;
    }
    if (amount > platformBalance) {
      toast({ title: t.amountExceedsBalance, variant: 'destructive' });
      return;
    }
    if (!selectedWithdrawalMethodId) {
        toast({ title: t.mustSelectPaymentMethod, variant: 'destructive' });
        return;
    }

    const method = adminUser.paymentMethods?.find(pm => pm.id === selectedWithdrawalMethodId);
    if (!method) return;

    const description = `${t.withdrawTo} ${method.type} ${method.last4 ? `****${method.last4}` : `(${method.phoneNumber})`}`;

    await addTransaction(adminUser.id, {
        description: description,
        amount: -amount,
        status: 'Pending',
    });

    toast({ title: t.withdrawalInitiated, description: t.withdrawalInitiatedDesc });
    setWithdrawalAmount('');
    setSelectedWithdrawalMethodId(undefined);
    setIsWithdrawDialogOpen(false);
  };
  
  const handleDeleteJob = async (jobId: string) => {
    await Promise.all([
        deleteMessagesByJobId(jobId),
        deleteProposalsByJobId(jobId),
        deleteReviewsByJobId(jobId),
    ]);
    await deleteJob(jobId);
    toast({
        title: t.jobDeleted,
        description: t.jobDeletedAndData,
    });
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.role === 'client') {
        const clientJobs = jobs.filter(j => j.clientId === userToDelete.id);
        await Promise.all(clientJobs.map(job => 
            Promise.all([
                deleteMessagesByJobId(job.id),
                deleteProposalsByJobId(job.id),
                deleteReviewsByJobId(job.id),
            ])
        ));
        await deleteJobsByClientId(userToDelete.id);
    }
    
    if (userToDelete.role === 'freelancer') {
        await deleteProposalsByFreelancerId(userToDelete.id);
    }
    
    await Promise.all([
        deleteReviewsForUser(userToDelete.id),
        deleteDirectMessagesForUser(userToDelete.id),
    ]);
    
    await deleteUser(userToDelete.id);
    
    toast({
        title: t.userDeleted,
        description: t.userDeletedDesc.replace('{name}', userToDelete.name),
        variant: 'destructive',
    });
  };

  const handleApprove = async (userId: string) => {
    await approveVerification(userId);
    toast({ title: t.verificationApproved, description: t.verificationApprovedDesc });
    setReviewingUser(null);
  };

  const handleReject = async () => {
    if (!reviewingUser || !rejectionReason.trim()) {
        toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
        return;
    }
    await rejectVerification(reviewingUser.id, rejectionReason);
    toast({ title: t.verificationRejected, description: t.verificationRejectedDesc, variant: "destructive" });
    setReviewingUser(null);
    setIsRejecting(false);
    setRejectionReason('');
  };

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
  
  const getVerificationStatusVariant = (status: User['verificationStatus']) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'unverified': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
        case 'Visa':
        case 'Mastercard':
            return <CreditCard className="h-8 w-8 text-muted-foreground" />;
        case 'EVC Plus':
        case 'EDahab':
        case 'Zaad':
            return <Smartphone className="h-8 w-8 text-muted-foreground" />;
        default:
            return <Wallet className="h-8 w-8 text-muted-foreground" />;
    }
  }

  return (
    <div>
        <header className='mb-6'>
            <h1 className="text-3xl font-bold tracking-tight">{t.adminDashboard}</h1>
            <p className="text-muted-foreground mt-1">{t.adminDashboardDesc}</p>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analytics">{t.analytics}</TabsTrigger>
                <TabsTrigger value="users">{t.users}</TabsTrigger>
                <TabsTrigger value="jobs">{t.jobs}</TabsTrigger>
                <TabsTrigger value="verifications" className="relative">
                    {t.verifications}
                    {pendingVerifications.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{pendingVerifications.length}</Badge>
                    )}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="analytics" className="mt-6 space-y-6">
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">{t.platformBalance}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${platformBalance.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{t.fromCompletedJobs}</p>
                        </CardContent>
                        <CardFooter>
                            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button disabled={platformBalance <= 0}>
                                      <Banknote className="mr-2 h-4 w-4" />
                                      {t.withdrawToBank}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t.withdrawDialogTitle}</DialogTitle>
                                        <DialogDescription>{t.withdrawDialogDesc}</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleConfirmWithdrawal}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="withdraw-amount">{t.withdrawalAmount}</Label>
                                                <Input id="withdraw-amount" type="number" placeholder="e.g., 100.00" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t.withdrawTo}</Label>
                                                <RadioGroup value={selectedWithdrawalMethodId} onValueChange={setSelectedWithdrawalMethodId}>
                                                    {(adminUser?.paymentMethods || []).map(method => (
                                                        <div key={method.id} className="flex items-center space-x-2 border rounded-md p-3">
                                                            <RadioGroupItem value={method.id} id={`withdraw-${method.id}`} />
                                                            <Label htmlFor={`withdraw-${method.id}`} className="flex items-center gap-2 font-normal w-full cursor-pointer">
                                                                {getPaymentMethodIcon(method.type)}
                                                                {method.last4 ? (
                                                                    <span>{method.type} {t.endingIn} {method.last4}</span>
                                                                ) : (
                                                                    <span>{method.type} ({method.phoneNumber})</span>
                                                                )}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                                {(adminUser?.paymentMethods || []).length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center">{t.noPaymentMethodsAdmin}</p>
                                                )}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="ghost">{t.cancel}</Button>
                                            </DialogClose>
                                            <Button type="submit" disabled={(adminUser?.paymentMethods || []).length === 0}>{t.confirmWithdrawal}</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.revenueThisMonth}</CardTitle>
                             <div className="p-2 rounded-md bg-primary/20">
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${thisMonthRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{t.platformFeesThisMonth}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
                            <div className="p-2 rounded-md bg-info/20">
                                <Users className="h-4 w-4 text-info" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.filter(u => u.role !== 'admin').length}</div>
                            <p className="text-xs text-muted-foreground">{users.filter(u => u.role === 'client').length} {t.clients}, {users.filter(u => u.role === 'freelancer').length} {t.freelancers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.totalJobs}</CardTitle>
                            <div className="p-2 rounded-md bg-accent/20">
                                <Briefcase className="h-4 w-4 text-accent" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{jobs.length}</div>
                            <p className="text-xs text-muted-foreground">{jobs.filter(j => j.status === 'Completed').length} {t.completed.toLowerCase()}</p>
                        </CardContent>
                    </Card>
                </div>
                 <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
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
                                    <defs>
                                        <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                    </defs>
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
                                        cursor={false}
                                        content={<ChartTooltipContent formatter={(value) => `$${Number(value).toFixed(2)}`} />}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="url(#fillRevenue)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>{t.recentTransactions}</CardTitle>
                            <CardDescription>
                                {t.totalPlatformFees.replace('{count}', String(adminTransactions.length))}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-6">
                                {recentTransactionsWithUsers.map(tx => (
                                    <div key={tx.id} className="flex items-center">
                                        <Avatar className="h-9 w-9 border-2 border-transparent hover:border-primary transition-colors">
                                            <AvatarImage src={tx.user?.avatarUrl} alt="Avatar" />
                                            <AvatarFallback>{tx.user?.name.charAt(0) ?? 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{tx.user?.name ?? 'Unknown User'}</p>
                                            <p className="text-sm text-muted-foreground">{tx.description}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-success">+${tx.amount.toFixed(2)}</div>
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
                                    <TableHead>Verification</TableHead>
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
                                            <Badge variant={user.role === 'client' ? 'default' : 'secondary'}>{t[user.role as keyof typeof t] || user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getVerificationStatusVariant(user.verificationStatus)}>
                                                {t[user.verificationStatus as keyof typeof t] || user.verificationStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isBlocked ? 'destructive' : 'default'}>
                                                {user.isBlocked ? t.blocked : t.active}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="icon" onClick={() => setChattingWithUser(user)}>
                                                    <MessageCircle className="h-4 w-4" />
                                                    <span className="sr-only">Chat with {user.name}</span>
                                                </Button>
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
                                                        <DropdownMenuSeparator />
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                                    onSelect={(e) => e.preventDefault()}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>{t.deleteUser}</span>
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>{t.deleteUserConfirmTitle}</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {t.deleteUserConfirmDesc.replace('{name}', user.name)}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteUser(user)}
                                                                        className="bg-destructive hover:bg-destructive/90"
                                                                    >
                                                                        {t.deleteUser}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
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
                                    <TableHead className="text-right">Actions</TableHead>
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
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                      variant="outline"
                                                      size="icon"
                                                      onClick={() => setChattingJob(job)}
                                                      disabled={!job.hiredFreelancerId}
                                                      aria-label="View Chat"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                                        onSelect={(e) => e.preventDefault()}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        <span>{t.deleteJob}</span>
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>{t.deleteJobConfirmTitle}</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            {t.deleteJobConfirmDesc}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteJob(job.id)}
                                                                            className="bg-destructive hover:bg-destructive/90"
                                                                        >
                                                                            {t.deleteJob}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="verifications" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.verifications}</CardTitle>
                        <CardDescription>{t.verificationsDesc}</CardDescription>
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
                                {verificationSubmissions.length > 0 ? verificationSubmissions.map((user) => (
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
                                            <Badge variant={user.role === 'client' ? 'default' : 'secondary'}>{t[user.role as keyof typeof t] || user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getVerificationStatusVariant(user.verificationStatus)}>
                                                {t[user.verificationStatus as keyof typeof t] || user.verificationStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button onClick={() => setReviewingUser(user)}>{user.verificationStatus === 'pending' ? t.review : t.view}</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            {t.noVerificationSubmissions}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {chattingJob && (
            <ChatDialog
                job={chattingJob}
                isOpen={!!chattingJob}
                onClose={() => setChattingJob(null)}
            />
        )}
        {chattingWithUser && (
            <DirectChatDialog
                otherUser={chattingWithUser}
                isOpen={!!chattingWithUser}
                onClose={() => setChattingWithUser(null)}
            />
        )}
        {reviewingUser && (
            <Dialog open={!!reviewingUser} onOpenChange={(isOpen) => {
              if (!isOpen) {
                setReviewingUser(null);
                setIsRejecting(false);
                setRejectionReason('');
              }
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{reviewingUser.verificationStatus === 'pending' ? t.reviewVerificationTitle.replace('{name}', reviewingUser.name) : t.verificationDetailsTitle.replace('{name}', reviewingUser.name)}</DialogTitle>
                        <DialogDescription>{reviewingUser.email}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                        <h3 className="font-semibold">{t.submittedDocs}</h3>
                        {reviewingUser.passportOrIdUrl && (
                             <div className="space-y-2">
                                <Label>{t.idUploadTitle}</Label>
                                <div className="border rounded-lg p-2 space-y-2 bg-muted/50">
                                    {reviewingUser.passportOrIdUrl.startsWith('data:image') ? (
                                        <Image 
                                            src={reviewingUser.passportOrIdUrl} 
                                            alt="ID Document" 
                                            width={500} 
                                            height={300} 
                                            className="object-contain w-full h-auto rounded-md"
                                        />
                                    ) : (
                                        <div className="p-4 flex items-center gap-2 text-foreground">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                            <span className="font-medium">PDF Document</span>
                                        </div>
                                    )}
                                    <div className="flex justify-end pt-1">
                                        <Button asChild variant="outline" size="sm">
                                            <a href={reviewingUser.passportOrIdUrl} download={`id_doc_${reviewingUser.id}`}>
                                                <Download className="mr-2 h-4 w-4" />
                                                {t.download}
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                       
                        {reviewingUser.role === 'client' && reviewingUser.businessCertificateUrl && (
                            <div className="space-y-2">
                                <Label>{t.certUploadTitle}</Label>
                                <div className="border rounded-lg p-2 space-y-2 bg-muted/50">
                                    {reviewingUser.businessCertificateUrl.startsWith('data:image') ? (
                                        <Image 
                                            src={reviewingUser.businessCertificateUrl} 
                                            alt="Business Certificate" 
                                            width={500} 
                                            height={300} 
                                            className="object-contain w-full h-auto rounded-md"
                                        />
                                    ) : (
                                        <div className="p-4 flex items-center gap-2 text-foreground">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                            <span className="font-medium">PDF Document</span>
                                        </div>
                                    )}
                                    <div className="flex justify-end pt-1">
                                        <Button asChild variant="outline" size="sm">
                                            <a href={reviewingUser.businessCertificateUrl} download={`business_cert_${reviewingUser.id}`}>
                                                <Download className="mr-2 h-4 w-4" />
                                                {t.download}
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {reviewingUser.verificationStatus === 'pending' ? (
                            <>
                                <Button variant="ghost" onClick={() => { setReviewingUser(null); setIsRejecting(false); setRejectionReason('')}}>{t.cancel}</Button>
                                <AlertDialog open={isRejecting} onOpenChange={setIsRejecting}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">{t.reject}</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t.rejectVerificationTitle}</AlertDialogTitle>
                                            <AlertDialogDescription>{t.rejectVerificationDesc}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="py-2">
                                            <Textarea
                                                placeholder={t.rejectionReasonPlaceholder}
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleReject}>{t.confirmRejection}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button onClick={() => handleApprove(reviewingUser.id)}>{t.approve}</Button>
                            </>
                        ) : (
                            <Button onClick={() => { setReviewingUser(null); setIsRejecting(false); setRejectionReason('')}}>{t.closed}</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
