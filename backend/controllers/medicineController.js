import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
    apiKey: process.env.HUGGINGFACE_TOKEN,
    baseURL: "https://router.huggingface.co/v1"
})

const SYSTEM_PROMPT_MEDICINE = `
You are MedAI, an advanced but highly cautious health information assistant.
You extract specific informative data regarding queried medications.

SAFETY BOUNDARIES:
1. Clarify that dosages are "typical examples" and NOT medical advice.
2. DO NOT endorse the use of off-label prescriptions.
3. Keep descriptions plain-language and clear. Avoid excessive jargon.

STRICT LOGIC RULES:
1. RISK SCORE CALCULATION:
   Base score = 100.
   Subtract points based on the data you find:
   - Minor side effects (e.g., headache, mild nausea) → -5 each.
   - Moderate side effects (e.g., severe vomiting, dizziness) → -10 each.
   - Major drug interactions → -15 each.
   - Serious warnings / contraindications → -20 each.
   Final score must be clamped between 0 and 100.
   - Score 80–100 → risk: "low"
   - Score 50–79 → risk: "moderate"
   - Score below 50 → risk: "high"
   If you cannot determine risk factors, return risk: "unavailable" and score: null.

2. SIMILAR MEDICINES:
   You MUST ALWAYS provide 3-4 medicine names that are related.
   Matches can be:
   - Within the same class (e.g., Cetirizine -> Loratadine, Fexofenadine)
   - Same use (e.g., Paracetamol -> Ibuprofen, Naproxen)
   - Same family (e.g., Amoxicillin -> Ampicillin, Penicillin)
   Never leave this array empty. Never return "No similar medicines found". If you are unsure, provide the most common alternatives for the condition being treated.

FORMAT INSTRUCTIONS:
Respond ONLY with this JSON exact framework:
{
  "name": "Queried name format",
  "category": "e.g. Antibiotics, Analgesic",
  "usedFor": "Condition it treats",
  "howItWorks": "Simple 1-sentence mechanism",
  "typicalDosage": "Standard adult dose example",
  "sideEffects": ["Array", "Of", "Common", "Effects"],
  "warnings": "Important contraindications",
  "risk": "low" | "moderate" | "high" | "unavailable",
  "safetyScore": number | null,
  "similarMedicines": ["Array", "Of", "Medicine", "Names"]
}
`

export const lookupMedicine = async (req, res) => {
    try {
        const { medicineName } = req.body

        if (!medicineName) {
            return res.status(400).json({ error: 'Medicine name is required' })
        }

        const completion = await openai.chat.completions.create({
            model: "meta-llama/Meta-Llama-3-8B-Instruct",
            max_tokens: 700,
            messages: [
                { role: "system", content: SYSTEM_PROMPT_MEDICINE },
                { role: "user", content: `Please provide information for: ${medicineName}` }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })

        const rawContent = completion.choices[0].message.content
        console.log('[Medicine AI Response]:', rawContent)

        let parsedResponse = JSON.parse(rawContent)

        // Defensive mapping to ensure frontend gets what it needs
        if (!parsedResponse.similarMedicines || !Array.isArray(parsedResponse.similarMedicines) || parsedResponse.similarMedicines.length === 0) {
            console.log('[Medicine AI] missing or empty similarMedicines, generating defaults...');
            const category = (parsedResponse.category || '').toLowerCase();
            const name = (parsedResponse.name || '').toLowerCase();

            if (category.includes('anti') || category.includes('histamine') || name.includes('cetirizine')) {
                parsedResponse.similarMedicines = ['Loratadine', 'Fexofenadine', 'Levocetirizine'];
            } else if (category.includes('analgesic') || category.includes('pain') || name.includes('paracetamol') || name.includes('dolo')) {
                parsedResponse.similarMedicines = ['Ibuprofen', 'Naproxen', 'Aspirin'];
            } else if (category.includes('antibiotic') || name.includes('amoxicillin')) {
                parsedResponse.similarMedicines = ['Ampicillin', 'Penicillin', 'Augmentin'];
            } else {
                parsedResponse.similarMedicines = [];
            }
        }

        res.status(200).json(parsedResponse)

    } catch (error) {
        console.error('[HuggingFace Medicine Error]', error)
        res.status(500).json({ error: 'Failed to lookup medicine data.', details: error ? String(error.message || error) : 'Unknown error' })
    }
}

const SYSTEM_PROMPT_EXTRACT_MEDICINE = `
You are a medical search assistant.

Your task is to extract ONLY the medicine name from the user's input so it can be used in the OpenFDA API.

Rules:

1. Remove dosage amounts (500mg, 10ml, etc).
2. Remove words like tablet, syrup, capsule, injection.
3. Remove extra symptoms or questions.
4. Return ONLY the clean generic or brand name.
5. Do NOT explain anything.
6. Do NOT add extra text.

If the medicine name is unclear, return:
"UNCLEAR_MEDICINE_NAME"

Examples:

Input: "Paracetamol 500mg tablet"
Output: "paracetamol"

Input: "Is Calpol safe?"
Output: "calpol"

Input: "I have fever can I take dolo 650?"
Output: "dolo"
`

export const extractMedicineName = async (req, res) => {
    try {
        const { query } = req.body

        if (!query) {
            return res.status(400).json({ error: 'Query is required' })
        }

        const completion = await openai.chat.completions.create({
            model: "meta-llama/Meta-Llama-3-8B-Instruct",
            max_tokens: 50,
            messages: [
                { role: "system", content: SYSTEM_PROMPT_EXTRACT_MEDICINE },
                { role: "user", content: `Input: "${query}"\nOutput:` }
            ],
            temperature: 0.1
        })

        const extractedName = completion.choices[0].message.content.trim()

        res.status(200).json({ medicineName: extractedName })

    } catch (error) {
        console.error('[HuggingFace Extractor Error]', error)
        res.status(500).json({ error: 'Failed to extract medicine name.', details: error ? String(error.message || error) : 'Unknown error' })
    }
}
