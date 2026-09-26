import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { policyDate } from "@/components/legal/LegalDocument";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/gioi-thieu`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...["/privacy-policy", "/terms-of-service"].map((path) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: new Date(policyDate),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
