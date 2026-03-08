const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');
const localesDir = path.join(srcDir, 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

const directoriesToScan = [
    path.join(srcDir, 'Client-Pages'),
    path.join(srcDir, 'Receptionist-Pages'),
    path.join(srcDir, 'Mechanic-Pages'),
    path.join(srcDir, 'PartsManager-Pages'),
    path.join(srcDir, 'Supervisor-Pages'),
    path.join(srcDir, 'components'),
    path.join(srcDir, 'pages') // UserProfile.jsx
];

// Regex to match t('key', 'Default Value') or t("key", "Default Value")
// It handles optional spaces and different quote types.
const regex = /t\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?\s*\)/g;

function getFiles(dir, filesList = []) {
    if (!fs.existsSync(dir)) return filesList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, filesList);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            filesList.push(fullPath);
        }
    }
    return filesList;
}

const allFiles = directoriesToScan.reduce((acc, dir) => getFiles(dir, acc), []);

const extractedKeys = {};

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        const defaultValue = match[2] || key; // fallback to key if no default
        extractedKeys[key] = defaultValue;
    }
});

function updateLocaleFile(filePath) {
    let localeData = {};
    if (fs.existsSync(filePath)) {
        try {
            localeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error parsing ${filePath}:`, e);
        }
    }

    // Helper to set nested object properties
    function setNestedPath(obj, pathStr, value) {
        const keys = pathStr.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        const lastKey = keys[keys.length - 1];
        if (!current[lastKey]) {
            current[lastKey] = value;
        }
    }

    let addedCount = 0;
    for (const [key, defaultValue] of Object.entries(extractedKeys)) {
        // Check if key exists
        const keys = key.split('.');
        let current = localeData;
        let exists = true;
        for (const k of keys) {
            if (current === undefined || current[k] === undefined) {
                exists = false;
                break;
            }
            current = current[k];
        }

        if (!exists) {
            setNestedPath(localeData, key, defaultValue);
            addedCount++;
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(localeData, null, 2), 'utf8');
    console.log(`Updated ${path.basename(filePath)} - Added ${addedCount} new keys.`);
}

updateLocaleFile(enPath);
updateLocaleFile(frPath);

console.log('Extraction complete.');
