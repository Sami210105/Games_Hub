require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3001;

const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY;
const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// === ✅ Background generation (Segmind) ===
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.length < 3) {
      return res.status(400).json({ error: "Prompt too short" });
    }

    const payload = {
      prompt,
      negative_prompt: "blurry, distorted, text, watermark, signature, deformed",
      width: 1024,
      height: 1024,
      guidance_scale: 7,
      steps: 40,
      seed: Math.floor(Math.random() * 100000),
      samples: 1,
      image_format: "png",
      image_quality: 95
    };

    const response = await axios.post("https://api.segmind.com/v1/seedream-v3-text-to-image", payload, {
      headers: {
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data, 'binary');
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;
    res.json({ image: base64Image });

  } catch (err) {
    console.error("🔥 Segmind API Error:", err.message);
    res.status(500).json({ error: "Image generation failed", details: err.message });
  }
});

// === ✅ Sprite generation + remove.bg background removal ===
app.post('/api/generate-sprite', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.length < 3) {
      return res.status(400).json({ error: "Prompt too short" });
    }

    // 1. Generate sprite using ClipDrop
    const spriteRes = await axios.post(
      'https://clipdrop-api.co/text-to-image/v1',
      { prompt },
      {
        headers: {
          'x-api-key': CLIPDROP_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const tempFile = `temp_sprite_${uuidv4()}.png`;
    const cleanedFile = `cleaned_sprite_${uuidv4()}.png`;

    fs.writeFileSync(tempFile, spriteRes.data);

    // 2. Send image to remove.bg API
    const formData = new FormData();
    formData.append('image_file', fs.createReadStream(tempFile));
    formData.append('size', 'auto');

    const removeRes = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': REMOVE_BG_API_KEY
      },
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(cleanedFile, removeRes.data);
    const cleanedBuffer = fs.readFileSync(cleanedFile);

    // 3. Encode for frontend
    const base64Image = `data:image/png;base64,${cleanedBuffer.toString('base64')}`;

    // 4. Cleanup temp files
    fs.unlinkSync(tempFile);
    fs.unlinkSync(cleanedFile);

    res.json({ image: base64Image });

  } catch (err) {
    console.error("🔥 Sprite generation failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Sprite generation failed", details: err.message });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT} (or Render)`);
});
