import express from 'express'
import { analyzeReport, saveReport, getUserReports, deleteReport } from '../controllers/reportsController.js'
import { verifyToken as protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/analyze', protect, analyzeReport)
router.post('/save', protect, saveReport)
router.get('/history', protect, getUserReports)
router.delete('/:id', protect, deleteReport)

export default router
