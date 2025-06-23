'use server';
/**
 * @fileOverview Recommends jobs to a freelancer based on their profile.
 *
 * This file exports:
 * - `recommendJobsForFreelancer`: An async function that recommends jobs.
 * - `RecommendJobsForFreelancerInput`: The input type for the function.
 * - `RecommendJobsForFreelancerOutput`: The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Job } from '@/lib/types';


export type RecommendJobsForFreelancerInput = {
    freelancerProfile: string;
    jobs: Job[];
};


const RecommendJobsForFreelancerOutputSchema = z.array(
  z.object({
    jobId: z.string().describe('The ID of the recommended job.'),
    rank: z.number().describe('A numerical ranking of the job match, with higher numbers indicating a better match.'),
    reason: z.string().describe('Reasoning behind the recommendation.'),
  })
).describe('An array of recommended jobs with their rankings.');
export type RecommendJobsForFreelancerOutput = z.infer<typeof RecommendJobsForFreelancerOutputSchema>;

// This is the exported function that the client will call.
export async function recommendJobsForFreelancer(input: RecommendJobsForFreelancerInput): Promise<RecommendJobsForFreelancerOutput> {
  const leanJobs = input.jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description
  }));
  
  const result = await recommendJobsFlow({
      freelancerProfile: input.freelancerProfile,
      jobs: leanJobs
  });

  return result;
}


// Internal schema for the flow itself, using only necessary data.
const FlowInputSchema = z.object({
    freelancerProfile: z.string().describe("The freelancer's profile, including skills and bio."),
    jobs: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string()
    })).describe('A list of available jobs with their IDs, titles, and descriptions.'),
});


const recommendJobsPrompt = ai.definePrompt({
  name: 'recommendJobsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: FlowInputSchema},
  output: {schema: RecommendJobsForFreelancerOutputSchema},
  prompt: `You are an expert career advisor for freelancers. Your task is to recommend the most suitable jobs for a freelancer based on their profile.
Analyze the provided freelancer profile and the list of available jobs.
For each job, provide a rank from 1-10 indicating how good of a match it is (10 being a perfect match).
Also provide a concise reason for your recommendation.
Only return jobs that are a good match (rank 6 or higher).

Freelancer Profile:
{{{freelancerProfile}}}

Available Jobs:
{{#each jobs}}
- Job ID: {{{this.id}}}
  Title: {{{this.title}}}
  Description: {{{this.description}}}
{{/each}}
`,
});

const recommendJobsFlow = ai.defineFlow(
  {
    name: 'recommendJobsFlow',
    inputSchema: FlowInputSchema,
    outputSchema: RecommendJobsForFreelancerOutputSchema,
  },
  async input => {
    try {
      const {output} = await recommendJobsPrompt(input);
      // The output can be null if the model has nothing to return.
      // We return an empty array if output is null or undefined.
      return output || [];
    } catch (error) {
      console.error('Error in recommendJobsFlow:', error);
      // On failure (e.g., model overloaded), return an empty array to prevent crashing.
      return [];
    }
  }
);
