export interface NavItem {
  name: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
  tag?: string;
  colSpan?: string; // e.g. "md:col-span-2"
}

export interface MetricItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  avatar: string;
  content: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  tagline: string;
  supportEmail: string;
  description: string;
  url: string;
  ogImage: string;
  keywords: string[];
  links: {
    facebook: string;
  };
}
