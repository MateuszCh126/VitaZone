const debugLogin = async () => {
    try {
        console.log('Attempting login to http://localhost:3001/api/auth/login...');
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@gmail.com', password: 'password123' }) // Password doesn't matter for 500 check
        });

        console.log('StatusCode:', res.status);
        const text = await res.text();
        console.log('Response Body:', text);
    } catch (err) {
        console.error('Fetch Error:', err);
    }
};

debugLogin();
