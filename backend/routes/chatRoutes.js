import express from 'express'
import { analyzeSymptoms, getSessions, getSessionById, deleteSession, generateSymptoms } from '../controllers/chatController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// To easily test without passing auth tokens for now, removing verifyToken
// Re-add verifyToken middleware later
router.post('/analyze', analyzeSymptoms)
router.post('/generate-symptoms', generateSymptoms)
router.get('/sessions', getSessions)
router.get('/sessions/:id', getSessionById)
router.delete('/sessions/:id', deleteSession)

export default router
