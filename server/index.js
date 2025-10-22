require('dotenv').config();

const express = require('express');
const cors = require('cors');  
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = 5000;

// Generate the ai with the key
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// connect cors to React
app.use(cors({
    origin: 'http://localhost:3000'
})); 
app.use(express.json()); 

app.get('/', (req, res) => {
    res.json({ 
        status: "OK", 
        message: "QuizIt AI Server is running!",
        api_endpoint: "POST /generate-quiz - Send text here to generate a quiz."
    });
});

app.post('/generate-quiz', async (req, res) => {
    const inputText = req.body.text; 

    // Check if valid
    if (!inputText) {
        return res.status(400).send({ error: "Input text is required to generate the quiz." });
    }

    // Prompt in JSON
    const fullPrompt = `
        You are an expert quiz generator. Your task is to analyze the provided text and generate a quiz from it.

        **INSTRUCTIONS:**
        1.  **Generate** exactly **5 Multiple Choice Questions (MCQ)** based on the attached text.
        2.  For each question, provide exactly **4 answer options**.
        3.  Ensure one option is the correct answer and the other three are plausible distractors (incorrect but believable options derived from the text's context).
        4.  **Crucially, respond ONLY in JSON format.** Do not include any preceding or trailing text, explanations, or code block delimiters (like \`\`\`json).

        **JSON STRUCTURE:**
        You must strictly adhere to the following JSON structure:

        {
          "quiz": [
            {
              "question": "The question derived from the text.",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer": "The text of the correct option (must exactly match one of the options)."
            }
          ]
        }

        **TEXT FOR ANALYSIS:**
        ---
        ${inputText}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // The ai model
            contents: fullPrompt,
        });

        const jsonText = response.text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const quizData = JSON.parse(jsonText);

        res.json(quizData);

    } catch (error) {
        console.error("Error creating quiz:", error);
        // error
        res.status(500).send({
            error: "An error occurred while connecting to the AI model or parsing the output. Ensure the text is sufficiently long and contains relevant content.",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Quiz server running in: http://localhost:${PORT}`);
});