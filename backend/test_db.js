import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatHistory from './models/ChatHistory.js';
import User from './models/User.js';

dotenv.config();

async function testDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Check anonymous user
        let anonUser = await User.findOne({ googleId: 'anonymous' });
        if (!anonUser) {
            console.log("Creating anonymous user...");
            anonUser = await User.create({
                googleId: 'anonymous',
                email: 'anon@test.com',
                name: 'Anonymous User'
            });
        }
        console.log("Anon User ID:", anonUser._id);

        // 2. Create test session
        console.log("Creating test session...");
        const session = await ChatHistory.create({
            userId: anonUser._id,
            type: 'symptom',
            title: 'Test Debug Session',
            messages: [
                { role: 'user', content: 'hello DB test' },
                { role: 'assistant', content: { condition: 'none', reason: 'debug mode', riskLevel: 'Low', nextStep: 'fix app' } }
            ]
        });

        console.log("Successfully created session:", session._id);

        // 3. Fetch test sessions
        console.log("Fetching sessions...");
        const sessions = await ChatHistory.find({ userId: anonUser._id, type: 'symptom' })
            .select('_id title updatedAt')
            .sort({ updatedAt: -1 });

        console.log("Found sessions:", sessions.length);

    } catch (e) {
        console.error("FATAL DB ERROR:", e.message);
        console.error(e.stack);
    } finally {
        await mongoose.disconnect();
    }
}

testDB();
