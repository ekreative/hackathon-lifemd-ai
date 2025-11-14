import { z } from "zod/v3";
import type { ToolRegistration } from "./types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/spec.types.js";
import { openai } from "../openai.js";

export interface LabResultToolInput {
  file_data: string; // base64 encoded file data
  file_mimetype?: string; // MIME type of the file (e.g., "image/png", "application/pdf")
}

const labResultTool: ToolRegistration = {
  name: "lab_result_analysis",
  schema: {
    title: "Lab Result Analysis",
    description:
      "Extracts and prepares data from lab results, medical documents, and health reports from images or PDFs. Returns the extracted text, values, measurements, and reference ranges for the agent to analyze.",
    inputSchema: {
      file_data: z.string().describe("Base64 encoded file data (image or PDF)"),
      file_mimetype: z
        .string()
        .optional()
        .describe(
          "MIME type of the file (e.g., 'image/png', 'application/pdf')"
        ),
    },
    outputSchema: {
      extracted_data: z
        .string()
        .describe(
          "Extracted text, values, measurements, and reference ranges from the document"
        ),
    },
  },
  handler: async ({
    file_data,
    file_mimetype,
  }: LabResultToolInput): Promise<CallToolResult> => {
    try {
      const isPdf =
        file_mimetype === "application/pdf" || file_mimetype?.includes("pdf");
      const mimeType = file_mimetype || "image/png";
      const fileDataUrl = `data:${mimeType};base64,${file_data}`;

      // For PDFs, try using vision API (some models support PDFs directly)
      // For images, use vision API
      const extractionPrompt = isPdf
        ? "Extract all text, values, measurements, and reference ranges from this PDF lab result or medical document. Read all pages if multiple pages are visible. Include everything you can read - test names, values, units, reference ranges, dates, patient information, and any other information."
        : "Extract all text, values, measurements, and reference ranges from this lab result or medical document. Include everything you can read - test names, values, units, reference ranges, dates, and any other information.";

      // Use OpenAI vision API to extract text/data from the file
      // This works for both images and PDFs (if the model supports PDFs)
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a medical document data extractor.
Your role is to extract ALL text, values, measurements, and reference ranges from lab results and medical documents.

Extract:
- All test names and values
- All measurements and units
- All reference ranges (normal ranges)
- All dates and patient information
- Any notes or comments
- Any abnormal flags or indicators
${
  isPdf
    ? "- If this is a multi-page PDF, extract data from all visible pages"
    : ""
}

Format the extracted data clearly and completely. Do not interpret or explain - just extract the raw data.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: extractionPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: fileDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 4000, // Increased for PDFs which may have more content
      });

      const extractedData =
        response.choices[0]?.message?.content ??
        "Failed to extract data from the document.";

      // Check if extraction was successful or if we got an error message
      if (
        extractedData.toLowerCase().includes("cannot read") ||
        extractedData.toLowerCase().includes("unable to") ||
        extractedData.toLowerCase().includes("error")
      ) {
        throw new Error(
          `PDF extraction may not be fully supported. ${extractedData}`
        );
      }

      return {
        content: [{ type: "text", text: extractedData }],
        structuredContent: { extracted_data: extractedData },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Lab result extraction error:", errorMessage);

      // Provide helpful error message for PDFs
      const isPdf =
        file_mimetype === "application/pdf" || file_mimetype?.includes("pdf");
      const errorText = isPdf
        ? `Error extracting data from PDF lab result: ${errorMessage}. The PDF may be too complex, corrupted, or the vision model may have limited PDF support. Please try converting the PDF to an image (PNG/JPG) and upload that instead.`
        : `Error extracting data from lab result: ${errorMessage}. Please ensure the file is a valid image (PNG, JPG) or PDF.`;

      return {
        content: [
          {
            type: "text",
            text: errorText,
          },
        ],
        structuredContent: {
          extracted_data: `Error: ${errorMessage}`,
        },
      };
    }
  },
};

export default labResultTool;
