const fs = require('fs');
const js = fs.readFileSync('js/store.js', 'utf8');

const index = js.indexOf('preloader');
if (index !== -1) {
    console.log(js.substring(index - 100, index + 800));
} else {
    console.log("Not found preloader");
}
