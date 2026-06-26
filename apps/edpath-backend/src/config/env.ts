import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  EDPATH_LANGGRAPH_DEPLOYMENT_URL: z.string().url(),
  EDPATH_LANGGRAPH_GRAPH_ID: z
    .string()
    .min(1)
    .default("edpath-walking-skeleton"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
