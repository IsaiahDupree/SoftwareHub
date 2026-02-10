"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type BundleFormData = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  icon_url: string | null;
  banner_url: string | null;
  features: string[];
  is_published: boolean;
  is_featured: boolean;
  package_ids: string[];
};

type AvailablePackage = {
  id: string;
  name: string;
  slug: string;
  price_cents: number | null;
  icon_url: string | null;
};

export default function PackageBundleForm({
  bundle,
  isNew,
}: {
  bundle: BundleFormData;
  isNew: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<AvailablePackage[]>([]);

  const [name, setName] = useState(bundle.name);
  const [slug, setSlug] = useState(bundle.slug);
  const [description, setDescription] = useState(bundle.description || "");
  const [badgeText, setBadgeText] = useState(bundle.badge || "");
  const [priceCents, setPriceCents] = useState(bundle.price_cents);
  const [compareAtCents, setCompareAtCents] = useState(bundle.compare_at_cents || 0);
  const [stripeProductId, setStripeProductId] = useState(bundle.stripe_product_id || "");
  const [stripePriceId, setStripePriceId] = useState(bundle.stripe_price_id || "");
  const [iconUrl, setIconUrl] = useState(bundle.icon_url || "");
  const [features, setFeatures] = useState<string[]>(bundle.features || []);
  const [newFeature, setNewFeature] = useState("");
  const [isPublished, setIsPublished] = useState(bundle.is_published);
  const [isFeatured, setIsFeatured] = useState(bundle.is_featured);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(bundle.package_ids);

  useEffect(() => {
    fetch("/api/admin/packages")
      .then((res) => res.json())
      .then((data) => setPackages(data.packages || []))
      .catch(console.error);
  }, []);

  function autoSlug(val: string) {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(val: string) {
    setName(val);
    if (isNew) setSlug(autoSlug(val));
  }

  function togglePackage(pkgId: string) {
    setSelectedPackageIds((prev) =>
      prev.includes(pkgId)
        ? prev.filter((id) => id !== pkgId)
        : [...prev, pkgId]
    );
  }

  function addFeature() {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  }

  function removeFeature(index: number) {
    setFeatures(features.filter((_, i) => i !== index));
  }

  // Calculate savings
  const individualTotal = packages
    .filter((p) => selectedPackageIds.includes(p.id))
    .reduce((sum, p) => sum + (p.price_cents || 0), 0);
  const savings = individualTotal > 0 ? individualTotal - priceCents : 0;
  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (selectedPackageIds.length < 2) {
      setError("A bundle must contain at least 2 packages");
      setLoading(false);
      return;
    }

    const body = {
      name,
      slug,
      description: description || null,
      badge: badgeText || null,
      price_cents: priceCents,
      compare_at_cents: compareAtCents || null,
      stripe_product_id: stripeProductId || null,
      stripe_price_id: stripePriceId || null,
      icon_url: iconUrl || null,
      features,
      is_published: isPublished,
      is_featured: isFeatured,
      package_ids: selectedPackageIds,
    };

    const url = isNew
      ? "/api/admin/package-bundles"
      : `/api/admin/package-bundles/${bundle.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      const msg = Array.isArray(data.error)
        ? data.error.map((e: { message: string }) => e.message).join(", ")
        : data.error;
      setError(msg || "Save failed");
      setLoading(false);
      return;
    }

    router.push("/admin/package-bundles");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/package-bundles" className="text-sm text-gray-600 hover:text-black">
            ← Package Bundles
          </Link>
          <h1 className="text-2xl font-semibold mt-1">
            {isNew ? "New Package Bundle" : `Edit: ${bundle.name}`}
          </h1>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(autoSlug(e.target.value))}
            disabled={!isNew}
            className="w-full border rounded-lg p-2 disabled:bg-gray-50"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg p-2"
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Badge</label>
          <input
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="e.g. Save 30%"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Icon URL</label>
          <input
            type="text"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="font-medium">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bundle Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={(priceCents / 100).toFixed(2)}
              onChange={(e) => setPriceCents(Math.round(parseFloat(e.target.value || "0") * 100))}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Compare At ($)</label>
            <input
              type="number"
              step="0.01"
              value={compareAtCents ? (compareAtCents / 100).toFixed(2) : ""}
              onChange={(e) => setCompareAtCents(e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0)}
              className="w-full border rounded-lg p-2"
              placeholder="Original price"
            />
          </div>
          <div className="flex items-end pb-2">
            {individualTotal > 0 && (
              <div className="text-sm">
                <p className="text-gray-500">Individual total: ${(individualTotal / 100).toFixed(2)}</p>
                {savings > 0 && (
                  <p className="text-green-600 font-medium">
                    Saves ${(savings / 100).toFixed(2)} ({savingsPercent}%)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stripe Product ID</label>
            <input
              type="text"
              value={stripeProductId}
              onChange={(e) => setStripeProductId(e.target.value)}
              className="w-full border rounded-lg p-2 font-mono text-sm"
              placeholder="prod_xxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stripe Price ID</label>
            <input
              type="text"
              value={stripePriceId}
              onChange={(e) => setStripePriceId(e.target.value)}
              className="w-full border rounded-lg p-2 font-mono text-sm"
              placeholder="price_xxx"
            />
          </div>
        </div>
      </div>

      {/* Package Selection */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="font-medium">
          Included Packages ({selectedPackageIds.length} selected)
        </h2>
        {packages.length === 0 ? (
          <p className="text-gray-500 text-sm">Loading packages...</p>
        ) : (
          <div className="space-y-2">
            {packages.map((pkg) => {
              const isSelected = selectedPackageIds.includes(pkg.id);
              return (
                <label
                  key={pkg.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePackage(pkg.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{pkg.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({pkg.slug})</span>
                  </div>
                  {pkg.price_cents != null && (
                    <span className="text-sm text-gray-600">
                      ${(pkg.price_cents / 100).toFixed(2)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-medium">Bundle Features</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            className="flex-1 border rounded-lg p-2 text-sm"
            placeholder="Add a feature..."
          />
          <Button type="button" variant="outline" onClick={addFeature}>
            Add
          </Button>
        </div>
        {features.length > 0 && (
          <ul className="space-y-1">
            {features.map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{feat}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Publishing */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span className="text-sm">Published</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          <span className="text-sm">Featured</span>
        </label>
      </div>
    </form>
  );
}
