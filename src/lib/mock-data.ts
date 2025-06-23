
import type { User, Job, Proposal, FreelancerProfile, ClientProfile, Message, Review, Transaction, DirectMessage } from './types';

export const mockUsers: User[] = [
  {
    id: 'client-1',
    name: 'Farmaajo Inc.',
    email: 'client@example.com',
    avatarUrl: 'https://placehold.co/100x100/E8F5FF/000000.png?text=FI',
    role: 'client',
    password: 'password123',
    paymentMethods: [
      { id: 'pm-1', type: 'Visa', last4: '4242', expiryMonth: 12, expiryYear: 2026, isPrimary: true },
      { id: 'pm-c1', type: 'EVC Plus', phoneNumber: '611234567', isPrimary: false },
    ],
    transactions: [
      { id: 'txn-c0', date: '2024-07-01T09:00:00Z', description: 'Initial account funding', amount: 5000, status: 'Completed' },
      { id: 'txn-c1', date: '2024-07-20T10:00:00Z', description: 'Payment for "E-commerce Website"', amount: -2500, status: 'Completed' },
      { id: 'txn-c2', date: '2024-07-15T11:30:00Z', description: 'Payment for "Mobile App Design"', amount: -1800, status: 'Completed' },
      { id: 'txn-c3', date: '2024-07-05T14:00:00Z', description: 'Payment for "Blog Content"', amount: -500, status: 'Completed' },
    ],
    isBlocked: false,
  },
  {
    id: 'freelancer-1',
    name: 'Aisha Ahmed',
    email: 'aisha@example.com',
    avatarUrl: 'https://placehold.co/100x100/29ABE2/FFFFFF.png?text=AA',
    role: 'freelancer',
    password: 'password123',
    paymentMethods: [
      { id: 'pm-2', type: 'Visa', last4: '1234', expiryMonth: 8, expiryYear: 2025, isPrimary: true },
      { id: 'pm-f1', type: 'EDahab', phoneNumber: '621234567', isPrimary: false },
    ],
    transactions: [
      { id: 'txn-f1', date: '2024-07-20T10:00:00Z', description: 'Payment for "E-commerce Website"', amount: 2375, status: 'Completed' },
      { id: 'txn-f2', date: '2024-07-18T09:00:00Z', description: 'Withdrawal to Bank Account', amount: -1500, status: 'Completed' },
      { id: 'txn-f3', date: '2024-07-15T11:30:00Z', description: 'Payment for "Mobile App Design"', amount: 1710, status: 'Completed' },
      { id: 'txn-f5', date: '2024-07-05T14:00:00Z', description: 'Payment for "Blog Content"', amount: 475, status: 'Completed' },
    ],
    isBlocked: false,
  },
  {
    id: 'freelancer-2',
    name: 'Yusuf Ali',
    email: 'yusuf@example.com',
    avatarUrl: 'https://placehold.co/100x100/F9A825/000000.png?text=YA',
    role: 'freelancer',
    password: 'password123',
    paymentMethods: [],
    transactions: [],
    isBlocked: true,
  },
   {
    id: 'admin-1',
    name: 'Admin User',
    email: 'abdikadirhassan2015@gmail.com',
    avatarUrl: 'https://placehold.co/100x100/1a1a1a/ffffff.png?text=A',
    role: 'admin',
    password: 'Mahir4422',
    transactions: [
      { id: 'txn-a1', date: '2024-07-20T10:00:00Z', description: 'Platform Fee for "E-commerce Website"', amount: 125, status: 'Completed' },
      { id: 'txn-a2', date: '2024-07-15T11:30:00Z', description: 'Platform Fee for "Mobile App Design"', amount: 90, status: 'Completed' },
      { id: 'txn-a3', date: '2024-07-05T14:00:00Z', description: 'Platform Fee for "Blog Content"', amount: 25, status: 'Completed' },
    ],
    isBlocked: false,
  },
];

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Build a Modern E-commerce Website',
    description: 'We are looking for a skilled developer to build a responsive and fast e-commerce platform using Next.js and Shopify. The ideal candidate has experience with modern frontend technologies and API integrations.',
    category: 'Web Development',
    budget: 2500,
    deadline: '2024-08-30',
    clientId: 'client-1',
    status: 'Open',
    clientReviewed: false,
    freelancerReviewed: false,
    postedDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: 'job-2',
    title: 'Design a Mobile App for a Food Delivery Service',
    description: 'We need a creative UI/UX designer to design an intuitive and visually appealing mobile application for a new food delivery startup. The deliverables should include wireframes, mockups, and a design system.',
    category: 'Design',
    budget: 1800,
    deadline: '2024-09-15',
    clientId: 'client-1',
    status: 'Open',
    clientReviewed: false,
    freelancerReviewed: false,
    postedDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'job-3',
    title: 'Write Blog Content for a Tech Startup',
    description: 'Seeking a talented writer to produce high-quality blog posts about software development, AI, and cloud computing. Must be able to write in an engaging and informative style.',
    category: 'Writing',
    budget: 500,
    deadline: '2024-08-25',
    clientId: 'client-1',
    status: 'InProgress',
    hiredFreelancerId: 'freelancer-1',
    clientReviewed: false,
    freelancerReviewed: false,
    postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
];

