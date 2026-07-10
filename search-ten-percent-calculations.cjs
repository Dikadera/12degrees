const fs = require('fs');
const content = fs.readFileSync('js/store.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('0.10') || line.includes('0.1') || line.includes('10')) {
        if (line.includes('*') || line.includes('/') || line.includes('discount')) {
            console.log(`${i + 1}: ${line}`);
        }
    }
});
