
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'client' | 'freelancer';
  password?: string;
  balance?: number;
  paymentMethods?: PaymentMethod[];
  transactions?: Transaction[];
};

export type SubmittedFile = {
  name: string;
  url: string; // For simulation, this will be a placeholder or blob URL
  type: string;
  size: number;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  clientId: string;
  status: 'Open' | 'Interviewing' | 'InProgress' | 'AwaitingApproval' | 'Completed';
  hiredFreelancerId?: string;
  submittedFiles?: SubmittedFile[];
};

export type Proposal = {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  status: 'Pending' | 'Accepted' | 'Rejected';
};

export type FreelancerProfile = {
  userId: string;
  skills: string[];
  hourlyRate: number;
  bio: string;
  portfolio: string[]; // urls to images
};

export type ClientProfile = {
  userId: string;
  companyName: string;
  projectsPosted: string[]; // array of job IDs
};

export type RankedFreelancer = {
  profile: string;
  proposal: string;
  rank: number;
  reason: string;
  originalProposal: Proposal;
};

export type PaymentMethod = {
  id: string;
  type: 'Visa' | 'Mastercard' | 'EVC Plus' | 'EDahab' | 'Zaad';
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  phoneNumber?: string;
  isPrimary: boolean;
};

export type Transaction = {
  id: string;
  date: string; // ISO date string
  description: string;
  amount: number; // positive for income, negative for withdrawal/fee
  status: 'Completed' | 'Pending' | 'Failed';
};

export type Message = {
    id: string;
    jobId: string;
    senderId: string;
    text?: string;
    files?: SubmittedFile[];
    timestamp: string; // ISO date string
};
