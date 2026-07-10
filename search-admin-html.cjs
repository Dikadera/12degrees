const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');

const regex = /<div[^>]*id="tab-settings"[\s\S]*?<\/div>/;
const match = html.match(regex);
if (match) {
    console.log("Found tab-settings:\n", match[0].substring(0, 1000));
} else {
    // Search for just System Configuration text and print lines around it
    const index = html.indexOf('System Configuration');
    if (index !== -1) {
        console.log("Found System Configuration:\n", html.substring(index - 200, index + 1500));
    } else {
        console.log("Not found System Configuration");
    }
}
