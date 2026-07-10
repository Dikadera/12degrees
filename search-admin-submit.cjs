const fs = require('fs');
const js = fs.readFileSync('js/admin.js', 'utf8');

const index = js.indexOf("productForm.addEventListener('submit'");
if (index !== -1) {
    console.log(js.substring(index, index + 1500));
} else {
    console.log("Not found productForm submit listener");
}
