// functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({ origin: true });

// Set global options for all functions
setGlobalOptions({ region: "us-central1" });

// Initialize the Gemini AI client.
// CRITICAL: Your Gemini API key must be set as a secret in your Firebase environment.
// Run this command in your terminal from your project directory:
// firebase functions:secrets:set GEMINI_KEY
// Then, when prompted, paste your secret Gemini API key.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

/**
 * Handles standard text generation requests from the frontend.
 */
exports.callGemini = onRequest(async (request, response) => {
  cors(request, response, async () => {
    if (request.method !== "POST") {
      return response.status(405).send("Method Not Allowed");
    }

    try {
      const { userQuery, systemInstruction, useGrounding, jsonSchema } = request.body;
      if (!userQuery) {
        return response.status(400).json({ error: "userQuery is required." });
      }

      // Using the same modern model as your frontend for consistency
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-05-20" });

      const generationConfig = {
        responseMimeType: jsonSchema ? "application/json" : "text/plain",
        responseSchema: jsonSchema || undefined,
      };

      const tools = useGrounding ? [{ "google_search": {} }] : [];

      const result = await model.generateContent({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig,
        tools,
      });

      // Extract only the text and send it back, as the frontend expects.
      const text = result.response.candidates[0].content.parts[0].text;
      response.status(200).send(text);

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      response.status(500).json({ error: "Failed to call Gemini API." });
    }
  });
});

/**
 * Handles image analysis (vision) requests from the frontend.
 */
exports.analyzeChart = onRequest({ timeoutSeconds: 300, memory: "1GiB" }, async (request, response) => {
    cors(request, response, async () => {
      if (request.method !== "POST") {
        return response.status(405).send("Method Not Allowed");
      }

      try {
        const payload = request.body;
        if (!payload || !payload.contents) {
          return response.status(400).json({ error: "Invalid payload provided." });
        }
        
        // Use the modern vision-capable model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-preview-05-20" });
        const result = await model.generateContent(payload);

        // Extract just the text part (which contains the JSON) and send it back.
        const text = result.response.candidates[0].content.parts[0].text;
        response.status(200).send(text);

      } catch (error) {
        console.error("Error calling Gemini Vision API:", error);
        response.status(500).json({ error: "Failed to call Gemini Vision API." });
      }
    });
  },
);