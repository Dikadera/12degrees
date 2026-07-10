const fs = require('fs');
const lines = fs.readFileSync('js/store.js', 'utf8').split('\n');

lines.forEach((line, i) => {
    if (line.includes('function formatCategory')) {
        console.log(`${i + 1}: ${line}`);
    }
});
