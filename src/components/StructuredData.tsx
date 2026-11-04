import React from "react";

export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HomeMind",
    operatingSystem: "Android, iOS, Web",
    applicationCategory: "LifestyleApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
    },
    description: "Trợ lý quản lý kho gia đình thông minh kết hợp AI, tối ưu hóa mua sắm và theo dõi hạn sử dụng.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "128",
    },
    author: {
      "@type": "Organization",
      name: "HomeMind Team",
      url: "https://homemind-landingpage.vercel.app",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
