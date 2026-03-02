async function test() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/medicine/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'I have fever can I take dolo 650?' })
        });
        const data = await response.json();
        console.log('Result:', data);
    } catch (e) {
        console.error(e);
    }
}
test();
