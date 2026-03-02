import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function test(url) {
    const openai = new OpenAI({
        apiKey: process.env.HUGGINGFACE_TOKEN,
        baseURL: url
    });
    try {
        const completion = await openai.chat.completions.create({
            model: 'meta-llama/Meta-Llama-3-8B-Instruct',
            max_tokens: 5,
            messages: [
                { role: 'user', content: 'Say hi' }
            ]
        });
        fs.appendFileSync('error_log.txt', `Success for ${url}: ` + completion.choices[0].message.content + '\n');
    } catch (e) {
        fs.appendFileSync('error_log.txt', `Error for ${url}: ` + e.message + '\n');
    }
}

async function main() {
    fs.writeFileSync('error_log.txt', '');
    await test('https://router.huggingface.co/v1');
    await test('https://router.huggingface.co/hf-inference/v1');
    console.log("Done checking");
}
main();
