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

export async function recommendJobsForFreelancer(
  input: RecommendJobsForFreelancerInput
): Promise<RecommendJobsForFreelancerOutput> {
  return await recommendJobs(input);
}

export async function generateServiceDescription(
  input: GenerateServiceDescriptionInput
): Promise<GenerateServiceDescriptionOutput> {
  return await genServiceDesc(input);
}
