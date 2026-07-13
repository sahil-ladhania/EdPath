/*
  * Upload schemas for the backend graph.
*/
import { z } from "zod";

// Define the pdf meta schema
export const PdfMetaSchema = z.object({
  filename: z.string().min(1),
  charCount: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
});

// Define the pdf meta type
export type PdfMeta = z.infer<typeof PdfMetaSchema>;

// Define the upload reject reason schema
export const UploadRejectReasonSchema = z.enum([
  "empty",
  "no_text_layer",
  "over_ceiling",
  "unparseable",
]);

// Define the upload reject reason type
export type UploadRejectReason = z.infer<typeof UploadRejectReasonSchema>;

// Define the upload result schema
export const UploadResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("accepted"), pdfMeta: PdfMetaSchema }),
  z.object({
    status: z.literal("rejected"),
    reason: UploadRejectReasonSchema,
    message: z.string().min(1),
  }),
]);

// Define the upload result type
export type UploadResult = z.infer<typeof UploadResultSchema>;