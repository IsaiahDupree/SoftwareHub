import { supabaseAdmin } from '@/lib/supabase/admin';

interface CreateActivityInput {
  type: string;
  title: string;
  body?: string;
  package_id?: string;
  user_id?: string;
  visibility?: 'public' | 'private';
  is_pinned?: boolean;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export async function createActivity(input: CreateActivityInput) {
  const { error } = await supabaseAdmin.from('activity_feed').insert({
    type: input.type,
    title: input.title,
    body: input.body || null,
    package_id: input.package_id || null,
    user_id: input.user_id || null,
    visibility: input.visibility || 'public',
    is_pinned: input.is_pinned || false,
    action_url: input.action_url || null,
    action_label: input.action_label || null,
    expires_at: input.expires_at || null,
    metadata: input.metadata || null,
  });

  if (error) {
    console.error('Error creating activity:', error);
  }

  return !error;
}

export async function createReleaseActivity(
  packageId: string,
  packageName: string,
  packageSlug: string,
  version: string,
  releaseNotes?: string
) {
  const notesSummary = releaseNotes
    ? releaseNotes.length > 200
      ? releaseNotes.slice(0, 200) + '...'
      : releaseNotes
    : null;

  return createActivity({
    type: 'release',
    title: `${packageName} v${version} released`,
    body: notesSummary,
    package_id: packageId,
    action_url: `/app/packages/${packageSlug}/changelog`,
    action_label: 'View changelog',
  });
}

export async function createStatusChangeActivity(
  packageId: string,
  packageName: string,
  newStatus: string,
  message?: string
) {
  const isUp = newStatus === 'operational';
  const title = isUp
    ? `${packageName} is back online`
    : `${packageName} is experiencing ${newStatus === 'degraded' ? 'degraded performance' : newStatus}`;

  return createActivity({
    type: 'status_change',
    title,
    body: message || null,
    package_id: packageId,
  });
}
