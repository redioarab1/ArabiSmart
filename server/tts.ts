/**
 * Text-to-Speech service using Google Cloud TTS API
 * Converts news articles to audio podcasts
 */

import { storagePut } from "./storage";

interface TTSOptions {
  text: string;
  language: "ar" | "sv" | "en";
  newsId: number;
}

interface TTSResult {
  audioUrl: string;
  duration: number | null;
}

/**
 * Convert text to speech and upload to S3
 */
export async function textToSpeech(options: TTSOptions): Promise<TTSResult> {
  const { text, language, newsId } = options;

  // Language-specific voice configuration
  const voiceConfig = {
    ar: {
      languageCode: "ar-XA",
      name: "ar-XA-Wavenet-A", // Female voice
      ssmlGender: "FEMALE",
    },
    sv: {
      languageCode: "sv-SE",
      name: "sv-SE-Wavenet-A", // Female voice
      ssmlGender: "FEMALE",
    },
    en: {
      languageCode: "en-US",
      name: "en-US-Wavenet-F", // Female voice
      ssmlGender: "FEMALE",
    },
  };

  const voice = voiceConfig[language];

  try {
    // Use Google Cloud Text-to-Speech API
    // Note: This requires GOOGLE_CLOUD_TTS_API_KEY environment variable
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    
    if (!apiKey) {
      throw new Error("GOOGLE_CLOUD_TTS_API_KEY is not configured");
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voice.languageCode,
            name: voice.name,
            ssmlGender: voice.ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TTS API error: ${error}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent; // Base64 encoded audio

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioContent, "base64");

    // Upload to S3
    const fileKey = `podcasts/news-${newsId}-${Date.now()}.mp3`;
    const { url } = await storagePut(fileKey, audioBuffer, "audio/mpeg");

    // Estimate duration (rough calculation: ~150 words per minute, ~5 chars per word)
    const estimatedWords = text.length / 5;
    const estimatedDuration = Math.ceil((estimatedWords / 150) * 60); // in seconds

    return {
      audioUrl: url,
      duration: estimatedDuration,
    };
  } catch (error) {
    console.error("[TTS] Error generating audio:", error);
    throw error;
  }
}

/**
 * Prepare text for TTS by cleaning and formatting
 */
export function prepareTextForTTS(title: string, description: string | null, content: string | null): string {
  let text = title;

  if (description) {
    text += ". " + description;
  }

  if (content) {
    // Remove HTML tags if present
    const cleanContent = content.replace(/<[^>]*>/g, "");
    text += ". " + cleanContent;
  }

  // Limit to reasonable length (Google TTS has 5000 character limit)
  if (text.length > 4500) {
    text = text.substring(0, 4500) + "...";
  }

  return text;
}
