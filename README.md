# Instagram DM AI Bot (ManyChat + OpenAI)

A Node.js backend that connects ManyChat to OpenAI so users can chat naturally via Instagram DM.

---

## Setup (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API key
```bash
cp .env.example .env
```
Open `.env` and paste your OpenAI API key.

### 3. Edit your AI context
Open `server.js` and find the `SYSTEM_PROMPT` section (line ~20).
Replace the placeholder text with info about your business.

### 4. Run the server
```bash
npm start
```

### 5. Deploy (so ManyChat can reach it)
Use one of these free/cheap options:
- **Railway** → railway.app (easiest, ~$5/mo)
- **Render** → render.com (free tier available)
- **Vercel** → vercel.com (free)

After deploying, you'll get a public URL like:
`https://your-app.railway.app`

Your webhook URL will be:
`https://your-app.railway.app/webhook`

---

## ManyChat Setup (one-time, ~5 minutes)

1. Go to **ManyChat → Flows → New Flow**
2. Set trigger: **"Instagram DM received"** or **"Comment on post"**
3. Add an action: **"External Request (Webhook)"**
4. Set:
   - **URL**: `https://your-app.railway.app/webhook`
   - **Method**: `POST`
   - **Body** (JSON):
     ```json
     {
       "user_id": "{{user id}}",
       "message": "{{last user input}}",
       "first_name": "{{first name}}"
     }
     ```
5. Map the response: use `content.messages[0].text` as the reply message
6. Save & Publish

---

## How it works

```
User DMs on Instagram
       ↓
   ManyChat receives it
       ↓
   Calls your /webhook
       ↓
   OpenAI generates reply
       ↓
   Your server returns reply
       ↓
   ManyChat sends it to user
```

- Conversation history is kept per user (up to 23 hours)
- After 24h of inactivity, history resets (Instagram window closes anyway)
- Supports unlimited back-and-forth within the 24h window

---

## Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| GET | /health | Check if server is running |
| POST | /webhook | ManyChat sends messages here |
| POST | /reset | Clear a user's conversation history |

---

## Customization

- **Change AI model**: Edit `model: "gpt-4o-mini"` in server.js → use `"gpt-4o"` for smarter responses
- **Change system prompt**: Edit `SYSTEM_PROMPT` in server.js
- **Persistent storage**: Replace the `conversations` Map with Redis or MongoDB for production
