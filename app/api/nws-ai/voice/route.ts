import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function createPcmWav(pcm16Data: Int16Array, sampleRate = 24000): ArrayBuffer {
  const byteLength = pcm16Data.byteLength;
  const buffer = new ArrayBuffer(44 + byteLength);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + byteLength, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 mono)
  view.setUint32(24, sampleRate, true); // SampleRate (24000)
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, byteLength, true);

  // Write PCM samples
  const target = new Int16Array(buffer, 44, pcm16Data.length);
  target.set(pcm16Data);

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generates a pleasant synthetic tone audio cue if TTS is offline
function generateTonePcmWav(durationSec = 1.5, sampleRate = 24000): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const pcm16 = new Int16Array(numSamples);
  const freq = 440; // A4
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / durationSec);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * envelope;
    pcm16[i] = Math.max(-32768, Math.min(32767, sample * 32767));
  }
  const wavBuffer = createPcmWav(pcm16, sampleRate);
  return Buffer.from(wavBuffer).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, audioData, mode = "voice-chat" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const userPrompt = transcript || "Analyze current market volume and key technical anchors.";

    if (!apiKey) {
      const mockReply = `Voice desk acknowledgement for ${userPrompt}. Orders remain balanced at key pivots, invalidation pegged at two point five percent risk limit.`;
      return NextResponse.json({
        transcript: userPrompt,
        replyText: mockReply,
        audioBase64: generateTonePcmWav(1.2, 24000),
        sampleRate: 24000,
        mode,
        fallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let spokenReplyText = "";

    // Step 1: Generate institutional voice desk response
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `You are the Lead Voice Trader on the NextWall Street institutional trading floor (NWS AI).
Respond to the trader's spoken query: "${userPrompt}".
Deliver a spoken audio response that sounds natural, crisp, authoritative, and spoken like a veteran pit trader:
- Maximum 2 to 3 sentences.
- Speak directly, clearly stating numbers, key price anchors, and execution bias.
- No markdown formatting or symbols that sound awkward when spoken out loud.`,
      });

      spokenReplyText = response.text?.replace(/[*#_`]/g, "").trim() || "";
    } catch (e: any) {
      spokenReplyText = `Voice desk acknowledgment for ${userPrompt}. Orders steady at primary pivot levels.`;
    }

    // Step 2: Try to generate 24kHz audio via TTS or fallback audio
    let audioBase64 = "";
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: spokenReplyText,
        config: {
          responseModalities: ["AUDIO"] as any,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Zephyr",
              },
            },
          },
        },
      });

      const parts = ttsResponse.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p: any) => p.inlineData?.mimeType?.includes("audio"));
      if (audioPart && audioPart.inlineData?.data) {
        audioBase64 = audioPart.inlineData.data;
      }
    } catch (ttsErr) {
      audioBase64 = generateTonePcmWav(0.6, 24000);
    }

    return NextResponse.json({
      transcript: userPrompt,
      replyText: spokenReplyText,
      audioBase64,
      sampleRate: 24000,
      mode,
    });
  } catch (error: any) {
    console.error("NWS AI Voice API Error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to process voice conversation",
        replyText: "Voice trader terminal reconnecting to audio bus. Please repeat your instruction.",
        audioBase64: "",
      },
      { status: 500 }
    );
  }
}
