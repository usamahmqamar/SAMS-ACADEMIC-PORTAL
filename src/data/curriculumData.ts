export interface WeeklyMilestone {
  week: number;
  topic: string;
  objectives: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  completedDate?: string;
}

export interface LessonPlanDraft {
  id: string;
  classId: string;
  subject: string;
  week: number;
  title: string;
  objectives: string;
  materials: string;
  procedureIntro: string;
  procedurePractice: string;
  procedureActivity: string;
  procedureEvaluation: string;
  homework: string;
  teacherId: string;
  teacherName: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision Needed';
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const defaultChecklists: Record<string, WeeklyMilestone[]> = {
  "Primary Mathematics": [
    { week: 1, topic: "Numbers & Place Values", objectives: "Read & write numbers up to 1,000,000; expanded notation mastery.", status: "Completed", completedDate: "2026-06-05" },
    { week: 2, topic: "Basic Operations (Addition/Subtraction)", objectives: "Perform mental additions of large digit sets & composite addition strategies.", status: "Completed", completedDate: "2026-06-12" },
    { week: 3, topic: "Long Multiplication & Division", objectives: "Solve 3-digit multiplication & single-digit divisor divisions step-by-step.", status: "Completed", completedDate: "2026-06-19" },
    { week: 4, topic: "Fractions Introduction", objectives: "Identify numerator/denominator, add fractions with like denominators.", status: "Completed", completedDate: "2026-06-26" },
    { week: 5, topic: "Mixed Fractions & Conversions", objectives: "Convert improper fractions to mixed numbers, and order fraction lists.", status: "In Progress" },
    { week: 6, topic: "Decimals & Percentages", objectives: "Relate decimals to fractions, write basic percentages from shapes.", status: "Not Started" },
    { week: 7, topic: "Ratios & Simple Proportions", objectives: "Solve scaling problems, map calculations, and identify equivalence.", status: "Not Started" },
    { week: 8, topic: "Introduction to Algebra Variables", objectives: "Solve simple single-variable expressions like x + 5 = 12.", status: "Not Started" },
    { week: 9, topic: "Calculations of Area & Perimeter", objectives: "Formulate area for triangles & composite squares with correct units.", status: "Not Started" },
    { week: 10, topic: "Term Review & Examination Practice", objectives: "Comprehensive assessment covering all 9 weeks of course material.", status: "Not Started" }
  ],
  "Junior Secondary Science": [
    { week: 1, topic: "Scientific Method & Laboratory Rules", objectives: "Formulate hypotheses, identify variables, list core safety symbols.", status: "Completed", completedDate: "2026-06-04" },
    { week: 2, topic: "Living Things & Environments", objectives: "Identify 7 characteristics of life, distinguish biotic & abiotic components.", status: "Completed", completedDate: "2026-06-11" },
    { week: 3, topic: "Cell Structures & Functions", objectives: "Map differences between plant and animal cells under virtual slides.", status: "Completed", completedDate: "2026-06-18" },
    { week: 4, topic: "Structure of Matter & Atoms", objectives: "Define atomic components (protons, electrons), read hydrogen to oxygen on Periodic Table.", status: "Completed", completedDate: "2026-06-25" },
    { week: 5, topic: "Physical vs Chemical Changes", objectives: "Observe combustion, rust, and dilution, and write evidence of reaction.", status: "In Progress" },
    { week: 6, topic: "Forces & Movement Mechanics", objectives: "Calculate gravity weight, study friction, and map velocity vectors.", status: "Not Started" },
    { week: 7, topic: "Forms of Energy & Conservation", objectives: "Track mechanical kinetic to potential transformations with math grids.", status: "Not Started" },
    { week: 8, topic: "Human Digestive & Excretory System", objectives: "Draw digestion channels, name gastric acids, track intake path.", status: "Not Started" },
    { week: 9, topic: "Atmosphere, Ecosystems & Pollution", objectives: "Detail greenhouse gases, evaluate waste effects in town water basins.", status: "Not Started" },
    { week: 10, topic: "Comprehensive Review & Practical Assessments", objectives: "Synthesize terms, evaluate lab files, complete final mock quiz.", status: "Not Started" }
  ],
  "Nursery Literacy": [
    { week: 1, topic: "Phonics & Sounding A-E", objectives: "Acknowledge phonemes for A, B, C, D, E with visual objects.", status: "Completed", completedDate: "2026-06-03" },
    { week: 2, topic: "Phonics & Sounding F-J", objectives: "Articulate sound blends F, G, H, I, J using animal cards.", status: "Completed", completedDate: "2026-06-10" },
    { week: 3, topic: "Tracing & Finger Control Exercises", objectives: "Trace circular, straight vertical, and horizontal pencil lines.", status: "Completed", completedDate: "2026-06-17" },
    { week: 4, topic: "Tracing Upper Case Letters A-F", objectives: "Follow dotted lines to write letters A to F with pencil grips.", status: "Completed", completedDate: "2026-06-24" },
    { week: 5, topic: "Word Association Matching Games", objectives: "Match visual objects (cat, sun, book) to beginning letter-sounds.", status: "In Progress" },
    { week: 6, topic: "CVC Words Building (3 Letters)", objectives: "Sound out simple three-letter sets like C-A-T, P-I-N, H-E-N.", status: "Not Started" },
    { week: 7, topic: "Basic Sight Words Familiarity", objectives: "Recall words: 'the', 'is', 'am', 'on', 'she' instantly.", status: "Not Started" },
    { week: 8, topic: "Tracing Upper Case Letters G-L", objectives: "Practice strokes for letters G to L on double-ruled charts.", status: "Not Started" },
    { week: 9, topic: "Short Story Comprehension & Auditory Games", objectives: "Identify active characters in 5-sentence audio stories.", status: "Not Started" },
    { week: 10, topic: "Graduation Plays & Recitation Parade", objectives: "Alphabet songs rehearsal, choral letter games, class performance.", status: "Not Started" }
  ],
  "Basic English & Grammar": [
    { week: 1, topic: "Nouns: Common and Proper Nouns", objectives: "Identify naming words for persons, places, animals, and things.", status: "Completed", completedDate: "2026-06-03" },
    { week: 2, topic: "Pronouns and Antecedents", objectives: "Replace nouns with personal pronouns (he, she, it, they).", status: "Completed", completedDate: "2026-06-10" },
    { week: 3, topic: "Adjectives & Descriptive Words", objectives: "Use color, size, and shape adjectives in descriptive phrases.", status: "Completed", completedDate: "2026-06-17" },
    { week: 4, topic: "Articles (A, An, The)", objectives: "Apply indefinite and definite articles before consonant and vowel sounds.", status: "Completed", completedDate: "2026-06-24" },
    { week: 5, topic: "Parts of Speech: Action Verbs & Past Tense", objectives: "Distinguish present actions from regular and irregular past tense forms.", status: "In Progress" },
    { week: 6, topic: "Adverbs of Manner and Time", objectives: "Explain how actions are done using -ly adverbs and time markers.", status: "Not Started" },
    { week: 7, topic: "Prepositions of Place and Direction", objectives: "Use in, on, under, between, behind in situational sentences.", status: "Not Started" },
    { week: 8, topic: "Conjunctions (And, But, Because)", objectives: "Join two independent clauses with coordinating conjunctions.", status: "Not Started" },
    { week: 9, topic: "Punctuation & Capitalization Rules", objectives: "Apply full stops, question marks, exclamation marks, and commas.", status: "Not Started" },
    { week: 10, topic: "Term Review & Creative Composition", objectives: "Write a 3-paragraph narrative essay using learned grammar rules.", status: "Not Started" }
  ],
  "Islamic Studies": [
    { week: 1, topic: "Surah Al-Fatihah Recitation & Tajweed", objectives: "Recite with correct makharij and understand foundational meanings.", status: "Completed", completedDate: "2026-06-02" },
    { week: 2, topic: "Pillars of Islam (Arkan al-Islam)", objectives: "List and explain the significance of the 5 Pillars of Islam.", status: "Completed", completedDate: "2026-06-09" },
    { week: 3, topic: "Taharah (Purification & Wudhu Steps)", objectives: "Demonstrate practical steps of ablution and conditions for prayer.", status: "Completed", completedDate: "2026-06-16" },
    { week: 4, topic: "Daily Salat (Five Prescribed Prayers)", objectives: "Know the rak'ah counts and times for Fajr, Dhuhr, Asr, Maghrib, Isha.", status: "Completed", completedDate: "2026-06-23" },
    { week: 5, topic: "Hadith on Truthfulness & Honesty", objectives: "Memorize the Hadith on truthfulness and discuss practical applications.", status: "In Progress" },
    { week: 6, topic: "Seerah: Early Life of Prophet Muhammad (SAW)", objectives: "Narrate the birth, lineage, and character in Makkah.", status: "Not Started" },
    { week: 7, topic: "Surah Al-Ikhlas & Tawheed", objectives: "Explain the oneness of Allah and memorize the Surah with translation.", status: "Not Started" },
    { week: 8, topic: "Islamic Manners (Etiquette of Eating and Greeting)", objectives: "Demonstrate Salam greeting and eating with right hand with Bismillah.", status: "Not Started" },
    { week: 9, topic: "Stories of the Prophets: Prophet Ibrahim (AS)", objectives: "Recall the bravery, devotion, and sacrifice of Prophet Ibrahim.", status: "Not Started" },
    { week: 10, topic: "Term Revision & Practical Du'a Assessment", objectives: "Oral recitation of daily supplications and term content review.", status: "Not Started" }
  ]
};

export const defaultLessonPlans: LessonPlanDraft[] = [
  {
    id: "lp-1",
    classId: "Primary 5 - Gold",
    subject: "Primary Mathematics",
    week: 5,
    title: "Mastering Mixed Fractions & Improper Conversions",
    objectives: "1. Convert improper fractions to mixed numbers and vice versa with 90% accuracy.\n2. Perform basic addition of mixed fractions with common denominators.",
    materials: "Fraction circles, plastic fraction bars, custom printed worksheet grids.",
    procedureIntro: "Review simple fraction definitions (numerator/denominator). Draw a pizza with 5 quarters on the board and ask how many whole pizzas that makes (1 whole and 1 quarter).",
    procedurePractice: "Demonstrate dividing numerator by denominator to find the whole number and remainder. Show the formula: mixed = quotient + remainder/divisor. Solve 7/3, 11/4, 15/6 as a class.",
    procedureActivity: "Group activity: Hand out fraction strips. Pairs represent fractions like 9/4 visually, then write the mixed number equivalent in their activity logbooks.",
    procedureEvaluation: "Short exit quiz: Complete 3 problems on conversions. Direct students to slide their papers into the collection box.",
    homework: "Complete Textbook Exercise 5B, Questions 1 through 10 on page 42.",
    teacherId: "staff-1",
    teacherName: "Aisha Garba",
    status: "Approved",
    feedback: "This is a brilliantly structured lesson plan. The pizza analogy works incredibly well for Grade 5 pupils. Well done, Aisha!",
    reviewedBy: "SAMS Principal Reviewer",
    reviewedAt: "2026-07-15T14:30:00Z",
    createdAt: "2026-07-14T09:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z"
  },
  {
    id: "lp-2",
    classId: "Junior Sec 1 - Alpha",
    subject: "Junior Secondary Science",
    week: 5,
    title: "Observing Physical and Chemical Changes in Matter",
    objectives: "1. Distinguish between physical and chemical changes with examples.\n2. Record at least 3 signs of chemical reactions (color shift, heat release, gas release).",
    materials: "Magnesium ribbon, vinegar, baking soda, safety goggles, test tubes.",
    procedureIntro: "Demonstrate tearing a sheet of paper (physical change) versus burning a corner safely (chemical change). Discuss why the ash cannot be turned back into paper.",
    procedurePractice: "Introduce terms: reversible and irreversible reactions. Outline signs of a chemical reaction: gas bubbles, heat change, precipitate formation.",
    procedureActivity: "Hands-on Experiment: In pairs, students mix baking soda with vinegar in a test tube, observe gas bubbling, and record temperature change (feeling the tube).",
    procedureEvaluation: "Class review: Go around the room and have each pair share one observation and categorize it as physical or chemical.",
    homework: "Write a 1-page report detailing at least two examples of physical changes and two chemical changes observed in their kitchen at home.",
    teacherId: "staff-2",
    teacherName: "Mohammed Bello",
    status: "Submitted",
    createdAt: "2026-07-20T08:15:00Z",
    updatedAt: "2026-07-20T08:15:00Z"
  }
];
