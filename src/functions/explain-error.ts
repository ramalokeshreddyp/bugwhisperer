import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const responseSchema = {
  name: "explain_error",
  description: "Explain a code error in beginner-friendly terms with structured sections",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["syntax", "runtime", "logic", "unknown"],
        description: "The type of error"
      },
      categoryLabel: {
        type: "string",
        description: "Human-friendly label like 'Syntax Error', 'Runtime Error', 'Logic Error'"
      },
      whatHappened: {
        type: "string",
        description: "One or two sentences in plain English about what the error means"
      },
      whyItHappened: {
        type: "string",
        description: "2-3 sentences explaining why this error occurs, using analogies where helpful"
      },
      whereToLook: {
        type: "string",
        description: "Tell the user where in their code the problem likely is"
      },
      fixSteps: {
        type: "array",
        items: { type: "string" },
        description: "Step-by-step instructions to fix the error (2-4 steps)"
      },
      codeBefore: {
        type: "string",
        description: "Example of broken code that would cause this error. Empty string if no code was provided."
      },
      codeAfter: {
        type: "string",
        description: "The corrected version of the code. Empty string if no code was provided."
      },
      encouragement: {
        type: "string",
        description: "A short encouraging message for the beginner"
      }
    },
    required: ["category", "categoryLabel", "whatHappened", "whyItHappened", "whereToLook", "fixSteps", "codeBefore", "codeAfter", "encouragement"],
    additionalProperties: false
  }
};

export const explainError = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      errorMessage: z.string().min(1).max(5000),
      codeSnippet: z.string().max(5000).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    // 1. Resolve credentials & endpoint configuration
    let apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    let apiBase = process.env.AI_API_BASE;
    let model = process.env.AI_MODEL;

    if (!apiKey) {
      throw new Error(
        "AI Service not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment variables."
      );
    }

    // Auto-detect based on provided keys if base/model are not explicitly configured
    if (!apiBase) {
      if (process.env.GEMINI_API_KEY) {
        apiBase = "https://generativelanguage.googleapis.com/v1beta/openai";
      } else if (process.env.OPENAI_API_KEY) {
        apiBase = "https://api.openai.com/v1";
      } else {
        apiBase = "https://api.openai.com/v1"; // Fallback
      }
    }

    if (!model) {
      if (process.env.GEMINI_API_KEY) {
        model = "gemini-2.5-flash";
      } else if (process.env.OPENAI_API_KEY) {
        model = "gpt-4o-mini";
      } else {
        model = "gpt-4o-mini"; // Fallback
      }
    }

    const endpointUrl = `${apiBase.replace(/\/$/, "")}/chat/completions`;

    const userContent = data.codeSnippet
      ? `Error message:\n${data.errorMessage}\n\nCode snippet:\n${data.codeSnippet}`
      : `Error message:\n${data.errorMessage}`;

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a friendly coding tutor helping absolute beginners (0-6 months experience) understand error messages.

Rules:
- Use simple, everyday language — NO jargon
- Use analogies (e.g. "brackets are like doors — open one, close it")
- Be encouraging — errors are normal!
- If code is provided, show corrected version in codeBefore/codeAfter
- If no code is provided, create a minimal example that demonstrates the error and fix
- Keep each field concise (2-3 sentences max)
- Fix steps should be actionable and specific`,
          },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: responseSchema,
          },
        ],
        tool_choice: { type: "function", function: { name: "explain_error" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI service error:", response.status, text);
      if (response.status === 429) {
        throw new Error("Too many requests — please wait a moment and try again.");
      }
      if (response.status === 402 || response.status === 401) {
        throw new Error("API authentication failed or usage limit reached. Please verify your API keys.");
      }
      throw new Error(`Failed to explain error (${response.status}). Please check server logs.`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("Could not parse explanation. Please try again.");
    }

    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        category: parsed.category || "unknown",
        categoryLabel: parsed.categoryLabel || "Unknown Error",
        whatHappened: parsed.whatHappened || "",
        whyItHappened: parsed.whyItHappened || "",
        whereToLook: parsed.whereToLook || "",
        fixSteps: parsed.fixSteps || [],
        codeBefore: parsed.codeBefore || "",
        codeAfter: parsed.codeAfter || "",
        encouragement: parsed.encouragement || "You're doing great — keep going!",
      };
    } catch {
      throw new Error("Could not parse explanation. Please try again.");
    }
  });
