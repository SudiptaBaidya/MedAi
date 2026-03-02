import mongoose from 'mongoose'

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['medicine', 'symptom'],
        required: true
    },
    title: {
        type: String,
        required: true,
        default: 'New Chat'
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'system', 'assistant'],
                required: true
            },
            content: {
                type: mongoose.Schema.Types.Mixed, // Can be string for user, object for parsed AI response
                required: true
            }
        }
    ]
}, { timestamps: true })

export default mongoose.model('ChatHistory', chatHistorySchema)
