'use server';
/**
 * @fileOverview Ranks freelancers based on their suitability for a given job.
 *
 * This file exports:
 * - `rankMatchingFreelancers`: An async function that ranks freelancers based on job requirements.
 * - `RankMatchingFreelancersInput`: The input type for the rankMatchingFreelancers function.
 * - `RankMatchingFreelancersOutput`: The output type for the rankMatchingFreelancers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RankMatchingFreelancersInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  freelancerProfiles: z.array(
    z.object({
      profile: z.string().describe('The freelancer profile details, including skills, experience, and rates.'),
      proposal: z.string().describe('The freelancer proposal for the job.'),
    })
  ).describe('An array of freelancer profiles and proposals.'),
});
export type RankMatchingFreelancersInput = z.infer<typeof RankMatchingFreelancersInputSchema>;

const RankMatchingFreelancersOutputSchema = z.array(
  z.object({
    profile: z.string().describe('The freelancer profile details, including skills, experience, and rates.'),
    proposal: z.string().describe('The freelancer proposal for the job.'),
    rank: z.number().describe('A numerical ranking of the freelancer, with higher numbers indicating a better match.'),
    reason: z.string().describe('Reasoning behind the rank.'),
  })
).describe('An array of freelancer profiles and their rankings for the job.');
export type RankMatchingFreelancersOutput = z.infer<typeof RankMatchingFreelancersOutputSchema>;

export async function rankMatchingFreelancers(input: RankMatchingFreelancersInput): Promise<RankMatchingFreelancersOutput> {
  return rankMatchingFreelancersFlow(input);
}

const rankMatchingFreelancersPrompt = ai.definePrompt({
  name: 'rankMatchingFreelancersPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {schema: RankMatchingFreelancersInputSchema},
  output: {schema: RankMatchingFreelancersOutputSchema},
  prompt: `You are an expert in matching freelancers to jobs. Given a job description and a list of freelancer profiles and proposals, rank the freelancers based on how well they fit the job requirements. Provide the reason for the rank for each freelancer.

Job Description: {{{jobDescription}}}

Freelancer Profiles:
{{#each freelancerProfiles}}
  Profile: {{{this.profile}}}
  Proposal: {{{this.proposal}}}
{{/each}}`,
});

const rankMatchingFreelancersFlow = ai.defineFlow(
  {
    name: 'rankMatchingFreelancersFlow',
    inputSchema: RankMatchingFreelancersInputSchema,
    outputSchema: RankMatchingFreelancersOutputSchema,
  },
  async input => {
    const {output} = await rankMatchingFreelancersPrompt(input);
    return output!;
  }
);
