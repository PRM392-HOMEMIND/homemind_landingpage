import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import MetricStats from "@/components/sections/MetricStats";
import PainPointsSection from "@/components/sections/PainPointsSection";
import InteractiveShowcase from "@/components/sections/InteractiveShowcase";
import BentoGridSection from "@/components/sections/BentoGridSection";
import RoiCalculatorSection from "@/components/sections/RoiCalculatorSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import PricingSection from "@/components/sections/PricingSection";
import FaqSection from "@/components/sections/FaqSection";
import CtaBanner from "@/components/sections/CtaBanner";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <MetricStats />
        <PainPointsSection />
        <InteractiveShowcase />
        <BentoGridSection />
        <RoiCalculatorSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
