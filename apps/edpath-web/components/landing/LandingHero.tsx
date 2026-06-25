"use client";

export function LandingHero() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
      <p className="text-xs font-semibold uppercase text-primary">
        Guided PDF lessons
      </p>
      <h1 className="max-w-2xl font-display text-4xl text-ink sm:text-5xl">
        Upload one study PDF and turn it into a structured learning path.
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        EdPath plans the lesson, pauses for approval, teaches with one MCQ at a
        time, and ends with a focused progress report.
      </p>
    </section>
  );
}
