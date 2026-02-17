import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const ContactSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.enum(['manual', 'csv_import', 'vcard', 'api']).default('manual'),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

const BulkImportSchema = z.object({
  contacts: z.array(ContactSchema),
  source: z.enum(['csv_import', 'vcard']).default('csv_import'),
});

// GET /api/crm/contacts?workspace=slug&page=1&limit=50&search=name (CRM-003)
export async function GET(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceSlug = searchParams.get('workspace');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const search = searchParams.get('search') ?? '';
  const offset = (page - 1) * limit;

  // Verify user owns workspace
  const { data: tenant } = await supabase
    .from('crm_tenants')
    .select('id')
    .eq('user_id', user.id)
    .eq('workspace_slug', workspaceSlug ?? '')
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  let query = supabase
    .from('crm_contacts')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .order('warmth_score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }

  const { data: contacts, count, error } = await query;

  if (error) {
    console.error('CRM contacts query error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }

  return NextResponse.json({
    contacts,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

// POST /api/crm/contacts - Create or bulk import contacts (CRM-006)
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceSlug = searchParams.get('workspace');
  const isBulk = searchParams.get('bulk') === 'true';

  // Verify user owns workspace
  const { data: tenant } = await supabase
    .from('crm_tenants')
    .select('id')
    .eq('user_id', user.id)
    .eq('workspace_slug', workspaceSlug ?? '')
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (isBulk) {
    // Bulk import from CSV/vCard (CRM-006)
    const parsed = BulkImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bulk import data', details: parsed.error.issues }, { status: 400 });
    }

    const contactsToInsert = parsed.data.contacts.map(c => ({
      ...c,
      tenant_id: tenant.id,
      source: parsed.data.source,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('crm_contacts')
      .insert(contactsToInsert)
      .select('id');

    if (insertError) {
      console.error('Bulk import error:', insertError);
      return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }

    return NextResponse.json({
      imported: inserted?.length ?? 0,
      message: `Successfully imported ${inserted?.length} contacts`,
    }, { status: 201 });
  }

  // Single contact creation
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid contact data', details: parsed.error.issues }, { status: 400 });
  }

  const { data: contact, error: insertError } = await supabase
    .from('crm_contacts')
    .insert({ ...parsed.data, tenant_id: tenant.id })
    .select()
    .single();

  if (insertError) {
    console.error('Contact creation error:', insertError);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }

  return NextResponse.json({ contact }, { status: 201 });
}
