const { execSync } = require('child_process');
try {
    const fileContent = execSync('git show 98c4317ecb5fc09f8af1c5627dd4bb62497c7308:js/db.js').toString();
    const lines = fileContent.split('\n');
    console.log("File loaded. Total lines: " + lines.length);
    
    // Find where DEFAULT_PRODUCTS is declared
    let startIndex = -1;
    lines.forEach((line, idx) => {
        if (line.includes('const DEFAULT_PRODUCTS')) {
            startIndex = idx;
        }
    });
    
    if (startIndex !== -1) {
        console.log(`Found DEFAULT_PRODUCTS at line ${startIndex}. Printing next 150 lines:`);
        console.log(lines.slice(startIndex, startIndex + 150).join('\n'));
    } else {
        console.log("DEFAULT_PRODUCTS variable not found in initial commit db.js.");
    }
} catch (e) {
    console.error("Error reading commit file:", e.message);
}
