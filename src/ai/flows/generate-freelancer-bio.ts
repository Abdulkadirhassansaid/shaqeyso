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
): Promise<{ success: true, data: GenerateFreelancerBioOutput } | { success: false, error: string }> {
  try {
    const result = await generateFreelancerBioFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI flow 'generateFreelancerBioFlow' failed:", error);
    return { success: false, error: 'AI generation not available now' };
  }
}

const prompt = ai.definePrompt({
  name: 'generateFreelancerBioPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateFreelancerBioInputSchema},
  output: {schema: GenerateFreelancerBioOutputSchema},
  prompt: `You are writing a bio for a freelancer named {{{name}}}.
Adopt the persona of the freelancer. Write in the first person ("I am...", "My skills include...").
Use a short, powerful, and human-like tone.

The bio MUST follow this structure:
1. A brief introductory sentence.
2. A list of key strengths or accomplishments using bullet points.

IMPORTANT FORMATTING RULES:
- Use a hyphen (-) for bullet points.
- Do NOT use any other markdown formatting like ** for bold text.
- Do NOT merge the introductory sentence and the bullet points into a single paragraph.

Here are the freelancer's details:
Name: {{{name}}}
Skills:
{{#each skills}}
- {{{this}}}
{{/each}}

Generate a compelling bio based on these instructions.
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
