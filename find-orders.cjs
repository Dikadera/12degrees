const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\079e3f2e-662b-46a7-86be-85c21d5c7fc4\\.system_generated\\logs\\transcript.jsonl';

try {
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');
        console.log(`Total log lines: ${lines.length}`);
        
        let foundCount = 0;
        lines.forEach((line, idx) => {
            if (line.includes('ORD-') || line.includes('customerName') || line.includes('customerPhone')) {
                // Let's print snippets containing orders info
                if (line.length < 500) {
                    console.log(`[Line ${idx}] ${line}`);
                } else {
                    console.log(`[Line ${idx}] (Truncated) ... ${line.substring(0, 300)} ...`);
                }
                foundCount++;
            }
        });
        console.log(`Found ${foundCount} matches.`);
    } else {
        console.log("Log file does not exist.");
    }
} catch (e) {
    console.error("Search error:", e.message);
}
