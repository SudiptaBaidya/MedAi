import express from 'express'
import { analyzeSymptoms, getSessions, getSessionById } from '../controllers/chatController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// To easily test without passing auth tokens for now, removing verifyToken
// Re-add verifyToken middleware later
router.post('/analyze', analyzeSymptoms)
router.get('/sessions', getSessions)
router.get('/sessions/:id', getSessionById)

export default router
