"use client";

import { useState, useRef } from "react";
import { User, Camera } from "lucide-react";

interface AvatarUploadProps {
  src?: string | null;
  name?: string;
  size?: number;
  onUpload?: (file: File) => void;
  editable?: boolean;
}

export function AvatarUpload({
  src,
  name,
  size = 40,
  onUpload,
  editable = false,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onUpload?.(file);
  };

  const displaySrc = preview || src;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden bg-muted flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displaySrc} alt={name || "Avatar"} className="w-full h-full object-cover" />
        ) : initials ? (
          <span className="text-sm font-medium text-muted-foreground">{initials}</span>
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )}
      </div>
      {editable && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-1 shadow-sm"
            aria-label="Upload avatar"
            style={{ width: size / 3, height: size / 3, minWidth: 20, minHeight: 20 }}
          >
            <Camera className="w-full h-full" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
