"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Package, AlertTriangle, KeyRound, MessageSquare, Megaphone, BookOpen } from "lucide-react";
import Link from "next/link";

interface NotificationPreferences {
  email_on_comment: boolean;
  email_on_reply: boolean;
  email_on_announcement: boolean;
  email_on_course_update: boolean;
  in_app_notifications: boolean;
  email_on_new_release: boolean;
  email_on_status_change: boolean;
  email_on_license_expiration: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_on_comment: true,
  email_on_reply: true,
  email_on_announcement: true,
  email_on_course_update: true,
  in_app_notifications: true,
  email_on_new_release: true,
  email_on_status_change: true,
  email_on_license_expiration: true,
};

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          checked ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) throw new Error("Failed to load preferences");
      const data = await res.json();
      setPrefs({ ...defaultPreferences, ...data.preferences });
    } catch {
      setMessage({ type: "error", text: "Failed to load notification preferences" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      setMessage({ type: "success", text: "Preferences saved" });
    } catch {
      setMessage({ type: "error", text: "Failed to save preferences" });
    } finally {
      setIsSaving(false);
    }
  }

  function updatePref(key: keyof NotificationPreferences, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-12 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground mt-1">Choose what emails you receive</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/settings">Profile Settings</Link>
        </Button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Software Notifications */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-1">Software & Packages</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Notifications about your purchased software and licenses
        </p>
        <div className="rounded-lg border divide-y">
          <div className="px-4">
            <ToggleRow
              icon={<Package className="h-4 w-4" />}
              label="New Releases"
              description="Get notified when a new version of your software is available"
              checked={prefs.email_on_new_release}
              onChange={(v) => updatePref("email_on_new_release", v)}
            />
          </div>
          <div className="px-4">
            <ToggleRow
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Status Changes"
              description="Get notified when a service you use has an outage or maintenance"
              checked={prefs.email_on_status_change}
              onChange={(v) => updatePref("email_on_status_change", v)}
            />
          </div>
          <div className="px-4">
            <ToggleRow
              icon={<KeyRound className="h-4 w-4" />}
              label="License Expiration"
              description="Get reminded 7 days before your license expires"
              checked={prefs.email_on_license_expiration}
              onChange={(v) => updatePref("email_on_license_expiration", v)}
            />
          </div>
        </div>
      </div>

      {/* Course & Community Notifications */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-1">Courses & Community</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Notifications about courses and community activity
        </p>
        <div className="rounded-lg border divide-y">
          <div className="px-4">
            <ToggleRow
              icon={<MessageSquare className="h-4 w-4" />}
              label="Comments"
              description="Get notified about new comments on lessons you've commented on"
              checked={prefs.email_on_comment}
              onChange={(v) => updatePref("email_on_comment", v)}
            />
          </div>
          <div className="px-4">
            <ToggleRow
              icon={<MessageSquare className="h-4 w-4" />}
              label="Replies"
              description="Get notified when someone replies to your comment"
              checked={prefs.email_on_reply}
              onChange={(v) => updatePref("email_on_reply", v)}
            />
          </div>
          <div className="px-4">
            <ToggleRow
              icon={<Megaphone className="h-4 w-4" />}
              label="Announcements"
              description="Important updates and announcements"
              checked={prefs.email_on_announcement}
              onChange={(v) => updatePref("email_on_announcement", v)}
            />
          </div>
          <div className="px-4">
            <ToggleRow
              icon={<BookOpen className="h-4 w-4" />}
              label="Course Updates"
              description="New lessons and content added to courses you own"
              checked={prefs.email_on_course_update}
              onChange={(v) => updatePref("email_on_course_update", v)}
            />
          </div>
        </div>
      </div>

      {/* General */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-1">General</h2>
        <div className="rounded-lg border">
          <div className="px-4">
            <ToggleRow
              icon={<Bell className="h-4 w-4" />}
              label="In-App Notifications"
              description="Show notifications within the app"
              checked={prefs.in_app_notifications}
              onChange={(v) => updatePref("in_app_notifications", v)}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
