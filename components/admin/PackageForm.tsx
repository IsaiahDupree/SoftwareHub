"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Package } from "@/lib/types/packages";

interface PackageFormProps {
  package?: Package;
  mode: "create" | "edit";
}

export default function PackageForm({ package: pkg, mode }: PackageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: pkg?.name || "",
    slug: pkg?.slug || "",
    tagline: pkg?.tagline || "",
    description: pkg?.description || "",
    type: pkg?.type || "LOCAL_AGENT",
    requires_macos: pkg?.requires_macos || false,
    min_os_version: pkg?.min_os_version || "",
    download_url: pkg?.download_url || "",
    web_app_url: pkg?.web_app_url || "",
    status: pkg?.status || "operational",
    status_message: pkg?.status_message || "",
    status_check_url: pkg?.status_check_url || "",
    price_cents: pkg?.price_cents?.toString() || "",
    icon_url: pkg?.icon_url || "",
    banner_url: pkg?.banner_url || "",
    features: pkg?.features || [],
    requirements: JSON.stringify(pkg?.requirements || {}, null, 2),
    documentation_url: pkg?.documentation_url || "",
    support_url: pkg?.support_url || "",
    is_published: pkg?.is_published || false,
    is_featured: pkg?.is_featured || false,
    sort_order: pkg?.sort_order?.toString() || "0",
  });

  const [featureInput, setFeatureInput] = useState("");

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  }

  function addFeature() {
    if (featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput("");
    }
  }

  function removeFeature(index: number) {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  function autoSlug() {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    handleChange("slug", slug);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    let parsedRequirements = {};
    try {
      parsedRequirements = JSON.parse(formData.requirements || "{}");
    } catch {
      setMessage("Error: Invalid JSON in requirements field");
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name,
      slug: formData.slug,
      tagline: formData.tagline || null,
      description: formData.description || null,
      type: formData.type,
      requires_macos: formData.requires_macos,
      min_os_version: formData.min_os_version || null,
      download_url: formData.download_url || null,
      web_app_url: formData.web_app_url || null,
      status: formData.status,
      status_message: formData.status_message || null,
      status_check_url: formData.status_check_url || null,
      price_cents: parseInt(formData.price_cents) || null,
      icon_url: formData.icon_url || null,
      banner_url: formData.banner_url || null,
      features: formData.features,
      requirements: parsedRequirements,
      documentation_url: formData.documentation_url || null,
      support_url: formData.support_url || null,
      is_published: formData.is_published,
      is_featured: formData.is_featured,
      sort_order: parseInt(formData.sort_order) || 0,
    };

    const url =
      mode === "create"
        ? "/api/admin/packages"
        : `/api/admin/packages/${pkg?.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const errorMsg =
        typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error);
      setMessage(`Error: ${errorMsg}`);
    } else {
      if (mode === "create") {
        router.push(`/admin/packages/${data.package.id}`);
      } else {
        setMessage("Saved!");
        router.refresh();
      }
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to unpublish this package?")) return;

    setLoading(true);
    const res = await fetch(`/api/admin/packages/${pkg?.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/admin/packages");
    } else {
      const data = await res.json();
      setMessage(`Error: ${data.error}`);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {message && (
        <div
          className={`px-3 py-2 rounded text-sm ${
            message.startsWith("Error")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div>
          <label className="block mb-1 font-medium text-sm">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => mode === "create" && !formData.slug && autoSlug()}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Slug</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              required
              pattern="[a-z0-9-]+"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              readOnly={mode === "edit"}
            />
            {mode === "create" && (
              <button
                type="button"
                onClick={autoSlug}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Auto
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Tagline</label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => handleChange("tagline", e.target.value)}
            placeholder="Short description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Type</label>
          <select
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="LOCAL_AGENT">Local Agent</option>
            <option value="CLOUD_APP">Cloud App</option>
          </select>
        </div>
      </div>

      {/* Platform Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Platform</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requires_macos"
            checked={formData.requires_macos}
            onChange={(e) => handleChange("requires_macos", e.target.checked)}
            className="rounded"
          />
          <label htmlFor="requires_macos" className="text-sm">
            Requires macOS
          </label>
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">
            Minimum OS Version
          </label>
          <input
            type="text"
            value={formData.min_os_version}
            onChange={(e) => handleChange("min_os_version", e.target.value)}
            placeholder="e.g. 14.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* URLs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">URLs</h3>

        <div>
          <label className="block mb-1 font-medium text-sm">Download URL</label>
          <input
            type="url"
            value={formData.download_url}
            onChange={(e) => handleChange("download_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Web App URL</label>
          <input
            type="url"
            value={formData.web_app_url}
            onChange={(e) => handleChange("web_app_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">
            Documentation URL
          </label>
          <input
            type="url"
            value={formData.documentation_url}
            onChange={(e) => handleChange("documentation_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Support URL</label>
          <input
            type="url"
            value={formData.support_url}
            onChange={(e) => handleChange("support_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing</h3>

        <div>
          <label className="block mb-1 font-medium text-sm">
            Price (cents)
          </label>
          <input
            type="number"
            value={formData.price_cents}
            onChange={(e) => handleChange("price_cents", e.target.value)}
            min="0"
            placeholder="e.g. 4900 for $49"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status</h3>

        <div>
          <label className="block mb-1 font-medium text-sm">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="operational">Operational</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">
            Status Message
          </label>
          <input
            type="text"
            value={formData.status_message}
            onChange={(e) => handleChange("status_message", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">
            Status Check URL
          </label>
          <input
            type="url"
            value={formData.status_check_url}
            onChange={(e) => handleChange("status_check_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Media */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Media</h3>

        <div>
          <label className="block mb-1 font-medium text-sm">Icon URL</label>
          <input
            type="url"
            value={formData.icon_url}
            onChange={(e) => handleChange("icon_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {formData.icon_url && (
            <img
              src={formData.icon_url}
              alt="Icon preview"
              className="mt-2 h-16 w-16 rounded-lg object-cover"
            />
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Banner URL</label>
          <input
            type="url"
            value={formData.banner_url}
            onChange={(e) => handleChange("banner_url", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Features</h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            placeholder="Add a feature..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            type="button"
            onClick={addFeature}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Add
          </button>
        </div>

        {formData.features.length > 0 && (
          <ul className="space-y-1">
            {formData.features.map((feature, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md text-sm"
              >
                <span>{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Requirements (JSON)</h3>
        <textarea
          value={formData.requirements}
          onChange={(e) => handleChange("requirements", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
        />
      </div>

      {/* Publishing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Publishing</h3>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => handleChange("is_published", e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is_published" className="text-sm">
              Published
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => handleChange("is_featured", e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is_featured" className="text-sm">
              Featured
            </label>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Sort Order</label>
          <input
            type="number"
            value={formData.sort_order}
            onChange={(e) => handleChange("sort_order", e.target.value)}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create Package"
            : "Save Changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unpublish
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push("/admin/packages")}
          className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
