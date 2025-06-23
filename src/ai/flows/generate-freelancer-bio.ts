'use server';
/**
 * @fileOverview AI-powered freelancer bio generator.
 *
 * - generateFreelancerBio - A function that generates a professional freelancer bio.
 * - GenerateFreelancerBioInput - The input type for the generateFreelancerBio function.
 * - GenerateFreelancerBioOutput - The return type for the generateFreelancerBio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFreelancerBioInputSchema = z.object({
  name: z.string().describe("The name of the freelancer."),
  skills: z.array(z.string()).describe("A list of the freelancer's skills."),
});
export type GenerateFreelancerBioInput = z.infer<
  typeof GenerateFreelancerBioInputSchema
>;

const GenerateFreelancerBioOutputSchema = z.object({
  bio: z.string().describe('A professional bio for the freelancer.'),
});
export type GenerateFreelancerBioOutput = z.infer<
  typeof GenerateFreelancerBioOutputSchema
>;

export async function generateFreelancerBio(
  input: GenerateFreelancerBioInput
): Promise<GenerateFreelancerBioOutput> {
  return generateFreelancerBioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFreelancerBioPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateFreelancerBioInputSchema},
  output: {schema: GenerateFreelancerBioOutputSchema},
  prompt: `You are an expert career coach who helps freelancers write compelling bios.
Given the freelancer's name and skills, generate a professional and engaging bio in 2-3 short paragraphs.
The bio should highlight their key skills and present them as a competent professional.
Do not use any markdown formatting like ** for bold text.

Freelancer Name: {{{name}}}
Skills:
{{#each skills}}
- {{{this}}}
{{/each}}
`,
});

const generateFreelancerBioFlow = ai.defineFlow(
  {
    name: 'generateFreelancerBioFlow',
    inputSchema: GenerateFreelancerBioInputSchema,
    outputSchema: GenerateFreelancerBioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
