require("dotenv").config();
const OpenAI = require("openai");


const token = process.env.DEEPSEEK_API_KEY;
const endpoint = process.env.AZURE_URL;
const modelName = "gpt-4o";

const client = new OpenAI({ baseURL: endpoint, apiKey: token });

exports.interpretQuery = async(query) => {
    const prompt = `Convert the user's natural language query into JSON filters.

Possible filters:
- is_palindrome: boolean
- min_length: number
- max_length: number
- word_count: number
- contains_character: single character string

Only return valid JSON, no extra text.

Examples:
"all single word palindromic strings" →
{"is_palindrome": true, "word_count": 1}

"strings longer than 10 characters" →
{"min_length": 11}

"strings containing the letter z" →
{"contains_character": "z"}

The Query is "${query}" →
`
try {
     const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are an intelligent query translator for a string database" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 1500,
      model: modelName
    });

    const content = response.choices[0].message.content;
    const cleanedContent = content.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(cleanedContent);

    return questions;
  } catch (error) {
    console.log(error)
    return 
  }
}