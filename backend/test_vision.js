import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.HUGGINGFACE_TOKEN,
    baseURL: "https://router.huggingface.co/v1"
});

async function test() {
    try {
        console.log("Testing mistralai/Pixtral-12B-2409 with an image...");
        const completion = await openai.chat.completions.create({
            model: 'mistralai/Pixtral-12B-2409',
            max_tokens: 50,
            messages: [
                { role: 'system', content: "You are a helpful assistant." },
                {
                    role: 'user',
                    content: [
                        { type: "text", text: "What color is this?" },
                        { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" } } // a 1x1 transparent/black pixel
                    ]
                }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });
        console.log("Success!");
        console.log(completion.choices[0].message.content);
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
            fs.writeFileSync('error_info.json', JSON.stringify(e.response.data, null, 2));
        } else {
            fs.writeFileSync('error_info.json', JSON.stringify({ message: e.message }, null, 2));
        }
    }
}

test();
