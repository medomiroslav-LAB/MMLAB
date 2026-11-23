// =====================================================================
// MM LAB | CENTRÁLNE DATABÁZY A PREDVOLENÉ DÁTA (data.js)
// =====================================================================

const LEGACY_DEFAULT_PRESET_IDS = new Set(['mp-1', 'mp-2', 'mp-3', 'mp-4', 'mp-5', 'mp-6']);

const SET_TECHNIQUES = [
    { id: 'standard', label: 'Klasická séria', badge: '', style: 'bg-dark-800 text-zinc-300 border-zinc-700' },
    { id: 'superset', label: 'Superséria (SS)', badge: 'SUPERSÉRIA', style: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { id: 'dropset', label: 'Drop Set (Zhodená váha)', badge: 'DROP SET', style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'restpause', label: 'Rest-Pause', badge: 'REST-PAUSE', style: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { id: 'myoreps', label: 'Myo-Reps', badge: 'MYO-REPS', style: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
    { id: 'tempo', label: 'Tempo', badge: 'TEMPO', style: 'bg-sky-500/20 text-sky-300 border-sky-500/40' }
];

const EDU_TOPICS = {
    rir: { title: 'Čo znamená RIR (0 až 10)?', body: 'RIR (Reps In Reserve) znamená, koľko opakovaní by si ešte vládal urobiť, keby išlo o život. RIR 2 = nechal si si 2 opakovania v rezerve. RIR 0 = išiel si úplne na doraz.' }
};

const CATEGORIES = [
    { id: 'all', name: 'Všetko' }, { id: 'legs', name: 'Nohy' }, { id: 'chest', name: 'Prsia' },
    { id: 'back', name: 'Chrbát' }, { id: 'shoulders', name: 'Ramená' }, { id: 'biceps', name: 'Biceps' },
    { id: 'triceps', name: 'Triceps' }, { id: 'forearms', name: 'Predlaktie' }, { id: 'calves', name: 'Lýtka' },
    { id: 'abs', name: 'Brucho' }, { id: 'plyo', name: 'Skoky & Čas' }
];

const DEFAULT_EXERCISES = [
    { id: 'ex-1', name: 'Drepy s veľkou činkou (Back Squat)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-64', name: 'Čelné drepy (Front Squat)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-65', name: 'Goblet Squat s jednoručkou / Kettlebellom', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-2', name: 'Hack Squat (stroj)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-3', name: 'Leg Press', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-4', name: 'Rumunský mŕtvy ťah (RDL)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-68', name: 'Mŕtvy ťah na jednej nohe (Single-Leg RDL)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-69', name: 'Klasický mŕtvy ťah (Conventional Deadlift)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-5', name: 'Predkopávanie v sede (Leg Extension)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-6', name: 'Zakopávanie v sede (Seated Leg Curl)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-8', name: 'Bulharské drepy s jednoručkami', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-74', name: 'Výpady v chôdzi (Walking Lunges)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-76', name: 'Výstupy na debnu s kolenom hore', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-9', name: 'Hip Thrust s veľkou činkou', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-11', name: 'Bench Press s veľkou činkou', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-12', name: 'Tlaky s jednoručkami na šikmej lavici (30°)', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-62', name: 'Tlaky s jednoručkami na rovnej lavici', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-13', name: 'Tlaky na prsia na stroji (Chest Press)', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-14', name: 'Peck-Deck (rozpažovanie na stroji)', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-15', name: 'Sťahovanie protismerných kladiek (Cable Fly)', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-16', name: 'Kľuky na bradlách (Dips)', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-17', name: 'Kľuky na zemi (Push-ups)', category: 'chest', defaultMode: 'reps' },
    { id: 'ex-18', name: 'Zhyby na hrazde nadhmatom', category: 'back', defaultMode: 'reps' },
    { id: 'ex-19', name: 'Sťahovanie hornej kladky naširoko', category: 'back', defaultMode: 'reps' },
    { id: 'ex-20', name: 'Príťahy veľkej činky v predklone', category: 'back', defaultMode: 'reps' },
    { id: 'ex-21', name: 'Príťahy spodnej kladky v sede (Seated Row)', category: 'back', defaultMode: 'reps' },
    { id: 'ex-22', name: 'Príťahy jednoručky s oporou o lavicu', category: 'back', defaultMode: 'reps' },
    { id: 'ex-25', name: 'Hyperextenzie na spodný chrbát', category: 'back', defaultMode: 'reps' },
    { id: 'ex-26', name: 'Tlaky nad hlavu v sede s jednoručkami', category: 'shoulders', defaultMode: 'reps' },
    { id: 'ex-27', name: 'Military Press (tlaky v stoji)', category: 'shoulders', defaultMode: 'reps' },
    { id: 'ex-28', name: 'Upažovanie s jednoručkami v stoji', category: 'shoulders', defaultMode: 'reps' },
    { id: 'ex-63', name: 'Príťahy k brade s EZ činkou', category: 'shoulders', defaultMode: 'reps' },
    { id: 'ex-30', name: 'Zapažovanie na zadné delty (Reverse Peck-Deck)', category: 'shoulders', defaultMode: 'reps' },
    { id: 'ex-31', name: 'Face Pulls na hornej kladke s lanom', category: 'shoulders', defaultMode: 'reps' },
    { id: 'ex-32', name: 'Bicepsový zdvih s EZ činkou v stoji', category: 'biceps', defaultMode: 'reps' },
    { id: 'ex-33', name: 'Bicepsový zdvih s jednoručkami', category: 'biceps', defaultMode: 'reps' },
    { id: 'ex-34', name: 'Kladivové zdvihy (Hammer Curls)', category: 'biceps', defaultMode: 'reps' },
    { id: 'ex-38', name: 'Stláčanie hornej kladky s lanom', category: 'triceps', defaultMode: 'reps' },
    { id: 'ex-40', name: 'Francúzsky tlak v ľahu s EZ činkou', category: 'triceps', defaultMode: 'reps' },
    { id: 'ex-41', name: 'Extenzie nad hlavou s lanom na kladke', category: 'triceps', defaultMode: 'reps' },
    { id: 'ex-45', name: 'Vis na hrazde na čas (Dead Hang)', category: 'forearms', defaultMode: 'time' },
    { id: 'ex-46', name: 'Farmárska chôdza (Farmer Walk)', category: 'forearms', defaultMode: 'time' },
    { id: 'ex-47', name: 'Výpony na lýtka v stoji', category: 'calves', defaultMode: 'reps' },
    { id: 'ex-48', name: 'Výpony na lýtka v sede (Soleus)', category: 'calves', defaultMode: 'reps' },
    { id: 'ex-119', name: 'Bent-Knee Calf Raise', category: 'calves', defaultMode: 'reps' },
    { id: 'ex-121', name: 'Tibialis Raise (prevencia píšťal)', category: 'calves', defaultMode: 'reps' },
    { id: 'ex-50', name: 'Plank (doska na predlaktiach)', category: 'abs', defaultMode: 'time' },
    { id: 'ex-51', name: 'Bočný Plank (Side Plank)', category: 'abs', defaultMode: 'time' },
    { id: 'ex-124', name: 'Dead Bug (stabilita drieku)', category: 'abs', defaultMode: 'reps' },
    { id: 'ex-126', name: 'Pallof Press na kladke', category: 'abs', defaultMode: 'reps' },
    { id: 'ex-53', name: 'Skracovačky na hornej kladke', category: 'abs', defaultMode: 'reps' },
    { id: 'ex-54', name: 'Prednožovanie vo vise na hrazde', category: 'abs', defaultMode: 'reps' },
    { id: 'ex-56', name: 'Pogo Jumps (odrazy cez členky)', category: 'plyo', defaultMode: 'time' },
    { id: 'ex-57', name: 'Skákanie cez švihadlo', category: 'plyo', defaultMode: 'time' },
    { id: 'ex-58', name: 'Výskoky na debnu (Box Jumps)', category: 'plyo', defaultMode: 'reps' },
    { id: 'ex-135', name: 'Skater Jumps (bočné odrazy)', category: 'plyo', defaultMode: 'time' },
    { id: 'ex-138', name: 'Kettlebell Swing', category: 'plyo', defaultMode: 'reps' }
,
    { id: 'ex-140', name: 'Abdukcia v sede na stroji (roznožovanie)', category: 'legs', defaultMode: 'reps' },
    { id: 'ex-141', name: 'Zanožovanie na spodnej kladke (Cable Glute Kickback)', category: 'legs', defaultMode: 'reps' },
];

const DEFAULT_SPLITS = [
    { id: 'split-fullbody-beginner', name: 'FULLBODY A – Základná sila', tag: 'Fullbody', blocks: [{ type: 'single', exerciseId: 'ex-65', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-13', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-19', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-4', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-26', sets: 2, technique: 'standard' }, { type: 'single', exerciseId: 'ex-50', sets: 3, technique: 'standard' }] },
    { id: 'split-fullbody-b', name: 'FULLBODY B – Variácia & Stred tela', tag: 'Fullbody', blocks: [{ type: 'single', exerciseId: 'ex-3', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-12', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-21', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-8', sets: 3, technique: 'standard' }, { type: 'superset', exerciseId: 'ex-28', exerciseId2: 'ex-33', sets: 3, technique: 'superset' }, { type: 'single', exerciseId: 'ex-124', sets: 3, technique: 'standard' }] },
    { id: 'split-glutes-a', name: 'GLUTES & ZADOK A – Guľatý zadok & Sila', tag: 'Zadok / Pre ženy', blocks: [{ type: 'single', exerciseId: 'ex-9', sets: 4, technique: 'standard' }, { type: 'single', exerciseId: 'ex-4', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-8', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-6', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-140', sets: 3, technique: 'dropset' }] },
    { id: 'split-glutes-b', name: 'GLUTES & ZADOK B – Tvarovanie & Izolácia', tag: 'Zadok / Pre ženy', blocks: [{ type: 'single', exerciseId: 'ex-3', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-68', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-76', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-141', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-50', sets: 3, technique: 'standard' }] },
    { id: 'split-women-fullbody', name: 'ŽENSKÉ FULLBODY – Pevný zadok & Tónovaný vrch', tag: 'Zadok / Pre ženy', blocks: [{ type: 'single', exerciseId: 'ex-9', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-65', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-19', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-12', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-28', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-124', sets: 3, technique: 'standard' }] },
    { id: 'split-home-glutes', name: 'DOMÁCI ZADOK & BRUCHO – Bez fitka (25 min)', tag: 'Zadok / Pre ženy', blocks: [{ type: 'single', exerciseId: 'ex-8', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-74', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-9', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-17', sets: 2, technique: 'standard' }, { type: 'superset', exerciseId: 'ex-50', exerciseId2: 'ex-51', sets: 3, technique: 'superset' }] },
    { id: 'split-ul-upper-a', name: 'UPPER A – Vrch tela (Ťažký)', tag: 'Upper / Lower', blocks: [{ type: 'single', exerciseId: 'ex-11', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-20', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-26', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-19', sets: 3, technique: 'standard' }, { type: 'superset', exerciseId: 'ex-32', exerciseId2: 'ex-38', sets: 3, technique: 'superset' }] },
    { id: 'split-ul-lower-a', name: 'LOWER A – Spodok tela (Drepy)', tag: 'Upper / Lower', blocks: [{ type: 'single', exerciseId: 'ex-1', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-4', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-5', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-47', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-50', sets: 3, technique: 'standard' }] },
    { id: 'split-ul-upper-b', name: 'UPPER B – Vrch tela (Hypertrofia)', tag: 'Upper / Lower', blocks: [{ type: 'single', exerciseId: 'ex-12', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-21', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-28', sets: 3, technique: 'dropset' }, { type: 'single', exerciseId: 'ex-31', sets: 3, technique: 'standard' }, { type: 'superset', exerciseId: 'ex-34', exerciseId2: 'ex-41', sets: 3, technique: 'superset' }] },
    { id: 'split-ul-lower-b', name: 'LOWER B – Spodok tela (Zadný reťazec)', tag: 'Upper / Lower', blocks: [{ type: 'single', exerciseId: 'ex-69', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-8', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-6', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-48', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-126', sets: 3, technique: 'standard' }] },
    { id: 'split-push-mirome', name: 'PUSH – Prsia, Ramená & Triceps', tag: 'PPL', blocks: [{ type: 'single', exerciseId: 'ex-12', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-62', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-14', sets: 3, technique: 'dropset' }, { type: 'single', exerciseId: 'ex-26', sets: 3, technique: 'standard' }, { type: 'superset', exerciseId: 'ex-28', exerciseId2: 'ex-63', sets: 3, technique: 'superset' }, { type: 'superset', exerciseId: 'ex-38', exerciseId2: 'ex-40', sets: 3, technique: 'superset' }] },
    { id: 'split-pull-mirome', name: 'PULL – Chrbát & Biceps', tag: 'PPL', blocks: [{ type: 'single', exerciseId: 'ex-18', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-21', sets: 3, technique: 'restpause' }, { type: 'single', exerciseId: 'ex-22', sets: 3, technique: 'standard' }, { type: 'superset', exerciseId: 'ex-31', exerciseId2: 'ex-32', sets: 3, technique: 'superset' }, { type: 'single', exerciseId: 'ex-34', sets: 3, technique: 'dropset' }] },
    { id: 'split-legs-mirome', name: 'LEGS & CORE – Nohy & Brucho', tag: 'PPL', blocks: [{ type: 'single', exerciseId: 'ex-1', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-4', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-3', sets: 3, technique: 'restpause' }, { type: 'superset', exerciseId: 'ex-5', exerciseId2: 'ex-6', sets: 3, technique: 'superset' }, { type: 'single', exerciseId: 'ex-47', sets: 4, technique: 'dropset' }, { type: 'single', exerciseId: 'ex-50', sets: 3, technique: 'standard' }] },
    { id: 'split-runners-strength', name: 'BEŽCI A – Sila & Stabilita', tag: 'Atletika', blocks: [{ type: 'single', exerciseId: 'ex-65', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-68', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-8', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-47', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-51', sets: 3, technique: 'standard' }] },
    { id: 'split-runners-explosive', name: 'BEŽCI B – Dynamika & Prevencia', tag: 'Atletika', blocks: [{ type: 'single', exerciseId: 'ex-56', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-135', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-68', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-76', sets: 3, technique: 'standard' }, { type: 'superset', exerciseId: 'ex-119', exerciseId2: 'ex-121', sets: 3, technique: 'superset' }, { type: 'single', exerciseId: 'ex-126', sets: 3, technique: 'standard' }] },
    { id: 'split-home-fullbody', name: 'DOMÁCE FULLBODY – Vlastná váha / Jednoručky', tag: 'Doma', blocks: [{ type: 'single', exerciseId: 'ex-65', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-17', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-74', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-22', sets: 3, technique: 'standard' }, { type: 'single', exerciseId: 'ex-50', sets: 3, technique: 'standard' }] }
];

const SUPP_CATEGORIES = [
    { id: 'all', name: 'Všetko' }, { id: 'vitamins', name: 'Vitamíny' }, { id: 'minerals', name: 'Minerály' },
    { id: 'with_meal_group', name: 'S jedlom' }, { id: 'amino', name: 'Aminokyseliny' }, { id: 'preworkout', name: 'Predtréningovky' },
    { id: 'performance', name: 'Sila & Výkon' }, { id: 'joints', name: 'Kĺby & Trávenie' }, { id: 'adaptogens', name: 'Adaptogény' }, { id: 'sleep', name: 'Spánok' }
];

const TIMING_SLOTS = {
    morning_empty: { title: 'Ráno nalačno', subtitle: 'Po prebudení s čistou vodou', badge: 'Ráno', color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' },
    with_meal: { title: 'S jedlom (raňajky / obed)', subtitle: 'Látky rozpustné v tukoch k jedlu', badge: 'S jedlom', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    pre_workout: { title: 'Pred tréningom (20–45 min)', subtitle: 'Prekrvenie, sila a fokus', badge: 'Pred tréningom', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
    post_workout: { title: 'Po tréningu / Cez deň', subtitle: 'Regenerácia svalov a ATP', badge: 'Po tréningu', color: 'text-brand-400 bg-brand-500/15 border-brand-500/30' },
    evening: { title: 'Večer / Pred spaním', subtitle: 'Upokojenie a regenerácia', badge: 'Večer', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' }
};

const DEFAULT_SUPPLEMENTS = [
    { id: 'supp-vit-c', name: 'Vitamín C', category: 'vitamins', timingSlot: 'morning_empty', whenText: 'Ráno nalačno alebo s jedlom', withWhat: 'So Železom a Kolagénom.', dosage: '500 – 1 000 mg', benefit: 'Imunita, antioxidant a tvorba kolagénu v šľachách.' },
    { id: 'supp-vit-d3k2', name: 'Vitamín D3 + K2 (MK-7)', category: 'vitamins', timingSlot: 'with_meal', whenText: 'Ráno alebo na obed s jedlom s tukmi', withWhat: 'S jedlom obsahujúcim tuky a s Horčíkom.', dosage: '2 000 – 5 000 IU D3 + 100 mcg K2', benefit: 'Imunita, svalová sila a smerovanie vápnika do kostí.' },
    { id: 'supp-bcomplex', name: 'B-Komplex (aktívne formy)', category: 'vitamins', timingSlot: 'with_meal', whenText: 'Ráno s raňajkami', withWhat: 'S raňajkami.', dosage: '1 kapsula', benefit: 'Premena potravy na energiu a nervová sústava.' },
    { id: 'supp-magnesium-bisglycinate', name: 'Horčík Bisglycinát', category: 'minerals', timingSlot: 'evening', whenText: 'Večer 30–60 min pred spaním', withWhat: 'S L-Theanínom alebo Ashwagandhou.', dosage: '200 – 400 mg', benefit: 'Uvoľňuje svaly po tréningu a prehlbuje spánok.' },
    { id: 'supp-magnesium-malate', name: 'Horčík Malát', category: 'minerals', timingSlot: 'morning_empty', whenText: 'Ráno nalačno alebo s raňajkami', withWhat: 'S B-Komplexom.', dosage: '150 – 300 mg', benefit: 'Podporuje bunkovú energiu ATP cez deň.' },
    { id: 'supp-zinc', name: 'Zinok Bisglycinát (+ Meď)', category: 'minerals', timingSlot: 'with_meal', whenText: 'S obedom alebo večerou', withWhat: 'S jedlom (nie nalačno).', dosage: '15 – 25 mg', benefit: 'Imunita, hormóny a regenerácia tkanív.' },
    { id: 'supp-creatine', name: 'Kreatín Monohydrát', category: 'performance', timingSlot: 'post_workout', whenText: 'Po tréningu alebo kedykoľvek denne', withWhat: 'S vodou a jedlom.', dosage: '5 g denne', benefit: 'Zvyšuje silu, výbušnosť, objem svalov a regeneráciu ATP.' },
    { id: 'supp-whey', name: 'Srvátkový proteín (Whey)', category: 'performance', timingSlot: 'post_workout', whenText: 'Po tréningu alebo na doplnenie bielkovín', withWhat: 'S vodou, mliekom alebo do kaše.', dosage: '25 – 35 g', benefit: 'Rýchly zdroj kvalitných bielkovín pre svaly.' },
    { id: 'supp-citrulline', name: 'L-Citrulín Malát (2:1)', category: 'preworkout', timingSlot: 'pre_workout', whenText: '20–30 min pred tréningom', withWhat: 'S vodou a elektrolytmi.', dosage: '6 – 8 g', benefit: 'Lepšie prekrvenie svalov a oddialenie únavy.' },
    { id: 'supp-electrolytes', name: 'Elektrolyty (Na, K, Mg)', category: 'performance', timingSlot: 'pre_workout', whenText: 'Ráno alebo počas tréningu', withWhat: 'V 500 ml vody.', dosage: '1 dávka', benefit: 'Hydratácia a prevencia svalových kŕčov.' },
    { id: 'supp-omega3', name: 'Omega-3 (EPA & DHA)', category: 'performance', timingSlot: 'with_meal', whenText: 'S jedlom obsahujúcim tuky', withWhat: 'S Vitamínom D3+K2.', dosage: '2 000 – 3 000 mg EPA+DHA', benefit: 'Protizápalový účinok, srdce, mozog a kĺby.' },
    { id: 'supp-joints', name: 'Kĺbová výživa (Kolagén + MSM)', category: 'joints', timingSlot: 'morning_empty', whenText: 'Ráno nalačno alebo s jedlom', withWhat: 'S Vitamínom C.', dosage: '10–15 g kolagénu', benefit: 'Výživa chrupaviek, šliach a väzov.' },
    { id: 'supp-cordyceps', name: 'Cordyceps CS-4', category: 'adaptogens', timingSlot: 'pre_workout', whenText: '30–45 min pred tréningom / behom', withWhat: 'S vodou.', dosage: '1 000 – 1 500 mg', benefit: 'Lepšie využitie kyslíka a vytrvalosť.' },
    { id: 'supp-ashwagandha', name: 'Ashwagandha KSM-66', category: 'adaptogens', timingSlot: 'evening', whenText: 'Večer s jedlom', withWhat: 'S Horčíkom.', dosage: '300 – 600 mg', benefit: 'Znižuje stresový kortizol a zlepšuje spánok.' },
    { id: 'supp-theanine', name: 'L-Theanín', category: 'sleep', timingSlot: 'evening', whenText: 'Večer pred spaním', withWhat: 'S Horčíkom.', dosage: '200 – 400 mg', benefit: 'Upokojenie mysle pred spaním.' }
];

const FOOD_CATEGORIES = [
    { id: 'all', name: 'Všetko' }, { id: 'scanned', name: 'Naskenované (EAN)' },
    { id: 'protein', name: 'Bielkoviny' }, { id: 'carbs', name: 'Sacharidy' },
    { id: 'fats', name: 'Tuky' }, { id: 'produce', name: 'Ovocie & Zelenina' }
];

const BASE_FOOD_DATABASE = [
    { id: 'f-chicken', name: 'Kuracie prsia (surové)', cat: 'protein', p: 23, c: 0, f: 1.5, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-chicken-thigh', name: 'Kuracie stehná bez kože', cat: 'protein', p: 19.5, c: 0, f: 8, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-turkey', name: 'Morčacie prsia (surové)', cat: 'protein', p: 24, c: 0, f: 1.2, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-beef-lean', name: 'Hovädzie zadné chudé', cat: 'protein', p: 21, c: 0, f: 5, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-beef-mince', name: 'Mleté hovädzie (10 % tuku)', cat: 'protein', p: 20, c: 0, f: 10, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-ham-chicken', name: 'Kuracia / Morčacia šunka 95 %', cat: 'protein', p: 19, c: 1, f: 2, unit: 'g', unitGrams: 1, defaultQty: 60 },
    { id: 'f-salmon', name: 'Losos čerstvý', cat: 'protein', p: 20, c: 0, f: 13, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-tuna', name: 'Tuniak vo vlastnej šťave', cat: 'protein', p: 25, c: 0, f: 1, unit: 'g', unitGrams: 1, defaultQty: 100 },
    { id: 'f-eggs', name: 'Vajcia celé (1 ks ≈ 60 g)', cat: 'protein', p: 12.5, c: 1, f: 10.5, unit: 'ks', unitGrams: 60, defaultQty: 3 },
    { id: 'f-eggwhites', name: 'Vaječné bielky tekuté', cat: 'protein', p: 11, c: 0.7, f: 0.2, unit: 'ml', unitGrams: 1, defaultQty: 150 },
    { id: 'f-milk', name: 'Mlieko polotučné 1,5 %', cat: 'protein', p: 3.3, c: 4.8, f: 1.5, unit: 'ml', unitGrams: 1, defaultQty: 200 },
    { id: 'f-kefir', name: 'Kefír / Acidko biele', cat: 'protein', p: 3.4, c: 4.5, f: 1.5, unit: 'ml', unitGrams: 1, defaultQty: 250 },
    { id: 'f-curd-low', name: 'Tvaroh jemný 0,5 %', cat: 'protein', p: 12, c: 4, f: 0.5, unit: 'g', unitGrams: 1, defaultQty: 125 },
    { id: 'f-skyr', name: 'Skyr / Grécky jogurt 0 %', cat: 'protein', p: 10.5, c: 4, f: 0.2, unit: 'g', unitGrams: 1, defaultQty: 140 },
    { id: 'f-greek5', name: 'Grécky jogurt 5 %', cat: 'protein', p: 9, c: 3.8, f: 5, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-cottage', name: 'Cottage Cheese biely', cat: 'protein', p: 12, c: 3, f: 4.5, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-mozzarella-light', name: 'Mozzarella Light', cat: 'protein', p: 19, c: 1.5, f: 9, unit: 'g', unitGrams: 1, defaultQty: 60 },
    { id: 'f-eidam30', name: 'Syr Eidam 30 %', cat: 'protein', p: 27, c: 1.5, f: 16, unit: 'g', unitGrams: 1, defaultQty: 40 },
    { id: 'f-whey', name: 'Srvátkový proteín (1 odm. ≈ 30 g)', cat: 'protein', p: 78, c: 6, f: 5, unit: 'ks', unitGrams: 30, defaultQty: 1 },
    { id: 'f-rice', name: 'Ryža basmati / jazmínová (surová)', cat: 'carbs', p: 7.5, c: 78, f: 0.6, unit: 'g', unitGrams: 1, defaultQty: 80 },
    { id: 'f-rice-cooked', name: 'Ryža varená', cat: 'carbs', p: 2.7, c: 28, f: 0.3, unit: 'g', unitGrams: 1, defaultQty: 200 },
    { id: 'f-oats', name: 'Ovsené vločky', cat: 'carbs', p: 13, c: 60, f: 7, unit: 'g', unitGrams: 1, defaultQty: 60 },
    { id: 'f-potatoes', name: 'Zemiaky (surové)', cat: 'carbs', p: 2, c: 17, f: 0.1, unit: 'g', unitGrams: 1, defaultQty: 250 },
    { id: 'f-sweetpotato', name: 'Bataty', cat: 'carbs', p: 1.6, c: 20, f: 0.1, unit: 'g', unitGrams: 1, defaultQty: 250 },
    { id: 'f-pasta', name: 'Cestoviny (surové)', cat: 'carbs', p: 12.5, c: 72, f: 1.5, unit: 'g', unitGrams: 1, defaultQty: 80 },
    { id: 'f-bread', name: 'Kváskový / celozrnný chlieb', cat: 'carbs', p: 8.5, c: 46, f: 2, unit: 'g', unitGrams: 1, defaultQty: 70 },
    { id: 'f-kaiserka', name: 'Kaiserka / Rožok (1 ks ≈ 50 g)', cat: 'carbs', p: 9, c: 56, f: 2.5, unit: 'ks', unitGrams: 50, defaultQty: 1 },
    { id: 'f-tortilla', name: 'Tortilla pšeničná (1 ks ≈ 60 g)', cat: 'carbs', p: 8, c: 52, f: 7, unit: 'ks', unitGrams: 60, defaultQty: 1 },
    { id: 'f-honey', name: 'Med', cat: 'carbs', p: 0.3, c: 82, f: 0, unit: 'g', unitGrams: 1, defaultQty: 15 },
    { id: 'f-oliveoil', name: 'Olivový olej', cat: 'fats', p: 0, c: 0, f: 100, unit: 'ml', unitGrams: 1, defaultQty: 10 },
    { id: 'f-butter', name: 'Maslo 82 % / Ghee', cat: 'fats', p: 0.7, c: 0.6, f: 82, unit: 'g', unitGrams: 1, defaultQty: 15 },
    { id: 'f-avocado', name: 'Avokádo', cat: 'fats', p: 2, c: 8.5, f: 15, unit: 'g', unitGrams: 1, defaultQty: 70 },
    { id: 'f-almonds', name: 'Mandle / Orechy', cat: 'fats', p: 21, c: 10, f: 50, unit: 'g', unitGrams: 1, defaultQty: 25 },
    { id: 'f-peanutbutter', name: 'Arašidové maslo 100 %', cat: 'fats', p: 25, c: 16, f: 50, unit: 'g', unitGrams: 1, defaultQty: 20 },
    { id: 'f-banana', name: 'Banán (1 ks ≈ 120 g)', cat: 'produce', p: 1.1, c: 23, f: 0.3, unit: 'ks', unitGrams: 120, defaultQty: 1 },
    { id: 'f-apple', name: 'Jablko (1 ks ≈ 150 g)', cat: 'produce', p: 0.3, c: 14, f: 0.2, unit: 'ks', unitGrams: 150, defaultQty: 1 },
    { id: 'f-berries', name: 'Čučoriedky / Maliny / Jahody', cat: 'produce', p: 1, c: 12, f: 0.4, unit: 'g', unitGrams: 1, defaultQty: 100 },
    { id: 'f-broccoli', name: 'Brokolica', cat: 'produce', p: 2.8, c: 6.5, f: 0.4, unit: 'g', unitGrams: 1, defaultQty: 150 },
    { id: 'f-veggies', name: 'Miešaná zelenina (šalát)', cat: 'produce', p: 1.2, c: 4.5, f: 0.2, unit: 'g', unitGrams: 1, defaultQty: 150 }
];

const MEAL_SLOTS = [
    { id: 'breakfast', name: 'Raňajky' },
    { id: 'snack1', name: 'Desiata' },
    { id: 'lunch', name: 'Obed' },
    { id: 'snack2', name: 'Olovrant' },
    { id: 'dinner', name: 'Večera' }
];

const SLOVAK_SAMPLE_MEALS = [
    { id: 'sm-1', slot: 'breakfast', title: 'Praženica na masle s kváskovým chlebom a šunkou', items: [{ foodId: 'f-eggs', qty: 3, unit: 'ks' }, { foodId: 'f-ham-chicken', qty: 50, unit: 'g' }, { foodId: 'f-bread', qty: 70, unit: 'g' }, { foodId: 'f-butter', qty: 8, unit: 'g' }, { foodId: 'f-veggies', qty: 100, unit: 'g' }] },
    { id: 'sm-2', slot: 'breakfast', title: 'Ovsená kaša s proteínom, banánom a arašidovým maslom', items: [{ foodId: 'f-oats', qty: 65, unit: 'g' }, { foodId: 'f-whey', qty: 1, unit: 'ks' }, { foodId: 'f-milk', qty: 200, unit: 'ml' }, { foodId: 'f-banana', qty: 1, unit: 'ks' }, { foodId: 'f-peanutbutter', qty: 15, unit: 'g' }] },
    { id: 'sm-3', slot: 'snack1', title: 'Jemný tvaroh / Skyr s medom, čučoriedkami a mandľami', items: [{ foodId: 'f-curd-low', qty: 200, unit: 'g' }, { foodId: 'f-berries', qty: 100, unit: 'g' }, { foodId: 'f-honey', qty: 15, unit: 'g' }, { foodId: 'f-almonds', qty: 15, unit: 'g' }] },
    { id: 'sm-4', slot: 'snack2', title: 'Cottage cheese s kaiserkou, šunkou a zeleninou', items: [{ foodId: 'f-cottage', qty: 180, unit: 'g' }, { foodId: 'f-kaiserka', qty: 1, unit: 'ks' }, { foodId: 'f-ham-chicken', qty: 50, unit: 'g' }, { foodId: 'f-veggies', qty: 120, unit: 'g' }] },
    { id: 'sm-5', slot: 'lunch', title: 'Kuracie prsia s ryžou basmati, brokolicou a olivovým olejom', items: [{ foodId: 'f-chicken', qty: 170, unit: 'g' }, { foodId: 'f-rice', qty: 85, unit: 'g' }, { foodId: 'f-broccoli', qty: 150, unit: 'g' }, { foodId: 'f-oliveoil', qty: 10, unit: 'ml' }] },
    { id: 'sm-6', slot: 'lunch', title: 'Hovädzie zadné s cestovinami a zeleninovým šalátom', items: [{ foodId: 'f-beef-lean', qty: 160, unit: 'g' }, { foodId: 'f-pasta', qty: 85, unit: 'g' }, { foodId: 'f-veggies', qty: 150, unit: 'g' }, { foodId: 'f-oliveoil', qty: 8, unit: 'ml' }] },
    { id: 'sm-7', slot: 'lunch', title: 'Losos so zemiakmi a miešaným šalátom', items: [{ foodId: 'f-salmon', qty: 160, unit: 'g' }, { foodId: 'f-potatoes', qty: 280, unit: 'g' }, { foodId: 'f-veggies', qty: 150, unit: 'g' }] },
    { id: 'sm-8', slot: 'dinner', title: 'Tortilla wrap s kuracím mäsom, mozzarellou a zeleninou', items: [{ foodId: 'f-tortilla', qty: 1, unit: 'ks' }, { foodId: 'f-chicken', qty: 140, unit: 'g' }, { foodId: 'f-mozzarella-light', qty: 50, unit: 'g' }, { foodId: 'f-veggies', qty: 120, unit: 'g' }] },
    { id: 'sm-9', slot: 'dinner', title: 'Tuniak vo vlastnej šťave s kaiserkou, avokádom a šalátom', items: [{ foodId: 'f-tuna', qty: 130, unit: 'g' }, { foodId: 'f-kaiserka', qty: 1, unit: 'ks' }, { foodId: 'f-avocado', qty: 60, unit: 'g' }, { foodId: 'f-veggies', qty: 150, unit: 'g' }] }
];

const SLOVAK_SAMPLE_DAYS = [
    { id: 'sd-1600', title: 'Vzorový deň ~1 650 kcal (Chudnutie)', mealIds: ['sm-1', 'sm-3', 'sm-5', 'sm-9'] },
    { id: 'sd-2100', title: 'Vzorový deň ~2 150 kcal (Udržanie / Aktívny)', mealIds: ['sm-2', 'sm-3', 'sm-5', 'sm-8'] },
    { id: 'sd-2600', title: 'Vzorový deň ~2 600 kcal (Šport / Muži)', mealIds: ['sm-2', 'sm-4', 'sm-6', 'sm-3', 'sm-8'] },
    { id: 'sd-3000', title: 'Vzorový deň ~3 050 kcal (Naberanie svalov)', mealIds: ['sm-2', 'sm-4', 'sm-7', 'sm-3', 'sm-6'] }
];

const DAY_TYPE_LABELS = { training: 'Tréningový deň', run: 'Beh / Kondícia', rest: 'Oddychový deň' };

const MEASURE_GUIDES = {
    all: 'Meraj vždy ráno nalačno: <strong>Pás</strong> cez pupok (uvoľnené brucho), <strong>Boky</strong> v najširšom mieste, <strong>Hrudník</strong> cez bradavky po výdychu, <strong>Stehno</strong> 15 cm nad kolenom, <strong>Ruka</strong> v strede bicepsu.'
};
