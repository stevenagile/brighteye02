// Lovable AI 閘道(OpenAI 相容)呼叫工具
// 使用專案內建的 LOVABLE_API_KEY,無需自備 OpenAI/Anthropic 金鑰。
// 文件:https://docs.lovable.dev/integrations/ai

const AI_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = Deno.env.get("LOVABLE_AI_MODEL") ?? "google/gemini-2.5-flash";
const API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResult {
  content: string;
  tokens: number | null;
}

// 呼叫 LLM,回傳文字與 token 用量
export async function callLovableAI(
  messages: ChatMessage[],
  model = DEFAULT_MODEL,
): Promise<AIResult> {
  if (!API_KEY) throw new Error("缺少 LOVABLE_API_KEY");

  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.2 }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`AI gateway ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 回應為空");

  return {
    content: content.trim(),
    tokens: data?.usage?.total_tokens ?? null,
  };
}
