import { run } from "@openai/agents";
import { lifeMDAgent } from "./lifeMDAgent.js";
import { ensureMcpConnection } from "./mcpServer.js";
import { getSession } from "./lifemdSessionManager.js";
import labResultTool from "../mcp/tools/labResult.js";

export interface FileInput {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
}

// Helper so the backend can trigger the agent directly
const runLifeMdAgent = async (
  message: string,
  conversationId?: string,
  file?: FileInput
): Promise<string> => {
  await ensureMcpConnection();
  let result;

  // If a file is provided, call the labResult tool directly first, then pass extracted data to agent
  if (file) {
    const isImage = file.mimetype?.startsWith("image/");
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname?.toLowerCase().endsWith(".pdf");

    if (isImage || isPdf) {
      // Convert file buffer to base64
      const fileDataBase64 = file.buffer.toString("base64");

      try {
        // Step 1: Call labResult tool directly to extract data (avoid embedding huge base64 in message)

        const extractionResult = await labResultTool.handler({
          file_data: fileDataBase64,
          file_mimetype: file.mimetype,
        } as any);

        // Extract the data from the result
        let extractedData = "Failed to extract data";
        if (extractionResult.structuredContent?.extracted_data) {
          const data = extractionResult.structuredContent.extracted_data;
          extractedData = typeof data === "string" ? data : String(data);
        } else if (
          extractionResult.content &&
          extractionResult.content.length > 0
        ) {
          const firstContent = extractionResult.content[0];
          if (
            firstContent &&
            typeof firstContent === "object" &&
            "text" in firstContent
          ) {
            extractedData = (firstContent as { text: string }).text;
          }
        }

        // Step 2: Pass the extracted data (much smaller) to the agent for analysis
        const analysisMessage = message
          ? `${message}\n\nHere is the extracted data from a lab result document:\n\n${extractedData}\n\nPlease analyze this data and provide insights based on the user's question.`
          : `Please analyze this extracted lab result data and provide insights:\n\n${extractedData}\n\nExplain what these results mean, highlight any values that are outside normal ranges, and provide general guidance.`;

        // Run the agent with the extracted data (much smaller message)
        const result = await run(lifeMDAgent, analysisMessage);

        const finalOutput = result.finalOutput;
        if (typeof finalOutput === "string") {
          return finalOutput;
        }
        throw new Error("Agent did not produce a textual response");
      } catch (error) {
        console.error("Error processing file:", error);
        throw error;
      }
    }
  }

  // Default: run the agent with just the message (no file or file processing failed)
  if (conversationId) {
    const session = getSession(conversationId);
    result = await run(lifeMDAgent, message, { session });
  } else {
    result = await run(lifeMDAgent, message);
  }
  const finalOutput = result.finalOutput;
  if (typeof finalOutput === "string") {
    return finalOutput;
  }
  throw new Error("Agent did not produce a textual response");
};

export default runLifeMdAgent;
