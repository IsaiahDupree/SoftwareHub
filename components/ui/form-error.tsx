"use client";

import { useEffect, useRef } from "react";

interface FormErrorProps {
  id: string;
  message?: string;
}

export function FormError({ id, message }: FormErrorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && ref.current) {
      ref.current.focus();
    }
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      id={id}
      role="alert"
      aria-live="assertive"
      className="text-sm text-red-600 mt-1"
      tabIndex={-1}
    >
      {message}
    </div>
  );
}
