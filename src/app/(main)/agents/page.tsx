import { ensureSession } from '@/app/auth/rsc';
import { redirect } from 'next/navigation';

export default async function AgentsOnboardingPage() {
  const session = await ensureSession();
  const { default_project: defaultProjectId } = session.userProfile;

  redirect(`/${defaultProjectId}/?agents-onboarding`);
}
