async function test() {
    try {
        const response = await fetch('https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=para&ef=DISPLAY_NAME');
        const data = await response.json();
        console.log(data);
    } catch (e) { console.error(e) }
}
test();
