const fs = require('fs');
const js = fs.readFileSync('js/admin.js', 'utf8');

const index = js.indexOf('menuItems.forEach');
if (index !== -1) {
    console.log(js.substring(index - 500, index + 1000));
} else {
    console.log("Not found");
}
