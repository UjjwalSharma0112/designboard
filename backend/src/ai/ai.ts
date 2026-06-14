import { GoogleGenerativeAI } from "@google/generative-ai";

type AIResponse = string;

interface AICall {
  system: string;
  prompt: string;
  json: boolean;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API!);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite",
});

const speechModel = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-tts-preview",
});

export async function callAI(call: AICall): Promise<AIResponse> {
  const finalPrompt = `
SYSTEM:
${call.system}

USER:
${call.prompt}

${call.json ? "Return ONLY valid JSON. No markdown. No explanation." : ""}
`;

  const result = await model.generateContent(finalPrompt);

  const response = result.response;

  return response.text();
}

function generateWavHeader(
  dataLength: number,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number,
): Buffer {
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4); // File size - 8
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return buffer;
}

export async function generateSpeech(text: string): Promise<string> {
  const result = await speechModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Read the following question out loud, word for word. Do not say anything else: "${text}"`,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Zephyr", // Core options: Aoede, Charon, Fenrir, Kore, Puck
          },
        },
      },
    } as any,
  });

  const part = result.response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData,
  );
  if (part && part.inlineData) {
    const rawAudioBase64 = part.inlineData.data;
    const rawAudioBuffer = Buffer.from(rawAudioBase64, "base64");
    const wavHeader = generateWavHeader(rawAudioBuffer.length, 24000, 1, 16);
    const wavBuffer = Buffer.concat([wavHeader, rawAudioBuffer]);
    return wavBuffer.toString("base64");
  }
  throw new Error("Failed to generate audio from Gemini");
}

export async function generateSpeechStream(
  text: string,
  onChunk: (chunk: Buffer) => void,
): Promise<void> {
  const resultStream = await speechModel.generateContentStream({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Read the following question out loud, word for word. Do not say anything else: "${text}"`,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Zephyr",
          },
        },
      },
    } as any,
  });

  for await (const chunk of resultStream.stream) {
    const part = chunk.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData,
    );
    if (part && part.inlineData) {
      const rawAudioBase64 = part.inlineData.data;
      const rawAudioBuffer = Buffer.from(rawAudioBase64, "base64");
      onChunk(rawAudioBuffer);
    }
  }
}

