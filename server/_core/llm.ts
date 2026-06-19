
export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

// النماذج المتاحة في Groq مجاناً
export type GroqModel =
  | "llama-3.3-70b-versatile"
  | "deepseek-r1-distill-llama-70b"
  | "llama-3.1-8b-instant"
  | "groq/compound"
  | "groq/compound-mini"
  | "meta-llama/llama-4-scout-17b-16e-instruct";

export const GROQ_MODELS: Record<GroqModel, { name: string; description: string; useCase: string; icon: string }> = {
  "llama-3.3-70b-versatile": {
    name: "Llama 3.3 70B",
    description: "نموذج قوي ومتوازن للمهام العامة والتحليل",
    useCase: "الملخصات اليومية والتحليل الإخباري",
    icon: "🦙",
  },
  "deepseek-r1-distill-llama-70b": {
    name: "DeepSeek R1",
    description: "نموذج متخصص في التفكير العميق والاستدلال المنطقي",
    useCase: "التحليل المعمّق والأسئلة المعقدة",
    icon: "🔍",
  },
  "llama-3.1-8b-instant": {
    name: "Llama 3.1 8B",
    description: "نموذج خفيف وسريع جداً للمهام البسيطة",
    useCase: "الردود السريعة والتصنيف",
    icon: "⚡",
  },
  "groq/compound": {
    name: "Compound Beta",
    description: "نموذج مركّب يجمع قدرات متعددة مع بحث ويب",
    useCase: "الأسئلة التي تتطلب معلومات حديثة",
    icon: "🌐",
  },
  "groq/compound-mini": {
    name: "Compound Mini",
    description: "نسخة مخففة من Compound مع بحث ويب",
    useCase: "البحث السريع والردود المختصرة",
    icon: "🔎",
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    name: "Llama 4 Scout",
    description: "أحدث نماذج Meta مع دعم ممتاز للعربية",
    useCase: "المهام العامة والمحادثة",
    icon: "🚀",
  },
};

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: GroqModel | string; // اختيار النموذج اختياري
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// ─────────────────────────────────────────────────────────────────────────────
// نظام Load Balancing الذكي بين Groq وSambaNova وCerebras
// ─────────────────────────────────────────────────────────────────────────────

type Provider = {
  name: string;
  apiUrl: string;
  apiKey: string;
  /** خريطة من اسم النموذج العام إلى الاسم الفعلي عند هذا المزود */
  modelMap: Record<string, string>;
  defaultModel: string;
  /** هل يدعم response_format json_schema؟ */
  supportsJsonSchema: boolean;
};

const buildProviders = (): Provider[] => {
  const providers: Provider[] = [];

  // ── Groq ──────────────────────────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      apiUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      modelMap: {
        "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant": "llama-3.1-8b-instant",
        "deepseek-r1-distill-llama-70b": "deepseek-r1-distill-llama-70b",
        "groq/compound": "compound-beta",
        "groq/compound-mini": "compound-beta-mini",
        "meta-llama/llama-4-scout-17b-16e-instruct": "meta-llama/llama-4-scout-17b-16e-instruct",
      },
      defaultModel: "llama-3.3-70b-versatile",
      supportsJsonSchema: true,
    });
  }

  // ── SambaNova ─────────────────────────────────────────────────────────────
  if (process.env.SAMBANOVA_API_KEY) {
    providers.push({
      name: "SambaNova",
      apiUrl: "https://api.sambanova.ai/v1/chat/completions",
      apiKey: process.env.SAMBANOVA_API_KEY,
      modelMap: {
        "llama-3.3-70b-versatile": "Meta-Llama-3.3-70B-Instruct",
        "llama-3.1-8b-instant": "Meta-Llama-3.1-8B-Instruct",
        "deepseek-r1-distill-llama-70b": "DeepSeek-R1",
        "groq/compound": "Meta-Llama-3.3-70B-Instruct",
        "groq/compound-mini": "Meta-Llama-3.1-8B-Instruct",
        "meta-llama/llama-4-scout-17b-16e-instruct": "Meta-Llama-3.3-70B-Instruct",
      },
      defaultModel: "Meta-Llama-3.3-70B-Instruct",
      supportsJsonSchema: false, // SambaNova لا يدعم json_schema بشكل موثوق
    });
  }

  // ── Cerebras ──────────────────────────────────────────────────────────────
  if (process.env.CEREBRAS_API_KEY) {
    providers.push({
      name: "Cerebras",
      apiUrl: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY,
      modelMap: {
        "llama-3.3-70b-versatile": "gpt-oss-120b",
        "llama-3.1-8b-instant": "gpt-oss-120b",
        "deepseek-r1-distill-llama-70b": "gpt-oss-120b",
        "groq/compound": "gpt-oss-120b",
        "groq/compound-mini": "gpt-oss-120b",
        "meta-llama/llama-4-scout-17b-16e-instruct": "gpt-oss-120b",
      },
      defaultModel: "gpt-oss-120b",
      supportsJsonSchema: false, // Cerebras لا يدعم json_schema
    });
  }

  return providers;
};

