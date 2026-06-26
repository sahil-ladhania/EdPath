import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  EDPATH_LANGGRAPH_DEPLOYMENT_URL: z.string().url(),
  EDPATH_LANGGRAPH_GRAPH_ID: z
    .string()
    .min(1)
    .default("edpath-agent"),
  UPLOAD_MAX_BINARY_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 1024 * 1024),
  UPLOAD_MAX_CLEAN_CHARS: z.coerce.number().int().positive().default(200_000),
  UPLOAD_MAX_TOKENS: z.coerce.number().int().positive().default(50_000),
  UPLOAD_MAX_PAGES: z.coerce.number().int().positive().default(50),
  UPLOAD_MIN_CLEAN_CHARS: z.coerce.number().int().nonnegative().default(200),
  UPLOAD_MIN_CHARS_PER_PAGE: z.coerce.number().int().nonnegative().default(30),
  OPENAI_API_KEY: z.string().min(1).optional(),
  /** Workhorse model for N1/N3/N5/N9 generative nodes (B8). */
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  /** N1 plan escape hatch when repair retries are exhausted (B8). */
  OPENAI_PLAN_ESCAPE_MODEL: z.string().min(1).default("gpt-4o"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

/** True when live OpenAI calls are available; otherwise nodes use stub content. */
export function isOpenAiConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}
