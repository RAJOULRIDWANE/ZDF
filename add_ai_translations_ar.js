const fs = require('fs');
const path = require('path');

const optionsPath = path.join(__dirname, 'ai-model', 'models', 'options.json');
const models = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));

const repairClassesPath = path.join(__dirname, 'ai-model', 'models', 'repair_classes.json');
const repairs = JSON.parse(fs.readFileSync(repairClassesPath, 'utf8'));

const arPath = path.join(__dirname, 'frontend', 'src', 'locales', 'ar.json');
const arLocale = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const transAr = {
    // fuel_type
    "diesel": "ديزل",
    "hybrid": "هجين",
    "petrol": "بنزين",
    // transmission
    "automatic": "أوتوماتيك",
    "manual": "يدوي",
    // severity_level
    "critical": "حرج",
    "high": "عالي",
    "low": "منخفض",
    "medium": "متوسط",
    // vehicle_type
    "bus": "حافلة",
    "car": "سيارة",
    "moto": "دراجة نارية",
    "truck": "شاحنة",
    // probable_causes
    "AC compressor failure": "عطل في ضاغط التكييف",
    "AC gas leak": "تسرب غاز التكييف",
    "Alternator belt wear": "تآكل حزام المولد",
    "Alternator failure": "عطل في المولد",
    "Ball joint socket failure": "عطل في تجويف المفصلة الكروية",
    "Ball joint wear": "تآكل المفصلة الكروية",
    "Battery cell failure": "عطل في خلية البطارية",
    "Blown head gasket": "تلف في رأس الأسطوانة (جوان كيلاس)",
    "Brake pad degradation": "تدهور تيل الفرامل",
    "Caliper hydraulic leak": "تسرب هيدروليكي في جهاز الفرامل",
    "Clogged fuel injector": "انسداد حاقن الوقود",
    "Clutch pressure plate failure": "عطل في لوحة ضغط القابض",
    "Compressor clutch wear": "تآكل قابض الضاغط",
    "Cracked coolant hose": "تشقق في خرطوم سائل التبريد",
    "Dead battery": "بطارية ميتة",
    "Disc surface wear": "تآكل سطح القرص",
    "Failed O2 sensor": "عطل في مستشعر الأكسجين",
    "Fouled spark plugs": "تلوث شمعات الإشعال",
    "Gearbox bearing wear": "تآكل محمل علبة التروس",
    "Gearbox synchronizer failure": "عطل في مزامن علبة التروس",
    "Injector seal failure": "عطل في ختم الحاقن",
    "Low refrigerant": "انخفاض سائل التبريد",
    "O2 sensor contamination": "تلوث مستشعر الأكسجين",
    "Oil pan seal failure": "عطل في ختم وعاء الزيت",
    "Overheating damage to gasket": "تلف الحشية بسبب الحرارة الزائدة",
    "Radiator corrosion": "تآكل المبرد (رادياتير)",
    "Radiator crack": "تشقق في المبرد",
    "Radiator pinhole leak": "تسرب دقيق في المبرد",
    "Seized caliper": "التصاق جهاز الفرامل",
    "Shock absorber oil leak": "تسرب الزيت من ممتص الصدمات",
    "Spark plug electrode wear": "تآكل قطب شمعة الإشعال",
    "Stuck thermostat": "التصاق منظم الحرارة",
    "Thermostat valve failure": "عطل في صمام منظم الحرارة",
    "Timing belt tensioner failure": "عطل في شداد حزام التوقيت",
    "Timing belt wear": "تآكل حزام التوقيت",
    "Valve cover gasket leak": "تسرب في غطاء الصمام",
    "Warped brake disc": "اعوجاج قرص الفرامل",
    "Worn brake pads": "تآكل تيل الفرامل",
    "Worn clutch disc": "تآكل قرص القابض",
    "Worn shock absorbers": "تآكل ممتصات الصدمات",
    // Predictions
    "Fix coolant leak": "إصلاح تسرب سائل التبريد",
    "Fix oil leak": "إصلاح تسرب الزيت",
    "Refill AC refrigerant": "إعادة تعبئة غاز التكييف",
    "Repair gearbox": "إصلاح علبة التروس",
    "Replace AC compressor": "استبدال ضاغط التكييف",
    "Replace alternator": "استبدال المولد (الدينامو)",
    "Replace ball joint": "استبدال المفصلة الكروية",
    "Replace battery": "استبدال البطارية",
    "Replace brake caliper": "استبدال جهاز الفرامل",
    "Replace brake discs": "استبدال أقراص الفرامل",
    "Replace brake pads": "استبدال تيل الفرامل",
    "Replace clutch kit": "استبدال طقم القابض (الدبرياج)",
    "Replace fuel injectors": "استبدال حاقنات الوقود",
    "Replace head gasket": "استبدال حشية رأس الأسطوانة",
    "Replace oxygen sensor": "استبدال مستشعر الأكسجين",
    "Replace radiator": "استبدال المبرد (الرادياتير)",
    "Replace shock absorbers": "استبدال ممتصات الصدمات",
    "Replace spark plugs": "استبدال شمعات الإشعال",
    "Replace thermostat": "استبدال منظم الحرارة",
    "Replace timing belt": "استبدال حزام التوقيت"
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

ensureNested(arLocale, 'ai.options.vehicle_type');
ensureNested(arLocale, 'ai.options.make');
ensureNested(arLocale, 'ai.options.fuel_type');
ensureNested(arLocale, 'ai.options.transmission');
ensureNested(arLocale, 'ai.options.severity');
ensureNested(arLocale, 'ai.options.cause');
ensureNested(arLocale, 'ai.predictions');

const writeKey = (path, name, val) => {
    let arObj = arLocale;
    const parts = path.split('.');
    for (const p of parts) {
        arObj = arObj[p];
    }
    arObj[name] = val;
};

// Vehicle Type
for (const v of models.vehicle_type) {
    writeKey('ai.options.vehicle_type', v, transAr[v]);
}
// Make
for (const m of models.make) {
    writeKey('ai.options.make', m, m); // Keeps the same
}
// Fuel Type
for (const f of models.fuel_type) {
    writeKey('ai.options.fuel_type', f, transAr[f]);
}
// Transmission
for (const t of models.transmission) {
    writeKey('ai.options.transmission', t, transAr[t]);
}
// Severity Level
for (const s of models.severity_level) {
    writeKey('ai.options.severity', s, transAr[s]);
}
// Probable Causes
for (const c of models.probable_causes) {
    const safeKey = c.replace(/\s+/g, '_').toLowerCase();
    writeKey('ai.options.cause', safeKey, transAr[c]);
}

// Predictions
for (const p of repairs) {
    const safeKey = p.replace(/\s+/g, '_').toLowerCase();
    writeKey('ai.predictions', safeKey, transAr[p]);
}

// Ensure the rest of AI keys are present in Arabic
const basicAiTranslations = {
    "messages.load_options_failed": "فشل تحميل خيارات الذكاء الاصطناعي",
    "messages.prediction_failed": "فشل التوقع",
    "messages.service_unreachable": "لا يمكن الوصول إلى خدمة الذكاء الاصطناعي. تأكد من تشغيل الخادم.",
    "loading_diagnostic": "جاري تحميل تشخيص الذكاء الاصطناعي...",
    "service_unavailable": "خدمة الذكاء الاصطناعي غير متوفرة",
    "hint_flask": "تأكد من تشغيل خادم Flask على المنفذ 5000.",
    "results.diagnosis_complete": "اكتمل تشخيص الذكاء الاصطناعي",
    "results.top_predictions": "أهم توقعات الإصلاح",
    "results.confidence": "نسبة الثقة",
    "results.new_diagnosis": "تشخيص جديد",
    "form.vehicle_information": "معلومات المركبة",
    "form.vehicle_type": "نوع المركبة",
    "form.select": "اختر...",
    "form.model_placeholder": "مثل: كورولا",
    "form.year": "السنة",
    "form.mileage": "المسافة المقطوعة (كم)",
    "form.mileage_placeholder": "مثل: 95000",
    "form.engine_size": "حجم المحرك (cc)",
    "form.engine_size_placeholder": "مثل: 1600",
    "form.fuel_type": "نوع الوقود",
    "form.transmission": "ناقل الحركة",
    "form.severity_level": "مستوى الخطورة",
    "form.symptoms_legend": "الأعراض",
    "form.symptoms_label": "صف الأعراض (افصل بينها بفواصل)",
    "form.symptoms_placeholder": "مثل: ضوضاء المحرك، اهتزاز عند الفرملة...",
    "form.probable_cause_legend": "السبب المحتمل",
    "form.optional": "(اختياري)",
    "form.unknown_cause": "غير معروف / دع الذكاء الاصطناعي يقرر",
    "form.analysing": "جاري التحليل...",
    "form.get_diagnosis": "الحصول على تشخيص الذكاء الاصطناعي"
};

for (const [key, value] of Object.entries(basicAiTranslations)) {
    const parentPath = key.includes('.') ? `ai.${key.split('.').slice(0, -1).join('.')}` : 'ai';
    ensureNested(arLocale, parentPath);
    writeKey(parentPath, key.split('.').pop(), value);
}

fs.writeFileSync(arPath, JSON.stringify(arLocale, null, 2));

console.log("Translations successfully added for AI models in Arabic!");
