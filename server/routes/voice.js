const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');

const SYSTEM_PROMPT = `
You are an intelligent note-processing assistant.
Your task is to convert a user's natural language command into structured JSON for a note-taking application.

---
## 🎯 OBJECTIVE
Extract the following from the user input:
1. Note title
2. List items (if any)
3. Action type

---
## 📤 OUTPUT FORMAT (STRICT JSON)
Always return ONLY valid JSON. No explanation.
{
"action": "create_note",
"title": "string",
"items": ["item1", "item2"]
}

---
## 🧠 RULES
1. ACTION TYPES:
* "create_note" → when user is creating a new note/list
* "add_to_note" → when user adds items to an existing note
* "unknown" → if intent is unclear

2. TITLE EXTRACTION:
* Extract the main subject of the note
* Examples:
  "note on favourite places" → "Favourite Places"
  "create a grocery list" → "Grocery List"

3. ITEM EXTRACTION:
* Extract all items after words like:
  "add", "include", "with"
* Split items by:
  "and", ","
* Capitalize properly:
  "paris" → "Paris"

4. CLEANING:
* Remove filler words:
  "please", "can you", "i want to"
* Ignore unnecessary words

5. EDGE CASES:
* If no items → return empty array []
* If no title → use "Untitled"
`;

router.post('/parse', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'No text provided' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Server missing GROQ_API_KEY configuration.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Groq API Error:', errData);
      return res.status(response.status).json({ message: 'NLP parsing failed' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from Groq');
    }

    // Attempt to parse to ensure it's valid JSON
    const parsed = JSON.parse(content);
    return res.json(parsed);

  } catch (error) {
    console.error('Voice parse error:', error);
    res.status(500).json({ message: 'Internal server error while parsing voice note' });
  }
});

module.exports = router;
