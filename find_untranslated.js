const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend', 'src', 'locales', 'en.json');
const frPath = path.join(__dirname, 'frontend', 'src', 'locales', 'fr.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));

const toTranslate = {};

function traverse(enObj, frObj, keys = []) {
    for (const key in enObj) {
        if (typeof enObj[key] === 'object' && enObj[key] !== null) {
            if (frObj[key]) {
                traverse(enObj[key], frObj[key], [...keys, key]);
            }
        } else {
            if (frObj[key] === enObj[key] && typeof enObj[key] === 'string' && /[a-zA-Z]/.test(enObj[key])) {
                toTranslate[[...keys, key].join('.')] = enObj[key];
            }
        }
    }
}

traverse(enData, frData);

fs.writeFileSync('to_translate.json', JSON.stringify(toTranslate, null, 2));
console.log(`Found ${Object.keys(toTranslate).length} keys to translate.`);
