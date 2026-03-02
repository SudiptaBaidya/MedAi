import express from 'express'
import { lookupMedicine, extractMedicineName } from '../controllers/medicineController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// To easily test without passing auth tokens for now, removing verifyToken
// Re-add verifyToken middleware later
router.post('/lookup', lookupMedicine)
router.post('/extract', extractMedicineName)

export default router
