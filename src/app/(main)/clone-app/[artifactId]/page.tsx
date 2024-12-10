import { ensureSession } from '@/app/auth/rsc';
import { redirect } from 'next/navigation';

interface Props {
  params: {
    artifactId: string;
  };
  searchParams: { token?: string };
}

export default async function CloneAppPage({
  params: { artifactId },
  searchParams: { token },
}: Props) {
  const session = await ensureSession();
  const { default_project: defaultProjectId } = session.userProfile;

  redirect(
    `/${defaultProjectId}/apps/builder/clone/${artifactId}?token=${token}`,
  );
}
