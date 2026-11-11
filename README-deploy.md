# Talk with Leo — deploy notes

A 2-minute interactive simulation: you are Ms. Rivera, talking with Leo, 9, about the
book report a chatbot wrote for him. Voice (microphone) or text. Leo answers out loud
and in writing, then a short debrief with the transcript and reflection prompts.

## Deploy (Netlify Drop, same as the sim lab)

1. Drag this whole folder (`talk-to-leo`) onto https://app.netlify.com/drop
   — or drop it into an existing site's Deploys tab to update that site.
2. Site settings → Environment variables → add:
   - `ANTHROPIC_API_KEY` (Leo's brain; required) — use a **fresh** key.
     Do NOT reuse the Anthropic key from the old IEP sim file
     (`iep_sim_v2_voice.html`): it was exposed in plain text in Oct 2026.
     Create a new key in the Anthropic console and revoke the old one.
   - `ELEVENLABS_API_KEY` (Leo's voice; required for spoken replies)
   - `OPENAI_API_KEY` (optional — only if you pick OpenAI on the setup screen)
3. Redeploy if Netlify asks. Open the site link.
4. On the setup screen, click **Load voices** and pick one that sounds young for Leo.
   (If no voice loads, Leo falls back to your browser's built-in voice, or text only.)

## How it works

- `index.html` — the whole sim. Leo's portrait is embedded. No key lives in this file.
- `netlify/functions/llm.js` — proxy to Anthropic/OpenAI (same file as the sim lab).
- `netlify/functions/tts.js` — proxy to ElevenLabs (same file as the sim lab).
- Turn-based, not a live phone call: you speak (or type), a few seconds, Leo answers.
  The 2-minute timer starts when you press Start.
- Add `?seconds=10` to the URL to run a 10-second version (handy for a quick test).
- The conversation stays in the browser tab; nothing is stored on the server.
  The debrief screen offers a downloadable transcript (`.md`).

## Leo's face (puppet)

Leo is not a still photo any more. His portrait changes with how he feels
(nervous, thinking, sad, relieved, listening — chosen by the model with a hidden
tag that never reaches the screen), and while he speaks his mouth opens and
closes in time with the volume of his voice. The mouth follows the *sound*,
not the exact words — it is not true lip-sync. True word-level lip-sync would
need a talking-head service, and those services do not animate child
characters, so that route is closed for Leo (age 9). Frames live in `images/`
(9 stills, all cut from two sheets generated from the verified portrait).

## Playtest

Headless DOM playtest Nov 10, 2026 (`/tmp/simtest/test_leo.js`): **30 checks, 0 failures**
— setup/server status, voice list, mic fallback, Start, Leo's opener (face:
nervous), one full user turn (LLM called with the Leo system prompt, reply
with a [sad] tag stripped from bubble, speech and transcript, face switches
to sad), timer expiry → closing line → debrief with stats, replay, and
End-early path.
Not tested in a real browser: actual microphone input, the mouth flap against
real audio, real ElevenLabs voices, or a live Netlify deploy — open the
deployed site once and do one 2-minute run yourself.
