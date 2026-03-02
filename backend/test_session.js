import fetch from 'node-fetch';

async function testSession() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/chat/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'I have a headache' }]
            })
        });

        const data = await response.json();
        console.log("Response:", data);

        const sessions = await fetch('http://127.0.0.1:5000/api/chat/sessions');
        const sData = await sessions.json();
        console.log("Sessions:", sData);
    } catch (e) {
        console.error("Error:", e);
    }
}

testSession();
