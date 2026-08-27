const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/videos", express.static(path.join(__dirname, "videos")));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const videosDir = path.join(__dirname, "videos");

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}


// ==================================================
// WEBSITE
// ==================================================

app.get("/", (req, res) => {

  res.send(`
<!DOCTYPE html>
<html>

<head>

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

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
  line-height: 1.6;
}

video {

  width: 100%;
  margin-top: 20px;

  border-radius: 12px;
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

<option value="8">8 seconds</option>
<option value="16">16 seconds</option>

</select>


<button
 id="generateButton"
 onclick="generate()">

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

    result.textContent =
      "Please enter a topic.";

    return;

  }


  button.disabled = true;

  button.textContent =
    "CREATING AI VIDEO...";


  result.innerHTML = `

    <p>🧠 Gemini is planning your video...</p>

    <p>🎬 Veo is generating the video...</p>

    <p>⏳ Please wait...</p>

  `;


  try {

    const response =
      await fetch("/generate-video", {

        method: "POST",

        headers: {

          "Content-Type":
          "application/json"

        },

        body: JSON.stringify({

          topic,
          style,
          length

        })

      });


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Video generation failed"
      );

    }


    result.innerHTML = `

      <p>
        <strong>
          🎉 Your AI video is ready!
        </strong>
      </p>

      <video
        controls
        autoplay
        playsinline
        src="${data.videoUrl}">
      </video>

      <p>

        <a
          href="${data.videoUrl}"
          target="_blank"
          style="color:white;font-weight:bold;">

          ▶ Open MP4

        </a>

      </p>

    `;


  } catch (error) {

    console.error(error);

    result.textContent =
      "Error: " + error.message;

  }


  button.disabled = false;

  button.textContent =
    "GENERATE VIDEO 🎬";

}

</script>

</body>

</html>
  `);

});


// ==================================================
// VIDEO GENERATION
// ==================================================

app.post("/generate-video", async (req, res) => {

  try {

    const {
      topic,
      style,
      length
    } = req.body;


    if (!topic || !topic.trim()) {

      return res.status(400).json({

        error:
          "Please enter a video topic."

      });

    }


    // ==============================================
    // GEMINI CREATES THE VIDEO PROMPT
    // ==============================================

    const prompt = `

You are the creative director of Uncle GG Studio.

Create a powerful AI video concept.

Topic:
${topic}

Style:
${style}

The video must be suitable for
YouTube Shorts, TikTok and Facebook Reels.

Create a cinematic visual description
for an AI video generator.

The video should:

- Be emotional
- Be inspirational
- Look professional
- Have cinematic lighting
- Have realistic movement
- Be visually interesting
- Be vertical 9:16
- Contain no text
- Contain no subtitles
- Contain no logos
- Contain no watermark

If the style is Prayer + Motivation,
make the visual peaceful, hopeful and emotional.

Return ONLY the visual prompt.

`;


    let videoPrompt;


    for (
      let attempt = 1;
      attempt <= 3;
      attempt++
    ) {

      try {

        const response =
          await ai.models.generateContent({

            model:
              "gemini-3.7-flash",

            contents:
              prompt

          });


        videoPrompt =
          response.text.trim();


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


        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              attempt * 3000
            )
        );

      }

    }


    // ==============================================
    // VEO GENERATES THE REAL VIDEO
    // ==============================================

    console.log(
      "Starting Veo video generation..."
    );


    let operation =
      await ai.models.generateVideos({

        model:
          "veo-3.1-generate-preview",

        prompt:
          videoPrompt,

        config: {

          aspectRatio:
            "9:16",

          resolution:
            "720p",

          numberOfVideos:
            1

        }

      });


    // ==============================================
    // WAIT FOR VIDEO
    // ==============================================

    while (!operation.done) {

      console.log(
        "Waiting for Veo..."
      );


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            10000
          )
      );


      operation =
        await ai.operations.getVideosOperation({

          operation

        });

    }


    // ==============================================
    // CHECK RESULT
    // ==============================================

    if (
      !operation.response ||
      !operation.response.generatedVideos ||
      !operation.response.generatedVideos[0]
    ) {

      throw new Error(
        "Veo did not return a video."
      );

    }


    const generatedVideo =
      operation
        .response
        .generatedVideos[0];


    // ==============================================
    // SAVE VIDEO
    // ==============================================

    const safeName =
      "uncle-gg-" +
      Date.now();


    const outputFile =
      path.join(
        videosDir,
        safeName + ".mp4"
      );


    await ai.files.download({

      file:
        generatedVideo.video,

      downloadPath:
        outputFile

    });


    console.log(
      "Video saved:",
      outputFile
    );


    // ==============================================
    // SEND VIDEO TO WEBSITE
    // ==============================================

    res.json({

      videoUrl:
        "/videos/" +
        safeName +
        ".mp4",

      prompt:
        videoPrompt

    });


  } catch (error) {

    console.error(
      "VIDEO GENERATION ERROR:",
      error
    );


    res.status(500).json({

      error:
        error.message ||
        "Video generation failed."

    });

  }

});


// ==================================================
// START SERVER
// ==================================================

app.listen(PORT, () => {

  console.log(
    "Uncle GG Studio running on port " +
    PORT
  );

});
