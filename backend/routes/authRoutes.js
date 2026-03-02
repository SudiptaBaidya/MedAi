import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import User from '../models/User.js'

const router = express.Router()

// POST /api/auth/sync
// Syncs the Firebase user with our MongoDB User table
router.post('/sync', verifyToken, async (req, res) => {
    try {
        const { uid, email, name } = req.user

        let user = await User.findOne({ googleId: uid })

        if (!user) {
            // Create new user in DB
            user = await User.create({
                googleId: uid,
                email: email,
                name: name || email.split('@')[0] // Fallback name
            })
        }

        res.status(200).json({ success: true, user })
    } catch (error) {
        console.error('[Auth Sync Error]', error)
        res.status(500).json({ error: 'Server error during user sync' })
    }
})

export default router
