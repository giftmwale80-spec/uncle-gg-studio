const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }

          .container {
            width: 90%;
            max-width: 600px;
            text-align: center;
          }

          h1 {
            font-size: 32px;
          }

          .box {
            background: #1d1d1d;
            padding: 25px;
            border-radius: 15px;
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

          #result {
            margin-top: 20px;
            white-space: pre-wrap;
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

            <button onclick="generate()">
              GENERATE VIDEO
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

            if (!topic.trim()) {
              result.textContent = "Please enter a topic.";
              return;
            }

            result.textContent =
              "Preparing your Uncle GG Studio video...";

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

              result.textContent = data.message;
            } catch (error) {
              result.textContent =
                "Something went wrong. Please try again.";
            }
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/generate", (req, res) => {
  const { topic, style, length } = req.body;

  res.json({
    message:
      `Request received!\n\n` +
      `Topic: ${topic}\n` +
      `Style: ${style}\n` +
      `Length: ${length} seconds\n\n` +
      `Next step: connect Claude AI to generate the script.`
  });
});

app.listen(PORT, () => {
  console.log(`Uncle GG Studio running on port ${PORT}`);
});
