import Anthropic from "@anthropic-ai/sdk";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type CallClaudeOptions = {
  promptKey: string;
  variables: Record<string, string>;
  leadId?: string;
};

export const callClaude = async ({ promptKey, variables, leadId }: CallClaudeOptions): Promise<string> => {
  const admin = createSupabaseAdminClient();

  const { data: prompt, error } = await admin
    .from("ai_prompts")
    .select("system_prompt, user_prompt_template, model, max_tokens")
    .eq("key", promptKey)
    .single();

  if (error || !prompt) throw new Error(`AI prompt not found: ${promptKey}`);

  let userPrompt = prompt.user_prompt_template as string;
  for (const [key, value] of Object.entries(variables)) {
    userPrompt = userPrompt.replaceAll(`{{${key}}}`, value);
  }

  const start = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let responseText = "";
  let errorMsg: string | undefined;

  try {
    const response = await anthropic.messages.create({
      model: prompt.model as string,
      max_tokens: prompt.max_tokens as number,
      system: [
        {
          type: "text",
          text: prompt.system_prompt as string,
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [{ role: "user", content: userPrompt }]
    });

    const block = response.content[0];
    responseText = block.type === "text" ? block.text : "";
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "unknown";
    throw err;
  } finally {
    const latencyMs = Date.now() - start;
    const costUsd = estimateCost(prompt.model as string, inputTokens, outputTokens);

    await admin.from("ai_usage_log").insert({
      endpoint: promptKey,
      lead_id: leadId ?? null,
      model: prompt.model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      error: errorMsg ?? null
    });
  }

  // Strip markdown code fences defensively before returning
  return responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

// Approximate token costs — update if Anthropic changes pricing
const estimateCost = (model: string, input: number, output: number): number => {
  if (model.includes("haiku")) {
    // Haiku 4.5: ~$0.80/MTok input, $4/MTok output
    return (input * 0.8 + output * 4) / 1_000_000;
  }
  // Sonnet 4.6: ~$3/MTok input, $15/MTok output
  return (input * 3 + output * 15) / 1_000_000;
};
