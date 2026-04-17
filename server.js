import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const OPENAI_API_KEY = "PASTE_YOUR_API_KEY_HERE";

app.post("/speak", async (req, res) => {
    const { text } = req.body;

    try {
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

        const buffer = await response.arrayBuffer();
        const audio = Buffer.from(buffer);

        res.setHeader("Content-Type", "audio/mpeg");
        res.send(audio);

    } catch (err) {
        console.error(err);
        res.status(500).send("Voice error");
    }
});

app.listen(3000, () => {
    console.log("🎤 Voice server running on http://localhost:3000");
});
