const fs = require('fs');
const js = fs.readFileSync('js/admin.js', 'utf8');

const index = js.indexOf('function renderProductsTable');
if (index !== -1) {
    console.log(js.substring(index + 800, index + 1800));
} else {
    console.log("Not found");
}
