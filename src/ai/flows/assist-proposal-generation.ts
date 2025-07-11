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
): Promise<{success: true, data: AssistProposalGenerationOutput } | { success: false, error: string }> {
  try {
    const result = await assistProposalGenerationFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI flow 'assistProposalGenerationFlow' failed:", error);
    return { success: false, error: 'AI generation not available now' };
  }
}

const assistProposalGenerationPrompt = ai.definePrompt({
  name: 'assistProposalGenerationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: AssistProposalGenerationInputSchema},
  output: {schema: AssistProposalGenerationOutputSchema},
  prompt: `You are a freelancer writing a compelling proposal for a job.
Adopt the persona of the freelancer. Write in the first person.
Use a short, powerful, and human-like tone.

The proposal MUST follow this structure:
1. A brief opening that directly addresses the client's needs from the job description.
2. Highlight your most relevant skills and experience from your profile.
3. A section with the heading "My Plan".
4. Under that heading, propose a few concrete steps to complete the job using bullet points. Include an estimated timeframe for the work.

IMPORTANT FORMATTING RULES:
- Do not use any markdown formatting like ** for bold text. Use hyphens (-) for bullet points.
- Do not introduce yourself with "Hello" or "Hi". Get straight to the point.
- Do not end with a generic closing like "I look forward to hearing from you".

Job Description: {{{jobDescription}}}
Freelancer Profile: {{{freelancerProfile}}}

Write a proposal that is likely to get you hired.
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
