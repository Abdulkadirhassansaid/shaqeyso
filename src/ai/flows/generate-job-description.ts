'use server';
/**
 * @fileOverview AI-powered job description generator.
 *
 * - generateJobDescription - A function that generates a detailed job description from a short prompt.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJobDescriptionInputSchema = z.object({
  prompt: z.string().describe('A short prompt describing the job.'),
});
export type GenerateJobDescriptionInput = z.infer<
  typeof GenerateJobDescriptionInputSchema
>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('A detailed job description.'),
});
export type GenerateJobDescriptionOutput = z.infer<
  typeof GenerateJobDescriptionOutputSchema
>;

export async function generateJobDescription(
  input: GenerateJobDescriptionInput
): Promise<{ success: true, data: GenerateJobDescriptionOutput } | { success: false, error: string }> {
  try {
    const result = await generateJobDescriptionFlow(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI flow 'generateJobDescriptionFlow' failed:", error);
    return { success: false, error: 'AI generation not available now' };
  }
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: GenerateJobDescriptionOutputSchema},
  prompt: `You are an expert job description writer. Given a short prompt, you will generate a detailed and appealing job description.
Do not use markdown formatting like ** for bold text. Instead of bolding, use plain text for headings.
For any lists, use a hyphen (-) as a bullet point.
Do not include a "How to Apply" section, contact information, or any generic company boilerplate about equal opportunity employment. The application process is handled by the platform.

Prompt: {{{prompt}}}`,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
