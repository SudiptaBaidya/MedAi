import OpenAI from 'openai'
import dotenv from 'dotenv'
import ChatHistory from '../models/ChatHistory.js'
import User from '../models/User.js'

dotenv.config()

const openai = new OpenAI({
    apiKey: process.env.HUGGINGFACE_TOKEN,
    baseURL: "https://router.huggingface.co/v1"
})

const SYSTEM_PROMPT_SYMPTOMS = `
You are MedAI, an advanced but highly cautious health information assistant.
You strictly provide structured insights based on user symptoms.

SAFETY BOUNDARIES (CRITICAL):
1. ALWAYS state clearly within the response that you are not a doctor.
2. AVOID definitive diagnosis.
3. AVOID emergency medical instructions. If symptoms suggest a severe condition (e.g. chest pain, extreme bleeding), immediately recommend emergency services as the Suggested Next Step.
4. DO NOT prescribe restricted medicines.
5. If the user asks for medicine suggestions for common diseases or symptoms (e.g., fever, cold), you MAY suggest common over-the-counter (OTC) medicines. However, you MUST explicitly state that they should consult with a doctor before taking any medication.

FORMAT INSTRUCTIONS:
Always respond exactly in this JSON format:
{
  "condition": "Possible Condition name",
  "reason": "Brief explanation of why these symptoms match",
  "riskLevel": "Low" | "Moderate" | "High",
  "medicines": "Suggested over-the-counter medicines (if applicable), along with a disclaimer to consult a doctor. Leave empty or omit if not applicable.",
  "nextStep": "Suggested Next Step (e.g., 'Rest and hydrate', 'Consult a doctor within 24h', 'Seek immediate emergency care')"
}
Do not include markdown blocks (\`\`\`json). Return purely the JSON object.
`

export const analyzeSymptoms = async (req, res) => {
    try {
        const { messages, sessionId } = req.body

        // Fallback if auth isn't wired fully yet on frontend for testing
        const uid = req.user?.uid || 'anonymous'

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' })
        }

        // Filter greeting and format for AI
        const formattedMessages = messages.map(msg => {
            let content = msg.content;
            if (Array.isArray(content)) {
                // Legacy image message fallback
                const textPart = content.find(p => p.type === 'text');
                content = textPart ? textPart.text : "Image provided by user (no longer supported).";
            }
            if (typeof content === 'object' && !Array.isArray(content)) content = JSON.stringify(content);
            const role = (msg.role === 'system' || msg.role === 'assistant') ? 'assistant' : 'user';
            return { role, content };
        }).filter(msg => {
            if (typeof msg.content === 'string') return !msg.content.includes("Hi, I am MedAI");
            return true;
        });

        const apiMessages = [
            { role: 'system', content: SYSTEM_PROMPT_SYMPTOMS },
            ...formattedMessages
        ];

        const completion = await openai.chat.completions.create({
            model: 'meta-llama/Meta-Llama-3-8B-Instruct',
            max_tokens: 500,
            messages: apiMessages,
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const parsedResponse = JSON.parse(completion.choices[0].message.content);
        let finalSessionId = sessionId;
        let finalUserId = null;

        // Save to Database
        if (uid !== 'anonymous') {
            const user = await User.findOne({ googleId: uid })
            if (user) finalUserId = user._id;
        } else {
            // Find or create an anonymous user for testing
            let anonUser = await User.findOne({ googleId: 'anonymous' });
            if (!anonUser) {
                anonUser = await User.create({
                    googleId: 'anonymous',
                    email: 'anon@test.com',
                    name: 'Anonymous User'
                });
            }
            finalUserId = anonUser._id;
        }

        if (finalUserId) {
            const latestUserMessage = messages[messages.length - 1];
            let title = 'New Chat';
            if (typeof latestUserMessage.content === 'string') {
                title = latestUserMessage.content.substring(0, 30) + (latestUserMessage.content.length > 30 ? '...' : '');
            } else if (Array.isArray(latestUserMessage.content)) {
                const textPart = latestUserMessage.content.find(p => p.type === 'text');
                if (textPart && textPart.text) {
                    title = textPart.text.substring(0, 30) + (textPart.text.length > 30 ? '...' : '');
                } else {
                    title = 'Image Analysis';
                }
            }

            if (sessionId) {
                await ChatHistory.findByIdAndUpdate(sessionId, {
                    $push: {
                        messages: {
                            $each: [
                                { role: 'user', content: latestUserMessage.content },
                                { role: 'assistant', content: parsedResponse }
                            ]
                        }
                    }
                });
            } else {
                const session = await ChatHistory.create({
                    userId: finalUserId,
                    type: 'symptom',
                    title: title,
                    messages: [
                        { role: 'user', content: latestUserMessage.content },
                        { role: 'assistant', content: parsedResponse }
                    ]
                })
                finalSessionId = session._id;
            }
        }

        res.status(200).json({ response: parsedResponse, sessionId: finalSessionId });

    } catch (error) {
        console.error('[HuggingFace Analysis / DB Error]', error.message, error.stack);

        if (error.status === 429) {
            return res.status(200).json({
                condition: "HuggingFace Quota Exceeded",
                reason: "The configured HuggingFace API key has run out of credits or hit its rate limit. Please check your account.",
                riskLevel: "Low",
                nextStep: "Add a valid HuggingFace API key with sufficient quota to enable real AI responses."
            });
        }

        res.status(500).json({ error: 'Failed to process symptoms with AI. Please try again.', details: error.message, stack: error.stack })
    }
}

export const getSessions = async (req, res) => {
    try {
        const uid = req.user?.uid || 'anonymous';
        let finalUserId = null;

        if (uid !== 'anonymous') {
            const user = await User.findOne({ googleId: uid });
            if (user) finalUserId = user._id;
        } else {
            const anonUser = await User.findOne({ googleId: 'anonymous' });
            if (anonUser) finalUserId = anonUser._id;
        }

        if (!finalUserId) return res.status(200).json([]);

        const sessions = await ChatHistory.find({ userId: finalUserId, type: 'symptom' })
            .select('_id title updatedAt')
            .sort({ updatedAt: -1 });

        res.status(200).json(sessions);
    } catch (error) {
        console.error('[Get Sessions Error]', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
}

export const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await ChatHistory.findById(id);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.status(200).json(session);
    } catch (error) {
        console.error('[Get Session Error]', error);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
}
