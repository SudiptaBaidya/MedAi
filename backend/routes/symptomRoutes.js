import express from 'express'
import { getSymptomsByOrgan, analyzeSelectedSymptoms } from '../controllers/symptomController.js'

const router = express.Router()

router.get('/', getSymptomsByOrgan)
router.post('/', analyzeSelectedSymptoms)

export default router
