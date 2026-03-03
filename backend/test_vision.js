import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.HUGGINGFACE_TOKEN,
    baseURL: "https://router.huggingface.co/v1"
});

async function main() {
    try {
        const completion = await openai.chat.completions.create({
            model: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
            max_tokens: 500,
            messages: [{ role: 'user', content: 'Say hi' }],
            temperature: 0.5,
            response_format: { type: "json_object" }
        });
        console.log("Success:", completion.choices[0].message.content);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
main();
