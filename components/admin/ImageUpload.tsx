"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  previewSize?: "icon" | "banner" | "screenshot";
}

export default function ImageUpload({
  label,
  value,
  onChange,
  accept = "image/*",
  maxSizeMB = 5,
  previewSize = "icon",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewClasses = {
    icon: "h-16 w-16 rounded-lg",
    banner: "h-32 w-full rounded-lg",
    screenshot: "h-40 w-auto rounded-lg",
  };

  async function handleFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setError("");

    // For now, create an object URL as a placeholder
    // In production, this would upload to R2/S3
    const objectUrl = URL.createObjectURL(file);
    onChange(objectUrl);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <label className="block font-medium text-sm">{label}</label>

      {/* URL input */}
      <input
        type="url"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setError("");
        }}
        placeholder="Enter URL or drag & drop an image"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-black bg-gray-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        <p className="text-sm text-muted-foreground">
          {uploading
            ? "Uploading..."
            : "Click or drag & drop to upload"}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Preview */}
      {value && (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt="Preview"
            className={`object-cover ${previewClasses[previewSize]}`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
