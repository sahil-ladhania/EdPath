"use client";

export function LandingHero() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-primary">
        Guided PDF lessons
      </p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-[var(--tracking-display)] text-ink sm:text-5xl">
        Turn one PDF into a guided lesson
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Upload your source. EdPath builds a path for you to review, then teaches
        one question at a time.
      </p>
    </section>
  );
}
