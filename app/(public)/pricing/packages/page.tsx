import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap } from "lucide-react";

export default async function PackageSubscriptionPricingPage() {
  const supabase = supabaseServer();

  const { data: tiers } = await supabase
    .from("package_subscription_tiers")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  // Get count of published packages
  const { count: packageCount } = await supabase
    .from("packages")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  // Check if user has an active subscription
  const { data: { user } } = await supabase.auth.getUser();
  let activeSubscription = null;

  if (user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, status, package_subscription_tier_id, current_period_end")
      .eq("user_id", user.id)
      .not("package_subscription_tier_id", "is", null)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    activeSubscription = sub;
  }

  return (
    <main className="container max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Subscription</Badge>
        <h1 className="text-4xl font-bold mb-4">All-Access Package Subscription</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get access to all {packageCount || "our"} software packages with a single subscription.
          Includes all current and future packages, license keys, and updates.
        </p>
      </div>

      {activeSubscription && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center">
          <p className="text-green-800 font-medium">
            You have an active subscription. Next billing:{" "}
            {activeSubscription.current_period_end
              ? new Date(activeSubscription.current_period_end).toLocaleDateString()
              : "N/A"}
          </p>
          <Link href="/app/products" className="text-green-600 hover:underline text-sm">
            Go to your products
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(tiers ?? []).map((tier) => {
          const monthlyPrice = tier.price_cents_monthly / 100;
          const yearlyPrice = tier.price_cents_yearly
            ? tier.price_cents_yearly / 100
            : null;
          const yearlyMonthly = yearlyPrice ? yearlyPrice / 12 : null;
          const yearlySavings = yearlyMonthly
            ? Math.round(((monthlyPrice - yearlyMonthly) / monthlyPrice) * 100)
            : null;
          const features = tier.features || [];

          return (
            <Card
              key={tier.id}
              className={`relative ${tier.is_featured ? "border-blue-500 ring-2 ring-blue-100" : ""}`}
            >
              {tier.is_featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600">Most Popular</Badge>
                </div>
              )}
              {tier.badge && !tier.is_featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-100 text-amber-800">{tier.badge}</Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                {tier.description && (
                  <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Monthly pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${monthlyPrice.toFixed(0)}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  {yearlyPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      or ${yearlyPrice.toFixed(0)}/year (save {yearlySavings}%)
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium">
                      {tier.includes_all_packages
                        ? `All ${packageCount || ""} packages included`
                        : "Selected packages included"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{tier.max_devices_per_license} devices per license</span>
                  </li>
                  {features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {activeSubscription ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <SubscribeButton tierSlug={tier.slug} isLoggedIn={!!user} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!tiers || tiers.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No subscription plans available at the moment.</p>
          <p className="text-sm mt-2">Check back soon for all-access subscription options.</p>
        </div>
      )}
    </main>
  );
}

function SubscribeButton({ tierSlug, isLoggedIn }: { tierSlug: string; isLoggedIn: boolean }) {
  if (!isLoggedIn) {
    return (
      <Button asChild className="w-full">
        <Link href={`/login?next=/pricing/packages`}>
          Sign in to Subscribe
        </Link>
      </Button>
    );
  }

  return (
    <form
      action="/api/package-subscriptions/checkout"
      method="POST"
    >
      <input type="hidden" name="tierSlug" value={tierSlug} />
      <input type="hidden" name="billingPeriod" value="monthly" />
      <Button type="submit" className="w-full">
        Subscribe Now
      </Button>
    </form>
  );
}
