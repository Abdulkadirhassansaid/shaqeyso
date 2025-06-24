'use server';
/**
 * @fileOverview AI-powered service description generator for freelancers.
 *
 * - generateServiceDescription - A function that generates a service description.
 * - GenerateServiceDescriptionInput - The input type for the function.
 * - GenerateServiceDescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateServiceDescriptionInputSchema = z.object({
  title: z.string().describe("The title of the freelancer's service."),
});
export type GenerateServiceDescriptionInput = z.infer<
  typeof GenerateServiceDescriptionInputSchema
>;

const GenerateServiceDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling description for the service.'),
});
export type GenerateServiceDescriptionOutput = z.infer<
  typeof GenerateServiceDescriptionOutputSchema
>;

export async function generateServiceDescription(
  input: GenerateServiceDescriptionInput
): Promise<GenerateServiceDescriptionOutput> {
  return generateServiceDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateServiceDescriptionPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateServiceDescriptionInputSchema},
  output: {schema: GenerateServiceDescriptionOutputSchema},
  prompt: `You are an expert copywriter helping a freelancer create a compelling service description.
Given the service title, write a short and persuasive description (around 2-3 sentences) that clearly explains the value proposition to a potential client.
Focus on the benefits the client will receive.

Service Title: {{{title}}}
`,
});

const generateServiceDescriptionFlow = ai.defineFlow(
  {
    name: 'generateServiceDescriptionFlow',
    inputSchema: GenerateServiceDescriptionInputSchema,
    outputSchema: GenerateServiceDescriptionOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error("AI flow 'generateServiceDescriptionFlow' failed:", error);
      throw new Error("The AI service is currently unavailable. Please try again later.");
    }
  }
);
