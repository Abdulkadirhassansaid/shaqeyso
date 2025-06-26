
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'client' | 'freelancer' | 'admin';
  paymentMethods?: PaymentMethod[];
  transactions?: Transaction[];
  isBlocked?: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationRejectionReason?: string;
  verificationDocumentType?: 'personalId' | 'businessCertificate';
  passportOrIdUrl?: string; // This will hold the data URL
  businessCertificateUrl?: string; // This will hold the data URL
  directMessageReadTimestamps?: { [conversationPartnerId: string]: string };
};

export type Job = {
  id:string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  clientId: string;
  status: 'Open' | 'Interviewing' | 'InProgress' | 'Completed';
  hiredFreelancerId?: string;
  clientReviewed?: boolean;
  freelancerReviewed?: boolean;
  postedDate: string;
  sourceServiceId?: string;
  sourceServiceTitle?: string;
  lastMessageTimestamp?: string;
  lastMessageSenderId?: string;
  lastReadBy?: { [userId: string]: string };
};

export type Proposal = {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  status: 'Pending' | 'Accepted' | 'Rejected';
};

export type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  deliveryTime: number; // in days
  fastDelivery?: {
    days: number;
    price: number;
  };
  images?: string[];
};

export type FreelancerProfile = {
  userId: string;
  skills: string[];
  hourlyRate: number;
  bio: string;
  portfolio: string[]; // urls to images
  services?: Service[];
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

export type SubmittedFile = {
    name: string;
    url: string;
    type: string;
    size: number;
}

export type Message = {
    id: string;
    senderId: string;
    text?: string;
    files?: SubmittedFile[];
    timestamp: string; // ISO date string
};

export type Review = {
    id: string;
    jobId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number; // 1-5
    comment: string;
    date: string; // ISO date string
};

export type DirectMessage = {
    id: string;
    participantIds: string[]; // [adminId, userId]
    senderId: string;
    text: string;
    timestamp: string; // ISO date string
};
