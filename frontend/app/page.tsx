import { HeroSection } from "@/components/landing/HeroSection";
import { TrendingStrip } from "@/components/landing/TrendingStrip";
import { FeaturesStrip } from "@/components/landing/FeaturesStrip";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { DealsSection } from "@/components/landing/DealsSection";
import { CuratedSection } from "@/components/landing/CuratedSection";
import { SellerHighlightSection } from "@/components/landing/SellerHighlightSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { DemandSection } from "@/components/landing/DemandSection";
import { NewsletterSection } from "@/components/landing/NewsletterSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <TrendingStrip />
      <FeaturesStrip />
      <CategoriesSection />
      <DealsSection />
      <CuratedSection />
      <SellerHighlightSection />
      <CommunitySection />
      <DemandSection />
      <NewsletterSection />
      <FinalCtaSection />
      <Footer />
    </div>
  );
}
