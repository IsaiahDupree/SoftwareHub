import { z } from 'zod';

export const CreatePackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  tagline: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.enum(['LOCAL_AGENT', 'CLOUD_APP']),
  requires_macos: z.boolean().optional().default(false),
  min_os_version: z.string().optional().nullable(),
  download_url: z.string().url().optional().nullable(),
  web_app_url: z.string().url().optional().nullable(),
  status: z.enum(['operational', 'degraded', 'down', 'maintenance']).optional().default('operational'),
  status_message: z.string().optional().nullable(),
  status_check_url: z.string().url().optional().nullable(),
  stripe_product_id: z.string().optional().nullable(),
  stripe_price_id: z.string().optional().nullable(),
  price_cents: z.number().int().min(0).optional().nullable(),
  icon_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  screenshots: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  requirements: z.record(z.unknown()).optional().default({}),
  related_course_id: z.string().uuid().optional().nullable(),
  documentation_url: z.string().url().optional().nullable(),
  support_url: z.string().url().optional().nullable(),
  is_published: z.boolean().optional().default(false),
  is_featured: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const UpdatePackageSchema = CreatePackageSchema.partial().omit({ slug: true });

export const CreateReleaseSchema = z.object({
  package_id: z.string().uuid('Invalid package ID'),
  version: z.string().min(1, 'Version is required').regex(/^\d+\.\d+\.\d+/, 'Version must be semver format (e.g. 1.0.0)'),
  channel: z.enum(['stable', 'beta', 'alpha', 'dev']).optional().default('stable'),
  download_url: z.string().url('Download URL is required'),
  file_name: z.string().optional().nullable(),
  file_size_bytes: z.number().int().min(0).optional().nullable(),
  checksum_sha256: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  release_notes: z.string().optional().nullable(),
  release_notes_html: z.string().optional().nullable(),
  breaking_changes: z.array(z.string()).optional().nullable(),
  highlights: z.array(z.string()).optional().nullable(),
  min_os_version: z.string().optional().nullable(),
  supported_architectures: z.array(z.string()).optional().default(['arm64', 'x86_64']),
  is_current: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(false),
});

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;
export type CreateReleaseInput = z.infer<typeof CreateReleaseSchema>;