export const mockProposals: Proposal[] = [
    {
        id: 'prop-1',
        jobId: 'job-1',
        freelancerId: 'freelancer-1',
        coverLetter: "I am a perfect fit for this role. With over 5 years of experience in Next.js and Shopify, I've delivered high-performance e-commerce sites that drive sales. I can start immediately.",
        proposedRate: 60,
        status: 'Pending',
    },
    {
        id: 'prop-2',
        jobId: 'job-1',
        freelancerId: 'freelancer-2',
        coverLetter: "My portfolio speaks for itself. I specialize in creating seamless user experiences for e-commerce. I am confident I can build a website that exceeds your expectations.",
        proposedRate: 55,
        status: 'Pending',
    }
];

export const mockFreelancerProfiles: FreelancerProfile[] = [
    {
        userId: 'freelancer-1',
        skills: ['React', 'Next.js', 'TypeScript', 'Shopify', 'Tailwind CSS'],
        hourlyRate: 60,
        bio: 'Senior frontend developer specializing in building fast and beautiful e-commerce websites.',
        portfolio: [],
    },
    {
        userId: 'freelancer-2',
        skills: ['React', 'Vue.js', 'Node.js', 'UI/UX Design'],
        hourlyRate: 55,
        bio: 'Full-stack developer with a passion for clean code and intuitive design.',
        portfolio: [],
    }
];

export const mockClientProfiles: ClientProfile[] = [
    {
        userId: 'client-1',
        companyName: 'Farmaajo Inc.',
        projectsPosted: ['job-1', 'job-2', 'job-3'],
    }
];

export const mockMessages: Message[] = [
    {
        id: 'msg-1',
        jobId: 'job-3',
        senderId: 'client-1',
        text: 'Hi Aisha, how is the project coming along? Do you have any updates for me?',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
    {
        id: 'msg-2',
        jobId: 'job-3',
        senderId: 'freelancer-1',
        text: "Hi! It's going well. I've completed the first draft of the blog posts. I'll be submitting them for your review shortly.",
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
    },
];

export const mockReviews: Review[] = [
    {
        id: 'review-1',
        jobId: 'job-2',
        reviewerId: 'client-1',
        revieweeId: 'freelancer-1',
        rating: 5,
        comment: 'Aisha was fantastic to work with. She delivered high-quality designs ahead of schedule and was very responsive to feedback.',
        date: '2024-07-16T10:00:00Z',
    },
];

export const mockDirectMessages: DirectMessage[] = [
  {
    id: 'dm-1',
    participantIds: ['admin-1', 'freelancer-1'],
    senderId: 'admin-1',
    text: 'Hi Aisha, I just wanted to check in and see how you are finding the platform.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'dm-2',
    participantIds: ['admin-1', 'freelancer-1'],
    senderId: 'freelancer-1',
    text: "Hi Admin! Thanks for checking in. It's been great so far, I've already found a project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), // 23 hours ago
  }
];
