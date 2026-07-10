const fs = require('fs');

const files = ['index.html', 'shop.html', 'js/store.js', 'js/db.js'];
files.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (line.includes('10%') || line.includes('10 percent')) {
                console.log(`${file}:${i + 1}: ${line}`);
            }
        });
    }
});
