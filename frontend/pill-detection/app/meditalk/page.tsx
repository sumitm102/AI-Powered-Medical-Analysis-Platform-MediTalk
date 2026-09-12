// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import {
//   ControlBar,
//   RoomAudioRenderer,
//   RoomContext,
//   BarVisualizer,
//   VoiceAssistantControlBar,
// } from "@livekit/components-react";
// import { Room, RoomEvent } from "livekit-client";
// import "@livekit/components-styles";
// import { Upload, X } from "lucide-react";

// /* -------------------------------
//    Types & Setup
// -------------------------------- */
// type ConnectionStatus =
//   | "Disconnected"
//   | "Connecting..."
//   | "Connected"
//   | "Config Error"
//   | "Error";

// export default function MediTalkAgent() {
//   const [status, setStatus] = useState<ConnectionStatus>("Disconnected");
//   const [participantID, setParticipantID] = useState<string | null>(null);
//   const [uploadStatus, setUploadStatus] = useState<string | null>(null);

//   const roomName = "meditalk-room";
//   const username = "meditalk-user";

//   const [roomInstance] = useState(
//     () =>
//       new Room({
//         adaptiveStream: true,
//         dynacast: true,
//       })
//   );

//   /* -------------------------------
//      Connect to LiveKit
//   -------------------------------- */
//   useEffect(() => {
//     let active = true;
//     (async () => {
//       try {
//         setStatus("Connecting...");
//         const res = await fetch(
//           `/api/token?room=${roomName}&username=${username}`
//         );
//         const data = await res.json();

//         const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
//         if (!livekitUrl) {
//           console.error("NEXT_PUBLIC_LIVEKIT_URL is not set");
//           setStatus("Config Error");
//           return;
//         }

//         await roomInstance.connect(livekitUrl, data.token);
//         if (!active) return;

//         setParticipantID(roomInstance.localParticipant.identity);
//         setStatus("Connected");

//         roomInstance.on(RoomEvent.Disconnected, () => {
//           setStatus("Disconnected");
//         });
//       } catch (err) {
//         console.error(err);
//         setStatus("Error");
//       }
//     })();

//     return () => {
//       active = false;
//       roomInstance.disconnect();
//     };
//   }, [roomInstance]);

//   /* -------------------------------
//      File Upload + Preview
//   -------------------------------- */
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setSelectedFile(file);
//     setPreviewUrl(URL.createObjectURL(file));
//     setUploadStatus("Sending image to AI agent...");

//     // Send file to LiveKit agent
//     if (roomInstance.localParticipant) {
//       try {
//         const info = await roomInstance.localParticipant.sendFile(file, {
//           topic: "xray-image", // must match agent's topic
//           mimeType: file.type,
//           onProgress: (progress) =>
//             console.log(
//               "Sending file progress:",
//               Math.ceil(progress * 100),
//               "%"
//             ),
//         });

//         console.log("File sent with stream ID:", info.id);
//         setUploadStatus("Image sent. Waiting for AI analysis...");
//       } catch (err) {
//         console.error("Failed to send file:", err);
//         setUploadStatus("Failed to send image");
//       }
//     }
//   };

//   const handleRemoveImage = () => {
//     setSelectedFile(null);
//     setPreviewUrl(null);
//     setUploadStatus(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   /* -------------------------------
//      UI Layout
//   -------------------------------- */
//   return (
//     <RoomContext.Provider value={roomInstance}>
//       <main className="min-h-screen bg-gray-50 font-sans antialiased flex flex-col lg:flex-row">
//         {/* LEFT SECTION: Image Upload / Preview */}
//         <div className="lg:w-2/3 p-4 md:p-8 flex flex-col">
//           <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
//             MediTalk: X-Ray Analysis
//           </h1>

