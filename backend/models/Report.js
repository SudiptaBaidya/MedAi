import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    filename: {
        type: String,
        default: 'Analyzed Report'
    },
    date: {
        type: String,
        required: true
    },
    data: {
        summary: { type: String, required: true },
        keyFindings: [{ type: String }],
        symptomsNoted: [{ type: String }],
        jargonExplained: [{
            term: { type: String },
            explanation: { type: String }
        }],
        disclaimer: { type: String }
    }
}, { timestamps: true })

export default mongoose.model('Report', reportSchema)
