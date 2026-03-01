"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    const body = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };

    // Send to analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/web-vitals",
        JSON.stringify(body)
      );
    }
  });

  return null;
}
