// Import components
import { LandingHero } from "@/components/landing/LandingHero";
import { UploadCard } from "@/components/landing/UploadCard";
import { AppShell } from "@/components/shell/AppShell";

// Function to render the home page
export default function Home() {
  return (
    <AppShell headerVariant="landing">
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-8 sm:px-5 lg:px-6 lg:py-10">
        <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="min-w-0">
            <LandingHero />
          </div>
          <div className="min-w-0">
            <UploadCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
};