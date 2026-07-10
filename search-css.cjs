const fs = require('fs');

const css = fs.readFileSync('css/style.css', 'utf8');

const regexes = [
    /\.category-section[^{]*\{([^}]*)\}/g,
    /\.product-grid[^{]*\{([^}]*)\}/g,
    /\.reveal-on-scroll[^{]*\{([^}]*)\}/g
];

regexes.forEach(regex => {
    let match;
    console.log(`Searching for pattern: ${regex.toString()}`);
    while ((match = regex.exec(css)) !== null) {
        console.log(`Found rule: ${match[0]}\n`);
    }
});