//           <div className="flex-grow bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center relative transition duration-150 ease-in-out hover:border-indigo-500 hover:bg-indigo-50/50">
//             {previewUrl ? (
//               <>
//                 <img
//                   src={previewUrl}
//                   alt="Diagnostic Preview"
//                   className="max-h-full max-w-full object-contain rounded-xl shadow-xl transition duration-300"
//                 />
//                 <button
//                   onClick={handleRemoveImage}
//                   className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-150 shadow-md z-10"
//                   title="Remove Image"
//                 >
//                   <X size={20} />
//                 </button>
//                 <div className="absolute bottom-6 left-6 bg-indigo-500/90 text-white text-sm px-4 py-2 rounded-xl backdrop-blur-sm shadow-lg">
//                   Image: {selectedFile?.name} (
//                   {Math.round((selectedFile?.size || 0) / 1024)} KB)
//                 </div>
//                 {uploadStatus && (
//                   <div className="absolute bottom-6 right-6 text-sm text-gray-700 bg-white px-3 py-1 rounded shadow">
//                     {uploadStatus}
//                   </div>
//                 )}
//               </>
//             ) : (
//               <div className="text-center p-10">
//                 <Upload className="mx-auto h-12 w-12 text-gray-400" />
//                 <div className="mt-2 flex text-sm text-gray-600">
//                   <label
//                     htmlFor="file-upload"
//                     className="relative cursor-pointer font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
//                   >
//                     <span>Upload a diagnostic image (e.g., X-Ray)</span>
//                     <input
//                       id="file-upload"
//                       name="file-upload"
//                       type="file"
//                       className="sr-only"
//                       accept="image/*"
//                       onChange={handleFileChange}
//                       ref={fileInputRef}
//                     />
//                   </label>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1">PNG or JPG</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* RIGHT SECTION: LiveKit Agent Controls */}
//         <div className="lg:w-1/3 bg-white p-4 md:p-8 flex flex-col shadow-xl border-l">
//           <h2 className="text-xl font-semibold text-gray-900 mb-6">
//             MediTalk Agent
//           </h2>

//           <div className="mb-6 flex flex-col space-y-3">
//             <div className="flex justify-between items-center">
//               <p className="text-gray-600">Connection Status:</p>
//               <p className="font-semibold text-indigo-600">{status}</p>
//             </div>
//             <div className="flex justify-between items-center text-sm text-gray-500">
//               <p>Participant ID:</p>
//               <p className="font-mono text-gray-700">
//                 {participantID || "N/A"}
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-col space-y-4">
//             <BarVisualizer barCount={8} />
//             <RoomAudioRenderer />
//             <VoiceAssistantControlBar className="text-black" />
//           </div>
//         </div>
//       </main>
//     </RoomContext.Provider>
//   );
// }

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ControlBar,
  RoomAudioRenderer,
  RoomContext,
  BarVisualizer,
  VoiceAssistantControlBar,
} from "@livekit/components-react";
import { Room, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Upload, X } from "lucide-react";

/* -------------------------------
   Types & Setup
-------------------------------- */
type ConnectionStatus =
  | "Disconnected"
  | "Connecting..."
  | "Connected"
  | "Config Error"
  | "Error";

