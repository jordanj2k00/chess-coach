const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/speak", async (req, res) => {

    const text = req.body.text;

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini-tts",
            voice: "alloy",
            input: text
        })
    });

    const audio = await response.arrayBuffer();

    res.set({ "Content-Type": "audio/mpeg" });
    res.send(Buffer.from(audio));
});

app.listen(3000, () => {
    console.log("🎤 Voice server running on http://localhost:3000");
});