// حالة Round-Robin: يتناوب بين المزودين بالتسلسل
let providerIndex = 0;

/**
 * يختار المزود التالي بنظام Round-Robin مع Fallback تلقائي عند الفشل.
 * - يبدأ من المزود الحالي في الدور
 * - إذا فشل، ينتقل للتالي تلقائياً
 * - إذا فشلت جميع المزودين، يرجع للـ Manus Forge
 */
const getNextProvider = (providers: Provider[]): Provider | null => {
  if (providers.length === 0) return null;
  const p = providers[providerIndex % providers.length];
  providerIndex = (providerIndex + 1) % providers.length;
  return p;
};

// ─────────────────────────────────────────────────────────────────────────────

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

// النموذج الافتراضي لكل خدمة - توزيع مُحسَّن
export const DEFAULT_MODELS = {
  classification: "llama-3.1-8b-instant" as GroqModel,     // سريع وخفيف للتصنيف
  summary: "llama-3.3-70b-versatile" as GroqModel,          // جودة عالية للملخص اليومي
  translation: "llama-3.1-8b-instant" as GroqModel,         // سريع وكافي للترجمة
  chat: "llama-3.3-70b-versatile" as GroqModel,             // النموذج الوحيد في /AI
  podcast: "llama-3.3-70b-versatile" as GroqModel,          // جودة عالية لسكريبت البودكاست
  analysis: "deepseek-r1-distill-llama-70b" as GroqModel,   // تفكير عميق للتحليل المعمّق
  search: "groq/compound" as GroqModel,                      // بحث ويب للمعلومات الحديثة
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

/**
 * استدعاء LLM مع نظام Load Balancing الذكي:
 * - يتناوب بين Groq وSambaNova وCerebras بنظام Round-Robin
 * - عند فشل أحدهم (rate limit أو خطأ)، ينتقل للتالي تلقائياً
 * - إذا فشلت جميع المزودين، يستخدم Manus Forge كـ fallback نهائي
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model: requestedModel,
  } = params;

  const callerMaxTokens = params.max_tokens ?? params.maxTokens;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  const normalizedMessages = messages.map(normalizeMessage);

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );

  // بناء قائمة المزودين المتاحين
  const providers = buildProviders();

  // إذا لم يكن هناك مزود خارجي، استخدم Manus Forge مباشرة
  if (providers.length === 0) {
    return callForge(params, normalizedMessages, normalizedResponseFormat, normalizedToolChoice, callerMaxTokens);
  }

  // محاولة كل مزود بالتناوب
  const errors: string[] = [];
  const startIndex = providerIndex;

  for (let attempt = 0; attempt < providers.length; attempt++) {
    const provider = getNextProvider(providers)!;

    try {
      const result = await callProvider(
        provider,
        requestedModel,
        normalizedMessages,
        tools,
        normalizedToolChoice,
        normalizedResponseFormat,
        callerMaxTokens
      );
      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[LLM] ${provider.name} failed: ${errMsg.slice(0, 120)}`);
      errors.push(`${provider.name}: ${errMsg.slice(0, 80)}`);
      // استمر للمزود التالي
    }
  }

  // جميع المزودين فشلوا — جرّب Manus Forge كـ fallback نهائي
  console.warn(`[LLM] All providers failed, falling back to Manus Forge. Errors: ${errors.join(" | ")}`);
  try {
    return await callForge(params, normalizedMessages, normalizedResponseFormat, normalizedToolChoice, callerMaxTokens);
  } catch (forgeErr) {
    throw new Error(
      `LLM invoke failed on all providers. Errors: ${errors.join(" | ")} | Forge: ${forgeErr instanceof Error ? forgeErr.message : String(forgeErr)}`
    );
  }
}

/** استدعاء مزود خارجي (Groq / SambaNova / Cerebras) */
async function callProvider(
  provider: Provider,
  requestedModel: string | undefined,
  normalizedMessages: ReturnType<typeof normalizeMessage>[],
  tools: Tool[] | undefined,
  normalizedToolChoice: "none" | "auto" | ToolChoiceExplicit | undefined,
  normalizedResponseFormat: ReturnType<typeof normalizeResponseFormat>,
  callerMaxTokens: number | undefined
): Promise<InvokeResult> {
  // تحديد النموذج الفعلي عند هذا المزود
  const genericModel = requestedModel ?? "llama-3.3-70b-versatile";
  const actualModel = provider.modelMap[genericModel] ?? provider.defaultModel;

  const payload: Record<string, unknown> = {
    model: actualModel,
    messages: normalizedMessages,
    max_tokens: callerMaxTokens ?? 8192,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // response_format: فقط إذا كان المزود يدعم json_schema، وإلا استخدم json_object
  if (normalizedResponseFormat) {
    if (normalizedResponseFormat.type === "json_schema" && !provider.supportsJsonSchema) {
      // تحويل json_schema إلى json_object للمزودين الذين لا يدعمونه
      payload.response_format = { type: "json_object" };
      // أضف تعليمات JSON في رسالة النظام
      const systemMsg = normalizedMessages.find(m => m.role === "system");
      if (systemMsg && typeof systemMsg.content === "string") {
        systemMsg.content += "\n\nأجب بـ JSON صالح فقط دون أي نص إضافي.";
      }
    } else {
      payload.response_format = normalizedResponseFormat;
    }
  }

  const response = await fetch(provider.apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status} ${response.statusText} – ${errorText.slice(0, 200)}`);
  }

  return (await response.json()) as InvokeResult;
}

/** استدعاء Manus Forge كـ fallback نهائي */
async function callForge(
  params: InvokeParams,
  normalizedMessages: ReturnType<typeof normalizeMessage>[],
  normalizedResponseFormat: ReturnType<typeof normalizeResponseFormat>,
  normalizedToolChoice: "none" | "auto" | ToolChoiceExplicit | undefined,
  callerMaxTokens: number | undefined
): Promise<InvokeResult> {
  const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL
    ? `${process.env.BUILT_IN_FORGE_API_URL.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
  const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;

  if (!forgeApiKey) {
    throw new Error("No LLM API key configured (GROQ_API_KEY, SAMBANOVA_API_KEY, CEREBRAS_API_KEY, or BUILT_IN_FORGE_API_KEY)");
  }

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    messages: normalizedMessages,
    thinking: { budget_tokens: 128 },
    max_tokens: callerMaxTokens ?? 32768,
  };

  if (params.tools && params.tools.length > 0) {
    payload.tools = params.tools;
  }

  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(forgeApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Forge: ${response.status} ${response.statusText} – ${errorText.slice(0, 200)}`);
  }

  return (await response.json()) as InvokeResult;
}
