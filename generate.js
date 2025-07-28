const axios = require('axios');

const api_key = "YOUR_API_KEY"; // 🔁 Replace with your actual API key
const url = "https://api.segmind.com/v1/seedream-v3-text-to-image";

// Customize your prompt
const data = {
  prompt: "A flourishing zen garden with cherry blossoms next to a calm koi pond, under a moonlit sky.",
  aspect_ratio: "16:9",
  seed: 12345,
  guidance_scale: 2.5,
  steps: 30,
  samples: 1,
  image_format: "png",
  image_quality: 95
};

(async () => {
  try {
    const response = await axios.post(url, data, {
      headers: {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data, 'binary');
    const base64Image = buffer.toString('base64');
    const outputFile = 'output.png';

    // Save image
    require('fs').writeFileSync(outputFile, buffer);
    console.log(`✅ Image saved to ${outputFile}`);
    // Optional: Log base64
    // console.log("Base64:", base64Image);

  } catch (error) {
    console.error("❌ Error generating image:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Body:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
})();
