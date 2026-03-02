import axios from 'axios'
import jwt from 'jsonwebtoken'

// Cache for Google's public keys
let publicKeys = {}
let lastFetchTime = 0

const fetchGooglePublicKeys = async () => {
    // Only fetch keys if they are older than 1 hour to reduce network requests
    if (Object.keys(publicKeys).length > 0 && Date.now() - lastFetchTime < 3600000) {
        return publicKeys
    }

    try {
        const response = await axios.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
        publicKeys = response.data
        lastFetchTime = Date.now()
        return publicKeys
    } catch (error) {
        console.error('[Auth Middleware] Error fetching Google public keys:', error)
        return null
    }
}

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decodedToken = jwt.decode(token, { complete: true })

        if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
            return res.status(403).json({ error: 'Unauthorized: Invalid token format' })
        }

        const keys = await fetchGooglePublicKeys()
        if (!keys) {
            return res.status(500).json({ error: 'Internal Server Error: Unable to verify token' })
        }

        const publicKey = keys[decodedToken.header.kid]

        // Verify token cryptographically
        const verifedData = jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            audience: process.env.FIREBASE_PROJECT_ID,
            issuer: `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`
        })

        // Format to map to our existing expectations (user fields like uid, email, name)
        req.user = {
            uid: verifedData.user_id, // Firebase standard field for UID
            email: verifedData.email,
            name: verifedData.name || null
        }

        next()
    } catch (error) {
        console.error('[Auth Middleware] Token verification failed:', error.message)
        return res.status(403).json({ error: 'Unauthorized: Invalid token' })
    }
}
