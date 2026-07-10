const fs = require('fs');
const lines = fs.readFileSync('admin.html', 'utf8').split('\n');

lines.forEach((line, i) => {
    if (line.includes('class="tab-panel"')) {
        console.log(`${i + 1}: ${line}`);
    }
});
