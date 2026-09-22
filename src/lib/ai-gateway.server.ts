const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";

type ResponsesInput = {
  system: string;
  user: string;
  effort?: "low" | "medium" | "high";
};

/**
 * Calls the Lovable AI Gateway Responses API with streaming enabled (required for
 * reasoning models) and accumulates the final text server-side.
 */
export async function generateText({ system, user, effort = "medium" }: ResponsesInput) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured yet. Missing LOVABLE_API_KEY.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: system,
      input: [{ role: "user", content: [{ type: "input_text", text: user }] }],
      stream: true,
      store: false,
      reasoning: { effort, summary: "auto" },
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new Error("The AI service is busy right now. Please try again in a moment.");
    }
    if (response.status === 402 || response.status === 403) {
      throw new Error(
        "AI usage is currently unavailable for this workspace. Please check the AI credit settings.",
      );
    }
    throw new Error(`AI request failed (${response.status}). ${detail.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string };
          };
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            text += event.delta;
          } else if (event.type === "response.completed" && !text) {
            text = event.response?.output_text ?? "";
          }
        } catch {
          // ignore keep-alive / non-JSON frames
        }
      }
    }
  }

  return text.trim();
}
