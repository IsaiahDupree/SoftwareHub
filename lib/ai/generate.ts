import OpenAI from "openai";

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function generateText(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: options?.maxTokens || 500,
    temperature: options?.temperature || 0.7,
  });
  return response.choices[0]?.message?.content || "";
}

export async function generateCommentReply(context: string): Promise<string> {
  return generateText(`Generate a helpful, professional reply to this comment:\n\n${context}`);
}

export async function generateCourseDescription(title: string, topics: string[]): Promise<string> {
  return generateText(
    `Write a compelling course description for "${title}" covering: ${topics.join(", ")}. Keep it under 200 words.`
  );
}
