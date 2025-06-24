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
import {
  recommendJobsForFreelancer as recommendJobs,
  type RecommendJobsForFreelancerInput,
  type RecommendJobsForFreelancerOutput,
} from '@/ai/flows/recommend-jobs-for-freelancer';
import {
  generateServiceDescription as genServiceDesc,
  type GenerateServiceDescriptionInput,
  type GenerateServiceDescriptionOutput,
} from '@/ai/flows/generate-service-description';

export async function generateJobDescription(
  input: GenerateJobDescriptionInput
): Promise<{ success: true, data: GenerateJobDescriptionOutput } | { success: false, error: string }> {
  return await genJobDesc(input);
}

export async function assistProposalGeneration(
  input: AssistProposalGenerationInput
): Promise<{ success: true, data: AssistProposalGenerationOutput } | { success: false, error: string }> {
  return await assistProp(input);
}

export async function rankMatchingFreelancers(
  input: RankMatchingFreelancersInput
): Promise<{ success: true, data: RankMatchingFreelancersOutput } | { success: false, error: string }> {
  return await rankFreelancers(input);
}

export async function generateFreelancerBio(
  input: GenerateFreelancerBioInput
): Promise<{ success: true, data: GenerateFreelancerBioOutput } | { success: false, error: string }> {
  return await genBio(input);
}

export async function recommendJobsForFreelancer(
  input: RecommendJobsForFreelancerInput
): Promise<{ success: true, data: RecommendJobsForFreelancerOutput } | { success: false, error: string }> {
  return await recommendJobs(input);
}

export async function generateServiceDescription(
  input: GenerateServiceDescriptionInput
): Promise<{ success: true, data: GenerateServiceDescriptionOutput } | { success: false, error: string }> {
  return await genServiceDesc(input);
}
