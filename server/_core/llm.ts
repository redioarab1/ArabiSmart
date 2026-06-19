import { ENV } from "./env";

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

// تحديد URL ومفتاح API:
// - إذا وُجد OPENAI_API_KEY → يستخدم OpenAI
// - إذا وُجد GROQ_API_KEY → يستخدم Groq (مجاني 14,400 طلب/يوم)
// - إذا وُجد GEMINI_API_KEY → يستخدم Google Gemini (مجاني)
// - وإلا → يستخدم Manus Forge
const resolveApiUrl = () => {
  if (process.env.OPENAI_API_KEY) {
    return "https://api.openai.com/v1/chat/completions";
  }
  if (process.env.GROQ_API_KEY) {
    return "https://api.groq.com/openai/v1/chat/completions";
  }
  if (process.env.GEMINI_API_KEY) {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
  return ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
};

const resolveApiKey = () =>
  process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || ENV.forgeApiKey;

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

const resolveModel = (requestedModel?: string) => {
  if (requestedModel) return requestedModel;
  if (process.env.OPENAI_API_KEY) return "gpt-4o-mini";
  // النموذج الافتراضي للمهام العامة
  if (process.env.GROQ_API_KEY) return "llama-3.3-70b-versatile";
  if (process.env.GEMINI_API_KEY) return "gemini-2.0-flash";
  return "gemini-2.5-flash";
};

const assertApiKey = () => {
  if (!resolveApiKey()) {
    throw new Error("LLM API key is not configured. Set OPENAI_API_KEY or BUILT_IN_FORGE_API_KEY");
  }
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

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

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

  const payload: Record<string, unknown> = {
    model: resolveModel(requestedModel),
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // احترام max_tokens المُمَرَّر من الاستدعاء إن وجد، وإلا استخدام القيمة الافتراضية
  const callerMaxTokens = params.max_tokens ?? params.maxTokens;
  payload.max_tokens = callerMaxTokens ?? (process.env.GROQ_API_KEY ? 8192 : 32768);
  // حقل thinking مدعوم فقط في Manus Forge وليس في Groq/Gemini
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    payload.thinking = { budget_tokens: 128 };
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${resolveApiKey()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
