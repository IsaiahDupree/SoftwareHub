"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReleaseUploadFormProps {
  packageId: string;
}

export default function ReleaseUploadForm({
  packageId,
}: ReleaseUploadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    version: "",
    channel: "stable",
    release_notes: "",
    is_current: true,
    is_published: false,
  });

  const [file, setFile] = useState<File | null>(null);

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setUploadProgress(0);

    // Step 1: Create the release record
    // Use a placeholder download_url; it will be updated if a file is uploaded
    const downloadUrl = file
      ? "pending-upload"
      : `https://placeholder.example.com/${packageId}/${formData.version}`;

    const createRes = await fetch("/api/admin/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package_id: packageId,
        version: formData.version,
        channel: formData.channel,
        release_notes: formData.release_notes || null,
        is_current: formData.is_current,
        is_published: formData.is_published,
        download_url: downloadUrl,
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      const errorMsg =
        typeof createData.error === "string"
          ? createData.error
          : JSON.stringify(createData.error);
      setMessage(`Error creating release: ${errorMsg}`);
      setLoading(false);
      return;
    }

    const releaseId = createData.release.id;

    // Step 2: Upload file if provided
    if (file) {
      setUploadProgress(30);

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadRes = await fetch(
        `/api/admin/releases/${releaseId}/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );

      setUploadProgress(90);

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json();
        setMessage(
          `Release created but file upload failed: ${uploadData.error}`
        );
        setLoading(false);
        return;
      }
    }

    setUploadProgress(100);
    setMessage("Release created successfully!");
    setLoading(false);

    // Reset form
    setFormData({
      version: "",
      channel: "stable",
      release_notes: "",
      is_current: true,
      is_published: false,
    });
    setFile(null);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {message && (
        <div
          className={`px-3 py-2 rounded text-sm ${
            message.startsWith("Error") || message.includes("failed")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium text-sm">Version</label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => handleChange("version", e.target.value)}
            required
            pattern="\d+\.\d+\.\d+.*"
            placeholder="e.g. 1.0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Channel</label>
          <select
            value={formData.channel}
            onChange={(e) => handleChange("channel", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
            <option value="alpha">Alpha</option>
            <option value="dev">Dev</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block mb-1 font-medium text-sm">Release Notes</label>
        <textarea
          value={formData.release_notes}
          onChange={(e) => handleChange("release_notes", e.target.value)}
          rows={4}
          placeholder="Markdown supported..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium text-sm">
          Binary File (optional)
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        {file && (
          <p className="mt-1 text-xs text-muted-foreground">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_current"
            checked={formData.is_current}
            onChange={(e) => handleChange("is_current", e.target.checked)}
            className="rounded"
          />
          <label htmlFor="is_current" className="text-sm">
            Set as current version
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_published"
            checked={formData.is_published}
            onChange={(e) => handleChange("is_published", e.target.checked)}
            className="rounded"
          />
          <label htmlFor="is_published" className="text-sm">
            Publish immediately
          </label>
        </div>
      </div>

      {loading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating Release..." : "Create Release"}
      </button>
    </form>
  );
}
