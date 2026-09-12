import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
  llm,
  Task,
  getJobContext,
} from "@livekit/agents";
import type { ByteStreamReader } from "@livekit/rtc-node";
import * as google from "@livekit/agents-plugin-google";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

class Assistant extends voice.Agent {
  private tasks: Set<Task<void>> = new Set();

  constructor() {
    super({
      instructions:
        "You are a professional, compassionate medical AI assistant specializing in preliminary diagnostic image analysis.",
    });
  }

  // Called when the agent joins the room
  async onEnter(): Promise<void> {
    const room = getJobContext().room;
    // Register a handler for incoming image streams
    room.registerByteStreamHandler(
      "xray-image",
      async (stream: ByteStreamReader) => {
        const task = Task.from((controller) =>
          this.imageReceived(stream, controller)
        );
        this.tasks.add(task);

        task.result.finally(() => {
          this.tasks.delete(task);
        });
      }
    );
  }

  // Handle the incoming image
  private async imageReceived(
    stream: ByteStreamReader,
    controller: AbortController
  ) {
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      if (controller.signal.aborted) return;
      chunks.push(chunk);
    }

    // Combine all chunks into one Uint8Array
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const imageBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      imageBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const chatCtx = this.chatCtx.copy();

    // Add image as Base64 content to chat context
    const imageContent = llm.createImageContent({
      image: `data:image/png;base64,${Buffer.from(imageBytes).toString(
        "base64"
      )}`,
      inferenceDetail: "auto",
    });

    chatCtx.addMessage({
      role: "user",
      content: [imageContent],
    });

    if (controller.signal.aborted) return;
    await this.updateChatCtx(chatCtx);

    // --- Generate AI reply and send it back ---
    const session = this.session;
    if (session) {
      const handle = session.generateReply({
        instructions: [`Analyze the uploaded image.`].join(" "),
      });

      await handle.waitForPlayout(); // TTS will automatically play
    }
  }
}

// ElevenLabs TTS instance
const elevenlabsTTS = new elevenlabs.TTS({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
  voice: {
    id: "Z3R5wn05IrDiVCyEkUrK",
    name: "Arabella",
    category: "Narrative & Story",
  },
  modelID: "eleven_turbo_v2_5",
});

// Gemini LLM instance
const geminiLLM = new google.beta.realtime.RealtimeModel({
  model: "gemini-2.5-flash-native-audio-preview-09-2025",
  voice: "Charon",
  temperature: 0.8,
  instructions:
    "You are a professional, compassionate medical AI assistant specializing in preliminary diagnostic image analysis. Review uploaded chest X-ray or other medical images and provide a preliminary assessment of pneumonia or any other kind of disease likelihood. Advise consulting a human physician. Speak clearly and concisely.",
});

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const session = new voice.AgentSession({
      llm: geminiLLM,
      tts: elevenlabsTTS,
    });

    await session.start({
      agent: new Assistant(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    // Initial greeting
    const handle = session.generateReply({
      instructions:
        "Hello! I am MediTalk AI. Please upload your image and I will provide a preliminary analysis.",
    });
    await handle.waitForPlayout();
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
