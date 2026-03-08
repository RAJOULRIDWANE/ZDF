const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, 'frontend', 'src', 'locales', 'fr.json');
const arPath = path.join(__dirname, 'frontend', 'src', 'locales', 'ar.json');

const frLocale = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const arLocale = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const transFr = {
    "home.tabs.ai.label": "Scan IA",
    "home.tabs.ai.header": "Moteur de Scan IA",
    "home.tabs.ai.feed1": "> CHARGEMENT DU MODÈLE XGBOOST...",
    "home.tabs.ai.feed2": "> 20 CLASSES DE RÉPARATION ACTIVES",
    "home.tabs.ai.feed3": "> ANALYSE DES SYMPTÔMES...",
    "home.ai_badge": "Propulsé par l'IA"
};

const transAr = {
    "home.tabs.ai.label": "مسح بالذكاء الاصطناعي",
    "home.tabs.ai.header": "محرك المسح بالذكاء الاصطناعي",
    "home.tabs.ai.feed1": "> جاري تحميل نموذج XGBOOST...",
    "home.tabs.ai.feed2": "> 20 فئة إصلاح نشطة",
    "home.tabs.ai.feed3": "> جاري تحليل الأعراض...",
    "home.ai_badge": "مدعوم بالذكاء الاصطناعي"
};

function ensureNested(obj, path) {
    const keys = path.split('.');
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

for (const [key, value] of Object.entries(transFr)) {
    writeKey(frLocale, key, value);
}

for (const [key, value] of Object.entries(transAr)) {
    writeKey(arLocale, key, value);
}

fs.writeFileSync(frPath, JSON.stringify(frLocale, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arLocale, null, 2));

console.log("Translations for AI tab strings updated successfully.");
