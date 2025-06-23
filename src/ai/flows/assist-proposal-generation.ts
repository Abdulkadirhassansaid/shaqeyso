'use server';

/**
 * @fileOverview This file defines a Genkit flow for assisting freelancers in generating better proposals.
 *
 * The flow takes a job description and freelancer profile as input and returns an AI-assisted proposal.
 * @fileOverview AI-assisted proposal generation for freelancers to improve their chances of being hired.
 * - `assistProposalGeneration`: A function that generates a proposal based on job description and freelancer profile.
 * - `AssistProposalGenerationInput`: The input type for the `assistProposalGeneration` function.
 * - `AssistProposalGenerationOutput`: The return type for the `assistProposalGeneration` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssistProposalGenerationInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The description of the job the freelancer is applying for.'),
  freelancerProfile: z
    .string()
    .describe('The profile of the freelancer applying for the job, including skills and experience.'),
});
export type AssistProposalGenerationInput = z.infer<
  typeof AssistProposalGenerationInputSchema
>;

const AssistProposalGenerationOutputSchema = z.object({
  proposal: z
    .string()
    .describe('The AI-assisted proposal generated for the freelancer.'),
});
export type AssistProposalGenerationOutput = z.infer<
  typeof AssistProposalGenerationOutputSchema
>;

export async function assistProposalGeneration(
  input: AssistProposalGenerationInput
): Promise<AssistProposalGenerationOutput> {
  return assistProposalGenerationFlow(input);
}

const assistProposalGenerationPrompt = ai.definePrompt({
  name: 'assistProposalGenerationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: AssistProposalGenerationInputSchema},
  output: {schema: AssistProposalGenerationOutputSchema},
  prompt: `You are an AI assistant helping freelancers write compelling proposals.
Do not use any markdown formatting like ** for bold text. For any lists of steps or points, use a hyphen (-) for bullet points.

Based on the job description and the freelancer's profile, generate a proposal that highlights the freelancer's relevant skills and experience, and addresses the client's needs.

Job Description: {{{jobDescription}}}
Freelancer Profile: {{{freelancerProfile}}}

Write a proposal that is likely to get the freelancer hired.
Focus on the needs of the client as described in the job description.
Propose a few concrete steps to take to complete the job, and include an estimated timeframe.
Include at least three paragraphs.
Do not introduce yourself.
Do not ask the client to reach out to you.
`,
});

const assistProposalGenerationFlow = ai.defineFlow(
  {
    name: 'assistProposalGenerationFlow',
    inputSchema: AssistProposalGenerationInputSchema,
    outputSchema: AssistProposalGenerationOutputSchema,
  },
  async input => {
    const {output} = await assistProposalGenerationPrompt(input);
    return output!;
  }
);
