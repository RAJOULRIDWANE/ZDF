const fs = require('fs');
const path = require('path');

const optionsPath = path.join(__dirname, 'ai-model', 'models', 'options.json');
const models = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));

const repairClassesPath = path.join(__dirname, 'ai-model', 'models', 'repair_classes.json');
const repairs = JSON.parse(fs.readFileSync(repairClassesPath, 'utf8'));

const enPath = path.join(__dirname, 'frontend', 'src', 'locales', 'en.json');
const frPath = path.join(__dirname, 'frontend', 'src', 'locales', 'fr.json');

const enLocale = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const frLocale = JSON.parse(fs.readFileSync(frPath, 'utf8'));

const transFr = {
    // fuel_type
    "diesel": "Diesel",
    "hybrid": "Hybride",
    "petrol": "Essence",
    // transmission
    "automatic": "Automatique",
    "manual": "Manuelle",
    // severity_level
    "critical": "Critique",
    "high": "Élevé",
    "low": "Faible",
    "medium": "Moyen",
    // vehicle_type
    "bus": "Bus",
    "car": "Voiture",
    "moto": "Moto",
    "truck": "Camion",
    // probable_causes
    "AC compressor failure": "Défaillance du compresseur de climatisation",
    "AC gas leak": "Fuite de gaz de climatisation",
    "Alternator belt wear": "Usure de la courroie d'alternateur",
    "Alternator failure": "Défaillance de l'alternateur",
    "Ball joint socket failure": "Défaillance de la rotule",
    "Ball joint wear": "Usure de la rotule",
    "Battery cell failure": "Défaillance d'une cellule de batterie",
    "Blown head gasket": "Joint de culasse claqué",
    "Brake pad degradation": "Dégradation des plaquettes de frein",
    "Caliper hydraulic leak": "Fuite hydraulique de l'étrier",
    "Clogged fuel injector": "Injecteur de carburant bouché",
    "Clutch pressure plate failure": "Défaillance du mécanisme d'embrayage",
    "Compressor clutch wear": "Usure de l'embrayage du compresseur",
    "Cracked coolant hose": "Durite de liquide de refroidissement fissurée",
    "Dead battery": "Batterie à plat",
    "Disc surface wear": "Usure de la surface du disque",
    "Failed O2 sensor": "Sonde lambda défectueuse",
    "Fouled spark plugs": "Bougies d'allumage encrassées",
    "Gearbox bearing wear": "Usure des roulements de la boîte de vitesses",
    "Gearbox synchronizer failure": "Défaillance du synchroniseur de boîte",
    "Injector seal failure": "Défaillance du joint d'injecteur",
    "Low refrigerant": "Niveau de réfrigérant bas",
    "O2 sensor contamination": "Contamination de la sonde lambda",
    "Oil pan seal failure": "Défaillance du joint de carter d'huile",
    "Overheating damage to gasket": "Dommage au joint causé par une surchauffe",
    "Radiator corrosion": "Corrosion du radiateur",
    "Radiator crack": "Radiateur fissuré",
    "Radiator pinhole leak": "Micro-fuite du radiateur",
    "Seized caliper": "Étrier grippé",
    "Shock absorber oil leak": "Fuite d'huile de l'amortisseur",
    "Spark plug electrode wear": "Usure de l'électrode de la bougie",
    "Stuck thermostat": "Thermostat bloqué",
    "Thermostat valve failure": "Défaillance de la soupape du thermostat",
    "Timing belt tensioner failure": "Défaillance du tendeur de courroie de distribution",
    "Timing belt wear": "Usure de la courroie de distribution",
    "Valve cover gasket leak": "Fuite du joint de cache-culbuteurs",
    "Warped brake disc": "Disque de frein voilé",
    "Worn brake pads": "Plaquettes de frein usées",
    "Worn clutch disc": "Disque d'embrayage usé",
    "Worn shock absorbers": "Amortisseurs usés",
    // Predictions
    "Fix coolant leak": "Réparer la fuite de liquide de refroidissement",
    "Fix oil leak": "Réparer la fuite d'huile",
    "Refill AC refrigerant": "Recharger le réfrigérant de climatisation",
    "Repair gearbox": "Réparer la boîte de vitesses",
    "Replace AC compressor": "Remplacer le compresseur de climatisation",
    "Replace alternator": "Remplacer l'alternateur",
    "Replace ball joint": "Remplacer la rotule",
    "Replace battery": "Remplacer la batterie",
    "Replace brake caliper": "Remplacer l'étrier de frein",
    "Replace brake discs": "Remplacer les disques de frein",
    "Replace brake pads": "Remplacer les plaquettes de frein",
    "Replace clutch kit": "Remplacer le kit d'embrayage",
    "Replace fuel injectors": "Remplacer les injecteurs de carburant",
    "Replace head gasket": "Remplacer le joint de culasse",
    "Replace oxygen sensor": "Remplacer la sonde lambda",
    "Replace radiator": "Remplacer le radiateur",
    "Replace shock absorbers": "Remplacer les amortisseurs",
    "Replace spark plugs": "Remplacer les bougies d'allumage",
    "Replace thermostat": "Remplacer le thermostat",
    "Replace timing belt": "Remplacer la courroie de distribution"
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

ensureNested(enLocale, 'ai.options.vehicle_type');
ensureNested(enLocale, 'ai.options.make');
ensureNested(enLocale, 'ai.options.fuel_type');
ensureNested(enLocale, 'ai.options.transmission');
ensureNested(enLocale, 'ai.options.severity');
ensureNested(enLocale, 'ai.options.cause');
ensureNested(enLocale, 'ai.predictions');

ensureNested(frLocale, 'ai.options.vehicle_type');
ensureNested(frLocale, 'ai.options.make');
ensureNested(frLocale, 'ai.options.fuel_type');
ensureNested(frLocale, 'ai.options.transmission');
ensureNested(frLocale, 'ai.options.severity');
ensureNested(frLocale, 'ai.options.cause');
ensureNested(frLocale, 'ai.predictions');

const writeKey = (path, name, enVal, frVal) => {
    let enObj = enLocale;
    let frObj = frLocale;
    const parts = path.split('.');
    for (const p of parts) {
        enObj = enObj[p];
        frObj = frObj[p];
    }
    enObj[name] = enVal;
    frObj[name] = frVal;
};

// Vehicle Type
for (const v of models.vehicle_type) {
    writeKey('ai.options.vehicle_type', v, v.charAt(0).toUpperCase() + v.slice(1), transFr[v]);
}
// Make
for (const m of models.make) {
    writeKey('ai.options.make', m, m, m); // Keeps the same
}
// Fuel Type
for (const f of models.fuel_type) {
    writeKey('ai.options.fuel_type', f, f.charAt(0).toUpperCase() + f.slice(1), transFr[f]);
}
// Transmission
for (const t of models.transmission) {
    writeKey('ai.options.transmission', t, t.charAt(0).toUpperCase() + t.slice(1), transFr[t]);
}
// Severity Level
for (const s of models.severity_level) {
    writeKey('ai.options.severity', s, s.charAt(0).toUpperCase() + s.slice(1), transFr[s]);
}
// Probable Causes
for (const c of models.probable_causes) {
    const safeKey = c.replace(/\s+/g, '_').toLowerCase();
    writeKey('ai.options.cause', safeKey, c, transFr[c]);
}

// Predictions
for (const p of repairs) {
    const safeKey = p.replace(/\s+/g, '_').toLowerCase();
    writeKey('ai.predictions', safeKey, p, transFr[p]);
}

fs.writeFileSync(enPath, JSON.stringify(enLocale, null, 2));
fs.writeFileSync(frPath, JSON.stringify(frLocale, null, 2));

console.log("Translations successfully added for AI models!");
