const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Uncle GG Studio</title>

        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #111;
            color: white;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .container {
            width: 90%;
            max-width: 600px;
          }

          h1 {
            text-align: center;
            font-size: 34px;
          }

          .box {
            background: #1d1d1d;
            padding: 25px;
            border-radius: 16px;
          }

          input,
          select,
          button {
            width: 100%;
            padding: 14px;
            margin-top: 12px;
            box-sizing: border-box;
            border-radius: 8px;
            border: none;
            font-size: 16px;
          }

          button {
            background: white;
            color: #111;
            font-weight: bold;
            cursor: pointer;
          }

          button:disabled {
            opacity: 0.6;
          }

          #result {
            margin-top: 20px;
            white-space: pre-wrap;
            line-height: 1.6;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <h1>🎬 Uncle GG Studio</h1>

          <div class="box">
            <h2>AI Script Generator</h2>

            <input
              id="topic"
              type="text"
              placeholder="Enter your video topic..."
            />

            <select id="style">
              <option>Prayer + Motivation</option>
              <option>Motivation</option>
              <option>Gospel</option>
              <option>Inspirational</option>
            </select>

            <select id="length">
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>

            <button id="generateButton" onclick="generate()">
              GENERATE SCRIPT
            </button>

            <div id="result"></div>
          </div>
        </div>

        <script>
          async function generate() {
            const topic = document.getElementById("topic").value;
            const style = document.getElementById("style").value;
            const length = document.getElementById("length").value;
            const result = document.getElementById("result");
            const button = document.getElementById("generateButton");

            if (!topic.trim()) {
              result.textContent = "Please enter a topic.";
              return;
            }

            button.disabled = true;
            button.textContent = "GENERATING...";
            result.textContent = "Gemini is writing your script...";

            try {
              const response = await fetch("/generate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  topic,
                  style,
                  length
                })
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Generation failed");
              }

              result.textContent = data.script;
            } catch (error) {
              result.textContent =
                "Error: " + error.message;
            } finally {
              button.disabled = false;
              button.textContent = "GENERATE SCRIPT";
            }
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/generate", async (req, res) => {
  try {
    const { topic, style, length } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        error: "Please enter a topic."
      });
    }

    const prompt = `
You are the official AI scriptwriter for Uncle GG Studio.

Create a short social-media video script.

Topic: ${topic}
Style: ${style}
Length: approximately ${length} seconds.

Requirements:
- Make it engaging and natural.
- Make it suitable for YouTube Shorts, TikTok and Facebook Reels.
- For Prayer + Motivation, begin naturally with "Lord, today is..."
- Keep the language simple and powerful.
- Make it suitable for a general audience.
- Do not include camera directions.
- Return ONLY the spoken script.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt
    });

    res.json({
      script: response.text
    });

  } catch (error) {
    console.error("Gemini error:", error);

    res.status(500).json({
      error: "Gemini could not generate the script. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Uncle GG Studio running on port ${PORT}`);
});
