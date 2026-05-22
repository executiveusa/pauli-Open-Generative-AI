import OpenAI from "openai";

let client = null;

export function getAIClient() {
  if (!client) {
    const baseURL = process.env.OPENAI_BASE_URL || "http://31.220.58.212:8082";
    const apiKey = process.env.OPENAI_API_KEY || "dummy";
    const model = process.env.OPENAI_MODEL || "moonshotai/kimi-k2-thinking";

    client = new OpenAI({
      baseURL,
      apiKey,
      defaultModel: model,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[AI Client] Initialized with NIM proxy at ${baseURL}`);
    }
  }

  return client;
}

export async function generateWithAI(messages, options = {}) {
  const client = getAIClient();
  const model = process.env.OPENAI_MODEL || "moonshotai/kimi-k2-thinking";

  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      ...options.extra,
    });

    return {
      success: true,
      content: response.choices[0].message.content,
      usage: response.usage,
      model,
    };
  } catch (error) {
    const errorMsg = error?.message || "Unknown error";
    console.error("[AI Generation] Error:", errorMsg);

    return {
      success: false,
      error: errorMsg,
      content: null,
    };
  }
}

export async function healthCheck() {
  try {
    const baseURL = process.env.OPENAI_BASE_URL || "http://31.220.58.212:8082";
    const response = await fetch(`${baseURL}/health`, {
      timeout: 5000,
    });

    return {
      healthy: response.ok,
      status: response.status,
      url: baseURL,
    };
  } catch (error) {
    return {
      healthy: false,
      status: null,
      url: process.env.OPENAI_BASE_URL || "http://31.220.58.212:8082",
      error: error.message,
    };
  }
}

export { OpenAI };
