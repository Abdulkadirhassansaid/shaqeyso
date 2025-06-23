import { config } from 'dotenv';
config();

import '@/ai/flows/assist-proposal-generation.ts';
import '@/ai/flows/rank-matching-freelancers.ts';
import '@/ai/flows/generate-job-description.ts';