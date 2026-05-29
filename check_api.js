
import http from 'http';

const req = http.get('http://localhost:3001/api/species/search?q=py', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`BODY: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});
