// Netlify Function: ElevenLabs TTS proxy for the Simulation Lab.
// Deploy with the site, then set ELEVENLABS_API_KEY in
// Site settings -> Environment variables. The browser never sees the key.
//
// GET  /.netlify/functions/tts          -> { voices: [{voice_id, name}, ...] }
// POST /.netlify/functions/tts {text, voice_id, model_id} -> audio/mpeg
exports.handler = async (event) => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: "ELEVENLABS_API_KEY is not set in Netlify environment variables." }) };
  }
  try {
    if (event.httpMethod === "GET") {
      const r = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": key }
      });
      const d = await r.json();
      return { statusCode: r.status, headers: { "content-type": "application/json" }, body: JSON.stringify(d) };
    }
    const { text, voice_id, model_id } = JSON.parse(event.body || "{}");
    if (!text || !voice_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "text and voice_id are required" }) };
    }
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice_id)}`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json", "accept": "audio/mpeg" },
      body: JSON.stringify({
        text: String(text).slice(0, 1500),
        model_id: model_id || "eleven_flash_v2_5"
      })
    });
    if (!r.ok) {
      const t = await r.text();
      return { statusCode: r.status, headers: { "content-type": "application/json" }, body: t };
    }
    const buf = Buffer.from(await r.arrayBuffer());
    return {
      statusCode: 200,
      headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
      body: buf.toString("base64"),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
