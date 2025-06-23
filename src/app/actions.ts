'use server';

import {
  generateJobDescription as genJobDesc,
  type GenerateJobDescriptionInput,
  type GenerateJobDescriptionOutput,
} from '@/ai/flows/generate-job-description';
import {
  assistProposalGeneration as assistProp,
  type AssistProposalGenerationInput,
  type AssistProposalGenerationOutput,
} from '@/ai/flows/assist-proposal-generation';
import {
  rankMatchingFreelancers as rankFreelancers,
  type RankMatchingFreelancersInput,
  type RankMatchingFreelancersOutput,
} from '@/ai/flows/rank-matching-freelancers';
import {
  generateFreelancerBio as genBio,
  type GenerateFreelancerBioInput,
  type GenerateFreelancerBioOutput,
} from '@/ai/flows/generate-freelancer-bio';

export async function generateJobDescription(
  input: GenerateJobDescriptionInput
): Promise<GenerateJobDescriptionOutput> {
  return await genJobDesc(input);
}

export async function assistProposalGeneration(
  input: AssistProposalGenerationInput
): Promise<AssistProposalGenerationOutput> {
  return await assistProp(input);
}

export async function rankMatchingFreelancers(
  input: RankMatchingFreelancersInput
): Promise<RankMatchingFreelancersOutput> {
  return await rankFreelancers(input);
}

export async function generateFreelancerBio(
  input: GenerateFreelancerBioInput
): Promise<GenerateFreelancerBioOutput> {
  return await genBio(input);
}
