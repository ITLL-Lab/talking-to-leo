// Netlify Function: LLM proxy for the Simulation Lab.
// Keeps ANTHROPIC_API_KEY / OPENAI_API_KEY on the server so candidates
// never need their own keys and no secret lives in the HTML file.
//
// GET  /.netlify/functions/llm  -> { anthropic: true/false, openai: true/false }
// POST /.netlify/functions/llm { provider, model, system, messages, max_tokens } -> { text }
exports.handler = async (event) => {
  const AKEY = process.env.ANTHROPIC_API_KEY;
  const OKEY = process.env.OPENAI_API_KEY;

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ anthropic: !!AKEY, openai: !!OKEY })
    };
  }

  let b;
  try { b = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ error: "bad json" }) }; }
  const { provider, model, system, messages, max_tokens } = b;

  try {
    if (provider === "anthropic") {
      if (!AKEY) return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY is not set in Netlify environment variables." }) };
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": AKEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: max_tokens || 600, system, messages })
      });
      const d = await r.json();
      if (!r.ok) return { statusCode: r.status, body: JSON.stringify({ error: (d.error && d.error.message) || "Anthropic error" }) };
      // Join every text block (some models lead with a non-text block, which
      // used to make the reply come back empty).
      const text = (d.content || []).filter(b => b && b.type === "text").map(b => b.text || "").join("");
      return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) };
    } else {
      if (!OKEY) return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY is not set in Netlify environment variables." }) };
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": "Bearer " + OKEY },
        body: JSON.stringify({ model, max_tokens: max_tokens || 600, messages: [{ role: "system", content: system }].concat(messages || []) })
      });
      const d = await r.json();
      if (!r.ok) return { statusCode: r.status, body: JSON.stringify({ error: (d.error && d.error.message) || "OpenAI error" }) };
      return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ text: d.choices[0].message.content }) };
    }
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
