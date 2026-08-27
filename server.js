const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const app = express();
const PORT = process.env.PORT || 3000;

const execFileAsync = util.promisify(execFile);

app.use(express.json());
app.use("/videos", express.static(path.join(__dirname, "videos")));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const videosDir = path.join(__dirname, "videos");

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

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

input, select, button {
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
  line-height: 1.6;
}

a {
  color: white;
  font-weight: bold;
}
</style>
</head>

<body>

<div class="container">

<h1>🎬 Uncle GG Studio</h1>

<div class="box">

<h2>AI Video Generator</h2>

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
GENERATE VIDEO 🎬
</button>

<div id="result"></div>

</div>
</div>

<script>

async function generate() {

 const topic =
 document.getElementById("topic").value;

 const style =
 document.getElementById("style").value;

 const length =
 document.getElementById("length").value;

 const result =
 document.getElementById("result");

 const button =
 document.getElementById("generateButton");

 if (!topic.trim()) {
   result.textContent = "Please enter a topic.";
   return;
 }

 button.disabled = true;
 button.textContent = "CREATING VIDEO...";

 result.textContent =
 "Gemini is writing the script...";

 try {

   const response = await fetch("/generate-video", {

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
     throw new Error(data.error || "Video generation failed");
   }

   result.innerHTML = `
     <p><strong>Video created! 🎉</strong></p>
     <p>${data.script.replace(/</g, "&lt;")}</p>
     <p>
       <a href="${data.videoUrl}" target="_blank">
       ▶ Open your MP4 video
       </a>
     </p>
   `;

 } catch (error) {

   result.textContent =
     "Error: " + error.message;

 } finally {

   button.disabled = false;
   button.textContent = "GENERATE VIDEO 🎬";

 }

}

</script>

</body>
</html>
  `);
});


app.post("/generate-video", async (req, res) => {

  try {

    const {
      topic,
      style,
      length
    } = req.body;

    if (!topic || !topic.trim()) {

      return res.status(400).json({
        error: "Please enter a topic."
      });

    }

    const prompt = `
You are the official AI scriptwriter for Uncle GG Studio.

Create a short spoken social-media video script.

Topic: ${topic}
Style: ${style}
Length: approximately ${length} seconds.

Requirements:
- Make it engaging and natural.
- Suitable for YouTube Shorts, TikTok and Facebook Reels.
- If the style is Prayer + Motivation, begin naturally with "Lord, today is..."
- Use simple, powerful language.
- Suitable for a general audience.
- Return ONLY the spoken script.
`;

    let script;

    for (let attempt = 1; attempt <= 3; attempt++) {

      try {

        const response =
          await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt
          });

        script = response.text;
        break;

      } catch (error) {

        console.error(
          "Gemini attempt",
          attempt,
          error.message
        );

        if (attempt === 3) {
          throw error;
        }

        await new Promise(resolve =>
          setTimeout(resolve, attempt * 3000)
        );

      }

    }

    const safeName =
      "uncle-gg-" +
      Date.now();

    const outputFile =
      path.join(
        videosDir,
        safeName + ".mp4"
      );

    /*
      Create a simple animated vertical background
      and put the Gemini script on screen.
    */

    const escapedText =
      script
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/\n/g, " ");

    await execFileAsync("ffmpeg", [

      "-y",

      "-f",
      "lavfi",

      "-i",
      "color=c=black:s=1080x1920:r=30",

      "-t",
      String(length),

      "-vf",

      `drawtext=text='UNCLE GG STUDIO':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=300,drawtext=text='${escapedText}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=12`,

      "-c:v",
      "libx264",

      "-pix_fmt",
      "yuv420p",

      "-movflags",
      "+faststart",

      outputFile

    ]);

    res.json({

      script,

      videoUrl:
        "/videos/" +
        safeName +
        ".mp4"

    });

  } catch (error) {

    console.error(
      "Video generation error:",
      error
    );

    res.status(500).json({

      error:
        "The video could not be created. Check the Render logs."

    });

  }

});


app.listen(PORT, () => {

  console.log(
    `Uncle GG Studio running on port ${PORT}`
  );

});
