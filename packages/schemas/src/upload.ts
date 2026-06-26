import { z } from "zod";

/** PDF provenance captured at /upload (§5.1 `pdfMeta`; D3). */
export const PdfMetaSchema = z.object({
  filename: z.string().min(1),
  charCount: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
});
export type PdfMeta = z.infer<typeof PdfMetaSchema>;

/** Why an upload was rejected at the fail-fast gate (F1.3). */
export const UploadRejectReasonSchema = z.enum([
  "empty",
  "no_text_layer", // scanned / image-only, no extractable text layer
  "over_ceiling", // exceeds the token / char ceiling
  "unparseable",
]);
export type UploadRejectReason = z.infer<typeof UploadRejectReasonSchema>;

/**
 * /upload boundary result (Part C #9). No `threadId` — the client generates and
 * holds it in URL / localStorage (Flag 3; architecture §5.4, db-schema). The
 * graph starts only on an accepted result.
 */
export const UploadResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("accepted"), pdfMeta: PdfMetaSchema }),
  z.object({
    status: z.literal("rejected"),
    reason: UploadRejectReasonSchema,
    message: z.string().min(1), // human-readable reason for the upload surface
  }),
]);
export type UploadResult = z.infer<typeof UploadResultSchema>;
