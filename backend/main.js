// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import authRoutes from "./routes/auth.routes.js";

// dotenv.config({ path: ".env" });

// const app = express();
// const MONGODB_URI = process.env.MONGODB_URI;
// const PORT = 5812;

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use("/api/auth", authRoutes);
// app.use("/api/main", authRoutes);
// try {
//   mongoose.connect(MONGODB_URI).then(console.log("connected successfully"));
// } catch (error) {
//   console.log("not CONNNECTED", error.message);
// }

// app.get("/get-token", async (req, res) => {
//   try {
//     const token = new AccessToken(
//       process.env.LIVEKIT_API_KEY,
//       process.env.LIVEKIT_API_SECRET,
//       {
//         identity: "user-" + Math.random().toString(36).substring(2, 8),
//       }
//     );

//     token.addGrant({ roomJoin: true, room: "meditalk" });
//     res.json({ token: await token.toJwt() });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: "Failed to create token" });
//   }
// });

// app.listen(PORT, () => {
//   console.log("running on port 5812");
// });

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import { AccessToken } from "livekit-server-sdk";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
// import { Room, RoomEvent } from "livekit-serrver-sdk"; // Use appropriate LiveKit server SDK

dotenv.config({ path: ".env" });

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = 5812;

// Directory to save uploaded files
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ------------------- Middleware -------------------
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/main", authRoutes);

// Serve uploaded files as static assets
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ------------------- MongoDB Connection -------------------
try {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected successfully"));
} catch (error) {
  console.error("MongoDB connection failed:", error.message);
}

// ------------------- LiveKit Token Endpoint -------------------
app.get("/get-token", async (req, res) => {
  try {
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: "user-" + Math.random().toString(36).substring(2, 8),
      }
    );

    token.addGrant({ roomJoin: true, room: "meditalk-room" });
    res.json({ token: await token.toJwt() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create token" });
  }
});

// // ------------------- LiveKit Room Setup -------------------
// const room = new Room();

// // Register byte stream handler for X-ray images
// room.registerByteStreamHandler("xray-image", async (reader, participant) => {
//   console.log(`Received X-ray image from ${participant.identity}`);

//   const chunks = [];
//   for await (const chunk of reader) {
//     chunks.push(chunk);
//   }

//   const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
//   const imageData = new Uint8Array(totalLength);
//   let offset = 0;
//   for (const chunk of chunks) {
//     imageData.set(chunk, offset);
//     offset += chunk.length;
//   }

//   // Save the image to disk
//   const filePath = path.join(uploadDir, reader.info.name);
//   fs.writeFileSync(filePath, imageData);
//   console.log(`Saved X-ray image to: ${filePath}`);

//   // -----------------------------
//   // Trigger AI analysis (placeholder)
//   // -----------------------------
//   const aiResponse = `Received your X-ray image "${reader.info.name}". Preliminary analysis indicates: no obvious signs of pneumonia. Please consult a licensed physician for a full diagnosis.`;

//   try {
//     // Send text response back to the participant who uploaded
//     if (room.localParticipant) {
//       await room.localParticipant.sendText(aiResponse, {
//         destinationIdentities: [participant.identity],
//       });
//       console.log(`Sent AI analysis response to ${participant.identity}`);
//     }
//   } catch (err) {
//     console.error("Failed to send AI response:", err);
//   }
// });

// // Optional: handle room events
// room.on(RoomEvent.ParticipantConnected, (participant) => {
//   console.log(`Participant connected: ${participant.identity}`);
// });
// room.on(RoomEvent.ParticipantDisconnected, (participant) => {
//   console.log(`Participant disconnected: ${participant.identity}`);
// });

// app.post("/api/analyze", async (req, res) => {
//   try {
//     const { imageUrl } = req.body;

//     if (!imageUrl) {
//       return res
//         .status(400)
//         .json({ error: "Missing imageUrl in request body" });
//     }

//     console.log("🔍 Analyzing image:", imageUrl);

//     // Forward request to your AI analysis endpoint
//     const response = await fetch(
//       `https://oxygen-centuries-broke-betting.trycloudflare.com/analyze_url?url=${encodeURIComponent(
//         imageUrl
//       )}`,
//       { method: "POST" }
//     );

//     // If the response isn’t OK, log and return the error
//     if (!response.ok) {
//       const text = await response.text();
//       console.error("❌ Remote AI API error:", text);
//       return res.status(response.status).json({ error: text });
//     }

//     // Try parsing the AI response
//     const result = await response.json();
//     console.log("✅ AI Response:", result);
//     res.json(result);
//   } catch (error) {
//     console.error("💥 Error in /api/analyze:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

app.post("/api/analyze", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    // console.log("File URL for AI:", fileUrl);

    // Convert to URL or use local path depending on AI service
    // const fileUrl = `file://${filePath}`; // or upload to S3 for public URL
    const fileUrl =
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Chest_Xray_PA_3-8-2010.png";

    const response = await fetch(
      `https://home-relatives-hist-debate.trycloudflare.com/analyze_url?url=${encodeURIComponent(
        fileUrl
      )}`,
      { method: "POST" }
    );

    if (!response.ok) {
      // handle errors
      const text = await response.text(); // raw response
      console.error("Server returned error:", text);
      return res.status(response.status).send(text);
    }

    const result = await response.json();
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Error in /api/analyze:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ------------------- Start Express Server -------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
