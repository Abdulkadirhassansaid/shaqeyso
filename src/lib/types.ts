export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'client' | 'freelancer';
  password?: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  clientId: string;
  proposals?: Proposal[];
};

export type Proposal = {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
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
};
