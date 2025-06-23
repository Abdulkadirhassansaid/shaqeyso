import type { User, Job, Proposal, FreelancerProfile, ClientProfile } from './types';

export const mockUsers: User[] = [
  {
    id: 'client-1',
    name: 'Farmaajo Inc.',
    email: 'client@example.com',
    avatarUrl: 'https://placehold.co/100x100/E8F5FF/000000.png?text=FI',
    role: 'client',
    password: 'password123',
  },
  {
    id: 'freelancer-1',
    name: 'Aisha Ahmed',
    email: 'aisha@example.com',
    avatarUrl: 'https://placehold.co/100x100/29ABE2/FFFFFF.png?text=AA',
    role: 'freelancer',
    password: 'password123',
  },
  {
    id: 'freelancer-2',
    name: 'Yusuf Ali',
    email: 'yusuf@example.com',
    avatarUrl: 'https://placehold.co/100x100/F9A825/000000.png?text=YA',
    role: 'freelancer',
    password: 'password123',
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
  },
  {
    id: 'job-2',
    title: 'Design a Mobile App for a Food Delivery Service',
    description: 'We need a creative UI/UX designer to design an intuitive and visually appealing mobile application for a new food delivery startup. The deliverables should include wireframes, mockups, and a design system.',
    category: 'Design',
    budget: 1800,
    deadline: '2024-09-15',
    clientId: 'client-1',
  },
  {
    id: 'job-3',
    title: 'Write Blog Content for a Tech Startup',
    description: 'Seeking a talented writer to produce high-quality blog posts about software development, AI, and cloud computing. Must be able to write in an engaging and informative style.',
    category: 'Writing',
    budget: 500,
    deadline: '2024-08-25',
    clientId: 'client-1',
  },
];

export const mockProposals: Proposal[] = [
    {
        id: 'prop-1',
        jobId: 'job-1',
        freelancerId: 'freelancer-1',
        coverLetter: "I am a perfect fit for this role. With over 5 years of experience in Next.js and Shopify, I've delivered high-performance e-commerce sites that drive sales. I can start immediately.",
        proposedRate: 60,
    },
    {
        id: 'prop-2',
        jobId: 'job-1',
        freelancerId: 'freelancer-2',
        coverLetter: "My portfolio speaks for itself. I specialize in creating seamless user experiences for e-commerce. I am confident I can build a website that exceeds your expectations.",
        proposedRate: 55,
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
