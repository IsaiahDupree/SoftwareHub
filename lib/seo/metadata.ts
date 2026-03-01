import { Metadata } from "next";

const SITE_NAME = "SoftwareHub";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://softwarehub.io";

export function generateMetadata(params: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const url = `${BASE_URL}${params.path || ""}`;
  const image = params.image || `${BASE_URL}/og-default.png`;

  return {
    title: `${params.title} | ${SITE_NAME}`,
    description: params.description,
    openGraph: {
      title: params.title,
      description: params.description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630 }],
      type: params.type || "website",
    },
    twitter: {
      card: "summary_large_image",
      title: params.title,
      description: params.description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}
