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
    { week: 1, topic: "Numbers & Place Values", objectives: "Read & write numbers up to 1,000,000; expanded notation mastery.", status: "Not Started" },
    { week: 2, topic: "Basic Operations (Addition/Subtraction)", objectives: "Perform mental additions of large digit sets & composite addition strategies.", status: "Not Started" },
    { week: 3, topic: "Long Multiplication & Division", objectives: "Solve 3-digit multiplication & single-digit divisor divisions step-by-step.", status: "Not Started" },
    { week: 4, topic: "Fractions Introduction", objectives: "Identify numerator/denominator, add fractions with like denominators.", status: "Not Started" },
    { week: 5, topic: "Mixed Fractions & Conversions", objectives: "Convert improper fractions to mixed numbers, and order fraction lists.", status: "Not Started" },
    { week: 6, topic: "Decimals & Percentages", objectives: "Relate decimals to fractions, write basic percentages from shapes.", status: "Not Started" },
    { week: 7, topic: "Ratios & Simple Proportions", objectives: "Solve scaling problems, map calculations, and identify equivalence.", status: "Not Started" },
    { week: 8, topic: "Introduction to Algebra Variables", objectives: "Solve simple single-variable expressions like x + 5 = 12.", status: "Not Started" },
    { week: 9, topic: "Calculations of Area & Perimeter", objectives: "Formulate area for triangles & composite squares with correct units.", status: "Not Started" },
    { week: 10, topic: "Term Review & Examination Practice", objectives: "Comprehensive assessment covering all 9 weeks of course material.", status: "Not Started" }
  ],
  "Junior Secondary Science": [
    { week: 1, topic: "Scientific Method & Laboratory Rules", objectives: "Formulate hypotheses, identify variables, list core safety symbols.", status: "Not Started" },
    { week: 2, topic: "Living Things & Environments", objectives: "Identify 7 characteristics of life, distinguish biotic & abiotic components.", status: "Not Started" },
    { week: 3, topic: "Cell Structures & Functions", objectives: "Map differences between plant and animal cells under virtual slides.", status: "Not Started" },
    { week: 4, topic: "Structure of Matter & Atoms", objectives: "Define atomic components (protons, electrons), read hydrogen to oxygen on Periodic Table.", status: "Not Started" },
    { week: 5, topic: "Physical vs Chemical Changes", objectives: "Observe combustion, rust, and dilution, and write evidence of reaction.", status: "Not Started" },
    { week: 6, topic: "Forces & Movement Mechanics", objectives: "Calculate gravity weight, study friction, and map velocity vectors.", status: "Not Started" },
    { week: 7, topic: "Forms of Energy & Conservation", objectives: "Track mechanical kinetic to potential transformations with math grids.", status: "Not Started" },
    { week: 8, topic: "Human Digestive & Excretory System", objectives: "Draw digestion channels, name gastric acids, track intake path.", status: "Not Started" },
    { week: 9, topic: "Atmosphere, Ecosystems & Pollution", objectives: "Detail greenhouse gases, evaluate waste effects in town water basins.", status: "Not Started" },
    { week: 10, topic: "Comprehensive Review & Practical Assessments", objectives: "Synthesize terms, evaluate lab files, complete final mock quiz.", status: "Not Started" }
  ],
  "Nursery Literacy": [
    { week: 1, topic: "Phonics & Sounding A-E", objectives: "Acknowledge phonemes for A, B, C, D, E with visual objects.", status: "Not Started" },
    { week: 2, topic: "Phonics & Sounding F-J", objectives: "Articulate sound blends F, G, H, I, J using animal cards.", status: "Not Started" },
    { week: 3, topic: "Tracing & Finger Control Exercises", objectives: "Trace circular, straight vertical, and horizontal pencil lines.", status: "Not Started" },
    { week: 4, topic: "Tracing Upper Case Letters A-F", objectives: "Follow dotted lines to write letters A to F with pencil grips.", status: "Not Started" },
    { week: 5, topic: "Word Association Matching Games", objectives: "Match visual objects (cat, sun, book) to beginning letter-sounds.", status: "Not Started" },
    { week: 6, topic: "CVC Words Building (3 Letters)", objectives: "Sound out simple three-letter sets like C-A-T, P-I-N, H-E-N.", status: "Not Started" },
    { week: 7, topic: "Basic Sight Words Familiarity", objectives: "Recall words: 'the', 'is', 'am', 'on', 'she' instantly.", status: "Not Started" },
    { week: 8, topic: "Tracing Upper Case Letters G-L", objectives: "Practice strokes for letters G to L on double-ruled charts.", status: "Not Started" },
    { week: 9, topic: "Short Story Comprehension & Auditory Games", objectives: "Identify active characters in 5-sentence audio stories.", status: "Not Started" },
    { week: 10, topic: "Graduation Plays & Recitation Parade", objectives: "Alphabet songs rehearsal, choral letter games, class performance.", status: "Not Started" }
  ],
  "Basic English & Grammar": [
    { week: 1, topic: "Nouns: Common and Proper Nouns", objectives: "Identify naming words for persons, places, animals, and things.", status: "Not Started" },
    { week: 2, topic: "Pronouns and Antecedents", objectives: "Replace nouns with personal pronouns (he, she, it, they).", status: "Not Started" },
    { week: 3, topic: "Adjectives & Descriptive Words", objectives: "Use color, size, and shape adjectives in descriptive phrases.", status: "Not Started" },
    { week: 4, topic: "Articles (A, An, The)", objectives: "Apply indefinite and definite articles before consonant and vowel sounds.", status: "Not Started" },
    { week: 5, topic: "Parts of Speech: Action Verbs & Past Tense", objectives: "Distinguish present actions from regular and irregular past tense forms.", status: "Not Started" },
    { week: 6, topic: "Adverbs of Manner and Time", objectives: "Explain how actions are done using -ly adverbs and time markers.", status: "Not Started" },
    { week: 7, topic: "Prepositions of Place and Direction", objectives: "Use in, on, under, between, behind in situational sentences.", status: "Not Started" },
    { week: 8, topic: "Conjunctions (And, But, Because)", objectives: "Join two independent clauses with coordinating conjunctions.", status: "Not Started" },
    { week: 9, topic: "Punctuation & Capitalization Rules", objectives: "Apply full stops, question marks, exclamation marks, and commas.", status: "Not Started" },
    { week: 10, topic: "Term Review & Creative Composition", objectives: "Write a 3-paragraph narrative essay using learned grammar rules.", status: "Not Started" }
  ],
  "Islamic Studies": [
    { week: 1, topic: "Surah Al-Fatihah Recitation & Tajweed", objectives: "Recite with correct makharij and understand foundational meanings.", status: "Not Started" },
    { week: 2, topic: "Pillars of Islam (Arkan al-Islam)", objectives: "List and explain the significance of the 5 Pillars of Islam.", status: "Not Started" },
    { week: 3, topic: "Taharah (Purification & Wudhu Steps)", objectives: "Demonstrate practical steps of ablution and conditions for prayer.", status: "Not Started" },
    { week: 4, topic: "Daily Salat (Five Prescribed Prayers)", objectives: "Know the rak'ah counts and times for Fajr, Dhuhr, Asr, Maghrib, Isha.", status: "Not Started" },
    { week: 5, topic: "Hadith on Truthfulness & Honesty", objectives: "Memorize the Hadith on truthfulness and discuss practical applications.", status: "Not Started" },
    { week: 6, topic: "Seerah: Early Life of Prophet Muhammad (SAW)", objectives: "Narrate the birth, lineage, and character in Makkah.", status: "Not Started" },
    { week: 7, topic: "Surah Al-Ikhlas & Tawheed", objectives: "Explain the oneness of Allah and memorize the Surah with translation.", status: "Not Started" },
    { week: 8, topic: "Islamic Manners (Etiquette of Eating and Greeting)", objectives: "Demonstrate Salam greeting and eating with right hand with Bismillah.", status: "Not Started" },
    { week: 9, topic: "Stories of the Prophets: Prophet Ibrahim (AS)", objectives: "Recall the bravery, devotion, and sacrifice of Prophet Ibrahim.", status: "Not Started" },
    { week: 10, topic: "Term Revision & Practical Du'a Assessment", objectives: "Oral recitation of daily supplications and term content review.", status: "Not Started" }
  ]
};

export const defaultLessonPlans: LessonPlanDraft[] = [];
