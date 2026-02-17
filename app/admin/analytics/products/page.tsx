import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { DollarSign, ShoppingCart, TrendingUp, ArrowLeft } from 'lucide-react';
import { TimeFilterButtons } from '@/components/analytics/TimeFilterButtons';

interface ProductRevenue {
  name: string;
  slug: string;
  orders: number;
  revenue: number;
  avg_order_value: number;
}

export default async function ProductRevenueAnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect('/login?next=/admin/analytics/products');
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', auth.user.id)
    .single();

  if (userProfile?.role !== 'admin') {
    redirect('/app');
  }

  const days = parseInt(searchParams.days ?? '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Query all packages for reference
  const { data: allPackages } = await supabase
    .from('packages')
    .select('id, name, slug');

  const packageMap = new Map(
    (allPackages ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }])
  );

  // Query orders with licenses to associate package revenue
  // Orders may reference a course (course_id) or a license may tie to a package.
  // We look at licenses created within the time window to estimate per-package revenue.
  const { data: recentLicenses } = await supabase
    .from('licenses')
    .select('id, package_id, created_at')
    .gte('created_at', since)
    .not('package_id', 'is', null);

  // Group licenses by package
  const licenseByPackage = new Map<string, number>();
  for (const license of recentLicenses ?? []) {
    if (!license.package_id) continue;
    licenseByPackage.set(license.package_id, (licenseByPackage.get(license.package_id) ?? 0) + 1);
  }

  // Get orders data for revenue
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, amount, status, created_at')
    .gte('created_at', since)
    .eq('status', 'paid');

  const totalOrderRevenue = (recentOrders ?? []).reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const totalOrderCount = recentOrders?.length ?? 0;

  // Build per-package stats using license data + package prices
  const productRevenue: ProductRevenue[] = [];

  const licenseEntries = Array.from(licenseByPackage.entries());
  for (const [packageId, licenseCount] of licenseEntries) {
    const pkg = packageMap.get(packageId);
    if (!pkg) continue;

    // Get package price for revenue estimation
    const { data: pkgData } = await supabase
      .from('packages')
      .select('price_cents')
      .eq('id', packageId)
      .single();

    const priceCents = pkgData?.price_cents ?? 0;
    const estimatedRevenue = licenseCount * priceCents;

    productRevenue.push({
      name: pkg.name,
      slug: pkg.slug,
      orders: licenseCount,
      revenue: estimatedRevenue,
      avg_order_value: licenseCount > 0 ? priceCents : 0,
    });
  }

  // Sort by revenue descending
  productRevenue.sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = productRevenue.reduce((sum, p) => sum + p.revenue, 0) || totalOrderRevenue;
  const totalOrders = productRevenue.reduce((sum, p) => sum + p.orders, 0) || totalOrderCount;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // MRR from active subscriptions (subscriptions table uses price_cents and interval)
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('id, price_cents, interval')
    .eq('status', 'active');

  let mrr = 0;
  if (activeSubs) {
    for (const sub of activeSubs) {
      const amount = sub.price_cents ?? 0;
      if (sub.interval === 'year') {
        mrr += Math.round(amount / 12);
      } else {
        mrr += amount;
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue by Product"
        description="Per-product revenue breakdown and subscription MRR"
        breadcrumbs={
          <Link
            href="/admin/analytics"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analytics
          </Link>
        }
        actions={<TimeFilterButtons currentDays={days} />}
      />

      {/* Summary Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Revenue"
          value={`$${(totalRevenue / 100).toFixed(2)}`}
          description={`Last ${days} days`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          description="Across all products"
          icon={ShoppingCart}
        />
        <StatCard
          title="Avg Order Value"
          value={`$${(avgOrderValue / 100).toFixed(2)}`}
          description="Per transaction"
          icon={TrendingUp}
        />
        <StatCard
          title="Monthly MRR"
          value={`$${(mrr / 100).toFixed(2)}`}
          description="From active subscriptions"
          icon={DollarSign}
        />
      </StatCardGrid>

      {/* Product Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Package / Product</CardTitle>
          <CardDescription>
            Licenses issued and estimated revenue per product for the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productRevenue.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No product revenue data found for the selected period.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Product Name</th>
                    <th className="text-right p-3 font-medium">Licenses Issued</th>
                    <th className="text-right p-3 font-medium">Est. Revenue</th>
                    <th className="text-right p-3 font-medium">Avg Order Value</th>
                    <th className="text-right p-3 font-medium">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {productRevenue.map((product) => (
                    <tr key={product.slug} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.slug}</div>
                      </td>
                      <td className="p-3 text-right">{product.orders.toLocaleString()}</td>
                      <td className="p-3 text-right font-medium">
                        ${(product.revenue / 100).toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        ${(product.avg_order_value / 100).toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {totalRevenue > 0
                          ? `${Math.round((product.revenue / totalRevenue) * 100)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right">{totalOrders.toLocaleString()}</td>
                    <td className="p-3 text-right">${(totalRevenue / 100).toFixed(2)}</td>
                    <td className="p-3 text-right">${(avgOrderValue / 100).toFixed(2)}</td>
                    <td className="p-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Summary */}
      {totalOrderCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Orders ({days}-day window)</CardTitle>
            <CardDescription>
              Total paid orders in the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Paid Orders</p>
                <p className="text-sm text-muted-foreground">Completed purchases</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{totalOrderCount}</p>
                <p className="text-sm text-muted-foreground">
                  ${(totalOrderRevenue / 100).toFixed(2)} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Subscriptions Summary */}
      {(activeSubs?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>
              Currently active subscriptions contributing to MRR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Active Subscribers</p>
                <p className="text-sm text-muted-foreground">Paying subscriptions</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{activeSubs?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">
                  ${(mrr / 100).toFixed(2)} / mo MRR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
