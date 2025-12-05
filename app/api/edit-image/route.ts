import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageDataUrl = formData.get("image") as string | null;
    const prompt = formData.get("prompt") as string | null;

    if (!imageDataUrl || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: image and prompt are required" },
        { status: 400 }
      );
    }

    // Parse service account JSON from environment variable
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      return NextResponse.json(
        { error: "Service account credentials not configured" },
        { status: 500 }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || serviceAccount.project_id;
    const location = process.env.VERTEX_AI_LOCATION || "us-west2";

    // Convert data URL to base64 string (remove data:image/...;base64, prefix)
    const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json(
        { error: "Invalid image data URL format" },
        { status: 400 }
      );
    }

    const [, imageFormat, base64Data] = base64Match;

    // Initialize Vertex AI with service account credentials
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
      googleAuthOptions: {
        credentials: serviceAccount,
      },
    });

    // Get the generative model - try gemini-2.5-flash-image first, fallback to gemini-pro-vision if needed
    const model = "gemini-2.5-flash-image";
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
    });

    // Prepare the request
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: `image/${imageFormat}`,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    // Generate content with retry logic for rate limiting
    let result;
    let lastError;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        result = await generativeModel.generateContent(requestBody);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        // Check if it's a rate limit error (429)
        if (error.code === 429 || error.status === "RESOURCE_EXHAUSTED" || error.message?.includes("429")) {
          if (attempt < maxRetries - 1) {
            // Wait before retrying (exponential backoff)
            const delay = retryDelay * Math.pow(2, attempt);
            console.log(`Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          } else {
            // Final attempt failed, return rate limit error
            return NextResponse.json(
              {
                error: "Rate limit exceeded. Vertex AI is temporarily unavailable. Please wait a few minutes and try again.",
                code: "RATE_LIMIT",
                details: "You've hit the rate limit for Vertex AI. This can happen on free tier accounts or when making too many requests quickly.",
              },
              { status: 429 }
            );
          }
        }
        // For other errors, throw immediately
        throw error;
      }
    }

    if (!result) {
      throw lastError || new Error("Failed to generate content after retries");
    }

    const response = result.response;

    // Extract the edited image from the response
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts) {
      return NextResponse.json(
        { error: "Invalid response format from Vertex AI" },
        { status: 500 }
      );
    }

    const imagePart = response.candidates[0].content.parts.find(
      (part: any) => part.inlineData
    );

    if (!imagePart || !imagePart.inlineData) {
      return NextResponse.json(
        { error: "No image in response from Vertex AI. The model may not support image generation, or the prompt was blocked." },
        { status: 500 }
      );
    }

    // Convert the response image to data URL
    const editedImageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    return NextResponse.json({ editedImage: editedImageDataUrl });
  } catch (error: any) {
    console.error("Error editing image:", error);
    
    // Handle specific error types
    if (error.code === 429 || error.status === "RESOURCE_EXHAUSTED") {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a few minutes and try again.",
          code: "RATE_LIMIT",
          details: error.message,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to edit image", details: error.message },
      { status: 500 }
    );
  }
}

