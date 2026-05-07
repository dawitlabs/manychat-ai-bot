require("dotenv").config();
const express = require("express");
const { OpenAI } = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory conversation store (keyed by user ID)
// For production, replace with Redis or a database
const conversations = new Map();

// ─── YOUR AI CONTEXT / SYSTEM PROMPT ────────────────────────────────────────
const SYSTEM_PROMPT = `You are a friendly fitness coach assistant for our fitness app.

About us: We're a top-rated fitness app with personalized workout plans, nutrition tracking, expert-led video workouts, and a supportive community. We help people transform their body and health — whether they're beginners or advanced.

Your goal: Build excitement and naturally guide the user toward subscribing to the app. Don't be pushy or salesy — be genuinely helpful, answer their fitness questions, and when the moment feels right, mention how the app can help them reach their goals faster.

How to guide toward subscribing:
- First, be helpful and build trust by answering their questions
- Share quick fitness tips to show value
- When they seem interested, mention specific app features that match what they need
- Use soft CTAs like "we actually have a plan for that in the app" or "the app builds this for you automatically"
- If they ask how to subscribe, send them to: [YOUR APP LINK HERE]

Keep responses short (1-3 sentences). This is a DM — be conversational, not formal.

Never:
- Be pushy or spam them with subscribe messages
- Make up fitness or health claims
- Give medical advice

Language: Match the language the user writes in.`;
// ─────────────────────────────────────────────────────────────────────────────

// ─── FIRST DM PROMPT (sent when someone comments on your post/reel) ─────────
const COMMENT_REPLY_PROMPT = `You are a friendly fitness coach for our fitness app.

Someone just commented on our Instagram/Facebook fitness post or reel.
Your job is to DM them — start a genuine conversation that can naturally lead to them subscribing to the app.

Rules:
- Reference their comment so it feels personal, not automated
- Be like a cool gym buddy, not a salesperson
- Give them a quick useful fitness tip related to their comment to show value
- End with ONE casual question to keep the chat going
- Keep it to 2-3 sentences max
- Do NOT mention the app or subscribing yet — just build the connection first
- Match the language they commented in`;
// ─────────────────────────────────────────────────────────────────────────────

const CONVERSATION_TTL = 23 * 60 * 60 * 1000; // 23 hours
const MAX_HISTORY_MESSAGES = 20;

/**
 * GET /health
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * POST /comment
 * ManyChat calls this when someone COMMENTS on your Instagram/Facebook post or reel.
 * The AI generates a personalized first DM based on their comment.
 *
 * Expected body from ManyChat External Request:
 * {
 *   "user_id": "{{user id}}",
 *   "first_name": "{{first name}}",
 *   "comment_text": "{{last comment text}}",
 *   "platform": "instagram" or "facebook"
 * }
 */
app.post("/comment", async (req, res) => {
  try {
    const { user_id, first_name, comment_text, platform } = req.body;

    if (!user_id || !comment_text) {
      return res.status(400).json({
        version: "v2",
        content: {
          messages: [{ type: "text", text: "Missing user_id or comment_text." }],
        },
      });
    }

    const name = first_name || "there";
    const source = platform || "instagram";

    console.log(`[${new Date().toISOString()}] [${source}] Comment from ${user_id} (${name}): ${comment_text}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: COMMENT_REPLY_PROMPT },
        {
          role: "user",
          content: `The person's name is "${name}". They commented: "${comment_text}". Write the opening DM.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const aiReply = completion.choices[0].message.content.trim();

    // Start a new conversation history with this exchange
    const convo = {
      messages: [
        { role: "assistant", content: aiReply },
      ],
      lastActivity: Date.now(),
      source,
      startedFromComment: comment_text,
    };
    conversations.set(user_id, convo);

    console.log(`[${new Date().toISOString()}] Opening DM to ${user_id}: ${aiReply}`);

    return res.json({
      version: "v2",
      content: {
        messages: [{ type: "text", text: aiReply }],
      },
    });
  } catch (error) {
    console.error("Comment error:", error.message);
    return res.status(200).json({
      version: "v2",
      content: {
        messages: [
          { type: "text", text: "Hey! Thanks for your comment 😊 How can I help you?" },
        ],
      },
    });
  }
});

/**
 * POST /webhook
 * ManyChat calls this when a user sends a DM (ongoing conversation).
 *
 * Expected body from ManyChat External Request:
 * {
 *   "user_id": "{{user id}}",
 *   "message": "{{last user input}}",
 *   "first_name": "{{first name}}",
 *   "platform": "instagram" or "facebook"
 * }
 */
app.post("/webhook", async (req, res) => {
  try {
    const { user_id, message, first_name, platform } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({
        version: "v2",
        content: {
          messages: [{ type: "text", text: "Missing user_id or message." }],
        },
      });
    }

    const source = platform || "instagram";
    console.log(`[${new Date().toISOString()}] [${source}] DM from ${user_id}: ${message}`);

    let convo = conversations.get(user_id);

    if (!convo || Date.now() - convo.lastActivity > CONVERSATION_TTL) {
      convo = { messages: [], lastActivity: Date.now(), source };
    }

    convo.messages.push({ role: "user", content: message });

    if (convo.messages.length > MAX_HISTORY_MESSAGES) {
      convo.messages = convo.messages.slice(-MAX_HISTORY_MESSAGES);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...convo.messages,
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const aiReply = completion.choices[0].message.content.trim();

    convo.messages.push({ role: "assistant", content: aiReply });
    convo.lastActivity = Date.now();
    conversations.set(user_id, convo);

    console.log(`[${new Date().toISOString()}] AI reply to ${user_id}: ${aiReply}`);

    return res.json({
      version: "v2",
      content: {
        messages: [{ type: "text", text: aiReply }],
      },
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(200).json({
      version: "v2",
      content: {
        messages: [
          { type: "text", text: "Sorry, I'm having trouble right now. Please try again in a moment!" },
        ],
      },
    });
  }
});

/**
 * POST /reset
 * Reset a user's conversation history
 */
app.post("/reset", (req, res) => {
  const { user_id } = req.body;
  if (user_id) {
    conversations.delete(user_id);
    return res.json({ success: true, message: `Conversation reset for ${user_id}` });
  }
  return res.status(400).json({ error: "user_id required" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /comment  — comment triggers (generates first DM)`);
  console.log(`  POST /webhook  — ongoing DM conversation`);
  console.log(`  GET  /health   — health check`);
});
