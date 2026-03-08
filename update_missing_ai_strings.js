const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, 'frontend', 'src', 'locales', 'fr.json');
const arPath = path.join(__dirname, 'frontend', 'src', 'locales', 'ar.json');
const enPath = path.join(__dirname, 'frontend', 'src', 'locales', 'en.json');

const frLocale = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const arLocale = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enLocale = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const transFr = {
    "dashboard.btn_ai_diagnostic": "Diagnostic IA",
    "home.ai_title": "Diagnostic de réparation automobile",
    "home.ai_subtitle": "Décrivez les symptômes de votre véhicule et obtenez des prédictions de réparation instantanées par l'IA avec des estimations de coûts."
};

const transAr = {
    "dashboard.btn_ai_diagnostic": "التشخيص بالذكاء الاصطناعي",
    "home.ai_title": "تشخيص أعطال السيارات بالذكاء الاصطناعي",
    "home.ai_subtitle": "صف أعراض مركبتك واحصل على توقعات إصلاح فورية مدعومة بالذكاء الاصطناعي مع تقديرات التكلفة."
};

const transEn = {
    "dashboard.btn_ai_diagnostic": "AI Diagnostic",
    "home.ai_title": "Auto Repair Diagnostic",
    "home.ai_subtitle": "Describe your vehicle symptoms and get instant AI-powered repair predictions with cost estimates."
};

function ensureNested(obj, pathStr) {
    const keys = pathStr.split('.');
    let cur = obj;
    for (let k of keys) {
        if (!cur[k]) cur[k] = {};
        cur = cur[k];
    }
    return obj;
}

const writeKey = (obj, pathStr, val) => {
    const keys = pathStr.split('.');
    const name = keys.pop();
    const parentPath = keys.join('.');
    if (parentPath) ensureNested(obj, parentPath);

    let cur = obj;
    for (const p of keys) {
        cur = cur[p];
    }
    cur[name] = val;
};

for (const [key, value] of Object.entries(transFr)) writeKey(frLocale, key, value);
for (const [key, value] of Object.entries(transAr)) writeKey(arLocale, key, value);
for (const [key, value] of Object.entries(transEn)) writeKey(enLocale, key, value);

fs.writeFileSync(frPath, JSON.stringify(frLocale, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arLocale, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enLocale, null, 2));

console.log("Translations for AI Titles and Buttons updated accurately.");
