const { execSync } = require('child_process');

try {
    const commits = execSync('git log --oneline').toString().split('\n');
    console.log(`Checking ${commits.length} commits...`);
    
    for (const commitLine of commits) {
        if (!commitLine.trim()) continue;
        const hash = commitLine.split(' ')[0];
        try {
            const files = execSync(`git show --name-only ${hash}`).toString();
            if (files.includes('js/db.js')) {
                const dbContent = execSync(`git show ${hash}:js/db.js`).toString();
                if (dbContent.includes('Lumine') || dbContent.includes('Doctor') || dbContent.includes('Carrot')) {
                    console.log(`✨ Found product names in commit ${commitLine}!`);
                    // Find lines containing the match
                    const dbLines = dbContent.split('\n');
                    dbLines.forEach((line, idx) => {
                        if (line.includes('Lumine') || line.includes('Doctor') || line.includes('Carrot')) {
                            console.log(`[Line ${idx}] ${line}`);
                        }
                    });
                    break;
                }
            }
        } catch (e) {
            // Ignore missing path errors
        }
    }
} catch (e) {
    console.error("Search failed:", e.message);
}
