import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import Report from '../models/Report.js'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT_REPORT = `
You are MedAI, an educational medical assistant.
Your task is to analyze the provided medical report, scan, or document and explain it in plain, easy-to-understand language solely for knowledge purposes.

SAFETY BOUNDARIES (CRITICAL - YOU MUST FOLLOW THESE):
1. You MUST include a disclaimer that this analysis is for educational purposes only and DOES NOT replace a doctor's advice.
2. DO NOT provide a definitive diagnosis. State that these are "findings" or "observations."
3. Break down complex medical jargon into simple terms.

FORMAT INSTRUCTIONS:
Always respond exactly in this JSON format:
{
  "summary": "A brief, 2-3 sentence overview of what this report is.",
  "keyFindings": ["Array", "Of", "Important", "Observations", "Translated", "To", "Simple", "English"],
  "symptomsNoted": ["Array", "Of", "Symptoms", "Mentioned", "In", "Report"],
  "jargonExplained": [
      { "term": "Medical Term 1", "explanation": "Simple explanation" }
  ],
  "disclaimer": "This analysis is for educational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding your results."
}
Do not include markdown blocks (\`\`\`json). Return purely the JSON object.
`

export const analyzeReport = async (req, res) => {
    try {
        const { image } = req.body

        if (!image) {
            return res.status(400).json({ error: 'Report image is required' })
        }

        // 1. Strict Validation: Ensure it is a valid base64 image or pdf string from our frontend
        const base64Regex = /^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/;
        if (!image.match(base64Regex)) {
            return res.status(400).json({ error: 'Invalid file format. Ensure the safe compiler is working.' });
        }

        // Use gemini-2.5-flash because it has a high free tier limit instead of the 2 RPM limit on Pro models
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `${SYSTEM_PROMPT_REPORT}\n\nPlease analyze the attached medical report safely.`;

        // 2. Exact Parsing
        const mimeType = image.split(';')[0].split(':')[1];
        const base64Data = image.replace(base64Regex, "");

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse JSON from Gemini response");
        }

        const parsedResponse = JSON.parse(jsonMatch[0]);
        res.status(200).json(parsedResponse)

    } catch (error) {
        console.error('[Gemini Report Error]', error);

        // Explicitly catch Google Generative AI Quota / Rate Limit Errors
        if (error.status === 429 || (error.message && error.message.includes("429")) || (error.message && error.message.toLowerCase().includes("quota"))) {
            return res.status(429).json({
                error: 'Free Quota Ended. The AI has reached its maximum daily requests on the free tier. Please try again tomorrow or upgrade the plan.',
                isQuotaError: true
            });
        }

        res.status(500).json({
            error: 'Failed to analyze the report safely.',
            details: error ? String(error.message || error) : 'Unknown error'
        });
    }
}

// @desc    Save an analyzed report to history
// @route   POST /api/reports/save
// @access  Private
export const saveReport = async (req, res) => {
    try {
        const { filename, date, data } = req.body;

        if (!filename || !date || !data) {
            return res.status(400).json({ error: "Missing required report fields" });
        }

        const report = new Report({
            user: req.user.uid,
            filename,
            date,
            data
        });

        const savedReport = await report.save();
        res.status(201).json(savedReport);

    } catch (error) {
        console.error('Error saving report:', error);
        res.status(500).json({ error: 'Failed to save report to history.' });
    }
}

// @desc    Get user's report history
// @route   GET /api/reports/history
// @access  Private
export const getUserReports = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user.uid }).sort({ createdAt: -1 });

        // Format them to match the frontend HistoryItem interface
        const formattedReports = reports.map(r => ({
            id: r._id.toString(),
            filename: r.filename,
            date: r.date,
            data: r.data
        }));

        res.status(200).json(formattedReports);
    } catch (error) {
        console.error('Error fetching report history:', error);
        res.status(500).json({ error: 'Failed to fetch report history.' });
    }
}

// @desc    Delete a report from history
// @route   DELETE /api/reports/:id
// @access  Private
export const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Verify the user owns the report
        if (report.user !== req.user.uid) {
            return res.status(401).json({ error: 'Not authorized to delete this report' });
        }

        await report.deleteOne();
        res.status(200).json({ message: 'Report removed' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ error: 'Failed to delete report.' });
    }
}
