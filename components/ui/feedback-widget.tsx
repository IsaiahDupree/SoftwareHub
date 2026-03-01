"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, page: window.location.pathname }),
      });
      setSubmitted(true);
      setFeedback("");
      setTimeout(() => { setSubmitted(false); setIsOpen(false); }, 2000);
    } catch {
      // Silently fail
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"
        aria-label="Send feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 bg-background border rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Send Feedback</h3>
        <button onClick={() => setIsOpen(false)} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      {submitted ? (
        <p className="text-green-600 text-sm">Thank you for your feedback!</p>
      ) : (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think..."
            className="w-full p-2 border rounded-md text-sm resize-none h-24 mb-2"
            maxLength={1000}
          />
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
          >
            Send
          </button>
        </>
      )}
    </div>
  );
}
