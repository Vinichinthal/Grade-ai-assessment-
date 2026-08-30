import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient duration for OCR & grading

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, base64File, mimeType } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please define GEMINI_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const parts: any[] = [{ text: prompt }];
    if (base64File && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64File,
        },
      });
    }

    // List of models in order of priority
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-3.7-flash",
      "gemini-flash-latest"
    ];

    let lastError = "";
    let lastStatus = 500;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            return NextResponse.json({ text: textResponse, modelUsed: model });
          }
        } else {
          const errText = await response.text();
          lastError = `Model ${model} returned HTTP ${response.status}: ${errText}`;
          lastStatus = response.status;
          console.warn(`[Gemini API] ${model} failed with ${response.status}, trying next model...`);
        }
      } catch (err: any) {
        lastError = err.message || "Network request failed";
        console.warn(`[Gemini API] Request error with ${model}:`, err);
      }
    }

    return NextResponse.json(
      { error: lastError || "Failed to generate content with available Gemini models" },
      { status: lastStatus }
    );
  } catch (error: any) {
    console.error("Gemini route handler error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
