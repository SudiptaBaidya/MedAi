import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
    apiKey: process.env.HUGGINGFACE_TOKEN,
    baseURL: "https://router.huggingface.co/v1"
})

export const getSymptomsByOrgan = async (req, res) => {
    try {
        const { organ } = req.query

        if (!organ) {
            return res.status(400).json({ error: 'Organ query parameter is required' })
        }

        const prompt = `You are a medical AI assistant. The user clicked on the body part/organ: "${organ}".
Return a strict JSON object with three keys:
- "organ": the name of the organ ("${organ}")
- "symptoms": an array of 5-8 common symptoms related to issues with this organ
- "explanation": a concise (2-3 sentences) explanation of what these symptoms might indicate and general advice.

Example JSON:
{
  "organ": "Heart",
  "symptoms": ["Chest pain", "Shortness of breath", "Palpitations"],
  "explanation": "These symptoms could indicate cardiovascular issues. It's recommended to consult a doctor if severe."
}

Do not include markdown or external text, return pure JSON.`

        const completion = await openai.chat.completions.create({
            model: 'meta-llama/Meta-Llama-3-8B-Instruct',
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        let rawContent = completion.choices[0].message.content.trim();
        rawContent = rawContent.replace(/```(?:json)?/gi, '').trim();

        const parsedResponse = JSON.parse(rawContent);
        res.status(200).json(parsedResponse);
    } catch (error) {
        console.error('[Get Symptoms Error]', error);
        res.status(500).json({ error: 'Failed to find symptoms for the specified organ', details: error.message });
    }
}

export const analyzeSelectedSymptoms = async (req, res) => {
    try {
        const { organ, symptoms = [], customInput = "" } = req.body;

        if (!organ) {
            return res.status(400).json({ error: 'Organ is required' });
        }

        const prompt = `You are an advanced medical evaluator. A user has indicated they are experiencing issues with their ${organ}.
Specifically, they selected these symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None selected from list.'}.
Additional context provided by user: "${customInput || 'None'}".

Provide a structured, cautious medical analysis. MUST return strictly JSON exactly matching this format:
{
  "condition": "Likely condition or general category of issue",
  "reason": "Detailed explanation showing your clinical reasoning across the selected symptoms and the specified body part.",
  "riskLevel": "Low" | "Moderate" | "High",
  "medicines": "Common safe OTC medications or home remedies if applicable. Disclaimer.",
  "nextStep": "Clear actionable medical advice."
}

Do not include markdown or external text, return pure JSON.`;

        const completion = await openai.chat.completions.create({
            model: 'meta-llama/Meta-Llama-3-8B-Instruct',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        let rawContent = completion.choices[0].message.content.trim();
        rawContent = rawContent.replace(/```(?:json)?/gi, '').trim();

        const parsedResponse = JSON.parse(rawContent);
        res.status(200).json(parsedResponse);
    } catch (error) {
        console.error('[Analyze Symptoms Error]', error);
        if (error.status === 429) {
            return res.status(200).json({
                condition: "HuggingFace Quota Exceeded",
                reason: "The configured HuggingFace API key has run out of credits or hit its rate limit.",
                riskLevel: "Low",
                nextStep: "Add a valid HuggingFace API key."
            });
        }
        res.status(500).json({ error: 'Failed to analyze symptoms', details: error.message });
    }
}
