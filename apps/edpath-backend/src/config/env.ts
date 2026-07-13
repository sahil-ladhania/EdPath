/**
 * Zod-validated environment — fail-fast on boot; stub and tracing helpers.
**/
import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Define the backend root
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Load the dotenv file
loadDotenv({ path: resolve(backendRoot, ".env") });

// Define the environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  EDPATH_LANGGRAPH_DEPLOYMENT_URL: z.string().url().default("http://localhost:2024"),
  EDPATH_LANGGRAPH_GRAPH_ID: z.string().min(1).default("edpath-agent"),
  UPLOAD_MAX_BINARY_BYTES: z.coerce.number().int().positive().default(15 * 1024 * 1024),
  UPLOAD_MAX_CLEAN_CHARS: z.coerce.number().int().positive().default(200_000),
  UPLOAD_MAX_TOKENS: z.coerce.number().int().positive().default(50_000),
  UPLOAD_MAX_PAGES: z.coerce.number().int().positive().default(50),
  UPLOAD_MIN_CLEAN_CHARS: z.coerce.number().int().nonnegative().default(200),
  UPLOAD_MIN_CHARS_PER_PAGE: z.coerce.number().int().nonnegative().default(30),
  OPENAI_API_KEY: z.string().optional().transform((value) => (value && value.length > 0 ? value : undefined)),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OPENAI_PLAN_ESCAPE_MODEL: z.string().min(1).default("gpt-4o"),
  LANGSMITH_TRACING: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  LANGSMITH_API_KEY: z.string().min(1).optional(),
  LANGSMITH_PROJECT: z.string().min(1).default("edpath"),
  LANGSMITH_ENDPOINT: z.string().url().optional(),
  LANGCHAIN_CALLBACKS_BACKGROUND: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
});

// Parse the environment variables
const parsed = envSchema.safeParse(process.env);

// Check if the environment variables are valid
if (!parsed.success) {
  // Log the invalid environment variables
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
};

// Define the environment variables
export const env = parsed.data;

// Define the function to check if the OpenAI API key is configured
export function isOpenAiConfigured(): boolean {
  // Return true if the OpenAI API key is configured
  return Boolean(env.OPENAI_API_KEY);
};


// Define the function to check if the LangSmith tracing is enabled
export function isLangSmithTracingEnabled(): boolean {
  // Return true if the LangSmith tracing is enabled
  return env.LANGSMITH_TRACING === true && Boolean(env.LANGSMITH_API_KEY);
};