# IMPLEMENTATION PLAN: Modern Creative Landing Page (Next.js 15)

## 1. Project Context & Objectives
- **Target App Reference:** Modern dark-theme landing page with glassmorphism, micro-interactions, responsive bento grid, and high SEO score.
- **Scope:** Build the entire UI/UX scaffolding, design system, SEO metadata engine, smooth scrolling, and 3D Canvas placeholders (pre-configured for `@react-three/fiber` integration in Phase 2).
- **Core KPIs:** Lighthouse SEO = 100, Performance >= 95, 0 Hydration Errors, Fully responsive (Mobile 375px -> Desktop 2K+).

---

## 2. Technology Stack & Dependencies

```json
{
  "framework": "next@latest (App Router, React 19, TypeScript)",
  "styling": "tailwindcss@latest, postcss, autoprefixer, clsx, tailwind-merge",
  "icons": "lucide-react",
  "motion": "framer-motion, lenis (smooth scroll)",
  "components": "shadcn/ui (radix-ui primitives)"
}
```
--- 

## 3. Directory Layout Specification

```bash
.
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── Container.tsx
│   │   │   ├── GlowBadge.tsx
│   │   │   └── ThemeButton.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   └── Footer.tsx
│   │   ├── placeholders/
│   │   │   └── HeroSceneContainer.tsx
│   │   ├── providers/
│   │   │   └── SmoothScrollProvider.tsx
│   │   └── sections/
│   │       ├── HeroSection.tsx
│   │       ├── BentoGridSection.tsx
│   │       ├── InteractiveShowcase.tsx
│   │       ├── MetricStats.tsx
│   │       ├── TestimonialsSection.tsx
│   │       └── CtaBanner.tsx
│   ├── config/
│   │   ├── site.ts
│   │   └── navigation.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── animations.ts
│   └── types/
│       └── index.ts
├── public/
│   └── og-image.png
├── tailwind.config.ts
├── tsconfig.json
└── package.json

```
---

## 4. Execution Step-by-Step

### Phase 1: Environment & Scaffolding Setup
#### Step 1.1: Project Initialization
Run the initialization command:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```


#### Step 1.2: Install Production Dependencies

```bash
npm install framer-motion lucide-react lenis clsx tailwind-merge
```

#### Step 1.3: Utility Setup (src/lib/utils.ts)
```tsx
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### Step 1.4: Tailwind Config & Design Tokens (tailwind.config.ts)
Add dark theme colors, radial gradient background utilities, glassmorphism border colors, and animation keyframes.

#### Step 1.5: Smooth Scroll Provider (src/components/providers/SmoothScrollProvider.tsx)
Wrap children with @studio-freight/lenis / lenis React hook to achieve smooth deceleration for creative page experience.

### Phase 2: Configuration & Content Single Source of Truth
#### Step 2.1: Site Configuration (src/config/site.ts)
Export structured configuration for:

Metadata (title, description, url, ogImage, keywords)

Navigation Links (name, href)

Feature Items for Bento Grid (title, description, icon, tag, colSpan)

Metrics / Stats (label, value, prefix, suffix)

Testimonials (name, role, avatar, content)

### Phase 3: Layout & Section Implementation
#### Step 3.1: Navbar (src/components/layout/Navbar.tsx)
Floating sticky navbar with backdrop-blur-md bg-neutral-950/60 border border-white/10.

Smooth scroll triggers for in-page anchors (#features, #showcase, #testimonials).

Responsive Mobile Drawer / Hamburger toggle.

#### Step 3.2: 3D-Ready Container (src/components/placeholders/HeroSceneContainer.tsx)
Implement a dedicated container matching 3D Canvas aspect ratio.

Include abstract gradient pulse and glowing grid backdrop.

Add clear interface contract ready for <Scene3D /> replacement.

#### Step 3.3: Hero Section (src/components/sections/HeroSection.tsx)
Dual-column or Centered Split layout:

Left/Top: Pill badge, Semantic <h1> heading with gradient text, Subtitle, Dual CTAs.

Right/Bottom: Mounts <HeroSceneContainer />.

Entrance animation with framer-motion.

#### Step 3.4: Bento Grid Section (src/components/sections/BentoGridSection.tsx)
CSS Grid with grid-cols-1 md:grid-cols-3 gap-4.

High-contrast cards with subtle hover border glow (group-hover:border-primary/50).

#### Step 3.5: Deep Dive Showcase (src/components/sections/InteractiveShowcase.tsx)
Interactive state (Tab switching or accordion) changing the featured UI preview mockup.

#### Step 3.6: Testimonials & Metrics (src/components/sections/MetricStats.tsx, TestimonialsSection.tsx)
Responsive stats counter cards.

Testimonial grid with clean typography and user avatars.

#### Step 3.7: CTA Banner & Footer (src/components/sections/CtaBanner.tsx, src/components/layout/Footer.tsx)
Bottom conversion section with glow backdrop.

Comprehensive footer with social icons, copyright, and sitemap anchor links.

### Phase 4: SEO Engine & Core Web Vitals Optimization
#### Step 4.1: Metadata & OpenGraph (src/app/layout.tsx)
Configure complete Metadata object:

title.template and title.default

description, openGraph, twitter, robots, alternates.canonical.

#### Step 4.2: Structured Data / Schema Markup (src/app/layout.tsx)
Inject <script type="application/ld+json"> for WebSite and SoftwareApplication schema.

#### Step 4.3: Dynamic SEO Handlers
src/app/sitemap.ts: Return dynamic URLs with lastModified, changeFrequency, priority.

src/app/robots.ts: Output proper user-agent rules referencing the sitemap URL.

### Phase 5: Build Verification & QA
[ ] Execute npm run build and ensure 0 TypeScript / Linting errors.

[ ] Verify static generation (○ (Static)) for all marketing routes.

[ ] Confirm zero CLS on font loading using next/font/google.

[ ] Test all responsive breakpoints (Mobile: 375px, Tablet: 768px, Desktop: 1280px+).