'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/assist-proposal-generation.ts';
import '@/ai/flows/rank-matching-freelancers.ts';
import '@/ai/flows/generate-job-description.ts';
import '@/ai/flows/generate-freelancer-bio.ts';
import '@/ai/flows/recommend-jobs-for-freelancer.ts';
import '@/ai/flows/generate-service-description.ts';