export default function MediTalkAgent() {
  const [status, setStatus] = useState<ConnectionStatus>("Disconnected");
  const [participantID, setParticipantID] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomName = "meditalk-room";
  const username = "meditalk-user";

  const [roomInstance] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      })
  );

  /* -------------------------------
     Connect to LiveKit
  -------------------------------- */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus("Connecting...");
        const res = await fetch(
          `/api/token?room=${roomName}&username=${username}`
        );
        const data = await res.json();

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!livekitUrl) {
          console.error("NEXT_PUBLIC_LIVEKIT_URL is not set");
          setStatus("Config Error");
          return;
        }

        await roomInstance.connect(livekitUrl, data.token);
        if (!active) return;

        setParticipantID(roomInstance.localParticipant.identity);
        setStatus("Connected");

        roomInstance.on(RoomEvent.Disconnected, () => {
          setStatus("Disconnected");
        });
      } catch (err) {
        console.error(err);
        setStatus("Error");
      }
    })();

    return () => {
      active = false;
      roomInstance.disconnect();
    };
  }, [roomInstance]);

  /* -------------------------------
   File Upload + Preview
-------------------------------- */

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
    setUploadStatus("Sending image to external API...");
    setAnalysisResult(null); // reset previous result

    const formData = new FormData();
    formData.append("file", file);

    try {
      // --- Step 1: Send the image to backend for analysis ---
      const response = await fetch("http://localhost:5812/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text(); // raw error
        throw new Error(`Server responded with ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log("Backend analysis result:", result);

      // Display result in UI
      setAnalysisResult(result.description || JSON.stringify(result));
      setUploadStatus("Image analyzed successfully. Connecting to AI agent...");

      if (roomInstance.localParticipant) {
        try {
          await roomInstance.localParticipant.sendText("x-ray analysis", {
            topic: "xray-analysis", // Optional: use a topic to identify the message type
          });
          console.log("Analysis sent to AI agent via sendText");
          setUploadStatus("Analysis sent to AI agent.");
        } catch (err) {
          console.error("Failed to send analysis to LiveKit:", err);
          setUploadStatus("Failed to send analysis to AI agent");
        }
      }

      // --- Step 2: Send to LiveKit after analysis ---
      if (roomInstance.localParticipant) {
        const info = await roomInstance.localParticipant.sendFile(file, {
          topic: "xray-image",
          mimeType: file.type,
          onProgress: (progress) =>
            console.log(
              "Sending file progress:",
              Math.ceil(progress * 100),
              "%"
            ),
        });

        console.log("File sent to LiveKit with stream ID:", info.id);
        setUploadStatus("Image sent to AI agent.");
      }
    } catch (err: any) {
      console.error("Error during external API or LiveKit upload:", err);
      setUploadStatus("Failed to process image");
      setAnalysisResult(err.message);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* -------------------------------
     UI Layout
  -------------------------------- */
  return (
    <RoomContext.Provider value={roomInstance}>
      <main className="min-h-screen bg-[#F1F1F1] font-sans flex flex-col lg:flex-row gap-6 p-4 md:p-8">
        {/* LEFT SECTION: Image Upload / Preview */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold text-[#009688]">
            MediTalk: X-Ray Analysis
          </h1>

          <div className="flex-grow bg-white/80 border border-gray-200 rounded-3xl shadow-lg p-6 flex flex-col items-center justify-center relative transition duration-300 hover:shadow-2xl">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Diagnostic Preview"
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-md transition duration-300"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 p-2 bg-[#009688] text-white rounded-full hover:bg-[#00796B] transition duration-150 shadow-md"
                  title="Remove Image"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-6 left-6 bg-[#009688]/90 text-white text-sm px-4 py-2 rounded-xl shadow-md backdrop-blur-sm">
                  Image: {selectedFile?.name} (
                  {Math.round((selectedFile?.size || 0) / 1024)} KB)
                </div>
                {uploadStatus && (
                  <div className="absolute bottom-6 right-6 text-sm text-gray-700 bg-white px-3 py-1 rounded shadow">
                    {uploadStatus}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-10">
                <Upload className="mx-auto h-12 w-12 text-[#009688]" />
                <div className="mt-2 flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer font-medium text-[#009688] hover:text-[#00796B] transition-colors"
                  >
                    <span>Upload a diagnostic image (e.g., X-Ray)</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG or JPG</p>
              </div>
            )}
            {analysisResult && (
              <div className="mt-4 p-4 bg-white rounded-xl shadow-md text-gray-800">
                <h3 className="font-semibold mb-2">Analysis Result:</h3>
                <p>{analysisResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: LiveKit Agent Controls */}
        <div className="lg:w-1/3 flex flex-col bg-white/80 p-6 rounded-3xl shadow-xl border border-gray-200 gap-6">
          <h2 className="text-xl font-semibold text-[#009688]">
            MediTalk Agent
          </h2>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Connection Status:</p>
              <p className="font-semibold text-[#009688]">{status}</p>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <p>Participant ID:</p>
              <p className="font-mono text-gray-700">
                {participantID || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <BarVisualizer barCount={8} className="rounded-lg" />
            <RoomAudioRenderer />
            <VoiceAssistantControlBar className="text-[#009688]" />
          </div>
        </div>
      </main>
    </RoomContext.Provider>
  );
}
