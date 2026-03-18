import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Routes
import chatRoutes from './routes/chatRoutes.js'
import medicineRoutes from './routes/medicineRoutes.js'
import authRoutes from './routes/authRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import symptomRoutes from './routes/symptomRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
    origin: [
        'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
        'http://localhost:3003', 'http://localhost:5173', 'http://localhost:5174',
        'http://localhost:5175', 'http://localhost:5176',
        'https://med-ai-rho-eight.vercel.app',
        'https://medai-utym.onrender.com'
    ],
    credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medai')
    .then(() => console.log('[MongoDB] Connected Successfully'))
    .catch(err => console.error('[MongoDB] Connection Failed:', err))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/medicine', medicineRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/symptoms', symptomRoutes)

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'active', message: 'MedAI API is running.' })
})

app.listen(PORT, () => {
    console.log(`[server]: MedAI backend running at http://localhost:${PORT}`)
})
