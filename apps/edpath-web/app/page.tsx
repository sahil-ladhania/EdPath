import { LandingHero } from "@/components/landing/LandingHero";
import { UploadCard } from "@/components/landing/UploadCard";
import { AppShell } from "@/components/shell/AppShell";

export default function Home() {
  return (
    <AppShell modeLabel="Upload">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <LandingHero />
        <UploadCard />
      </div>
    </AppShell>
  );
}