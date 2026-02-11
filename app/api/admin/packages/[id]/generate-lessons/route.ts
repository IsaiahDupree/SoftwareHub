import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface RouteParams {
  params: { id: string };
}

const SETUP_LESSONS = [
  {
    title_template: 'Installing {name}',
    lesson_type: 'download',
    content_template: `<h2>Installation Guide</h2>
<p>Follow these steps to install <strong>{name}</strong> on your device.</p>

<h3>System Requirements</h3>
<ul>
  <li>macOS {min_os} or later</li>
  <li>At least 500MB of free disk space</li>
  <li>Active internet connection for activation</li>
</ul>

<h3>Steps</h3>
<ol>
  <li><strong>Download</strong> - Click the download button below to get the latest version.</li>
  <li><strong>Open the installer</strong> - Double-click the downloaded .dmg file.</li>
  <li><strong>Drag to Applications</strong> - Drag {name} to your Applications folder.</li>
  <li><strong>Launch</strong> - Open {name} from Applications or Spotlight.</li>
  <li><strong>Grant permissions</strong> - Allow any required system permissions when prompted.</li>
</ol>

<p>If you encounter any issues, check the Troubleshooting lesson below.</p>`,
    download_instructions_template: 'Download {name} using the button below. The installer will guide you through the setup process.',
    sort_order: 0,
  },
  {
    title_template: 'Activating Your {name} License',
    lesson_type: 'text',
    content_template: `<h2>License Activation</h2>
<p>Your license key was included in your purchase confirmation email. You can also find it on your <a href="/app/licenses">licenses page</a>.</p>

<h3>Activation Steps</h3>
<ol>
  <li><strong>Open {name}</strong> - Launch the application.</li>
  <li><strong>Enter your license key</strong> - When prompted, paste your license key in the format <code>XXXX-XXXX-XXXX-XXXX</code>.</li>
  <li><strong>Click Activate</strong> - The app will verify your license and activate.</li>
  <li><strong>Done!</strong> - You now have full access to all features.</li>
</ol>

<h3>License Details</h3>
<ul>
  <li>Your license allows activation on up to <strong>2 devices</strong>.</li>
  <li>You can manage your devices from the <a href="/app/licenses">licenses page</a>.</li>
  <li>If you need to move your license to a new device, deactivate the old device first.</li>
</ul>

<h3>Finding Your License Key</h3>
<p>If you can't find your license key:</p>
<ul>
  <li>Check your email for the purchase confirmation</li>
  <li>Visit your <a href="/app/licenses">licenses page</a> in your account</li>
  <li>Contact support if you need help</li>
</ul>`,
    sort_order: 1,
  },
  {
    title_template: '{name} Troubleshooting',
    lesson_type: 'text',
    content_template: `<h2>Troubleshooting Guide</h2>
<p>Having issues with {name}? Here are solutions to common problems.</p>

<h3>Installation Issues</h3>
<dl>
  <dt><strong>"App can't be opened because it is from an unidentified developer"</strong></dt>
  <dd>Go to System Preferences > Security & Privacy > General, and click "Open Anyway".</dd>

  <dt><strong>Installation fails or hangs</strong></dt>
  <dd>Make sure you have enough disk space and that your macOS version meets the minimum requirements ({min_os} or later).</dd>
</dl>

<h3>Activation Issues</h3>
<dl>
  <dt><strong>"Invalid license key"</strong></dt>
  <dd>Make sure you're copying the entire key, including all four segments (XXXX-XXXX-XXXX-XXXX). Check for extra spaces.</dd>

  <dt><strong>"Device limit reached"</strong></dt>
  <dd>You've activated on the maximum number of devices. Deactivate an old device from your <a href="/app/licenses">licenses page</a>.</dd>

  <dt><strong>"License expired"</strong></dt>
  <dd>Your license may have expired. Check your <a href="/app/licenses">licenses page</a> for renewal options.</dd>
</dl>

<h3>Performance Issues</h3>
<dl>
  <dt><strong>App is slow or unresponsive</strong></dt>
  <dd>Try restarting {name}. If the issue persists, check that your system meets the minimum requirements.</dd>

  <dt><strong>App crashes on launch</strong></dt>
  <dd>Delete the app preferences file and try again. You can also try reinstalling the latest version.</dd>
</dl>

<h3>Still Need Help?</h3>
<p>If you're still experiencing issues, please <a href="/support">contact our support team</a>.</p>`,
    sort_order: 2,
  },
];

/**
 * POST /api/admin/packages/[id]/generate-lessons
 *
 * Auto-generates setup lessons (installation, activation, troubleshooting)
 * for a package's related course.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get the package
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from('packages')
    .select('id, name, slug, related_course_id, min_os_version')
    .eq('id', params.id)
    .single();

  if (pkgError || !pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  if (!pkg.related_course_id) {
    return NextResponse.json(
      { error: 'Package must have a related course to generate lessons' },
      { status: 400 }
    );
  }

  // Get existing lesson count for sort ordering
  const { count: existingCount } = await supabaseAdmin
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', pkg.related_course_id);

  const baseOrder = (existingCount || 0) + 1;
  const minOs = pkg.min_os_version || '14.0';

  // Generate lessons
  const lessonsToCreate = SETUP_LESSONS.map((template, idx) => {
    const title = template.title_template.replace(/{name}/g, pkg.name);
    const content = template.content_template
      .replace(/{name}/g, pkg.name)
      .replace(/{min_os}/g, minOs);

    const lesson: Record<string, unknown> = {
      course_id: pkg.related_course_id,
      title,
      lesson_type: template.lesson_type,
      content_html: content,
      sort_order: baseOrder + template.sort_order,
      is_published: false, // Draft by default so admin can review
      is_preview: false,
      drip_type: 'immediate',
    };

    if (template.lesson_type === 'download') {
      lesson.package_id = pkg.id;
      lesson.download_instructions = template.download_instructions_template
        ?.replace(/{name}/g, pkg.name);
    }

    return lesson;
  });

  const { data: created, error: insertError } = await supabaseAdmin
    .from('lessons')
    .insert(lessonsToCreate)
    .select('id, title, lesson_type');

  if (insertError) {
    console.error('Error generating setup lessons:', insertError);
    return NextResponse.json({ error: 'Failed to generate lessons' }, { status: 500 });
  }

  return NextResponse.json({
    message: `Generated ${created.length} setup lessons`,
    lessons: created,
  });
}
