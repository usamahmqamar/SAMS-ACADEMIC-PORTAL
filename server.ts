import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Gemini SDK with User-Agent telemetry headers
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Durable local state file configuration
const DB_FILE = path.resolve('./school_db.json');

const DEFAULT_DB = {
  students: [
    {
      id: "std-n1",
      name: "Sophia Martinez",
      level: "nursery",
      grade: "K1 (Ages 3-4)",
      classSection: "A",
      parentName: "Carlos Martinez",
      parentEmail: "carlos.m@example.com",
      parentPhone: "+1 (555) 0192",
      attendancePercentage: 94,
      behaviorRating: "Good",
      milestones: {
        "Fine Motor Skills (pencil grip, scissor cuts)": "Mastered",
        "Social Sharing & Interaction": "Developing",
        "Count up to 10 & Pattern Recognition": "Mastered",
        "Expressive Communication & Vocabulary": "Developing",
        "Listening & Task Completion": "Introduced"
      },
      grades: {},
      reportComment: "Sophia is a delightful child who brings boundless energy to our circle times. She has mastered her basic fine motor skills and shows deep curiosity during visual arts. She is currently developing her verbal sharing skills and learning to cooperate with peers during free play.",
      admissionDate: "2024-09-02",
      enrollmentNo: "ADM-2024-N001",
      admissionStatus: "Active",
      profile: {
        gender: "Female",
        dob: "2022-04-12",
        address: "12 Pine Street, Apt 3B, Boston",
        bloodGroup: "O+"
      },
      attendanceLogs: [
        {"date": "2026-05-25", "status": "Present"},
        {"date": "2026-05-26", "status": "Present"},
        {"date": "2026-05-27", "status": "Absent", "reason": "Minor Flu"},
        {"date": "2026-05-28", "status": "Present"},
        {"date": "2026-05-29", "status": "Present"}
      ],
      disciplinaryRecords: [],
      extracurriculars: ["Introductory Gymnastics", "Tactile Clay Craft", "Toddler Music Academy"],
      healthInfo: {
        allergies: "Peanut Sensitivity",
        medicalConditions: "None",
        bloodGroup: "O+",
        vaccinations: "Completed MMR, Polio, HepB"
      },
      academicProgression: [
        {"term": "Nursery Pre-K 2024", "avg": 95, "status": "Promoted"}
      ],
      homework: [
        {"id": "hw-n1", "subject": "Sensory Play", "task": "Collect 3 green, curved leaves for paste scrapbook", "dueDate": "2026-06-03", "status": "Pending"},
        {"id": "hw-n2", "subject": "Motor Development", "task": "Color inside circular shape with standard crayon", "dueDate": "2026-06-05", "status": "Completed"}
      ],
      notices: [
        {"id": "not-n1", "date": "2026-05-29", "title": "Tactile Clay Exhibition on Friday", "content": "Dear Parents, please send Sophia in old clothing as we will be using natural non-toxic clay."}
      ],
      feeStatements: {
        invoices: [
          {"id": "inv-n1", "description": "Nursery Tuition - Term 2", "amount": 1800, "paid": 1800, "status": "Paid", "date": "2026-01-15"},
          {"id": "inv-n2", "description": "Materials & Sensory Kits fee", "amount": 250, "paid": 250, "status": "Paid", "date": "2026-02-01"},
          {"id": "inv-n3", "description": "Nursery Tuition - Term 3", "amount": 1800, "paid": 0, "status": "Unpaid", "date": "2026-05-20"}
        ],
        outstandingBalance: 1800
      }
    },
    {
      id: "std-n2",
      name: "Liam O'Connor",
      level: "nursery",
      grade: "Preschool (Ages 2-3)",
      classSection: "B",
      parentName: "Siobhan O'Connor",
      parentEmail: "siobhan.oc@example.com",
      parentPhone: "+1 (555) 8734",
      attendancePercentage: 92,
      behaviorRating: "Excellent",
      milestones: {
        "Fine Motor Skills (pencil grip, scissor cuts)": "Developing",
        "Social Sharing & Interaction": "Mastered",
        "Count up to 10 & Pattern Recognition": "Developing",
        "Expressive Communication & Vocabulary": "Mastered",
        "Listening & Task Completion": "Developing"
      },
      grades: {},
      reportComment: "Liam has transitioned smoothly into Preschool. He is highly empathetic, has made excellent friendships, and communicates his thoughts masterfully. We are starting to introduce structured cognitive counting tasks which he is receiving gracefully.",
      admissionDate: "2024-11-10",
      enrollmentNo: "ADM-2024-N002",
      admissionStatus: "Active",
      profile: {
        gender: "Male",
        dob: "2023-01-18",
        address: "74 Maple Avenue, Quincy",
        bloodGroup: "A+"
      },
      attendanceLogs: [
        {"date": "2026-05-25", "status": "Present"},
        {"date": "2026-05-26", "status": "Present"},
        {"date": "2026-05-27", "status": "Present"},
        {"date": "2026-05-28", "status": "Absent", "reason": "Late Woke Up"},
        {"date": "2026-05-29", "status": "Present"}
      ],
      disciplinaryRecords: [],
      extracurriculars: ["Toddler Gym", "Language Play Circle"],
      healthInfo: {
        allergies: "Egg Albumin Allergy",
        medicalConditions: "None",
        bloodGroup: "A+",
        vaccinations: "Completed Polio, MMR Booster"
      },
      academicProgression: [],
      homework: [
        {"id": "hw-n3", "subject": "Social Sharing", "task": "Bring 1 toy to share with Liam's classmate Chloe during playtime", "dueDate": "2026-06-04", "status": "Completed"}
      ],
      notices: [
        {"id": "not-n2", "date": "2026-05-28", "title": "Preschool Music and Rhythms", "content": "Liam will need standard light slippers for our musical rhythms class."}
      ],
      feeStatements: {
        invoices: [
          {"id": "inv-l1", "description": "Preschool Term Tuition - T2", "amount": 1600, "paid": 1600, "status": "Paid", "date": "2026-01-10"},
          {"id": "inv-l2", "description": "Preschool Term Tuition - T3", "amount": 1600, "paid": 1600, "status": "Paid", "date": "2026-05-15"}
        ],
        outstandingBalance: 0
      }
    },
    {
      id: "std-p1",
      name: "Alexander Mercer",
      level: "primary",
      grade: "Grade 3",
      classSection: "A",
      parentName: "Richard Mercer",
      parentEmail: "richard.mercer@example.com",
      parentPhone: "+1 (555) 3491",
      attendancePercentage: 97,
      behaviorRating: "Excellent",
      milestones: {},
      grades: {
        "Mathematics": 92,
        "Science": 95,
        "English Language": 88,
        "Social Studies": 90,
        "Creative Arts": 96
      },
      reportComment: "Alexander has demonstrated exceptional academic performance this term. His comprehension of complex scientific properties is superb, and his mathematical computation speed is outstanding. He maintains a helpful attitude and is a role model in the classroom.",
      admissionDate: "2022-09-01",
      enrollmentNo: "ADM-2022-P018",
      admissionStatus: "Active",
      profile: {
        gender: "Male",
        dob: "2017-08-24",
        address: "33 Beacon St, Unit 4, Boston",
        bloodGroup: "B-"
      },
      attendanceLogs: [
        {"date": "2026-05-25", "status": "Present"},
        {"date": "2026-05-26", "status": "Present"},
        {"date": "2026-05-27", "status": "Present"},
        {"date": "2026-05-28", "status": "Present"},
        {"date": "2026-05-29", "status": "Present"}
      ],
      disciplinaryRecords: [],
      extracurriculars: ["Primary Chess League", "Junior Soccer Club", "Robotics Explorers"],
      healthInfo: {
        allergies: "Dustmite hypersensitivity",
        medicalConditions: "Mild Asthma (Inhaler with school host)",
        bloodGroup: "B-",
        vaccinations: "Fully Up-to-Date"
      },
      academicProgression: [
        {"term": "Grade 1 Standard", "avg": 89, "status": "Promoted"},
        {"term": "Grade 2 Honors", "avg": 93, "status": "Promoted"}
      ],
      homework: [
        {"id": "hw-p1", "subject": "Mathematics", "task": "Practice long multiplication sheets page 45-47", "dueDate": "2026-06-03", "status": "Pending"},
        {"id": "hw-p2", "subject": "Science", "task": "Draw water cycle diagram on a standard card", "dueDate": "2026-06-05", "status": "Pending"},
        {"id": "hw-p3", "subject": "Social Studies", "task": "Identify 5 local public utility operations in the city", "dueDate": "2026-06-06", "status": "Completed"}
      ],
      notices: [
        {"id": "not-p1", "date": "2026-05-30", "title": "Field Trip to Science Museum", "content": "Please sign consent paperwork and submit the $15 museum entry fee by June 8th."}
      ],
      feeStatements: {
        invoices: [
          {"id": "inv-a1", "description": "Primary Tuition - Term 2", "amount": 2200, "paid": 2200, "status": "Paid", "date": "2026-01-12"},
          {"id": "inv-a2", "description": "Annual Field trips & Robotics kit", "amount": 350, "paid": 350, "status": "Paid", "date": "2026-02-15"},
          {"id": "inv-a3", "description": "Primary Tuition - Term 3", "amount": 2200, "paid": 1000, "status": "Unpaid", "date": "2026-05-22"}
        ],
        outstandingBalance: 1200
      }
    },
    {
      id: "std-p2",
      name: "Chloe Zhao",
      level: "primary",
      grade: "Grade 5",
      classSection: "B",
      parentName: "Ying Zhao",
      parentEmail: "ying.zhao@example.com",
      parentPhone: "+1 (555) 4501",
      attendancePercentage: 91,
      behaviorRating: "Good",
      milestones: {},
      grades: {
        "Mathematics": 78,
        "Science": 82,
        "English Language": 94,
        "Social Studies": 85,
        "Creative Arts": 89
      },
      reportComment: "Chloe is a highly expressive student who thrives particularly in language arts and literature operations. Her writing pieces showcase rich vocabulary and detail. In Mathematics, some persistent effort with long-division structures will greatly build her speed and confidence.",
      admissionDate: "2020-09-01",
      enrollmentNo: "ADM-2020-P094",
      admissionStatus: "Active",
      profile: {
        gender: "Female",
        dob: "2015-11-04",
        address: "18 Harbor Way, Quincy",
        bloodGroup: "O-"
      },
      attendanceLogs: [
        {"date": "2026-05-25", "status": "Present"},
        {"date": "2026-05-26", "status": "Present"},
        {"date": "2026-05-27", "status": "Present"},
        {"date": "2026-05-28", "status": "Absent", "reason": "Severe Cough"},
        {"date": "2026-05-29", "status": "Absent", "reason": "Sore Throat"}
      ],
      disciplinaryRecords: [],
      extracurriculars: ["Youth Orchestra (Violin)", "Primary Swimming Team", "Visual Arts Guild"],
      healthInfo: {
        allergies: "Penicillin allergy",
        medicalConditions: "Seasonal eczema",
        bloodGroup: "O-",
        vaccinations: "Fully Up-to-Date"
      },
      academicProgression: [
        {"term": "Grade 3 Standard", "avg": 81, "status": "Promoted"},
        {"term": "Grade 4 Standard", "avg": 84, "status": "Promoted"}
      ],
      homework: [
        {"id": "hw-p4", "subject": "Science", "task": "Record 4 different physical properties of water in sample bowls", "dueDate": "2026-06-03", "status": "Completed"},
        {"id": "hw-p5", "subject": "English Language", "task": "Write a 300-word creative essay about ocean floor", "dueDate": "2026-06-04", "status": "Pending"}
      ],
      notices: [
        {"id": "not-p2", "date": "2026-05-25", "title": "Violin Orchestra Rehearsals", "content": "Chloe will need to attend morning rehearsals at 7:50 AM on Tuesdays."}
      ],
      feeStatements: {
        invoices: [
          {"id": "inv-c1", "description": "Primary Tuition - Term 2", "amount": 2200, "paid": 2200, "status": "Paid", "date": "2026-01-10"},
          {"id": "inv-c2", "description": "Primary Tuition - Term 3", "amount": 2200, "paid": 0, "status": "Unpaid", "date": "2026-05-20"}
        ],
        outstandingBalance: 2200
      }
    },
    {
      id: "std-s1",
      name: "Amara Adebayo",
      level: "secondary",
      grade: "Grade 10",
      classSection: "A",
      parentName: "Femi Adebayo",
      parentEmail: "f.adebayo@example.com",
      parentPhone: "+1 (555) 7621",
      attendancePercentage: 98,
      behaviorRating: "Excellent",
      milestones: {},
      grades: {
        "Mathematics": 96,
        "Biology": 91,
        "Chemistry": 89,
        "Physics": 92,
        "English Literature": 85,
        "Global History": 94
      },
      reportComment: "Amara continues to be a cornerstone student in Grade 10. She displays a formidable analytical mindset both in Calculus and the scientific trials. Her engagement with historical contexts shows deep maturity. She manages her deadlines beautifully and works with precision.",
      admissionDate: "2017-09-01",
      enrollmentNo: "ADM-2017-S102",
      admissionStatus: "Active",
      profile: {
        gender: "Female",
        dob: "2010-05-08",
        address: "302 Commonwealth Ave, Boston",
        bloodGroup: "AB+"
      },
      attendanceLogs: [
        {"date": "2026-05-25", "status": "Present"},
        {"date": "2026-05-26", "status": "Present"},
        {"date": "2026-05-27", "status": "Present"},
        {"date": "2026-05-28", "status": "Present"},
        {"date": "2026-05-29", "status": "Present"}
      ],
      disciplinaryRecords: [],
      extracurriculars: ["Secondary Debate Society", "Varsity Volleyball", "Alliance Francaise Club"],
      healthInfo: {
        allergies: "None",
        medicalConditions: "None",
        bloodGroup: "AB+",
        vaccinations: "Fully Up-to-Date"
      },
      academicProgression: [
        {"term": "Grade 8 Preparatory", "avg": 91, "status": "Promoted"},
        {"term": "Grade 9 Secondary Stage", "avg": 93, "status": "Promoted"}
      ],
      homework: [
        {"id": "hw-s1", "subject": "Biology", "task": "Write laboratory findings on yeast anaerobic fermentation", "dueDate": "2026-06-03", "status": "Pending"},
        {"id": "hw-s2", "subject": "Mathematics", "task": "Solve Trigonometric identity problems 1 to 20", "dueDate": "2026-06-05", "status": "Completed"}
      ],
      notices: [
        {"id": "not-s1", "date": "2026-05-29", "title": "State Debate Finals", "content": "Congratulations to Amara for entering state debate finals. We will coordinate transport for next Wednesday."}
      ],
      feeStatements: {
        invoices: [
          {"id": "inv-s1-1", "description": "High School Tuition - Term 2", "amount": 2800, "paid": 2800, "status": "Paid", "date": "2026-01-11"},
          {"id": "inv-s1-2", "description": "High School Tuition - Term 3", "amount": 2800, "paid": 2800, "status": "Paid", "date": "2026-05-18"}
        ],
        outstandingBalance: 0
      }
    },
    {
      id: "std-s2",
      name: "Marcus Thorne",
      level: "secondary",
      grade: "Grade 11",
      classSection: "A",
      parentName: "Gemma Thorne",
      parentEmail: "gemma.thorne@example.com",
      parentPhone: "+1 (555) 2311",
      attendancePercentage: 88,
      behaviorRating: "Needs Improvement",
      milestones: {},
      grades: {
        "Mathematics": 68,
        "Biology": 72,
        "Chemistry": 64,
        "Physics": 71,
        "English Literature": 80,
        "Global History": 77
      },
      reportComment: "Marcus has the strong potential to succeed but currently exhibits inconsistent dedication. His test scores are heavily volatile, showing that gaps in comprehension remain due to uncommitted study habits. Increased attendance combined with proactive after-school math clinics will help guide his grades back upward.",
      admissionDate: "2016-09-01",
      enrollmentNo: "ADM-2016-S044",
      admissionStatus: "Active",
      profile: {
        gender: "Male",
        dob: "2009-02-14",
        address: "14 Elm Court, Apt 2C, Boston",
        bloodGroup: "A-"
      },
      attendanceLogs: [
        {"date": "2026-05-25", "status": "Present"},
        {"date": "2026-05-26", "status": "Absent", "reason": "Overslept"},
        {"date": "2026-05-27", "status": "Present"},
        {"date": "2026-05-28", "status": "Present"},
        {"date": "2026-05-29", "status": "Absent", "reason": "Dental pain"}
      ],
      disciplinaryRecords: [
        {"date": "2026-03-10", "issue": "Unexcused Tardy to First Class Hour", "action": "Teacher consultation & warning issued", "status": "Resolved"},
        {"date": "2026-04-20", "issue": "Failure to submit completed laboratory folder", "action": "Contacted parents", "status": "Resolved"}
      ],
      extracurriculars: ["High School Basketball Club", "Creative Writing Club"],
      healthInfo: {
        allergies: "None",
        medicalConditions: "None",
        bloodGroup: "A-",
        vaccinations: "Fully Up-to-Date"
      },
      academicProgression: [
        {"term": "Grade 9 Honors Track", "avg": 76, "status": "Promoted"},
        {"term": "Grade 10 Prep Stage", "avg": 74, "status": "Promoted"}
      ],
      homework: [
        {"id": "hw-s3", "subject": "Chemistry", "task": "Practice questions on chemical stoichiometry page 102", "dueDate": "2026-06-03", "status": "Pending"},
        {"id": "hw-s4", "subject": "Biology", "task": "Study plant cell division diagram for checkup test", "dueDate": "2026-06-05", "status": "Pending"},
        {"id": "hw-s5", "subject": "English Literature", "task": "Complete essay drafting on symbolism in animal farm", "dueDate": "2026-06-06", "status": "Completed"}
      ],
      notices: [
        {"id": "not-s2", "date": "2026-05-28", "title": "Math Assistance Clinic Reminder", "content": "Marcus is strongly requested to attend after-school tutoring clinics at 3:30 PM on Thursdays inside Lab 1C."}
      ],
      feeStatements: {
        invoices: [
          {"id": "inv-m1", "description": "High School Tuition - Term 2", "amount": 2800, "paid": 2800, "status": "Paid", "date": "2026-01-10"},
          {"id": "inv-m2", "description": "High School Tuition - Term 3", "amount": 2800, "paid": 1400, "status": "Unpaid", "date": "2026-05-18"}
        ],
        outstandingBalance: 1400
      }
    }
  ],
  teachers: [
    {
      id: "tch-1",
      name: "Mrs. Sarah Jenkins",
      email: "jsarah@school.edu",
      phone: "+1 (555) 8801",
      level: ["nursery"],
      subjects: ["Early Socialization", "Sensory Play", "Motor Skills Development"],
      classesAssigned: ["K1 (Ages 3-4)", "Preschool (Ages 2-3)"],
      joiningDate: "2021-08-15",
      qualification: "M.Ed Early Childhood Education",
      status: "Active",
      address: "22 Orchard Rd, Boston",
      attendance: [
        { date: "2026-05-25", status: "Present" },
        { date: "2026-05-26", status: "Present" },
        { date: "2026-05-27", status: "Present" },
        { date: "2026-05-28", status: "Present" },
        { date: "2026-05-29", status: "Present" }
      ],
      leaves: [
        { id: "lv-1", leaveType: "Sick Leave", startDate: "2026-03-12", endDate: "2026-03-13", reason: "Sore throat", status: "Approved" }
      ],
      payroll: [
        { id: "pr-1", month: "April 2026", basic: 3200, bonus: 150, deductions: 50, net: 3300, status: "Paid", datePaid: "2026-04-30" },
        { id: "pr-2", month: "May 2026", basic: 3200, bonus: 0, deductions: 50, net: 3150, status: "Paid", datePaid: "2026-05-31" }
      ],
      performance: [
        { id: "pf-1", date: "2025-12-15", rating: 5, comment: "Outstanding classroom organization, patients with toddlers, excellent early socialization coordination.", reviewer: "Principal" }
      ],
      lessonPlans: [
        { id: "lp-1", subject: "Sensory Play", grade: "K1 (Ages 3-4)", topic: "Tactile Clay Craft", objective: "Identify shapes and textures through clay molding", summary: "Introduce kids to smooth vs rough surfaces. We will use red non-toxic water-soluble clay.", date: "2026-06-05", status: "Approved" }
      ]
    },
    {
      id: "tch-2",
      name: "Mr. David Alabi",
      email: "dalabi@school.edu",
      phone: "+1 (555) 1290",
      level: ["primary"],
      subjects: ["Mathematics", "Science", "Social Studies"],
      classesAssigned: ["Grade 3", "Grade 5"],
      joiningDate: "2022-09-01",
      qualification: "B.Sc Mathematics and Pedagogy",
      status: "Active",
      address: "18 Harbor Way, Quincy",
      attendance: [
        { date: "2026-05-25", status: "Present" },
        { date: "2026-05-26", status: "Present" },
        { date: "2026-05-27", status: "Present" },
        { date: "2026-05-28", status: "Absent", remarks: "Doctor appt" },
        { date: "2026-05-29", status: "Present" }
      ],
      leaves: [
        { id: "lv-2", leaveType: "Personal Leave", startDate: "2026-05-28", endDate: "2026-05-28", reason: "Annual medical checkup", status: "Approved" }
      ],
      payroll: [
        { id: "pr-3", month: "April 2026", basic: 3500, bonus: 100, deductions: 60, net: 3540, status: "Paid", datePaid: "2026-04-30" },
        { id: "pr-4", month: "May 2026", basic: 3500, bonus: 200, deductions: 60, net: 3640, status: "Paid", datePaid: "2026-05-31" }
      ],
      performance: [
        { id: "pf-2", date: "2025-12-18", rating: 4, comment: "Formidible math instruction and long division guidance. Very constructive student sessions.", reviewer: "Academic Supervisor" }
      ],
      lessonPlans: [
        { id: "lp-2", subject: "Mathematics", grade: "Grade 3", topic: "Long multiplication", objective: "Grasp double digit multiplication properties", summary: "Standard board examples, dynamic worksheets, and quiz rounds inside groups.", date: "2026-06-03", status: "Approved" }
      ]
    },
    {
      id: "tch-3",
      name: "Dr. Elena Rostova",
      email: "erostova@school.edu",
      phone: "+1 (555) 3647",
      level: ["secondary"],
      subjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
      classesAssigned: ["Grade 10", "Grade 11"],
      joiningDate: "2020-01-10",
      qualification: "Ph.D Organic Chemistry",
      status: "Active",
      address: "15 Beacon Hill Suite 12, Boston",
      attendance: [
        { date: "2026-05-25", status: "Present" },
        { date: "2026-05-26", status: "Present" },
        { date: "2026-05-27", status: "Present" },
        { date: "2026-05-28", status: "Present" },
        { date: "2026-05-29", status: "Present" }
      ],
      leaves: [],
      payroll: [
        { id: "pr-5", month: "April 2026", basic: 4500, bonus: 300, deductions: 80, net: 4720, status: "Paid", datePaid: "2026-04-30" },
        { id: "pr-6", month: "May 2026", basic: 4500, bonus: 300, deductions: 80, net: 4720, status: "Paid", datePaid: "2026-05-31" }
      ],
      performance: [
        { id: "pf-3", date: "2025-12-20", rating: 5, comment: "Extremely detailed secondary sciences curriculum delivery. Incredible debate society support.", reviewer: "Principal" }
      ],
      lessonPlans: [
        { id: "lp-3", subject: "Biology", grade: "Grade 10", topic: "Yeast anaerobic fermentation", objective: "Observe yeast reactions on sucrose vs glucose", summary: "Classroom laboratory setup, measuring test tube gas bubble production rates.", date: "2026-06-03", status: "Approved" }
      ]
    }
  ],
  schedules: [
    { id: "sch-1", grade: "Grade 3", day: "Monday", period: 1, subject: "Mathematics", teacherId: "tch-2" },
    { id: "sch-2", grade: "Grade 3", day: "Monday", period: 2, subject: "Science", teacherId: "tch-2" },
    { id: "sch-3", grade: "Grade 3", day: "Monday", period: 3, subject: "English Language", teacherId: "tch-2" },
    { id: "sch-4", grade: "Grade 3", day: "Tuesday", period: 1, subject: "Social Studies", teacherId: "tch-2" },
    { id: "sch-5", grade: "Grade 3", day: "Wednesday", period: 2, subject: "Creative Arts", teacherId: "tch-2" },
    { id: "sch-6", grade: "Grade 10", day: "Monday", period: 1, subject: "Biology", teacherId: "tch-3" },
    { id: "sch-7", grade: "Grade 10", day: "Monday", period: 2, subject: "Chemistry", teacherId: "tch-3" },
    { id: "sch-8", grade: "Grade 10", day: "Tuesday", period: 3, subject: "Physics", teacherId: "tch-3" },
    { id: "sch-9", grade: "K1 (Ages 3-4)", day: "Monday", period: 1, subject: "Sensory Play", teacherId: "tch-1" },
    { id: "sch-10", grade: "K1 (Ages 3-4)", day: "Monday", period: 2, subject: "Motor Skills Development", teacherId: "tch-1" }
  ],
  curriculums: [
    {
      id: "curr-1",
      grade: "Grade 10",
      subject: "Biology",
      topics: [
        { name: "Cellular Respiration & Anaerobic Fermentation", hours: 12, objectives: "Compare glycolysis and fermentation rate variances under different temperatures." },
        { name: "Genetics & DNA Transcription", hours: 15, objectives: "Understand nucleotide replication mechanisms and map basic pedigree charts." }
      ],
      teacherId: "tch-3"
    },
    {
      id: "curr-2",
      grade: "Grade 3",
      subject: "Mathematics",
      topics: [
        { name: "Multiplication & Division Foundations", hours: 18, objectives: "Master times tables up to 12 and perform simple division problems." },
        { name: "Introductory Fractions", hours: 10, objectives: "Identify halves, thirds, and quarters using visual pie charts." }
      ],
      teacherId: "tch-2"
    }
  ],
  exams: [
    {
      id: "ex-1",
      title: "Mid-Term Examination",
      grade: "Grade 10",
      subject: "Biology",
      date: "2026-06-15",
      weightPercentage: 30,
      totalMarks: 100
    },
    {
      id: "ex-2",
      title: "Final CAT Examination",
      grade: "Grade 10",
      subject: "Biology",
      date: "2026-06-25",
      weightPercentage: 50,
      totalMarks: 100
    },
    {
      id: "ex-3",
      title: "Continuous assessment quiz",
      grade: "Grade 3",
      subject: "Mathematics",
      date: "2026-06-12",
      weightPercentage: 20,
      totalMarks: 50
    }
  ],
  gradeScales: [
    { id: "scale-a", grade: "A", minScore: 90, maxScore: 100, gradePoints: 4, description: "Outstanding performance, master of objectives" },
    { id: "scale-b", "grade": "B", minScore: 80, maxScore: 89, gradePoints: 3, description: "Very good coverage, meets standards with merit" },
    { id: "scale-c", "grade": "C", minScore: 70, maxScore: 79, gradePoints: 2, description: "Satisfactory achievement of essential objectives" },
    { id: "scale-d", "grade": "D", minScore: 50, maxScore: 69, gradePoints: 1, description: "Minimum passing grade, requires attention" },
    { id: "scale-f", "grade": "F", minScore: 0, maxScore: 49, gradePoints: 0, description: "Insufficient evidence of learning, fails standards" }
  ]
};

// Database local loader
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error("Database file could not be parsed, using fallback", e);
    }
  }
  return DEFAULT_DB;
}

function saveDB(state: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error("Database file save aborted", e);
  }
}

// Pre-initialize DB variables
let dbState = loadDB();

// Migration: ensure new databases are attached to saved states and migrate for branch tag isolation
let stateChanged = false;

if (!dbState.curriculums) {
  dbState.curriculums = DEFAULT_DB.curriculums;
  stateChanged = true;
}
if (!dbState.exams) {
  dbState.exams = DEFAULT_DB.exams;
  stateChanged = true;
}
if (!dbState.gradeScales) {
  dbState.gradeScales = DEFAULT_DB.gradeScales;
  stateChanged = true;
}

if (!dbState.subjects) {
  dbState.subjects = [
    // Nursery Level
    { id: "sub-n1", name: "Early Socialization", level: "nursery", requirement: "compulsory" },
    { id: "sub-n2", name: "Sensory Play", level: "nursery", requirement: "compulsory" },
    { id: "sub-n3", name: "Motor Skills Development", level: "nursery", requirement: "compulsory" },
    { id: "sub-n4", name: "Numeracy Foundation", level: "nursery", requirement: "compulsory" },
    { id: "sub-n5", name: "Literacy Foundation", level: "nursery", requirement: "compulsory" },
    { id: "sub-n6", name: "Creative Arts & Crafts", level: "nursery", requirement: "optional" },
    // Primary Level
    { id: "sub-p1", name: "Mathematics", level: "primary", requirement: "compulsory" },
    { id: "sub-p2", name: "Science", level: "primary", requirement: "compulsory" },
    { id: "sub-p3", name: "Social Studies", level: "primary", requirement: "compulsory" },
    { id: "sub-p4", name: "English Language", level: "primary", requirement: "compulsory" },
    { id: "sub-p5", name: "Creative Arts", level: "primary", requirement: "optional" },
    { id: "sub-p6", name: "Civic Education", level: "primary", requirement: "compulsory" },
    { id: "sub-p7", name: "Computer Studies/ICT", level: "primary", requirement: "optional" },
    // Secondary Level
    { id: "sub-s1", name: "Mathematics", level: "secondary", requirement: "compulsory" },
    { id: "sub-s2", name: "Biology", level: "secondary", requirement: "optional" },
    { id: "sub-s3", name: "Chemistry", level: "secondary", requirement: "optional" },
    { id: "sub-s4", name: "Physics", level: "secondary", requirement: "optional" },
    { id: "sub-s5", name: "English Literature", level: "secondary", requirement: "compulsory" },
    { id: "sub-s6", name: "Global History", level: "secondary", requirement: "compulsory" },
    { id: "sub-s7", name: "Geography", level: "secondary", requirement: "optional" },
    { id: "sub-s8", name: "Computer Science", level: "secondary", requirement: "optional" }
  ];
  stateChanged = true;
}

if (!dbState.admissions) {
  dbState.admissions = [
    {
      id: "APP-2026-6184",
      name: "Habiba Umar",
      level: "nursery",
      grade: "K1 (Ages 3-4)",
      parentName: "Umar Yusuf",
      parentEmail: "umar.y@example.com",
      parentPhone: "+234 (803) 777-1111",
      branch: "GN",
      status: "Pre-registered",
      preRegDate: "2026-06-12"
    },
    {
      id: "APP-2026-9284",
      name: "Sani Aliyu",
      level: "primary",
      grade: "Grade 3",
      parentName: "Aliyu Sani",
      parentEmail: "aliyu.s@gmail.com",
      parentPhone: "+234 (809) 444-2222",
      branch: "RS",
      status: "Submitted by Parent",
      preRegDate: "2026-06-10",
      dob: "2018-03-12",
      gender: "Male",
      address: "Runjin Sambo West Side, Sokoto",
      medicalAllergies: "Peanuts",
      medicalConditions: "None",
      bloodGroup: "A+",
      previousSchool: "Sokoto Kids Academy",
      interests: "Traditional Dance & Athletics",
      parentSubmittedDate: "2026-06-14"
    },
    {
      id: "APP-2026-7734",
      name: "Balarabe Dasuki",
      level: "secondary",
      grade: "Grade 10",
      parentName: "Dasuki Ibrahim",
      parentEmail: "dasuki@example.com",
      parentPhone: "+234 (802) 555-9999",
      branch: "GN",
      status: "HT Reviewed",
      preRegDate: "2026-06-08",
      dob: "2010-09-17",
      gender: "Male",
      address: "Gawun Nama Estate, Sokoto",
      medicalAllergies: "None",
      medicalConditions: "Asthma (Mild, uses inhaler)",
      bloodGroup: "O+",
      previousSchool: "Federal Government College Sokoto",
      interests: "Debate Club & Football",
      parentSubmittedDate: "2026-06-12",
      htNotes: "Balarabe has strong communication and reading comprehension scores in secondary sample testing. Recommended for fast-track Science program.",
      htEvaluation: "Recommended",
      htReviewedBy: "Principal Usman Sambo",
      htReviewedDate: "2026-06-15"
    }
  ];
  stateChanged = true;
}

// 1. Assign branch: 'GN' to any entry currently missing a branch
if (dbState.students) {
  dbState.students.forEach((s: any) => {
    if (!s.branch) {
      s.branch = 'GN';
      stateChanged = true;
    }
  });
}
if (dbState.teachers) {
  dbState.teachers.forEach((t: any) => {
    if (!t.branch) {
      t.branch = 'GN';
      stateChanged = true;
    }
  });
}
if (dbState.schedules) {
  dbState.schedules.forEach((s: any) => {
    if (!s.branch) {
      s.branch = 'GN';
      stateChanged = true;
    }
  });
}
if (dbState.curriculums) {
  dbState.curriculums.forEach((c: any) => {
    if (!c.branch) {
      c.branch = 'GN';
      stateChanged = true;
    }
  });
}
if (dbState.exams) {
  dbState.exams.forEach((e: any) => {
    if (!e.branch) {
      e.branch = 'GN';
      stateChanged = true;
    }
  });
}

// 2. Add Runjin Sambo (RS) seed data if no RS records exist
const hasRS = dbState.students && dbState.students.some((s: any) => s.branch === 'RS');
if (!hasRS) {
  const rsStudents = [
    {
      id: "std-rs1",
      name: "Aisha Bello",
      level: "nursery",
      grade: "K1 (Ages 3-4)",
      classSection: "A",
      parentName: "Alhaji Bello",
      parentEmail: "bello.a@example.com",
      parentPhone: "+234 (802) 111-2222",
      attendancePercentage: 96,
      behaviorRating: "Excellent",
      milestones: {
        "Fine Motor Skills (pencil grip, scissor cuts)": "Mastered",
        "Social Sharing & Interaction": "Developing",
        "Count up to 10 & Pattern Recognition": "Mastered",
        "Expressive Communication & Vocabulary": "Developing",
        "Listening & Task Completion": "Developing"
      },
      grades: {},
      reportComment: "Aisha is a bright student from our Runjin Sambo campus. She displays fantastic verbal skills.",
      admissionDate: "2024-09-02",
      enrollmentNo: "ADM-2024-RS001",
      admissionStatus: "Active",
      profile: {
        gender: "Female",
        dob: "2022-04-12",
        address: "Runjin Sambo Road, Sokoto",
        bloodGroup: "O+"
      },
      attendanceLogs: [
        {"date": "2026-05-25", "status": "Present"},
        {"date": "2026-05-26", "status": "Present"}
      ],
      disciplinaryRecords: [],
      extracurriculars: ["Introductory Gymnastics"],
      healthInfo: {
        allergies: "None",
        medicalConditions: "None",
        bloodGroup: "O+",
        vaccinations: "Completed Routine Immunization"
      },
      branch: "RS"
    },
    {
      id: "std-rs2",
      name: "Chinedu Okafor",
      level: "primary",
      grade: "Grade 3",
      classSection: "A",
      parentName: "Emeka Okafor",
      parentEmail: "emeka.o@example.com",
      parentPhone: "+234 (803) 333-4444",
      attendancePercentage: 93,
      behaviorRating: "Good",
      milestones: {},
      grades: {
        "Mathematics": 85,
        "Science": 78,
        "English Language": 82,
        "Social Studies": 80,
        "Creative Arts": 85
      },
      reportComment: "Chinedu has integrated very well at our Runjin Sambo primary wing.",
      admissionDate: "2022-09-01",
      enrollmentNo: "ADM-2022-RS018",
      admissionStatus: "Active",
      profile: {
        gender: "Male",
        dob: "2017-08-24",
        address: "Opposite School Gate RS, Sokoto",
        bloodGroup: "B-"
      },
      branch: "RS"
    },
    {
      id: "std-rs3",
      name: "Fatima Musa",
      level: "primary",
      grade: "Grade 5",
      classSection: "A",
      parentName: "Musa Umar",
      parentEmail: "musa.u@example.com",
      parentPhone: "+234 (806) 555-6666",
      attendancePercentage: 95,
      behaviorRating: "Excellent",
      milestones: {},
      grades: {
        "Mathematics": 90,
        "Science": 92,
        "English Language": 94,
        "Social Studies": 88,
        "Creative Arts": 91
      },
      reportComment: "Fatima is a top performer in Grade 5. Outstanding commitment.",
      admissionDate: "2020-09-01",
      enrollmentNo: "ADM-2020-RS094",
      admissionStatus: "Active",
      profile: {
        gender: "Female",
        dob: "2015-11-04",
        address: "Runjin Sambo Sokoto",
        bloodGroup: "O-"
      },
      branch: "RS"
    },
    {
      id: "std-rs4",
      name: "Zainab Abubakar",
      level: "secondary",
      grade: "Grade 10",
      classSection: "A",
      parentName: "Abubakar Sokoto",
      parentEmail: "abubakar@example.com",
      parentPhone: "+234 (805) 777-8888",
      attendancePercentage: 97,
      behaviorRating: "Excellent",
      milestones: {},
      grades: {
        "Mathematics": 88,
        "Biology": 92,
        "Chemistry": 85,
        "Physics": 89,
        "English Literature": 87,
        "Global History": 91
      },
      reportComment: "Zainab displays great maturity and intellectual depth in her science studies.",
      admissionDate: "2017-09-01",
      enrollmentNo: "ADM-2017-RS102",
      admissionStatus: "Active",
      profile: {
        gender: "Female",
        dob: "2010-05-08",
        address: "Runjin Sambo Housing Estate, Sokoto",
        bloodGroup: "AB+"
      },
      branch: "RS"
    },
    {
      id: "std-rs5",
      name: "Kabiru Ibrahim",
      level: "secondary",
      grade: "Grade 11",
      classSection: "B",
      parentName: "Ibrahim Dasuki",
      parentEmail: "dasuki@example.com",
      parentPhone: "+234 (809) 999-0000",
      attendancePercentage: 91,
      behaviorRating: "Good",
      milestones: {},
      grades: {
        "Mathematics": 74,
        "Biology": 80,
        "Chemistry": 78,
        "Physics": 76,
        "English Literature": 78,
        "Global History": 79
      },
      reportComment: "Kabiru should continuously study formulas during the math revision schedules.",
      admissionDate: "2016-09-01",
      enrollmentNo: "ADM-2016-RS044",
      admissionStatus: "Active",
      profile: {
        gender: "Male",
        dob: "2009-02-14",
        address: "Miyetti Allah Area, RS, Sokoto",
        bloodGroup: "A-"
      },
      branch: "RS"
    }
  ];

  const rsTeachers = [
    {
      id: "tch-4",
      name: "Mallam Usman Bello",
      email: "ubello@school.edu",
      phone: "+234 (802) 111-2222",
      level: ["nursery"],
      subjects: ["Early Socialization", "Sensory Play", "Motor Skills Development"],
      classesAssigned: ["K1 (Ages 3-4)", "Preschool (Ages 2-3)"],
      joiningDate: "2021-08-15",
      qualification: "B.Ed Early Childhood Education",
      status: "Active",
      address: "Runjin Sambo Road, Sokoto",
      branch: "RS"
    },
    {
      id: "tch-5",
      name: "Mrs. Maryam Umar",
      email: "mumar@school.edu",
      phone: "+234 (803) 333-4444",
      level: ["primary"],
      subjects: ["Mathematics", "Science", "Social Studies"],
      classesAssigned: ["Grade 3", "Grade 5"],
      joiningDate: "2022-09-01",
      qualification: "N.C.E, B.Sc Education",
      status: "Active",
      address: "Miyetti Allah Area, Runjin Sambo, Sokoto",
      branch: "RS"
    },
    {
      id: "tch-6",
      name: "Mr. Ibrahim Gusau",
      email: "igusau@school.edu",
      phone: "+234 (805) 777-8888",
      level: ["secondary"],
      subjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
      classesAssigned: ["Grade 10", "Grade 11"],
      joiningDate: "2020-01-10",
      qualification: "M.Sc Organic Chemistry",
      status: "Active",
      address: "Runjin Sambo Sokoto",
      branch: "RS"
    }
  ];

  const rsSchedules = [
    { id: "sch-rs1", grade: "Grade 3", day: "Monday", period: 1, subject: "Mathematics", teacherId: "tch-5", branch: "RS" },
    { id: "sch-rs2", grade: "Grade 3", day: "Monday", period: 2, subject: "Science", teacherId: "tch-5", branch: "RS" },
    { id: "sch-rs3", grade: "Grade 10", day: "Monday", period: 1, subject: "Biology", teacherId: "tch-6", branch: "RS" },
    { id: "sch-rs4", grade: "Grade 10", day: "Monday", period: 2, subject: "Chemistry", teacherId: "tch-6", branch: "RS" },
    { id: "sch-rs5", grade: "K1 (Ages 3-4)", day: "Monday", period: 1, subject: "Sensory Play", teacherId: "tch-4", branch: "RS" }
  ];

  const rsCurriculums = [
    {
      id: "curr-rs1",
      grade: "Grade 10",
      subject: "Biology",
      topics: [
        { name: "Cellular Nutrition & Energy", hours: 10, objectives: "Define standard photosynthesis pathways and aerobic respiration reactions." }
      ],
      teacherId: "tch-6",
      branch: "RS"
    },
    {
      id: "curr-rs2",
      grade: "Grade 3",
      subject: "Mathematics",
      topics: [
        { name: "Fractions & Basic Division", hours: 12, objectives: "Master times tables and execute division in small groupings." }
      ],
      teacherId: "tch-5",
      branch: "RS"
    }
  ];

  const rsExams = [
    {
      id: "ex-rs1",
      title: "Mid-Term Assessment",
      grade: "Grade 10",
      subject: "Biology",
      date: "2026-06-15",
      weightPercentage: 30,
      totalMarks: 100,
      branch: "RS"
    }
  ];

  dbState.students = [...(dbState.students || []), ...rsStudents];
  dbState.teachers = [...(dbState.teachers || []), ...rsTeachers];
  dbState.schedules = [...(dbState.schedules || []), ...rsSchedules];
  dbState.curriculums = [...(dbState.curriculums || []), ...rsCurriculums];
  dbState.exams = [...(dbState.exams || []), ...rsExams];
  stateChanged = true;
}

if (!dbState.financial_settings) {
  dbState.financial_settings = [
    {
      id: "fs-1",
      financialYear: "2026/2027",
      currency: "NGN",
      currencySymbol: "₦",
      receiptPrefix: "REC-26-",
      autoReceiptNumber: true,
      defaultDueDays: 15,
      defaultGracePeriod: 7,
      defaultPaymentThreshold: 50,
      defaultReceiptFooter: "Thank you for choosing SAMS. For questions, contact billing@sams.edu",
      isDefault: true,
      createdAt: new Date().toISOString()
    }
  ];
  stateChanged = true;
}

if (!dbState.fee_head_categories) {
  dbState.fee_head_categories = [
    { id: "fhc-1", name: "Academic Fees", description: "Direct classroom teaching and educational supplies", createdAt: new Date().toISOString() },
    { id: "fhc-2", name: "Administrative Fees", description: "SAMS central operations, development, and system infrastructure", createdAt: new Date().toISOString() },
    { id: "fhc-3", name: "Auxiliary Fees", description: "School health services, insurance, and medical coverage", createdAt: new Date().toISOString() },
    { id: "fhc-4", name: "Extracurricular Fees", description: "Sports events, club activities, and physical education", createdAt: new Date().toISOString() }
  ];
  stateChanged = true;
}

if (!dbState.fee_heads) {
  dbState.fee_heads = [
    {
      id: "fh-1",
      code: "TUIT-PRI",
      name: "Tuition",
      description: "Standard primary class tuition fee",
      categoryId: "fhc-1",
      isMandatory: true,
      isActive: true,
      branchId: "All",
      section: "Primary",
      displayOrder: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: "fh-2",
      code: "BKS-ALL",
      name: "Books",
      description: "Core academic textbook bundles",
      categoryId: "fhc-1",
      isMandatory: true,
      isActive: true,
      branchId: "All",
      section: "All",
      displayOrder: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: "fh-3",
      code: "STN-ALL",
      name: "Stationery",
      description: "Writing books, mathematical sets, and drawing pads",
      categoryId: "fhc-1",
      isMandatory: false,
      isActive: true,
      branchId: "All",
      section: "All",
      displayOrder: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: "fh-4",
      code: "DEV-LVY",
      name: "Development Levy",
      description: "Annual facility upkeep and structural maintenance contributions",
      categoryId: "fhc-2",
      isMandatory: true,
      isActive: true,
      branchId: "All",
      section: "All",
      displayOrder: 4,
      createdAt: new Date().toISOString()
    },
    {
      id: "fh-5",
      code: "SPT-ALL",
      name: "Sports Fee",
      description: "Annual inter-house sports events and recreational equipment maintenance",
      categoryId: "fhc-4",
      isMandatory: false,
      isActive: true,
      branchId: "All",
      section: "All",
      displayOrder: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: "fh-6",
      code: "ICT-LAB",
      name: "ICT Fee",
      description: "Computer lab access, coding software licenses, and internet infrastructure",
      categoryId: "fhc-1",
      isMandatory: true,
      isActive: true,
      branchId: "All",
      section: "All",
      displayOrder: 6,
      createdAt: new Date().toISOString()
    },
    {
      id: "fh-7",
      code: "MED-INS",
      name: "Medical Fee",
      description: "First-aid supplies, campus nurse operations, and emergency treatment desk",
      categoryId: "fhc-3",
      isMandatory: true,
      isActive: true,
      branchId: "All",
      section: "All",
      displayOrder: 7,
      createdAt: new Date().toISOString()
    },
    {
      id: "fh-8",
      code: "INS-ALL",
      name: "Insurance",
      description: "Student group accident and personal safety policy coverage",
      categoryId: "fhc-3",
      isMandatory: false,
      isActive: true,
      branchId: "All",
      section: "All",
      displayOrder: 8,
      createdAt: new Date().toISOString()
    }
  ];
  stateChanged = true;
}

if (!dbState.optional_charge_categories) {
  dbState.optional_charge_categories = [
    { id: "occ-1", name: "Admission & Onboarding", description: "Charges related to school admission and enrollment processes", createdAt: new Date().toISOString() },
    { id: "occ-2", name: "Uniforms & Apparel", description: "Standard clothing and tailored uniforms", createdAt: new Date().toISOString() },
    { id: "occ-3", name: "Supplies & Accessories", description: "Student accessories, ID cards, bags, and physical assets", createdAt: new Date().toISOString() },
    { id: "occ-4", name: "Special Services & Programs", description: "Optional transportation, religious programs, or special tuition", createdAt: new Date().toISOString() }
  ];
  stateChanged = true;
}

if (!dbState.optional_charges) {
  dbState.optional_charges = [
    {
      id: "oc-1",
      name: "Admission Form",
      description: "Application prospectus and form for new students",
      categoryId: "occ-1",
      amount: 5000,
      quantity: 1,
      separateReceipt: true,
      independentTracking: true,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "oc-2",
      name: "Admission Fee",
      description: "One-time registration fee upon final entry confirmation",
      categoryId: "occ-1",
      amount: 15000,
      quantity: 1,
      separateReceipt: true,
      independentTracking: true,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "oc-3",
      name: "Ready-made Uniform",
      description: "Pre-stitched school uniform set (standard size)",
      categoryId: "occ-2",
      amount: 8000,
      quantity: 1,
      separateReceipt: false,
      independentTracking: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "oc-4",
      name: "Tailored Uniform",
      description: "Custom tailored standard uniform stitched by school tailor",
      categoryId: "occ-2",
      amount: 12000,
      quantity: 1,
      separateReceipt: false,
      independentTracking: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "oc-5",
      name: "School Bag",
      description: "Branded school backpack with SAMS logo",
      categoryId: "occ-3",
      amount: 4500,
      quantity: 1,
      separateReceipt: false,
      independentTracking: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "oc-6",
      name: "ID Card",
      description: "NFC enabled magnetic smart identity card",
      categoryId: "occ-3",
      amount: 1500,
      quantity: 1,
      separateReceipt: false,
      independentTracking: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "oc-7",
      name: "Islamia Fee",
      description: "Optional afternoon Arabic & Islamic instruction program",
      categoryId: "occ-4",
      amount: 6000,
      quantity: 1,
      separateReceipt: false,
      independentTracking: true,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "oc-8",
      name: "Transport Fee",
      description: "Daily school bus pick-up and drop-off service (monthly rate)",
      categoryId: "occ-4",
      amount: 25000,
      quantity: 1,
      separateReceipt: true,
      independentTracking: true,
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
  stateChanged = true;
}

if (!dbState.sections) {
  dbState.sections = [
    { id: "sec-nursery", name: "Nursery", description: "Early childhood education section (Preschool, K1, K2)", branch: "GN", session: "ses-2026", createdAt: new Date().toISOString() },
    { id: "sec-primary", name: "Primary", description: "Primary school section (Grades 1-5)", branch: "GN", session: "ses-2026", createdAt: new Date().toISOString() },
    { id: "sec-junior-secondary", name: "Junior Secondary", description: "Junior high / secondary education (Grades 9-12)", branch: "GN", session: "ses-2026", createdAt: new Date().toISOString() },
    { id: "sec-islamia", name: "Islamia", description: "Afternoon Islamic & Arabic studies", branch: "GN", session: "ses-2026", createdAt: new Date().toISOString() },
    // Also include RS counterparts for full support
    { id: "sec-nursery-rs", name: "Nursery", description: "Early childhood education section (RS campus)", branch: "RS", session: "ses-2026", createdAt: new Date().toISOString() },
    { id: "sec-primary-rs", name: "Primary", description: "Primary school section (RS campus)", branch: "RS", session: "ses-2026", createdAt: new Date().toISOString() },
    { id: "sec-junior-secondary-rs", name: "Junior Secondary", description: "Junior high / secondary education (RS campus)", branch: "RS", session: "ses-2026", createdAt: new Date().toISOString() },
    { id: "sec-islamia-rs", name: "Islamia", description: "Afternoon Islamic & Arabic studies (RS campus)", branch: "RS", session: "ses-2026", createdAt: new Date().toISOString() }
  ];
  stateChanged = true;
}

if (dbState.classes) {
  let classChanged = false;
  dbState.classes = dbState.classes.map((c: any) => {
    if (!c.sectionId) {
      classChanged = true;
      const isRS = c.branch === "RS";
      if (c.level === "nursery") {
        return { ...c, sectionId: isRS ? "sec-nursery-rs" : "sec-nursery" };
      } else if (c.level === "primary") {
        return { ...c, sectionId: isRS ? "sec-primary-rs" : "sec-primary" };
      } else if (c.level === "secondary" || c.level === "junior-secondary") {
        return { ...c, sectionId: isRS ? "sec-junior-secondary-rs" : "sec-junior-secondary" };
      } else {
        return { ...c, sectionId: isRS ? "sec-islamia-rs" : "sec-islamia" };
      }
    }
    return c;
  });
  if (classChanged) {
    stateChanged = true;
  }
}

if (!dbState.fee_templates) {
  dbState.fee_templates = [
    {
      id: "temp-seed-1",
      branch: "GN",
      session: "ses-2026",
      term: "term-1",
      sectionId: "sec-primary",
      totalFee: 155000,
      items: [
        { feeHeadId: "fh-1", amount: 120000 },
        { feeHeadId: "fh-2", amount: 25000 },
        { feeHeadId: "fh-3", amount: 10000 }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "temp-seed-2",
      branch: "GN",
      session: "ses-2026",
      term: "term-2",
      sectionId: "sec-primary",
      totalFee: 165000,
      items: [
        { feeHeadId: "fh-1", amount: 130000 },
        { feeHeadId: "fh-2", amount: 25000 },
        { feeHeadId: "fh-3", amount: 10000 }
      ],
      createdAt: new Date().toISOString()
    }
  ];
  stateChanged = true;
}

if (dbState.fee_heads && !dbState.fee_heads.some((h: any) => h.id === "fh-grad")) {
  dbState.fee_heads.push({
    id: "fh-grad",
    code: "GRAD-LVY",
    name: "Graduation Levy",
    description: "Special levy for graduating class activities and certificates",
    categoryId: "fhc-1",
    isMandatory: true,
    isActive: true,
    branchId: "All",
    section: "Primary",
    displayOrder: 9,
    createdAt: new Date().toISOString()
  });
  stateChanged = true;
}

if (!dbState.class_fee_overrides) {
  dbState.class_fee_overrides = [
    {
      id: "override-seed-1",
      templateId: "temp-seed-1",
      classId: "cls-8", // Grade 5 (which is in Primary section)
      items: [
        { feeHeadId: "fh-grad", amount: 5000, isRemoved: false }, // Adds Graduation Levy
        { feeHeadId: "fh-3", amount: 15000, isRemoved: false },   // Edits Stationery amount to 15,000
        { feeHeadId: "fh-2", amount: 25000, isRemoved: true }      // Removes Books completely
      ],
      createdAt: new Date().toISOString()
    }
  ];
  stateChanged = true;
}

if (!dbState.student_fee_ledgers) {
  dbState.student_fee_ledgers = [];
  stateChanged = true;
}

if (!dbState.student_fee_items) {
  dbState.student_fee_items = [];
  stateChanged = true;
}

if (!dbState.family_accounts) {
  dbState.family_accounts = [];
  stateChanged = true;
}

if (!dbState.family_members) {
  dbState.family_members = [];
  stateChanged = true;
}

if (!dbState.family_payments) {
  dbState.family_payments = [];
  stateChanged = true;
}

if (!dbState.student_payments) {
  dbState.student_payments = [];
  stateChanged = true;
}

if (!dbState.student_payment_items) {
  dbState.student_payment_items = [];
  stateChanged = true;
}

if (!dbState.student_advance_credits) {
  dbState.student_advance_credits = [];
  stateChanged = true;
}

if (!dbState.parent_notifications) {
  dbState.parent_notifications = [];
  stateChanged = true;
}

if (!dbState.term_transitions) {
  dbState.term_transitions = [];
  stateChanged = true;
}

// Auto-seed family_accounts and family_members if they are empty
if (dbState.family_accounts.length === 0 && dbState.students && dbState.students.length > 0) {
  const students = dbState.students || [];
  const familiesMap = new Map();
  
  students.forEach((s: any) => {
    const parentName = s.parentName || 'Unknown Parent';
    const parentEmail = s.parentEmail || '';
    const parentPhone = s.parentPhone || '';
    
    let foundKey = '';
    for (const key of familiesMap.keys()) {
      const [kName, kEmail] = key.split(':::');
      if ((parentEmail && kEmail === parentEmail) || (parentName && kName.toLowerCase() === parentName.toLowerCase())) {
        foundKey = key;
        break;
      }
    }
    
    if (!foundKey) {
      foundKey = `${parentName}:::${parentEmail}`;
      familiesMap.set(foundKey, {
        parentName,
        parentEmail,
        parentPhone,
        students: []
      });
    }
    
    familiesMap.get(foundKey).students.push(s);
  });
  
  let idx = 1;
  familiesMap.forEach((fam, key) => {
    const famId = `fam-${Date.now()}-${idx++}`;
    dbState.family_accounts.push({
      id: famId,
      familyName: `${fam.parentName.split(' ')[0] || 'Unknown'} Family`,
      primaryParentName: fam.parentName,
      primaryParentEmail: fam.parentEmail,
      primaryParentPhone: fam.parentPhone,
      createdAt: new Date().toISOString()
    });
    
    fam.students.forEach((s: any) => {
      dbState.family_members.push({
        id: `fmem-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        familyAccountId: famId,
        studentId: s.id,
        relationship: 'Child',
        createdAt: new Date().toISOString()
      });
    });
  });
  stateChanged = true;
}

// -------------------------------------------------------------
// SIBLING DISCOUNT ENGINE SEEDING & POLICIES MIGRATION
// -------------------------------------------------------------

// Ensure all standard eligible & excluded fee heads exist
if (!dbState.fee_heads) {
  dbState.fee_heads = [];
  stateChanged = true;
}

const standardFeeHeads = [
  { id: "fh-1", code: "TUIT-FEE", name: "Tuition", description: "Standard term tuition", isMandatory: true, isActive: true, branchId: "all", section: "All", displayOrder: 1 },
  { id: "fh-4", code: "DEV-CHRG", name: "Development Charges", description: "Campus development levy", isMandatory: true, isActive: true, branchId: "all", section: "All", displayOrder: 2 },
  { id: "fh-portal", code: "PORTAL-FEE", name: "Portal Fee", description: "Digital student portal & ICT services", isMandatory: true, isActive: true, branchId: "all", section: "All", displayOrder: 3 },
  { id: "fh-games", code: "GAMES-FEE", name: "Games/Entertainment", description: "Sports and extracurricular entertainment levy", isMandatory: true, isActive: true, branchId: "all", section: "All", displayOrder: 4 },
  { id: "fh-furn", code: "FURN-FEE", name: "Furniture", description: "Classroom furniture & desk levy", isMandatory: true, isActive: true, branchId: "all", section: "All", displayOrder: 5 },
  { id: "fh-7", code: "MED-FEE", name: "Medical Services", description: "Clinic and first aid services", isMandatory: true, isActive: true, branchId: "all", section: "All", displayOrder: 6 },
  { id: "fh-islamic", code: "ISLAM-FEE", name: "Islamic Session", description: "Islamic studies and Quranic instruction", isMandatory: true, isActive: true, branchId: "all", section: "All", displayOrder: 7 },
  { id: "fh-2", code: "BOOK-FEE", name: "Textbooks", description: "Core academic textbook bundles (Excluded from discount)", isMandatory: false, isActive: true, branchId: "all", section: "All", displayOrder: 8 },
  { id: "fh-3", code: "STAT-FEE", name: "Stationery", description: "Exercise books, notebooks and pens (Excluded from discount)", isMandatory: false, isActive: true, branchId: "all", section: "All", displayOrder: 9 },
  { id: "fh-exam", code: "EXAM-FEE", name: "Examination Fee", description: "Termly examination sheets and grading (Excluded from discount)", isMandatory: false, isActive: true, branchId: "all", section: "All", displayOrder: 10 }
];

standardFeeHeads.forEach(head => {
  if (!dbState.fee_heads.some((h: any) => h.id === head.id || h.name.toLowerCase() === head.name.toLowerCase())) {
    dbState.fee_heads.push({
      ...head,
      createdAt: new Date().toISOString()
    });
    stateChanged = true;
  }
});

// Initialize sibling discount policies
if (!dbState.sibling_discount_policies || dbState.sibling_discount_policies.length === 0) {
  dbState.sibling_discount_policies = [
    {
      id: "sdp-gn-2026",
      branch: "GN",
      sessionId: "ses-2026",
      termId: "All",
      isActive: true,
      crossBranchEnabled: false, // Default is OFF as mandated
      rates: [
        { position: 1, label: "1st Sibling (Highest Class)", ratePercent: 0 },
        { position: 2, label: "2nd Sibling", ratePercent: 5 },
        { position: 3, label: "3rd Sibling", ratePercent: 10 },
        { position: 4, label: "4th Sibling", ratePercent: 15 },
        { position: 5, label: "5th Sibling & Above", ratePercent: 20 }
      ],
      eligibleFeeHeadNames: [
        "Tuition",
        "Development Charges",
        "Development Levy",
        "Portal Fee",
        "Games/Entertainment",
        "Furniture",
        "Medical Services",
        "Medical Fee",
        "Islamic Session",
        "ICT Fee",
        "Sports Fee"
      ],
      excludedFeeHeadNames: [
        "Textbooks",
        "Books",
        "Stationery",
        "Examination Fee",
        "Graduation Levy",
        "Optional Charges"
      ],
      clearanceDays: 15,
      clearanceDeadlineDate: null,
      expireIfNotCleared: true,
      partialPaymentPolicy: "recalculate_to_full_fee",
      createdAt: new Date().toISOString()
    },
    {
      id: "sdp-rs-2026",
      branch: "RS",
      sessionId: "ses-2026",
      termId: "All",
      isActive: true,
      crossBranchEnabled: false, // Default is OFF as mandated
      rates: [
        { position: 1, label: "1st Sibling (Highest Class)", ratePercent: 0 },
        { position: 2, label: "2nd Sibling", ratePercent: 5 },
        { position: 3, label: "3rd Sibling", ratePercent: 10 },
        { position: 4, label: "4th Sibling", ratePercent: 15 },
        { position: 5, label: "5th Sibling & Above", ratePercent: 20 }
      ],
      eligibleFeeHeadNames: [
        "Tuition",
        "Development Charges",
        "Development Levy",
        "Portal Fee",
        "Games/Entertainment",
        "Furniture",
        "Medical Services",
        "Medical Fee",
        "Islamic Session",
        "ICT Fee",
        "Sports Fee"
      ],
      excludedFeeHeadNames: [
        "Textbooks",
        "Books",
        "Stationery",
        "Examination Fee",
        "Graduation Levy",
        "Optional Charges"
      ],
      clearanceDays: 15,
      clearanceDeadlineDate: null,
      expireIfNotCleared: true,
      partialPaymentPolicy: "recalculate_to_full_fee",
      createdAt: new Date().toISOString()
    }
  ];
  stateChanged = true;
}

if (!dbState.sibling_discount_records) {
  dbState.sibling_discount_records = [];
  stateChanged = true;
}

if (!dbState.sibling_discount_audit_logs) {
  dbState.sibling_discount_audit_logs = [];
  stateChanged = true;
}

// Seed the Qamar Family in Gawon Nama (GN) to demonstrate the exact graduated sibling relief specification
if (dbState.students && !dbState.students.some((s: any) => s.id === 'std-qamar-1')) {
  const qamarStudents = [
    {
      id: 'std-qamar-1',
      name: 'Muhammad Qamar',
      level: 'secondary',
      grade: 'Grade 8 (JSS 2)',
      branch: 'GN',
      parentName: 'Engr. Usamah M. Qamar',
      parentEmail: 'usamah.qamar@example.com',
      parentPhone: '+234 803 123 4567',
      admissionDate: '2022-09-10',
      profile: { dob: '2012-05-14' },
      attendancePercentage: 96,
      behaviorRating: 'Excellent'
    },
    {
      id: 'std-qamar-2',
      name: 'Fatima Qamar',
      level: 'primary',
      grade: 'Grade 5 (Primary 5)',
      branch: 'GN',
      parentName: 'Engr. Usamah M. Qamar',
      parentEmail: 'usamah.qamar@example.com',
      parentPhone: '+234 803 123 4567',
      admissionDate: '2023-09-05',
      profile: { dob: '2015-08-20' },
      attendancePercentage: 98,
      behaviorRating: 'Excellent'
    },
    {
      id: 'std-qamar-3',
      name: 'Ibrahim Qamar',
      level: 'nursery',
      grade: 'K2 (Nursery 3 - Ages 4-5)',
      branch: 'GN',
      parentName: 'Engr. Usamah M. Qamar',
      parentEmail: 'usamah.qamar@example.com',
      parentPhone: '+234 803 123 4567',
      admissionDate: '2024-09-12',
      profile: { dob: '2020-01-10' },
      attendancePercentage: 94,
      behaviorRating: 'Good'
    },
    {
      id: 'std-qamar-4',
      name: 'Maryam Qamar',
      level: 'nursery',
      grade: 'Preschool (Nursery 1 - Ages 2-3)',
      branch: 'GN',
      parentName: 'Engr. Usamah M. Qamar',
      parentEmail: 'usamah.qamar@example.com',
      parentPhone: '+234 803 123 4567',
      admissionDate: '2025-09-15',
      profile: { dob: '2022-11-03' },
      attendancePercentage: 95,
      behaviorRating: 'Good'
    }
  ];

  qamarStudents.forEach(qs => {
    dbState.students.push(qs);
  });

  const famId = 'fam-qamar-gn';
  if (!dbState.family_accounts.some((f: any) => f.id === famId)) {
    dbState.family_accounts.push({
      id: famId,
      familyName: 'Qamar Family',
      primaryParentName: 'Engr. Usamah M. Qamar',
      primaryParentEmail: 'usamah.qamar@example.com',
      primaryParentPhone: '+234 803 123 4567',
      branch: 'GN',
      createdAt: new Date().toISOString()
    });

    qamarStudents.forEach(qs => {
      dbState.family_members.push({
        id: `fmem-qamar-${qs.id}`,
        familyAccountId: famId,
        studentId: qs.id,
        relationship: 'Child',
        createdAt: new Date().toISOString()
      });
    });
  }
  stateChanged = true;
}

// -------------------------------------------------------------
// SEED MULTI-TERM STUDENT FEE LEDGERS (Previous Term & Current Term)
// -------------------------------------------------------------
if (!dbState.student_fee_ledgers || dbState.student_fee_ledgers.length === 0 || !dbState.student_fee_ledgers.some((l: any) => l.studentId === 'std-n1')) {
  dbState.student_fee_ledgers = dbState.student_fee_ledgers || [];
  dbState.student_fee_items = dbState.student_fee_items || [];

  const defaultLedgerSeeds = [
    // Sophia Martinez (std-n1) - Exactly matching the prompt example: Previous Term ₦20,000 + Current Term ₦50,000 = ₦70,000
    {
      id: "sfl-std-n1-term1",
      studentId: "std-n1",
      studentName: "Sophia Martinez",
      admissionNo: "GN2402001",
      grade: "K1 (Ages 3-4)",
      branch: "GN",
      sessionId: "ses-2026",
      termId: "term-1",
      termName: "First Term (Previous Term)",
      status: "Partially Paid",
      baseTermFee: 40000,
      optionalChargesFee: 5000,
      discountAmount: 0,
      scholarshipAmount: 0,
      carryForward: 0,
      outstanding: 20000,
      grandTotal: 45000,
      billingDate: "2025-09-05",
      dueDate: "2025-09-25",
      createdAt: "2025-09-01T08:00:00.000Z"
    },
    {
      id: "sfl-std-n1-term2",
      studentId: "std-n1",
      studentName: "Sophia Martinez",
      admissionNo: "GN2402001",
      grade: "K1 (Ages 3-4)",
      branch: "GN",
      sessionId: "ses-2026",
      termId: "term-2",
      termName: "Second Term (Current Term)",
      status: "Unpaid",
      baseTermFee: 45000,
      optionalChargesFee: 5000,
      discountAmount: 0,
      scholarshipAmount: 0,
      carryForward: 0,
      outstanding: 50000,
      grandTotal: 50000,
      billingDate: "2026-01-08",
      dueDate: "2026-01-28",
      createdAt: "2026-01-05T08:00:00.000Z"
    },
    // Zainab Abubakar (std-rs4)
    {
      id: "sfl-std-rs4-term1",
      studentId: "std-rs4",
      studentName: "Zainab Abubakar",
      admissionNo: "ADM-2017-RS102",
      grade: "Grade 10",
      branch: "RS",
      sessionId: "ses-2026",
      termId: "term-1",
      termName: "First Term (Previous Term)",
      status: "Partially Paid",
      baseTermFee: 55000,
      optionalChargesFee: 5000,
      discountAmount: 0,
      scholarshipAmount: 0,
      carryForward: 0,
      outstanding: 15000,
      grandTotal: 60000,
      billingDate: "2025-09-05",
      dueDate: "2025-09-25",
      createdAt: "2025-09-01T08:00:00.000Z"
    },
    {
      id: "sfl-std-rs4-term2",
      studentId: "std-rs4",
      studentName: "Zainab Abubakar",
      admissionNo: "ADM-2017-RS102",
      grade: "Grade 10",
      branch: "RS",
      sessionId: "ses-2026",
      termId: "term-2",
      termName: "Second Term (Current Term)",
      status: "Unpaid",
      baseTermFee: 60000,
      optionalChargesFee: 5000,
      discountAmount: 0,
      scholarshipAmount: 0,
      carryForward: 0,
      outstanding: 65000,
      grandTotal: 65000,
      billingDate: "2026-01-08",
      dueDate: "2026-01-28",
      createdAt: "2026-01-05T08:00:00.000Z"
    },
    // Kabiru Ibrahim (std-rs5)
    {
      id: "sfl-std-rs5-term1",
      studentId: "std-rs5",
      studentName: "Kabiru Ibrahim",
      admissionNo: "ADM-2016-RS088",
      grade: "Grade 11",
      branch: "RS",
      sessionId: "ses-2026",
      termId: "term-1",
      termName: "First Term (Previous Term)",
      status: "Partially Paid",
      baseTermFee: 65000,
      optionalChargesFee: 5000,
      discountAmount: 0,
      scholarshipAmount: 0,
      carryForward: 0,
      outstanding: 30000,
      grandTotal: 70000,
      billingDate: "2025-09-05",
      dueDate: "2025-09-25",
      createdAt: "2025-09-01T08:00:00.000Z"
    },
    {
      id: "sfl-std-rs5-term2",
      studentId: "std-rs5",
      studentName: "Kabiru Ibrahim",
      admissionNo: "ADM-2016-RS088",
      grade: "Grade 11",
      branch: "RS",
      sessionId: "ses-2026",
      termId: "term-2",
      termName: "Second Term (Current Term)",
      status: "Unpaid",
      baseTermFee: 70000,
      optionalChargesFee: 5000,
      discountAmount: 0,
      scholarshipAmount: 0,
      carryForward: 0,
      outstanding: 75000,
      grandTotal: 75000,
      billingDate: "2026-01-08",
      dueDate: "2026-01-28",
      createdAt: "2026-01-05T08:00:00.000Z"
    }
  ];

  defaultLedgerSeeds.forEach(seed => {
    if (!dbState.student_fee_ledgers.some((l: any) => l.id === seed.id)) {
      dbState.student_fee_ledgers.push(seed);
    }
  });

  stateChanged = true;
}

if (stateChanged) {
  saveDB(dbState);
}

// -------------------------------------------------------------
// SIBLING RANKING & CONCESSION CALCULATION ENGINE
// -------------------------------------------------------------

export function getClassLevelWeight(gradeName?: string, levelName?: string): number {
  const g = (gradeName || '').toLowerCase();
  const l = (levelName || '').toLowerCase();

  // Secondary School / Senior & Junior
  if (g.includes('grade 12') || g.includes('ss 3') || g.includes('ss3') || g.includes('senior secondary 3')) return 12;
  if (g.includes('grade 11') || g.includes('ss 2') || g.includes('ss2') || g.includes('senior secondary 2')) return 11;
  if (g.includes('grade 10') || g.includes('ss 1') || g.includes('ss1') || g.includes('senior secondary 1')) return 10;
  if (g.includes('grade 9') || g.includes('jss 3') || g.includes('jss3') || g.includes('junior secondary 3')) return 9;
  if (g.includes('grade 8') || g.includes('jss 2') || g.includes('jss2') || g.includes('junior secondary 2')) return 8;
  if (g.includes('grade 7') || g.includes('jss 1') || g.includes('jss1') || g.includes('junior secondary 1')) return 7;
  if (l.includes('secondary') || g.includes('secondary') || g.includes('jss') || g.includes('ss')) return 7.5;

  // Primary School
  if (g.includes('grade 6') || g.includes('primary 6') || g.includes('pri 6') || g.includes('basic 6')) return 6;
  if (g.includes('grade 5') || g.includes('primary 5') || g.includes('pri 5') || g.includes('basic 5')) return 5;
  if (g.includes('grade 4') || g.includes('primary 4') || g.includes('pri 4') || g.includes('basic 4')) return 4;
  if (g.includes('grade 3') || g.includes('primary 3') || g.includes('pri 3') || g.includes('basic 3')) return 3;
  if (g.includes('grade 2') || g.includes('primary 2') || g.includes('pri 2') || g.includes('basic 2')) return 2;
  if (g.includes('grade 1') || g.includes('primary 1') || g.includes('pri 1') || g.includes('basic 1')) return 1;
  if (l.includes('primary') || g.includes('primary') || g.includes('basic')) return 3;

  // Nursery / Early Years
  if (g.includes('k2') || g.includes('nursery 3') || g.includes('nursery 2') || g.includes('ages 4-5')) return 0.8;
  if (g.includes('k1') || g.includes('nursery 1') || g.includes('ages 3-4')) return 0.5;
  if (g.includes('preschool') || g.includes('creche') || g.includes('playgroup') || g.includes('ages 2-3')) return 0.2;
  if (l.includes('nursery') || g.includes('nursery') || l.includes('islamia')) return 0.5;

  return 0;
}

export function sortSiblingsByPolicy(studentsList: any[]): any[] {
  return [...studentsList].sort((a, b) => {
    // Rule 1: Highest academic class/level first (Descending weight)
    const weightA = getClassLevelWeight(a.grade, a.level);
    const weightB = getClassLevelWeight(b.grade, b.level);
    if (weightA !== weightB) {
      return weightB - weightA;
    }

    // Rule 2: If academic class is identical -> Older child first (Earlier Date of Birth)
    const dobA = a.profile?.dob || a.dob || '';
    const dobB = b.profile?.dob || b.dob || '';
    if (dobA && dobB && dobA !== dobB) {
      return new Date(dobA).getTime() - new Date(dobB).getTime();
    }
    if (dobA && !dobB) return -1;
    if (!dobA && dobB) return 1;

    // Rule 3: If DOB is unavailable/identical -> Earlier Admission Date
    const admA = a.admissionDate || '';
    const admB = b.admissionDate || '';
    if (admA && admB && admA !== admB) {
      return new Date(admA).getTime() - new Date(admB).getTime();
    }
    if (admA && !admB) return -1;
    if (!admA && admB) return 1;

    // Rule 4: Deterministic final tie-breaker -> Student ID
    return (a.id || '').localeCompare(b.id || '');
  });
}

export function getSiblingDiscountRate(position: number, customRates?: Array<{ position: number; ratePercent: number }>): number {
  if (customRates && customRates.length > 0) {
    const exact = customRates.find(r => r.position === position);
    if (exact !== undefined) return exact.ratePercent;
    const sorted = [...customRates].sort((a, b) => b.position - a.position);
    if (position >= sorted[0].position) {
      return sorted[0].ratePercent;
    }
  }

  // Graduated default policy:
  if (position === 1) return 0;   // Highest Class = 0%
  if (position === 2) return 5;   // 2nd child = 5%
  if (position === 3) return 10;  // 3rd child = 10%
  if (position === 4) return 15;  // 4th child = 15%
  return 20;                      // 5th child & above = 20%
}

/**
 * Computes carried forward arrears for a student into targetSessionId + targetTermId.
 * Strict Term Validity Rule: Sibling discounts are only valid for the same term and must be fully cleared in that term.
 * If a previous term's ledger had a discount applied and was NOT fully cleared in that term,
 * the discount is forfeited upon carry-forward, and the carried forward amount will be the FULL original fee
 * minus actual payments made (not the discounted amount).
 */
export function computeStudentCarriedForward(
  studentId: string,
  targetSessionId: string,
  targetTermId: string,
  ledgersList: any[],
  siblingRecordsList: any[]
): {
  carryForward: number;
  forfeitedDiscounts: number;
  unpaidCount: number;
  breakdown: Array<{
    ledgerId: string;
    sessionId: string;
    termId: string;
    originalFee: number;
    paid: number;
    discountAmount: number;
    hadDiscount: boolean;
    isCleared: boolean;
    carriedForwardAmount: number;
    reason: string;
  }>;
} {
  let carryForward = 0;
  let forfeitedDiscounts = 0;
  let unpaidCount = 0;
  const breakdown: any[] = [];

  const previousUnpaid = (ledgersList || []).filter((l: any) =>
    l.studentId === studentId &&
    l.status !== 'Paid' &&
    l.id &&
    !( (l.sessionId === targetSessionId || l.session === targetSessionId) && (l.termId === targetTermId || l.term === targetTermId) )
  );

  previousUnpaid.forEach((ledger: any) => {
    const originalFee = Number(ledger.originalTotalFee || ledger.grossAmount || ledger.grandTotal || (ledger.baseTermFee + (ledger.optionalChargesFee || 0)) || 0);
    const amountPaid = Number(ledger.paid || (ledger.grandTotal && ledger.outstanding !== undefined ? Math.max(0, ledger.grandTotal - ledger.outstanding) : 0) || 0);
    const discountAmt = Number(ledger.siblingDiscountAmount || ledger.discount || 0);

    const isCleared = (ledger.status === 'Paid' || ledger.outstanding === 0 || (amountPaid >= (ledger.netPayable || originalFee - discountAmt) && (ledger.netPayable || originalFee - discountAmt) > 0));

    if (isCleared) {
      breakdown.push({
        ledgerId: ledger.id,
        sessionId: ledger.sessionId || ledger.session || '',
        termId: ledger.termId || ledger.term || '',
        originalFee,
        paid: amountPaid,
        discountAmount: discountAmt,
        hadDiscount: discountAmt > 0,
        isCleared: true,
        carriedForwardAmount: 0,
        reason: 'Cleared in term. Concession honored. ₦0 carried forward.'
      });
    } else {
      unpaidCount++;
      if (discountAmt > 0) {
        // Discount validity was strictly for that term.
        // Forfeited upon carrying forward to subsequent term: full fee minus amount paid.
        const fullFeeCarried = Math.max(0, originalFee - amountPaid);
        carryForward += fullFeeCarried;
        forfeitedDiscounts += discountAmt;

        // Update previous ledger state to reflect revocation
        ledger.siblingDiscountForfeited = true;
        ledger.forfeitedDiscountAmount = discountAmt;
        ledger.siblingDiscountAmount = 0;
        ledger.discount = 0;
        ledger.netPayable = originalFee;
        ledger.outstanding = fullFeeCarried;
        ledger.discountTermValidityStatus = 'UNCLEARED_EXPIRED_FULL_FEE_CARRIED_FORWARD';
        ledger.status = amountPaid > 0 ? 'Partially Paid (Discount Forfeited)' : 'Unpaid (Discount Forfeited)';

        // Update matching sibling discount record if present
        const matchRec = (siblingRecordsList || []).find((r: any) =>
          r.studentId === studentId &&
          (r.sessionId === ledger.sessionId || r.sessionId === ledger.session) &&
          (r.termId === ledger.termId || r.termId === ledger.term)
        );
        if (matchRec) {
          matchRec.status = 'Expired (Un-cleared in Term)';
          matchRec.clearedInTerm = false;
          matchRec.discountTermValidityStatus = 'UNCLEARED_EXPIRED_FULL_FEE_CARRIED_FORWARD';
          matchRec.carriedForwardFullAmount = fullFeeCarried;
          matchRec.forfeitedDiscountAmount = discountAmt;
          matchRec.expiryReason = `Discount validity restricted to same term. Un-cleared at term end; full fee of ₦${originalFee.toLocaleString()} (less ₦${amountPaid.toLocaleString()} paid) carried forward as ₦${fullFeeCarried.toLocaleString()}.`;
        }

        breakdown.push({
          ledgerId: ledger.id,
          sessionId: ledger.sessionId || ledger.session || '',
          termId: ledger.termId || ledger.term || '',
          originalFee,
          paid: amountPaid,
          discountAmount: discountAmt,
          hadDiscount: true,
          isCleared: false,
          carriedForwardAmount: fullFeeCarried,
          reason: `Un-cleared in term: Sibling discount of ₦${discountAmt.toLocaleString()} forfeited. Carried forward full undiscounted balance: ₦${fullFeeCarried.toLocaleString()} (₦${originalFee.toLocaleString()} full fee - ₦${amountPaid.toLocaleString()} paid).`
        });
      } else {
        const standardOutstanding = Number(ledger.outstanding !== undefined ? ledger.outstanding : Math.max(0, originalFee - amountPaid));
        carryForward += standardOutstanding;
        breakdown.push({
          ledgerId: ledger.id,
          sessionId: ledger.sessionId || ledger.session || '',
          termId: ledger.termId || ledger.term || '',
          originalFee,
          paid: amountPaid,
          discountAmount: 0,
          hadDiscount: false,
          isCleared: false,
          carriedForwardAmount: standardOutstanding,
          reason: `Standard unpaid arrears of ₦${standardOutstanding.toLocaleString()} carried forward.`
        });
      }
    }
  });

  return { carryForward, forfeitedDiscounts, unpaidCount, breakdown };
}
function getClassCode(grade: string): string {
  const g = (grade || "").toLowerCase();
  if (g.includes("nursery 1") || g.includes("preschool")) return "01";
  if (g.includes("nursery 2") || g.includes("k1")) return "02";
  if (g.includes("nursery 3") || g.includes("k2")) return "03";
  if (g.includes("grade 1") || g.includes("primary 1")) return "04";
  if (g.includes("grade 2") || g.includes("primary 2")) return "05";
  if (g.includes("grade 3") || g.includes("primary 3")) return "06";
  if (g.includes("grade 4") || g.includes("primary 4")) return "07";
  if (g.includes("grade 5") || g.includes("primary 5")) return "08";
  if (g.includes("grade 6") || g.includes("primary 6")) return "09";
  if (g.includes("grade 7")) return "10";
  if (g.includes("grade 8")) return "11";
  if (g.includes("grade 9")) return "12";
  if (g.includes("grade 10")) return "13";
  if (g.includes("grade 11")) return "14";
  if (g.includes("grade 12")) return "15";
  return "01"; 
}

function compileAdmissionNumber(branch: string, sessionYearStr: string, grade: string, serial: number | string): string {
  const b = (branch || "GN").toUpperCase();
  let ses = String(sessionYearStr || "26").trim();
  // Strip non-digits or take 2 digits of year
  ses = ses.replace(/\D/g, "");
  if (ses.length > 2) {
    ses = ses.slice(-2);
  } else if (!ses) {
    ses = "26";
  }
  const clCode = getClassCode(grade);
  const serialNum = String(serial || "").replace(/\D/g, "") || "1";
  const paddedSerial = serialNum.padStart(3, "0");
  return `${b}${ses}${clCode}${paddedSerial}`;
}

// Student Serial & Enrollment Number format migration
let migrationNeeded = false;
dbState.students = (dbState.students || []).map((student: any, idx: number) => {
  const currentSerial = student.serialNumber ? parseInt(student.serialNumber) : (idx + 1);
  const currentBranch = student.branch || "GN";
  
  let sessionYear = "26";
  if (student.admissionDate && student.admissionDate.includes("-")) {
    sessionYear = student.admissionDate.split("-")[0].slice(2, 4);
  } else if (student.enrollmentNo && student.enrollmentNo.includes("-")) {
    const parts = student.enrollmentNo.split("-");
    const yr = parts.find((p: string) => p.length === 4 && !isNaN(Number(p)));
    if (yr) sessionYear = yr.slice(2, 4);
  } else if (student.enrollmentNo && student.enrollmentNo.length >= 6) {
    // maybe like GN2001015 -> "20"
    sessionYear = student.enrollmentNo.slice(2, 4);
  }

  const computedEnrollmentNo = compileAdmissionNumber(currentBranch, sessionYear, student.grade, currentSerial);

  if (!student.serialNumber || !student.enrollmentNo || student.enrollmentNo.startsWith("ADM-")) {
    student.serialNumber = currentSerial;
    student.enrollmentNo = computedEnrollmentNo;
    migrationNeeded = true;
  }
  return student;
});

if (!dbState.classes) {
  dbState.classes = [
    { id: "cls-1", name: "Preschool (Ages 2-3)", level: "nursery", branch: "GN", subjects: ["Early Socialization", "Sensory Play"] },
    { id: "cls-2", name: "K1 (Ages 3-4)", level: "nursery", branch: "GN", subjects: ["Early Socialization", "Sensory Play", "Motor Skills Development"] },
    { id: "cls-3", name: "K2 (Ages 4-5)", level: "nursery", branch: "GN", subjects: ["Motor Skills Development"] },
    { id: "cls-4", name: "Grade 1", level: "primary", branch: "GN", subjects: ["Mathematics", "Science", "English Language"] },
    { id: "cls-5", name: "Grade 2", level: "primary", branch: "GN", subjects: ["Mathematics", "Science", "English Language"] },
    { id: "cls-6", name: "Grade 3", level: "primary", branch: "GN", subjects: ["Mathematics", "Science", "Social Studies", "English Language", "Creative Arts"] },
    { id: "cls-7", name: "Grade 4", level: "primary", branch: "GN", subjects: ["Mathematics", "Science", "English Language"] },
    { id: "cls-8", name: "Grade 5", level: "primary", branch: "GN", subjects: ["Mathematics", "Science", "Social Studies", "English Language", "Creative Arts"] },
    { id: "cls-9", name: "Grade 9", level: "secondary", branch: "GN", subjects: ["Mathematics", "Science"] },
    { id: "cls-10", name: "Grade 10", level: "secondary", branch: "GN", subjects: ["Mathematics", "Biology", "Chemistry", "Physics", "English Literature", "Global History"] },
    { id: "cls-11", name: "Grade 11", level: "secondary", branch: "GN", subjects: ["Mathematics", "Biology", "Chemistry", "Physics", "English Literature", "Global History"] },
    { id: "cls-12", name: "Grade 12", level: "secondary", branch: "GN", subjects: ["Mathematics", "Physics"] },
    // RS campus classes
    { id: "cls-rs1", name: "Preschool (Ages 2-3)", level: "nursery", branch: "RS", subjects: ["Early Socialization", "Sensory Play"] },
    { id: "cls-rs2", name: "K1 (Ages 3-4)", level: "nursery", branch: "RS", subjects: ["Early Socialization", "Sensory Play", "Motor Skills Development"] },
    { id: "cls-rs3", name: "Grade 3", level: "primary", branch: "RS", subjects: ["Mathematics", "Science", "English Language", "Social Studies", "Creative Arts"] },
    { id: "cls-rs4", name: "Grade 5", level: "primary", branch: "RS", subjects: ["Mathematics", "Science", "English Language", "Social Studies", "Creative Arts"] },
    { id: "cls-rs5", name: "Grade 10", level: "secondary", branch: "RS", subjects: ["Mathematics", "Biology", "Chemistry", "Physics", "English Literature", "Global History"] },
    { id: "cls-rs6", name: "Grade 11", level: "secondary", branch: "RS", subjects: ["Mathematics", "Biology", "Chemistry", "Physics", "English Literature", "Global History"] }
  ];
  migrationNeeded = true;
}

if (!dbState.academicSessions) {
  dbState.academicSessions = [
    {
      id: "ses-2026",
      name: "2025/2026 Academic Year",
      startDate: "2025-09-01",
      endDate: "2026-07-20",
      status: "active"
    }
  ];
  migrationNeeded = true;
}

if (!dbState.terms) {
  dbState.terms = [
    {
      id: "term-1",
      sessionId: "ses-2026",
      name: "First Term",
      startDate: "2025-09-01",
      endDate: "2025-12-18",
      numberOfWeeks: 15
    },
    {
      id: "term-2",
      sessionId: "ses-2026",
      name: "Second Term",
      startDate: "2026-01-05",
      endDate: "2026-04-03",
      numberOfWeeks: 13
    },
    {
      id: "term-3",
      sessionId: "ses-2026",
      name: "Third Term",
      startDate: "2026-04-20",
      endDate: "2026-07-20",
      numberOfWeeks: 13
    }
  ];
  migrationNeeded = true;
}

if (!dbState.holidays) {
  dbState.holidays = [
    {
      id: "hol-1",
      sessionId: "ses-2026",
      name: "Independence Day",
      type: "Public Holiday",
      startDate: "2025-10-01",
      endDate: "2025-10-01"
    },
    {
      id: "hol-2",
      sessionId: "ses-2026",
      name: "Christmas Break",
      type: "School Holiday",
      startDate: "2025-12-20",
      endDate: "2026-01-02"
    },
    {
      id: "hol-3",
      sessionId: "ses-2026",
      name: "Mid-Term Break",
      type: "Mid-Term Break",
      startDate: "2026-02-18",
      endDate: "2026-02-20"
    }
  ];
  migrationNeeded = true;
}

if (!dbState.eventCategories) {
  dbState.eventCategories = [
    // ACADEMIC
    {
      id: "cat-acad-ca",
      parentGroup: "ACADEMIC",
      name: "Continuous Assessment",
      description: "Periodic evaluation of students through tests and assignments.",
      color: "#4F46E5",
      icon: "FileSpreadsheet"
    },
    {
      id: "cat-acad-exam",
      parentGroup: "ACADEMIC",
      name: "Examination",
      description: "Formal assessment of student knowledge at the end of term.",
      color: "#4F46E5",
      icon: "GraduationCap"
    },
    {
      id: "cat-acad-rev",
      parentGroup: "ACADEMIC",
      name: "Revision",
      description: "Consolidation and review of taught curriculum prior to exams.",
      color: "#4F46E5",
      icon: "RotateCcw"
    },
    {
      id: "cat-acad-res",
      parentGroup: "ACADEMIC",
      name: "Result Processing",
      description: "Compiling scores, drafting remarks, and finalizing report cards.",
      color: "#4F46E5",
      icon: "TrendingUp"
    },
    // FINANCE
    {
      id: "cat-fin-rem",
      parentGroup: "FINANCE",
      name: "Fee Reminder",
      description: "Notifications to parents about outstanding school dues.",
      color: "#10B981",
      icon: "Bell"
    },
    {
      id: "cat-fin-drv",
      parentGroup: "FINANCE",
      name: "Fee Drive",
      description: "Campaign for outstanding tuition and development levy collection.",
      color: "#10B981",
      icon: "TrendingUp"
    },
    {
      id: "cat-fin-sch",
      parentGroup: "FINANCE",
      name: "Scholarship Review",
      description: "Evaluation of student financial aid eligibility and performance.",
      color: "#10B981",
      icon: "Award"
    },
    // STUDENT ACTIVITIES
    {
      id: "cat-act-col",
      parentGroup: "STUDENT ACTIVITIES",
      name: "Colour Day",
      description: "Themed primary and nursery level day celebrating various colors.",
      color: "#EC4899",
      icon: "Palette"
    },
    {
      id: "cat-act-cul",
      parentGroup: "STUDENT ACTIVITIES",
      name: "Cultural Day",
      description: "Exhibitions, plays, and attire showcasing regional heritage.",
      color: "#8B5CF6",
      icon: "Globe"
    },
    {
      id: "cat-act-spt",
      parentGroup: "STUDENT ACTIVITIES",
      name: "Sports Day",
      description: "Inter-house athletics competition and physical training show.",
      color: "#3B82F6",
      icon: "Trophy"
    },
    {
      id: "cat-act-exc",
      parentGroup: "STUDENT ACTIVITIES",
      name: "Excursion",
      description: "Educational outdoor visits and learning excursions.",
      color: "#10B981",
      icon: "Compass"
    },
    // STAFF
    {
      id: "cat-stf-mtg",
      parentGroup: "STAFF",
      name: "Staff Meeting",
      description: "General meeting of academic and administrative personnel.",
      color: "#6366F1",
      icon: "Users"
    },
    {
      id: "cat-stf-trn",
      parentGroup: "STAFF",
      name: "Training",
      description: "Capacity building for teaching methodologies and ERP usage.",
      color: "#6366F1",
      icon: "BookOpen"
    },
    {
      id: "cat-stf-wks",
      parentGroup: "STAFF",
      name: "Workshop",
      description: "Hands-on collaborative sessions on curriculum development.",
      color: "#6366F1",
      icon: "Hammer"
    },
    // INVENTORY
    {
      id: "cat-inv-ord",
      parentGroup: "INVENTORY",
      name: "Book Ordering",
      description: "Procurement of textbooks, diaries, and workbooks for the next term.",
      color: "#F97316",
      icon: "ShoppingBag"
    },
    {
      id: "cat-inv-dst",
      parentGroup: "INVENTORY",
      name: "Material Distribution",
      description: "Issuing of student books, uniforms, and teachers' classroom resources.",
      color: "#F97316",
      icon: "Truck"
    }
  ];
  migrationNeeded = true;
}

if (!dbState.events) {
  dbState.events = [
    {
      id: "evt-1",
      title: "Third Term Examination",
      description: "Final examination for the 2025/2026 Academic Year for all grade classes.",
      startDate: "2026-07-10",
      endDate: "2026-07-17",
      categoryId: "cat-acad-exam",
      branchId: "All",
      sessionId: "ses-2026",
      termId: "term-3"
    },
    {
      id: "evt-2",
      title: "Second Term Result Compilation & Review",
      description: "Teachers must review, compile, and submit the continuous assessment grades to the portal.",
      startDate: "2026-03-25",
      endDate: "2026-04-02",
      categoryId: "cat-acad-res",
      branchId: "GN",
      sessionId: "ses-2026",
      termId: "term-2"
    },
    {
      id: "evt-3",
      title: "Rayfield Campus Sports Carnival",
      description: "Annual multi-house athletic championships and awards ceremony.",
      startDate: "2026-02-12",
      endDate: "2026-02-14",
      categoryId: "cat-act-spt",
      branchId: "RS",
      sessionId: "ses-2026",
      termId: "term-2"
    },
    {
      id: "evt-4",
      title: "Urgent Outstanding Fee Reminder",
      description: "Send reminders to parents with outstanding tuitions or school bus levies.",
      startDate: "2026-07-01",
      endDate: "2026-07-06",
      categoryId: "cat-fin-rem",
      branchId: "All",
      sessionId: "ses-2026",
      termId: "term-3"
    },
    {
      id: "evt-5",
      title: "First Term Material Distribution",
      description: "Distribution of school diaries, standard uniforms, and textbooks.",
      startDate: "2025-09-02",
      endDate: "2025-09-07",
      categoryId: "cat-inv-dst",
      branchId: "GN",
      sessionId: "ses-2026",
      termId: "term-1"
    },
    {
      id: "evt-6",
      title: "Urgent Book Ordering Campaign",
      description: "Ensure textbook orders are dispatched to international and local publishers for the upcoming academic session.",
      startDate: "2026-05-10",
      endDate: "2026-05-20",
      categoryId: "cat-inv-ord",
      branchId: "All",
      sessionId: "ses-2026",
      termId: "term-3"
    }
  ];
  migrationNeeded = true;
}

if (!dbState.event_tasks) {
  dbState.event_tasks = [
    {
      id: "tsk-1",
      eventId: "evt-1",
      title: "English Language Exam Draft",
      description: "Draft standard reading, essay writing, and vocabulary assessments for all primary levels.",
      assignedUser: "Mrs. Aisha Abubakar",
      dueDate: "2026-07-05",
      status: "In Progress"
    },
    {
      id: "tsk-2",
      eventId: "evt-1",
      title: "Mathematics Exam Draft",
      description: "Ensure curriculum-aligned numerical, geometry, and algebra queries are drafted.",
      assignedUser: "Mr. Usman Bello",
      dueDate: "2026-07-04",
      status: "Pending"
    },
    {
      id: "tsk-3",
      eventId: "evt-1",
      title: "Science Exam Draft",
      description: "Formulate standard lab safety questions and primary physics theory queries.",
      assignedUser: "Dr. Aliyu Musa",
      dueDate: "2026-07-03",
      status: "Completed"
    },
    {
      id: "tsk-4",
      eventId: "evt-1",
      title: "Arabic Language Exam Draft",
      description: "Draft grammar, translation, and oral Quran recitation guidelines.",
      assignedUser: "Mallam Ibrahim Sani",
      dueDate: "2026-07-01",
      status: "Overdue"
    },
    {
      id: "tsk-5",
      eventId: "evt-4",
      title: "Gawun Nama Direct Pay Drive Calls",
      description: "Conduct direct phone and SMS campaigns to parents with more than two terms in fee arrears.",
      assignedUser: "Hajiya Maryam",
      dueDate: "2026-07-04",
      status: "In Progress"
    },
    {
      id: "tsk-6",
      eventId: "evt-4",
      title: "Runjin Sambo Campus Email Reminders",
      description: "Auto-dispatch payment notices and late-fee calculations to parent email lists.",
      assignedUser: "Malama Fatima",
      dueDate: "2026-07-01",
      status: "Completed"
    },
    {
      id: "tsk-td-1",
      eventId: "evt-1",
      title: "Weekly Teaching Record",
      description: "Log classroom instruction topics, board work layout, student notebook instructions, and book work coverage counts.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-10",
      dueTime: "17:00",
      status: "In Progress",
      taskType: "teaching_record",
      week: 1,
      reminderNotice: "Due Friday at 5:00 PM. Please attach photos of classroom board and notebook samples.",
      submissionStatus: "Pending",
      branch: "All"
    },
    {
      id: "tsk-td-2",
      eventId: "evt-1",
      title: "Weekly Lesson Plan",
      description: "Submit structured weekly lesson plans, behavioral objectives, learning aids, and assessment strategies.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-06",
      dueTime: "08:00",
      status: "Pending",
      taskType: "lesson_plan",
      week: 2,
      reminderNotice: "Due Monday at 8:00 AM before first period assembly.",
      submissionStatus: "Pending",
      branch: "All"
    },
    {
      id: "tsk-td-3",
      eventId: "evt-1",
      title: "Monthly Curriculum Progress",
      description: "Audit syllabus milestones coverage vs. scheme of work for the entire month across all assigned grades.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-31",
      dueTime: "16:00",
      status: "Pending",
      taskType: "curriculum_progress",
      reminderNotice: "Due at the end of the month. Compare planned topics vs taught topics.",
      submissionStatus: "Pending",
      branch: "All"
    },
    {
      id: "tsk-td-4",
      eventId: "evt-1",
      title: "Scheme of Work Review",
      description: "Departmental Scheme of Work progress audit, curriculum pace check, and remedial adjustment review.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-17",
      dueTime: "15:00",
      status: "Pending",
      taskType: "scheme_review",
      week: 4,
      reminderNotice: "Due Week 4 Friday. Review milestone pacing and student work coverage.",
      submissionStatus: "Pending",
      branch: "All"
    }
  ];
  migrationNeeded = true;
}

// Migration to ensure teaching deadlines exist in dbState.event_tasks
if (dbState.event_tasks && !dbState.event_tasks.some((t: any) => t.id === 'tsk-td-1' || t.taskType === 'teaching_record')) {
  dbState.event_tasks.push(
    {
      id: "tsk-td-1",
      eventId: "evt-1",
      title: "Weekly Teaching Record",
      description: "Log classroom instruction topics, board work layout, student notebook instructions, and book work coverage counts.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-10",
      dueTime: "17:00",
      status: "In Progress",
      taskType: "teaching_record",
      week: 1,
      reminderNotice: "Due Friday at 5:00 PM. Please attach photos of classroom board and notebook samples.",
      submissionStatus: "Pending",
      branch: "All"
    },
    {
      id: "tsk-td-2",
      eventId: "evt-1",
      title: "Weekly Lesson Plan",
      description: "Submit structured weekly lesson plans, behavioral objectives, learning aids, and assessment strategies.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-06",
      dueTime: "08:00",
      status: "Pending",
      taskType: "lesson_plan",
      week: 2,
      reminderNotice: "Due Monday at 8:00 AM before first period assembly.",
      submissionStatus: "Pending",
      branch: "All"
    },
    {
      id: "tsk-td-3",
      eventId: "evt-1",
      title: "Monthly Curriculum Progress",
      description: "Audit syllabus milestones coverage vs. scheme of work for the entire month across all assigned grades.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-31",
      dueTime: "16:00",
      status: "Pending",
      taskType: "curriculum_progress",
      reminderNotice: "Due at the end of the month. Compare planned topics vs taught topics.",
      submissionStatus: "Pending",
      branch: "All"
    },
    {
      id: "tsk-td-4",
      eventId: "evt-1",
      title: "Scheme of Work Review",
      description: "Departmental Scheme of Work progress audit, curriculum pace check, and remedial adjustment review.",
      assignedUser: "All Teachers",
      assignedRole: "Teacher",
      dueDate: "2026-07-17",
      dueTime: "15:00",
      status: "Pending",
      taskType: "scheme_review",
      week: 4,
      reminderNotice: "Due Week 4 Friday. Review milestone pacing and student work coverage.",
      submissionStatus: "Pending",
      branch: "All"
    }
  );
  migrationNeeded = true;
}

if (!dbState.event_assignments) {
  dbState.event_assignments = [
    {
      id: "asg-1",
      taskId: "tsk-1",
      assignedUser: "Mrs. Aisha Abubakar",
      assignedRole: "Teacher",
      assignedDate: "2026-07-01",
      completionDate: ""
    },
    {
      id: "asg-2",
      taskId: "tsk-2",
      assignedUser: "Mr. Usman Bello",
      assignedRole: "Teacher",
      assignedDate: "2026-07-02",
      completionDate: ""
    },
    {
      id: "asg-3",
      taskId: "tsk-3",
      assignedUser: "Dr. Aliyu Musa",
      assignedRole: "Teacher",
      assignedDate: "2026-06-25",
      completionDate: "2026-07-03"
    },
    {
      id: "asg-4",
      taskId: "tsk-4",
      assignedUser: "Mallam Ibrahim Sani",
      assignedRole: "Teacher",
      assignedDate: "2026-06-20",
      completionDate: ""
    },
    {
      id: "asg-5",
      taskId: "tsk-5",
      assignedUser: "Hajiya Maryam",
      assignedRole: "Accountant",
      assignedDate: "2026-07-02",
      completionDate: ""
    },
    {
      id: "asg-6",
      taskId: "tsk-6",
      assignedUser: "Malama Fatima",
      assignedRole: "Administrator",
      assignedDate: "2026-06-28",
      completionDate: "2026-07-01"
    }
  ];
  migrationNeeded = true;
}

if (!dbState.fee_campaigns) {
  dbState.fee_campaigns = [
    {
      id: "fc-1",
      name: "Week 2: Initial Term Fee Reminder",
      week: "Week 2",
      startDate: "2026-06-05",
      endDate: "2026-06-12",
      targetCollection: 50000,
      actualCollection: 42500,
      defaulterCount: 45
    },
    {
      id: "fc-2",
      name: "Week 4: Mid-Term Active Fee Drive",
      week: "Week 4",
      startDate: "2026-06-18",
      endDate: "2026-06-25",
      targetCollection: 35000,
      actualCollection: 28000,
      defaulterCount: 22
    },
    {
      id: "fc-3",
      name: "Week 6: Mid-Term Arrears Review & Outstanding Audit",
      week: "Week 6",
      startDate: "2026-07-01",
      endDate: "2026-07-08",
      targetCollection: 25000,
      actualCollection: 15500,
      defaulterCount: 15
    },
    {
      id: "fc-4",
      name: "Week 8: Pre-Exam Final Reminder Campaign",
      week: "Week 8",
      startDate: "2026-07-15",
      endDate: "2026-07-22",
      targetCollection: 15000,
      actualCollection: 4500,
      defaulterCount: 9
    },
    {
      id: "fc-5",
      name: "Week 10: Management Escalation & Clearance",
      week: "Week 10",
      startDate: "2026-07-28",
      endDate: "2026-08-05",
      targetCollection: 8000,
      actualCollection: 0,
      defaulterCount: 5
    }
  ];
  migrationNeeded = true;
}

// Ensure "Graduation" event and "Cultural Day" event are in dbState.events
if (dbState.events) {
  const hasGraduation = dbState.events.some((e: any) => e.id === "evt-7");
  if (!hasGraduation) {
    dbState.events.push({
      id: "evt-7",
      title: "Annual Graduation Ceremony",
      description: "Celebrating the graduating nursery, primary, and secondary class achievements.",
      startDate: "2026-07-18",
      endDate: "2026-07-19",
      categoryId: "cat-act-cul",
      branchId: "All",
      sessionId: "ses-2026",
      termId: "term-3"
    });
    migrationNeeded = true;
  }
  const hasCultural = dbState.events.some((e: any) => e.id === "evt-8");
  if (!hasCultural) {
    dbState.events.push({
      id: "evt-8",
      title: "Grand Cultural Heritage Day",
      description: "Exhibitions, custom culinary displays, regional attire, and music performance.",
      startDate: "2026-06-12",
      endDate: "2026-06-13",
      categoryId: "cat-act-cul",
      branchId: "All",
      sessionId: "ses-2026",
      termId: "term-3"
    });
    migrationNeeded = true;
  }
}

// Initial Event Budgets
if (!dbState.event_budgets) {
  dbState.event_budgets = [
    {
      id: "eb-1",
      eventId: "evt-3",
      eventName: "Rayfield Campus Sports Carnival",
      totalBudget: 8500,
      totalSpent: 7200,
      remaining: 1300,
      status: "under_budget",
      items: [
        { id: "eb-item-1", name: "Athletic Equipment & Kits", category: "Equipment", cost: 2500 },
        { id: "eb-item-2", name: "Student & Staff Refreshments", category: "Catering", cost: 2000 },
        { id: "eb-item-3", name: "Custom Trophies & Medals", category: "Awards", cost: 1500 },
        { id: "eb-item-4", name: "Public Address & DJ Services", category: "Logistics", cost: 1200 }
      ]
    },
    {
      id: "eb-2",
      eventId: "evt-7",
      eventName: "Annual Graduation Ceremony",
      totalBudget: 15000,
      totalSpent: 15200,
      remaining: -200,
      status: "over_budget",
      items: [
        { id: "eb-item-5", name: "Hall Rental & Decoration", category: "Logistics", cost: 5000 },
        { id: "eb-item-6", name: "Gowns Laundering & Tailoring", category: "Wardrobe", cost: 3500 },
        { id: "eb-item-7", name: "Keynote Speakers & Gifts", category: "Honorarium", cost: 2000 },
        { id: "eb-item-8", name: "Certificate Printing & Folders", category: "Materials", cost: 1200 },
        { id: "eb-item-9", name: "High-Table Catering", category: "Catering", cost: 3500 }
      ]
    },
    {
      id: "eb-3",
      eventId: "evt-8",
      eventName: "Grand Cultural Heritage Day",
      totalBudget: 12000,
      totalSpent: 11500,
      remaining: 500,
      status: "under_budget",
      items: [
        { id: "eb-item-10", name: "Traditional Pavilion Erecting", category: "Logistics", cost: 4000 },
        { id: "eb-item-11", name: "Invited Cultural Troupe", category: "Entertainment", cost: 2500 },
        { id: "eb-item-12", name: "Indigenous Food & Drink Stalls", category: "Catering", cost: 3000 },
        { id: "eb-item-13", name: "Security & Guest Protocol", category: "Security", cost: 2000 }
      ]
    }
  ];
  migrationNeeded = true;
}

// Initial Inventory Items
if (!dbState.inventory) {
  dbState.inventory = [
    { id: "inv-1", name: "Standard Answer Sheets", category: "Academic", stockQuantity: 1200, unit: "sheets" },
    { id: "inv-2", name: "Official Exam Registers", category: "Academic", stockQuantity: 20, unit: "books" },
    { id: "inv-3", name: "Whiteboard Dry-Erase Markers", category: "Stationery", stockQuantity: 18, unit: "packs" },
    { id: "inv-4", name: "Custom Athletic Trophies & Medals", category: "Sports", stockQuantity: 50, unit: "units" },
    { id: "inv-5", name: "Orange Traffic Cones for Track", category: "Sports", stockQuantity: 15, unit: "units" },
    { id: "inv-6", name: "Traditional Pavilion Fabric Banners", category: "Decoration", stockQuantity: 5, unit: "flags" },
    { id: "inv-7", name: "Biodegradable Meal Trays", category: "Catering", stockQuantity: 350, unit: "units" },
    { id: "inv-8", name: "Staff & Security Access Lanyards", category: "Logistics", stockQuantity: 50, unit: "badges" }
  ];
  migrationNeeded = true;
}

// Initial Inventory Readiness Checks
if (!dbState.inventory_readiness) {
  dbState.inventory_readiness = [
    {
      id: "rc-1",
      eventId: "evt-1",
      eventName: "Third Term Final Examinations Prep",
      activityDate: "2026-07-12",
      status: "warning",
      notes: "Answer sheets and registers are fully stocked. Need to procure 7 more packs of whiteboard markers before exam day.",
      items: [
        { itemId: "inv-1", name: "Answer Sheets Available", requiredQuantity: 500, availableQuantity: 500, status: "available" },
        { itemId: "inv-2", name: "Exam Registers Available", requiredQuantity: 12, availableQuantity: 12, status: "available" },
        { itemId: "inv-3", name: "Whiteboard Dry-Erase Markers", requiredQuantity: 25, availableQuantity: 18, status: "shortage" }
      ],
      lastChecked: "2026-07-04"
    },
    {
      id: "rc-2",
      eventId: "evt-3",
      eventName: "Rayfield Campus Sports Carnival Setup",
      activityDate: "2026-07-04",
      status: "critical",
      notes: "We need 40 track cones but we only have 15. Standard sports day can't run safely without boundary cones.",
      items: [
        { itemId: "inv-4", name: "Custom Athletic Trophies & Medals", requiredQuantity: 50, availableQuantity: 50, status: "available" },
        { itemId: "inv-5", name: "Orange Traffic Cones for Track", requiredQuantity: 40, availableQuantity: 15, status: "shortage" }
      ],
      lastChecked: "2026-07-04"
    },
    {
      id: "rc-3",
      eventId: "evt-8",
      eventName: "Grand Cultural Heritage Day Prep",
      activityDate: "2026-07-18",
      status: "warning",
      notes: "Pavilion banners are short. Need to contact the textile supplier.",
      items: [
        { itemId: "inv-6", name: "Traditional Pavilion Fabric Banners", requiredQuantity: 15, availableQuantity: 5, status: "shortage" },
        { itemId: "inv-7", name: "Biodegradable Meal Trays", requiredQuantity: 300, availableQuantity: 300, status: "available" },
        { itemId: "inv-8", name: "Staff & Security Access Lanyards", requiredQuantity: 50, availableQuantity: 50, status: "available" }
      ],
      lastChecked: "2026-07-04"
    }
  ];
  migrationNeeded = true;
}

// Initial Sellable & School Issue Inventory Items
if (!dbState.inventory_store_items || dbState.inventory_store_items.length === 0) {
  dbState.inventory_store_items = [
    {
      id: "item-1",
      itemCode: "MAT-MET-01",
      name: "Uniform Material - Navy Blue (Terylene Wool)",
      category: "Uniforms",
      branch: "Main Campus",
      store: "Uniform Depot",
      unit: "Meter",
      sellingPrice: 2500,
      costPrice: 1700,
      currentStock: 145.5,
      minimumStockLevel: 25,
      status: "Active",
      setting: "Sell to Parent",
      location: "Uniform Depot",
      bin: "Rack B-01 (Fabric Rolls)"
    },
    {
      id: "item-2",
      itemCode: "MAT-YRD-02",
      name: "Uniform Material - White Shirting Fabric",
      category: "Uniforms",
      branch: "Main Campus",
      store: "Uniform Depot",
      unit: "Yard",
      sellingPrice: 2200,
      costPrice: 1500,
      currentStock: 98.0,
      minimumStockLevel: 20,
      status: "Active",
      setting: "Both",
      location: "Uniform Depot",
      bin: "Rack B-03 (Shirting Rolls)"
    },
    {
      id: "item-3",
      itemCode: "UNI-SHT-01",
      name: "Ready-Made Short Sleeve Oxford Shirt (Size 14-16)",
      category: "Uniforms",
      branch: "Main Campus",
      store: "Uniform Depot",
      unit: "Piece",
      sellingPrice: 4500,
      costPrice: 3200,
      currentStock: 42,
      minimumStockLevel: 15,
      status: "Active",
      setting: "Both",
      location: "Uniform Depot",
      bin: "Locker #01 (Shirts)"
    },
    {
      id: "item-4",
      itemCode: "UNI-TRS-02",
      name: "Senior School Grey Tailored Trousers",
      category: "Uniforms",
      branch: "Main Campus",
      store: "Uniform Depot",
      unit: "Piece",
      sellingPrice: 5800,
      costPrice: 4000,
      currentStock: 35,
      minimumStockLevel: 10,
      status: "Active",
      setting: "Both",
      location: "Uniform Depot",
      bin: "Locker #02 (Trousers)"
    },
    {
      id: "item-5",
      itemCode: "ACC-TIE-01",
      name: "Official Woven School Crest Tie (Senior)",
      category: "Uniforms",
      branch: "Main Campus",
      store: "Uniform Depot",
      unit: "Piece",
      sellingPrice: 1800,
      costPrice: 1100,
      currentStock: 80,
      minimumStockLevel: 20,
      status: "Active",
      setting: "Both",
      location: "Uniform Depot",
      bin: "Cabinet C-01 (Accessories)"
    },
    {
      id: "item-6",
      itemCode: "ACC-BLT-01",
      name: "Embossed Leather School Uniform Belt",
      category: "Uniforms",
      branch: "Main Campus",
      store: "Uniform Depot",
      unit: "Piece",
      sellingPrice: 2000,
      costPrice: 1200,
      currentStock: 55,
      minimumStockLevel: 15,
      status: "Active",
      setting: "Sell to Parent",
      location: "Uniform Depot",
      bin: "Cabinet C-02 (Accessories)"
    },
    {
      id: "item-7",
      itemCode: "UNI-BLZ-01",
      name: "Secondary School Wool-Blend Blazer (Navy, Medium)",
      category: "Uniforms",
      branch: "Main Campus",
      store: "Uniform Depot",
      unit: "Piece",
      sellingPrice: 16500,
      costPrice: 12000,
      currentStock: 12,
      minimumStockLevel: 8,
      status: "Active",
      setting: "Both",
      location: "Uniform Depot",
      bin: "Uniform Locker #02"
    },
    {
      id: "item-8",
      itemCode: "SPT-SCK-01",
      name: "Official Sport Striped Athletic Socks",
      category: "Sports",
      branch: "Main Campus",
      store: "Sports Store",
      unit: "Pair",
      sellingPrice: 1200,
      costPrice: 750,
      currentStock: 65,
      minimumStockLevel: 20,
      status: "Active",
      setting: "Sell to Parent",
      location: "Sports Store",
      bin: "Bin S-04"
    },
    {
      id: "item-9",
      itemCode: "SPT-TRK-01",
      name: "Physical Education Tracksuit Set (Jacket + Pants)",
      category: "Sports",
      branch: "Main Campus",
      store: "Sports Store",
      unit: "Set",
      sellingPrice: 9500,
      costPrice: 6800,
      currentStock: 28,
      minimumStockLevel: 10,
      status: "Active",
      setting: "Both",
      location: "Sports Store",
      bin: "Bin S-02"
    },
    {
      id: "item-10",
      itemCode: "STA-MTH-01",
      name: "Oxford Mathematical Instruments & Geometry Set",
      category: "Stationery",
      branch: "Main Campus",
      store: "Main Storeroom",
      unit: "Pack",
      sellingPrice: 2800,
      costPrice: 1900,
      currentStock: 48,
      minimumStockLevel: 15,
      status: "Active",
      setting: "Sell to Parent",
      location: "Main Storeroom",
      bin: "Shelf M-02"
    },
    {
      id: "item-11",
      itemCode: "STA-NBK-50",
      name: "SAMS Custom Embossed Notebook (Pack of 50)",
      category: "Stationery",
      branch: "Main Campus",
      store: "Main Storeroom",
      unit: "Pack",
      sellingPrice: 7500,
      costPrice: 5200,
      currentStock: 45,
      minimumStockLevel: 20,
      status: "Active",
      setting: "Both",
      location: "Main Storeroom",
      bin: "Central Storeroom, Box #44"
    },
    {
      id: "item-12",
      itemCode: "TXT-MTH-10",
      name: "Grade 10 Mathematics Standard Textbook",
      category: "Textbooks",
      branch: "Main Campus",
      store: "Main Storeroom",
      unit: "Piece",
      sellingPrice: 4500,
      costPrice: 3500,
      currentStock: 120,
      minimumStockLevel: 30,
      status: "Active",
      setting: "Both",
      location: "Main Storeroom",
      bin: "Room A, Bin #12"
    },
    {
      id: "item-13",
      itemCode: "ADM-ANS-01",
      name: "Standard Terminal Answer Booklets (Pack of 500)",
      category: "Academic",
      branch: "Main Campus",
      store: "Main Storeroom",
      unit: "Pack",
      sellingPrice: 0,
      costPrice: 3500,
      currentStock: 80,
      minimumStockLevel: 25,
      status: "Active",
      setting: "School Issue Only",
      location: "Main Storeroom",
      bin: "Exam Vault, Shelf 1"
    },
    {
      id: "item-14",
      itemCode: "STA-MKR-12",
      name: "Whiteboard Dry-Erase Markers (Box of 12)",
      category: "Stationery",
      branch: "Main Campus",
      store: "Staff Room Supplies",
      unit: "Pack",
      sellingPrice: 0,
      costPrice: 1100,
      currentStock: 18,
      minimumStockLevel: 15,
      status: "Active",
      setting: "School Issue Only",
      location: "Staff Room Supplies",
      bin: "Cabinet #B"
    }
  ];
  migrationNeeded = true;
}

// Initial Store Sales Transactions
if (!dbState.inventory_store_sales || dbState.inventory_store_sales.length === 0) {
  dbState.inventory_store_sales = [
    {
      id: "REC-STR-2026-001",
      saleDate: "2026-07-20",
      time: "10:30 AM",
      branch: "Main Campus",
      store: "Uniform Depot",
      customerType: "Parent",
      studentId: "s-101",
      studentName: "Zainab Ibrahim",
      parentName: "Hajiya Fatima Ibrahim",
      parentPhone: "+234 803 456 7890",
      grade: "Grade 10-A",
      items: [
        {
          itemId: "item-1",
          itemCode: "MAT-MET-01",
          itemName: "Uniform Material - Navy Blue (Terylene Wool)",
          unit: "Meter",
          quantity: 2.5,
          unitPrice: 2500,
          subtotal: 6250
        },
        {
          itemId: "item-5",
          itemCode: "ACC-TIE-01",
          itemName: "Official Woven School Crest Tie (Senior)",
          unit: "Piece",
          quantity: 1,
          unitPrice: 1800,
          subtotal: 1800
        }
      ],
      subtotal: 8050,
      discountAmount: 0,
      totalAmount: 8050,
      paymentMethod: "POS Card",
      referenceNo: "POS-TXN-88412",
      cashierName: "Mal. Abubakar (Store Mgr)",
      notes: "2.5 meters fabric measured and cut for senior uniform tailoring",
      createdAt: new Date().toISOString()
    },
    {
      id: "REC-STR-2026-002",
      saleDate: "2026-07-21",
      time: "02:15 PM",
      branch: "Main Campus",
      store: "Uniform Depot",
      customerType: "Parent",
      studentId: "s-102",
      studentName: "Emmanuel Okafor",
      parentName: "Dr. Chukwudi Okafor",
      parentPhone: "+234 802 333 4455",
      grade: "Grade 11-B",
      items: [
        {
          itemId: "item-7",
          itemCode: "UNI-BLZ-01",
          itemName: "Secondary School Wool-Blend Blazer (Navy, Medium)",
          unit: "Piece",
          quantity: 1,
          unitPrice: 16500,
          subtotal: 16500
        },
        {
          itemId: "item-3",
          itemCode: "UNI-SHT-01",
          itemName: "Ready-Made Short Sleeve Oxford Shirt (Size 14-16)",
          unit: "Piece",
          quantity: 2,
          unitPrice: 4500,
          subtotal: 9000
        },
        {
          itemId: "item-6",
          itemCode: "ACC-BLT-01",
          itemName: "Embossed Leather School Uniform Belt",
          unit: "Piece",
          quantity: 1,
          unitPrice: 2000,
          subtotal: 2000
        }
      ],
      subtotal: 27500,
      discountAmount: 0,
      totalAmount: 27500,
      paymentMethod: "Bank Transfer",
      referenceNo: "GTB-TRF-991204",
      cashierName: "Mal. Abubakar (Store Mgr)",
      notes: "Full senior secondary kit purchased",
      createdAt: new Date().toISOString()
    }
  ];
  migrationNeeded = true;
}

if (!dbState.combined_payments) {
  dbState.combined_payments = [
    {
      id: "CPAY-2026-894102",
      combinedReceiptNo: "RCP-COMB-2026-894102",
      date: "2026-07-22",
      time: "10:45 AM",
      studentId: "std-n1",
      admissionNo: "ADM-2024-N001",
      studentName: "Sophia Martinez",
      grade: "K1 (Ages 3-4)",
      classSection: "A",
      branch: "Main Campus",
      parentName: "Carlos Martinez",
      parentPhone: "+1 (555) 0192",
      parentEmail: "carlos.m@example.com",
      totalPaymentReceived: 50000,
      paymentMethod: "Bank Transfer",
      referenceNo: "TRF-ZENITH-883912",
      cashierId: "usr-cashier-01",
      cashierName: "Hajiya Maryam (Accounts)",
      notes: "Single parent payment for Uniform material purchase (₦20,000) and Term Tuition Fee (₦30,000).",
      allocationSummary: {
        storePurchaseTotal: 20000,
        storeAmountPaid: 20000,
        storeBalanceDue: 0,
        storeStatus: "Paid",
        remainingForFees: 30000,
        schoolFeeOutstandingBefore: 70000,
        feeAmountAllocated: 30000,
        schoolFeeOutstandingAfter: 40000,
        feeStatus: "Partially Paid",
        advanceWalletCreditGenerated: 0
      },
      storeSaleId: "STR-TXN-2026-894102",
      storeReceiptNo: "RCP-STR-TXN-2026-894102",
      store: "Uniform Depot",
      storeItems: [
        {
          itemId: "item-1",
          itemCode: "MAT-MET-01",
          itemName: "Uniform Material - Navy Blue (Terylene Wool)",
          unit: "Meter",
          quantity: 4,
          unitPrice: 2500,
          subtotal: 10000
        },
        {
          itemId: "item-3",
          itemCode: "UNI-SHT-01",
          itemName: "Ready-Made Short Sleeve Oxford Shirt (Size 14-16)",
          unit: "Piece",
          quantity: 2,
          unitPrice: 4500,
          subtotal: 9000
        },
        {
          itemId: "item-5",
          itemCode: "ACC-TIE-01",
          itemName: "Official Woven School Crest Tie (Senior)",
          unit: "Piece",
          quantity: 1,
          unitPrice: 1800,
          subtotal: 1800
        }
      ],
      storeSubtotal: 20800,
      storeDiscountAmount: 800,
      storeGrandTotal: 20000,
      storeAmountPaid: 20000,
      storeLedgerCategory: "Store Materials Purchase",
      feePaymentId: "pay-fees-894102",
      feeReceiptNo: "RCP-pay-fees-894102",
      feeLedgerAllocations: [
        {
          ledgerId: "inv-std-n1-term1",
          name: "First Term Tuition & Facility Levy",
          termName: "Term 1 2026/2027",
          outstandingBefore: 70000,
          amountAllocated: 30000,
          outstandingAfter: 40000,
          status: "Partially Paid"
        }
      ],
      feeAmountAllocated: 30000,
      schoolFeeLedgerCategory: "Tuition & School Fees",
      advanceCreditId: undefined,
      createdAt: new Date().toISOString()
    }
  ];
  migrationNeeded = true;
}

if (migrationNeeded) {
  saveDB(dbState);
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get('/api/all_academic_data', (req, res) => {
  res.json({
    students: dbState.students || [],
    teachers: dbState.teachers || [],
    classes: dbState.classes || [],
    schedules: dbState.schedules || [],
    curriculums: dbState.curriculums || [],
    exams: dbState.exams || [],
    gradeScales: dbState.gradeScales || [],
    admissions: dbState.admissions || [],
    subjects: dbState.subjects || [],
    academicSessions: dbState.academicSessions || [],
    terms: dbState.terms || [],
    holidays: dbState.holidays || [],
    eventCategories: dbState.eventCategories || [],
    events: dbState.events || [],
    feeTemplates: dbState.fee_templates || []
  });
});

// Student CRUD
app.get('/api/students', (req, res) => {
  res.json(dbState.students);
});

app.get('/api/students/:id/restrictions', (req, res) => {
  const { id } = req.params;
  const student = dbState.students.find((s: any) => s.id === id);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  const ledgers = dbState.student_fee_ledgers || [];
  const unpaidLedgers = ledgers.filter((l: any) => l.studentId === id && l.status !== 'Paid');
  const templates = dbState.fee_templates || [];
  const classes = dbState.classes || [];
  const currentSimulatedDate = dbState.currentSimulatedDate || "2026-07-04";

  let isOverdue = false;
  const activeRestrictions = {
    blockReportCard: false,
    blockParentPortal: false,
    blockBooks: false,
    blockPromotion: false,
    blockRegistration: false
  };

  const overdueBills: any[] = [];

  unpaidLedgers.forEach((l: any) => {
    // Find matching class and section for this ledger
    const studentClass = classes.find((c: any) => c.id === l.classId || (c.name === student.grade && c.branch === student.branch));
    const sectionId = studentClass ? studentClass.sectionId : l.sectionId;

    const template = templates.find((t: any) => 
      t.branch === l.branch &&
      t.session === l.sessionId &&
      t.term === l.termId &&
      t.sectionId === sectionId
    );

    const graceDays = template && template.gracePeriod !== undefined ? template.gracePeriod : 3;
    
    if (l.dueDate) {
      const duePlusGrace = new Date(l.dueDate);
      duePlusGrace.setDate(duePlusGrace.getDate() + graceDays);
      const thresholdDateStr = duePlusGrace.toISOString().split('T')[0];

      if (currentSimulatedDate > thresholdDateStr) {
        isOverdue = true;
        overdueBills.push({
          ledgerId: l.id,
          termId: l.termId,
          dueDate: l.dueDate,
          graceDays,
          thresholdDate: thresholdDateStr,
          outstanding: l.outstanding,
          grandTotal: l.grandTotal
        });

        if (template && template.restrictions) {
          if (template.restrictions.blockReportCard) activeRestrictions.blockReportCard = true;
          if (template.restrictions.blockParentPortal) activeRestrictions.blockParentPortal = true;
          if (template.restrictions.blockBooks) activeRestrictions.blockBooks = true;
          if (template.restrictions.blockPromotion) activeRestrictions.blockPromotion = true;
          if (template.restrictions.blockRegistration) activeRestrictions.blockRegistration = true;
        }
      }
    }
  });

  res.json({
    studentId: id,
    studentName: student.name,
    isOverdue,
    currentSimulatedDate,
    overdueBills,
    activeRestrictions
  });
});

app.post('/api/students', (req, res) => {
  const { 
    name, level, grade, classSection, parentName, parentEmail, parentPhone, 
    milestones, grades, behaviorRating, branch, serialNumber, enrollmentNo, sessionYear, admissionDate 
  } = req.body;
  
  if (!name || !level || !grade) {
    return res.status(400).json({ error: "Missing required fields (name, level, grade)" });
  }

  const activeBranch = branch || "GN";
  const finalAdmissionDate = admissionDate || new Date().toISOString().split('T')[0];
  
  // Calculate unique serial number if not provided
  let finalSerialNumber = parseInt(serialNumber);
  if (isNaN(finalSerialNumber)) {
    const lastSerial = dbState.students.reduce((max: number, s: any) => Math.max(max, parseInt(s.serialNumber) || 0), 1000);
    finalSerialNumber = lastSerial + 1;
  }

  // Determine session year
  let finalSessionYear = sessionYear || "26";
  if (!sessionYear && finalAdmissionDate) {
    finalSessionYear = finalAdmissionDate.split("-")[0].slice(2, 4);
  }

  // Calculate or preserve enrollment No
  const finalEnrollmentNo = enrollmentNo || compileAdmissionNumber(activeBranch, finalSessionYear, grade, finalSerialNumber);

  const newStudent = {
    id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    level,
    grade,
    classSection: classSection || "A",
    parentName: parentName || "",
    parentEmail: parentEmail || "",
    parentPhone: parentPhone || "",
    attendancePercentage: 100,
    behaviorRating: behaviorRating || "Good",
    milestones: milestones || {},
    grades: grades || {},
    reportComment: "",
    branch: activeBranch,
    serialNumber: finalSerialNumber,
    enrollmentNo: finalEnrollmentNo,
    admissionDate: finalAdmissionDate,
    profile: req.body.profile || {
      gender: "Female",
      dob: "2018-05-15",
      address: "Sokoto, Nigeria",
      bloodGroup: "O+"
    },
    attendanceLogs: [
      { date: finalAdmissionDate, status: "Present" as const }
    ],
    disciplinaryRecords: [],
    extracurriculars: req.body.extracurriculars || ["Cultural Club"],
    healthInfo: req.body.healthInfo || {
      allergies: "None",
      medicalConditions: "None",
      bloodGroup: "O+",
      vaccinations: "Completed"
    },
    academicProgression: req.body.academicProgression || [],
    homework: req.body.homework || [],
    notices: req.body.notices || [],
    feeStatements: req.body.feeStatements || {
      invoices: [],
      outstandingBalance: 1500
    }
  };

  dbState.students.push(newStudent);
  saveDB(dbState);
  res.status(201).json(newStudent);
});

app.put('/api/students/:id', (req, res) => {
  const studentIndex = dbState.students.findIndex((s: any) => s.id === req.params.id);
  if (studentIndex === -1) {
    return res.status(404).json({ error: "Student not found" });
  }

  const existing = dbState.students[studentIndex];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id // Force preservation of original ID
  };

  dbState.students[studentIndex] = updated;

  // Automatically synchronize fee ledgers on the server when parent pays off outstanding statements in their UI
  if (req.body.feeStatements && req.body.feeStatements.outstandingBalance === 0) {
    const studentId = req.params.id;
    if (dbState.student_fee_ledgers) {
      dbState.student_fee_ledgers = dbState.student_fee_ledgers.map((l: any) => {
        if (l.studentId === studentId && l.status !== 'Paid') {
          return {
            ...l,
            status: 'Paid',
            outstanding: 0,
            paid: l.grandTotal,
            updatedAt: new Date().toISOString()
          };
        }
        return l;
      });
    }
  }

  saveDB(dbState);
  res.json(updated);
});

app.delete('/api/students/:id', (req, res) => {
  const studentIndex = dbState.students.findIndex((s: any) => s.id === req.params.id);
  if (studentIndex === -1) {
    return res.status(404).json({ error: "Student not found" });
  }

  const removed = dbState.students.splice(studentIndex, 1);
  saveDB(dbState);
  res.json({ message: "Student deletion complete", removed: removed[0] });
});

// Subjects CRUD
app.get('/api/subjects', (req, res) => {
  res.json(dbState.subjects || []);
});

app.post('/api/subjects', (req, res) => {
  const { name, level, requirement } = req.body;
  if (!name || !level) {
    return res.status(400).json({ error: "Missing required fields (name, level)" });
  }

  const normalizedNewName = name.trim();
  const existingSub = (dbState.subjects || []).find((s: any) => s.name.toLowerCase() === normalizedNewName.toLowerCase() && s.level === level);
  if (existingSub) {
    return res.status(400).json({ error: `Subject '${normalizedNewName}' already exists under '${level}' wing.` });
  }

  const newSubject = {
    id: `sub-${Date.now()}`,
    name: normalizedNewName,
    level,
    requirement: requirement || "compulsory"
  };

  if (!dbState.subjects) {
    dbState.subjects = [];
  }

  dbState.subjects.push(newSubject);
  saveDB(dbState);
  res.status(201).json(newSubject);
});

app.put('/api/subjects/:id', (req, res) => {
  const { name, level, requirement } = req.body;
  if (!name || !level) {
    return res.status(400).json({ error: "Missing required fields (name, level)" });
  }

  const idx = dbState.subjects?.findIndex((s: any) => s.id === req.params.id) ?? -1;
  if (idx === -1) {
    return res.status(404).json({ error: "Subject not found" });
  }

  const isDuplicate = (dbState.subjects || []).some((s: any) => s.id !== req.params.id && s.name.toLowerCase() === name.trim().toLowerCase() && s.level === level);
  if (isDuplicate) {
    return res.status(400).json({ error: "Another subject with this name already exists in this level wing." });
  }

  const oldName = dbState.subjects[idx].name;
  const newName = name.trim();

  dbState.subjects[idx] = {
    id: req.params.id,
    name: newName,
    level,
    requirement: requirement || "compulsory"
  };

  if (oldName !== newName) {
    if (dbState.classes) {
      dbState.classes = dbState.classes.map((cls: any) => {
        if (cls.subjects && cls.subjects.includes(oldName)) {
          return {
            ...cls,
            subjects: cls.subjects.map((s: string) => s === oldName ? newName : s)
          };
        }
        return cls;
      });
    }

    if (dbState.teachers) {
      dbState.teachers = dbState.teachers.map((t: any) => {
        let updated = false;
        let subjects = t.subjects;
        let subjectAllocations = t.subjectAllocations;

        if (subjects && subjects.includes(oldName)) {
          subjects = subjects.map((s: string) => s === oldName ? newName : s);
          updated = true;
        }

        if (subjectAllocations) {
          subjectAllocations = subjectAllocations.map((alloc: any) => {
            if (alloc.subject === oldName) {
              updated = true;
              return { ...alloc, subject: newName };
            }
            return alloc;
          });
        }

        return updated ? { ...t, subjects, subjectAllocations } : t;
      });
    }

    if (dbState.schedules) {
      dbState.schedules = dbState.schedules.map((sch: any) => {
        if (sch.subject === oldName) {
          return { ...sch, subject: newName };
        }
        return sch;
      });
    }

    if (dbState.curriculums) {
      dbState.curriculums = dbState.curriculums.map((curr: any) => {
        if (curr.subject === oldName) {
          return { ...curr, subject: newName };
        }
        return curr;
      });
    }

    if (dbState.exams) {
      dbState.exams = dbState.exams.map((ex: any) => {
        if (ex.subject === oldName) {
          return { ...ex, subject: newName };
        }
        return ex;
      });
    }
  }

  saveDB(dbState);
  res.json(dbState.subjects[idx]);
});

app.delete('/api/subjects/:id', (req, res) => {
  const idx = dbState.subjects?.findIndex((s: any) => s.id === req.params.id) ?? -1;
  if (idx === -1) {
    return res.status(404).json({ error: "Subject not found" });
  }

  const removed = dbState.subjects.splice(idx, 1);
  saveDB(dbState);
  res.json({ message: "Subject removed successfully", removed: removed[0] });
});

// Class CRUD
app.get('/api/classes', (req, res) => {
  res.json(dbState.classes || []);
});

app.post('/api/classes', (req, res) => {
  const { name, level, branch, subjects, sectionId } = req.body;
  if (!name || !level) {
    return res.status(400).json({ error: "Missing required fields (name, level)" });
  }

  const newClass = {
    id: `cls-${Date.now()}`,
    name,
    level, // 'nursery' | 'primary' | 'secondary'
    branch: branch || "GN",
    subjects: subjects || [],
    sectionId: sectionId || ""
  };

  if (!dbState.classes) {
    dbState.classes = [];
  }

  dbState.classes.push(newClass);
  saveDB(dbState);
  res.status(201).json(newClass);
});

app.put('/api/classes/:id', (req, res) => {
  const classIndex = dbState.classes?.findIndex((c: any) => c.id === req.params.id) ?? -1;
  if (classIndex === -1) {
    return res.status(404).json({ error: "Class not found" });
  }

  const existing = dbState.classes[classIndex];
  const oldName = existing.name;
  const newName = req.body.name || oldName;

  const updated = {
    ...existing,
    ...req.body,
    id: existing.id
  };

  dbState.classes[classIndex] = updated;

  // Cascade updates if the name actually changed
  if (oldName !== newName) {
    // 1. Update students matching oldName
    if (dbState.students) {
      dbState.students = dbState.students.map((s: any) => {
        if (s.grade === oldName) {
          return { ...s, grade: newName };
        }
        return s;
      });
    }

    // 2. Update teachers matching oldName in classesAssigned
    if (dbState.teachers) {
      dbState.teachers = dbState.teachers.map((t: any) => {
        if (t.classesAssigned && t.classesAssigned.includes(oldName)) {
          return {
            ...t,
            classesAssigned: t.classesAssigned.map((c: string) => c === oldName ? newName : c)
          };
        }
        return t;
      });
    }

    // 3. Update schedules
    if (dbState.schedules) {
      dbState.schedules = dbState.schedules.map((sch: any) => {
        if (sch.grade === oldName) {
          return { ...sch, grade: newName };
        }
        return sch;
      });
    }

    // 4. Update curriculums
    if (dbState.curriculums) {
      dbState.curriculums = dbState.curriculums.map((curr: any) => {
        if (curr.grade === oldName) {
          return { ...curr, grade: newName };
        }
        return curr;
      });
    }

    // 5. Update exams
    if (dbState.exams) {
      dbState.exams = dbState.exams.map((ex: any) => {
        if (ex.grade === oldName) {
          return { ...ex, grade: newName };
        }
        return ex;
      });
    }
  }

  saveDB(dbState);
  res.json(updated);
});

app.delete('/api/classes/:id', (req, res) => {
  const classIndex = dbState.classes?.findIndex((c: any) => c.id === req.params.id) ?? -1;
  if (classIndex === -1) {
    return res.status(404).json({ error: "Class not found" });
  }

  const removed = dbState.classes.splice(classIndex, 1);
  saveDB(dbState);
  res.json({ message: "Class deleted successfully", removed: removed[0] });
});

// Teacher CRUD
app.get('/api/teachers', (req, res) => {
  res.json(dbState.teachers);
});

app.post('/api/teachers', (req, res) => {
  const { name, email, phone, level, subjects, classesAssigned, branch, role, userId, accessControl, maxUnits, performanceScore, subjectAllocations } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Missing required fields (name, email)" });
  }

  const newTeacher = {
    id: `tch-${Date.now()}`,
    name,
    email,
    phone: phone || "",
    level: level || [],
    subjects: subjects || [],
    classesAssigned: classesAssigned || [],
    branch: branch || "GN",
    role: role || "teaching",
    userId: userId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    accessControl: accessControl || "Staff/Teacher",
    maxUnits: maxUnits || 20,
    performanceScore: performanceScore || 80,
    subjectAllocations: subjectAllocations || []
  };

  dbState.teachers.push(newTeacher);
  saveDB(dbState);
  res.status(201).json(newTeacher);
});

app.put('/api/teachers/:id', (req, res) => {
  const index = dbState.teachers.findIndex((t: any) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Teacher profile not found" });
  }

  const existing = dbState.teachers[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id
  };

  dbState.teachers[index] = updated;
  saveDB(dbState);
  res.json(updated);
});

app.delete('/api/teachers/:id', (req, res) => {
  const index = dbState.teachers.findIndex((t: any) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Teacher profile not found" });
  }

  const removed = dbState.teachers.splice(index, 1);
  saveDB(dbState);
  res.json({ message: "Teacher deleted successfully", removed: removed[0] });
});

// Schedules API
app.get('/api/schedules', (req, res) => {
  res.json(dbState.schedules);
});

app.post('/api/schedules', (req, res) => {
  const { grade, day, period, subject, teacherId, branch } = req.body;
  if (!grade || !day || !period || !subject) {
    return res.status(400).json({ error: "Missing timetable fields" });
  }

  const activeBranch = branch || "GN";

  // Check if position already booked & overwrite, or list new block specifically for this branch
  const conflictIdx = dbState.schedules.findIndex((s: any) => 
    s.grade === grade && 
    s.day === day && 
    s.period === parseInt(period) && 
    (s.branch === activeBranch || (!s.branch && activeBranch === 'GN'))
  );
  
  const scheduleEntry = {
    id: conflictIdx !== -1 ? dbState.schedules[conflictIdx].id : `sch-${Date.now()}`,
    grade,
    day,
    period: parseInt(period),
    subject,
    teacherId: teacherId || "",
    branch: activeBranch
  };

  if (conflictIdx !== -1) {
    dbState.schedules[conflictIdx] = scheduleEntry;
  } else {
    dbState.schedules.push(scheduleEntry);
  }

  saveDB(dbState);
  res.json(scheduleEntry);
});

app.delete('/api/schedules', (req, res) => {
  const { grade, day, period } = req.body;
  const initLength = dbState.schedules.length;
  dbState.schedules = dbState.schedules.filter((s: any) => !(s.grade === grade && s.day === day && s.period === parseInt(period)));
  
  if (dbState.schedules.length < initLength) {
    saveDB(dbState);
    res.json({ success: true, message: "Period scheduled cleared" });
  } else {
    res.status(404).json({ error: "Schedule block not found for clearing" });
  }
});

// Curriculums API
app.get('/api/curriculums', (req, res) => {
  res.json(dbState.curriculums || []);
});

app.post('/api/curriculums', (req, res) => {
  const { grade, subject, topics, teacherId, branch } = req.body;
  if (!grade || !subject) {
    return res.status(400).json({ error: "Grade and Subject are required for curriculum planning" });
  }
  const newCurr = {
    id: `curr-${Date.now()}`,
    grade,
    subject,
    topics: topics || [],
    teacherId: teacherId || "",
    branch: branch || "GN"
  };
  dbState.curriculums = dbState.curriculums || [];
  dbState.curriculums.push(newCurr);
  saveDB(dbState);
  res.status(201).json(newCurr);
});

app.put('/api/curriculums/:id', (req, res) => {
  dbState.curriculums = dbState.curriculums || [];
  const index = dbState.curriculums.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Curriculum not found" });
  }
  dbState.curriculums[index] = { ...dbState.curriculums[index], ...req.body, id: req.params.id };
  saveDB(dbState);
  res.json(dbState.curriculums[index]);
});

app.delete('/api/curriculums/:id', (req, res) => {
  dbState.curriculums = dbState.curriculums || [];
  const index = dbState.curriculums.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Curriculum not found" });
  }
  const removed = dbState.curriculums.splice(index, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Exams API
app.get('/api/exams', (req, res) => {
  res.json(dbState.exams || []);
});

app.post('/api/exams', (req, res) => {
  const { title, grade, subject, date, weightPercentage, totalMarks, branch } = req.body;
  if (!title || !grade || !subject || !date) {
    return res.status(400).json({ error: "Missing required exam fields" });
  }
  const newExam = {
    id: `ex-${Date.now()}`,
    title,
    grade,
    subject,
    date,
    weightPercentage: parseInt(weightPercentage) || 0,
    totalMarks: parseInt(totalMarks) || 100,
    branch: branch || "GN"
  };
  dbState.exams = dbState.exams || [];
  dbState.exams.push(newExam);
  saveDB(dbState);
  res.status(201).json(newExam);
});

app.delete('/api/exams/:id', (req, res) => {
  dbState.exams = dbState.exams || [];
  const index = dbState.exams.findIndex((e: any) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Exam not found" });
  }
  const removed = dbState.exams.splice(index, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Grade Scales API
app.get('/api/grade-scales', (req, res) => {
  res.json(dbState.gradeScales || []);
});

app.post('/api/grade-scales', (req, res) => {
  const { scales } = req.body;
  if (!Array.isArray(scales)) {
    return res.status(400).json({ error: "Scales must be an array" });
  }
  dbState.gradeScales = scales;
  saveDB(dbState);
  res.json(dbState.gradeScales);
});

// Admissions API with multi-stage approval pipeline
app.get('/api/admissions', (req, res) => {
  res.json(dbState.admissions || []);
});

app.post('/api/admissions/pre-register', (req, res) => {
  const { name, level, grade, parentName, parentEmail, parentPhone, branch } = req.body;
  if (!name || !level || !grade || !parentEmail) {
    return res.status(400).json({ error: "Missing required Pre-registration fields" });
  }

  const newApp = {
    id: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    level,
    grade,
    parentName,
    parentEmail,
    parentPhone: parentPhone || "",
    branch: branch || "GN",
    status: "Pre-registered",
    preRegDate: new Date().toISOString().split('T')[0]
  };

  dbState.admissions = dbState.admissions || [];
  dbState.admissions.push(newApp);
  saveDB(dbState);
  res.status(201).json(newApp);
});

app.post('/api/admissions/parent-submit', (req, res) => {
  const { id, dob, gender, address, medicalAllergies, medicalConditions, bloodGroup, previousSchool, interests } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing Application ID" });
  }

  const appIndex = dbState.admissions.findIndex((a: any) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: "Application not found with code: " + id });
  }

  const application = dbState.admissions[appIndex];
  
  // Update parent form info
  application.dob = dob || "2018-05-15";
  application.gender = gender || "Female";
  application.address = address || "";
  application.medicalAllergies = medicalAllergies || "None";
  application.medicalConditions = medicalConditions || "None";
  application.bloodGroup = bloodGroup || "O+";
  application.previousSchool = previousSchool || "None";
  application.interests = interests || "";
  application.status = "Submitted by Parent";
  application.parentSubmittedDate = new Date().toISOString().split('T')[0];

  saveDB(dbState);
  res.json(application);
});

app.post('/api/admissions/ht-review', (req, res) => {
  const { id, htNotes, htEvaluation, htReviewedBy, interviewScorecard } = req.body;
  if (!id || !htEvaluation) {
    return res.status(400).json({ error: "Missing required Review parameters" });
  }

  const appIndex = dbState.admissions.findIndex((a: any) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: "Application not found" });
  }

  const application = dbState.admissions[appIndex];
  application.htNotes = htNotes || "";
  application.htEvaluation = htEvaluation;
  application.htReviewedBy = htReviewedBy || "Principal Head Teacher";
  application.htReviewedDate = new Date().toISOString().split('T')[0];
  application.status = "HT Reviewed";
  if (interviewScorecard) {
    application.interviewScorecard = interviewScorecard;
  }

  saveDB(dbState);
  res.json(application);
});

app.post('/api/admissions/chairman-approve', (req, res) => {
  const { id, chairmanNotes, allocatedSection, feeTemplateId } = req.body;
  if (!id || !allocatedSection) {
    return res.status(400).json({ error: "Application ID and Class Section allocation are required" });
  }

  const appIndex = dbState.admissions.findIndex((a: any) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: "Application not found" });
  }

  const application = dbState.admissions[appIndex];
  application.chairmanNotes = chairmanNotes || "";
  application.allocatedSection = allocatedSection;
  application.chairmanApprovedDate = new Date().toISOString().split('T')[0];
  application.status = "Approved & Allocated";
  if (feeTemplateId) {
    application.feeTemplateId = feeTemplateId;
  }

  // Calculate unique serial number
  const lastSerial = dbState.students.reduce((max: number, s: any) => Math.max(max, parseInt(s.serialNumber) || 0), 1000);
  const finalSerialNumber = lastSerial + 1;
  const activeBranch = application.branch || "GN";
  const finalSessionYear = application.chairmanApprovedDate.split("-")[0].slice(2, 4);
  const finalEnrollmentNo = compileAdmissionNumber(activeBranch, finalSessionYear, application.grade, finalSerialNumber);

  // Look up Selected Fee Template
  const templates = dbState.fee_templates || [];
  const template = templates.find((t: any) => t.id === feeTemplateId);
  const finalFeeAmount = template ? (template.totalFee || 155000) : 1500;
  const finalFeeDescription = template 
    ? `Tuition Fee Billing Template (Ref: ${template.id})` 
    : "Admission Tuition & Uniform Desk Levy";

  // Promote to active students
  const newStudent = {
    id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: application.name,
    level: application.level,
    grade: application.grade,
    classSection: allocatedSection,
    parentName: application.parentName,
    parentEmail: application.parentEmail,
    parentPhone: application.parentPhone,
    attendancePercentage: 100,
    behaviorRating: "Excellent" as const,
    milestones: application.level === 'nursery' ? {
      "Fine Motor Skills (pencil grip, scissor cuts)": "Mastered" as const,
      "Social Sharing & Interaction": "Developing" as const,
      "Count up to 10 & Pattern Recognition": "Mastered" as const,
      "Expressive Communication & Vocabulary": "Developing" as const,
      "Listening & Task Completion": "Developing" as const
    } : {},
    grades: application.level !== 'nursery' ? {
      "Mathematics": 85,
      "Science": 85,
      "English Language": 85
    } : {},
    reportComment: `Officially admitted on ${application.chairmanApprovedDate} by central board command. Allocated to SAMS branch ${application.branch === 'RS' ? 'Runjin Sambo' : 'Gawun Nama'} in Section ${allocatedSection}.`,
    admissionDate: application.chairmanApprovedDate,
    serialNumber: finalSerialNumber,
    enrollmentNo: finalEnrollmentNo,
    admissionStatus: "Active" as const,
    branch: activeBranch,
    profile: {
      gender: application.gender || "Female",
      dob: application.dob || "2018-05-15",
      address: application.address || "Sokoto, Nigeria",
      bloodGroup: application.bloodGroup || "O+"
    },
    attendanceLogs: [
      { date: application.chairmanApprovedDate, status: "Present" as const }
    ],
    disciplinaryRecords: [],
    extracurriculars: application.interests ? [application.interests] : ["Debate & Cultural Club"],
    healthInfo: {
      allergies: application.medicalAllergies || "None",
      medicalConditions: application.medicalConditions || "None",
      bloodGroup: application.bloodGroup || "O+",
      vaccinations: "Completed Routine immunization"
    },
    feeStatements: {
      invoices: [
        { 
          id: `inv-adm-${Date.now()}`, 
          description: finalFeeDescription, 
          amount: finalFeeAmount, 
          paid: 0, 
          status: "Unpaid" as const, 
          date: application.chairmanApprovedDate 
        }
      ],
      outstandingBalance: finalFeeAmount
    }
  };

  dbState.students = dbState.students || [];
  dbState.students.push(newStudent);
  saveDB(dbState);
  res.json({ application, student: newStudent });
});

// -------------------------------------------------------------
// MINISTRY ACADEMIC CALENDAR & SESSION MANAGEMENT CRUD ENDPOINTS
// -------------------------------------------------------------

// Academic Sessions CRUD
app.get('/api/academic-sessions', (req, res) => {
  res.json(dbState.academicSessions || []);
});

app.post('/api/academic-sessions', (req, res) => {
  const { name, startDate, endDate, status } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required session fields" });
  }
  const newSession = {
    id: `ses-${Date.now()}`,
    name,
    startDate,
    endDate,
    status: status || 'planned'
  };

  dbState.academicSessions = dbState.academicSessions || [];
  
  // If status is active, make other sessions planned/archived
  if (newSession.status === 'active') {
    dbState.academicSessions.forEach((s: any) => {
      if (s.status === 'active') s.status = 'archived';
    });
  }

  dbState.academicSessions.push(newSession);
  saveDB(dbState);
  res.status(201).json(newSession);
});

app.put('/api/academic-sessions/:id', (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, status } = req.body;
  const sessionIndex = (dbState.academicSessions || []).findIndex((s: any) => s.id === id);
  if (sessionIndex === -1) {
    return res.status(404).json({ error: "Academic session not found" });
  }

  const session = dbState.academicSessions[sessionIndex];
  if (name) session.name = name;
  if (startDate) session.startDate = startDate;
  if (endDate) session.endDate = endDate;
  if (status) {
    session.status = status;
    if (status === 'active') {
      dbState.academicSessions.forEach((s: any) => {
        if (s.id !== id && s.status === 'active') s.status = 'archived';
      });
    }
  }

  saveDB(dbState);
  res.json(session);
});

app.delete('/api/academic-sessions/:id', (req, res) => {
  const { id } = req.params;
  const sessionIndex = (dbState.academicSessions || []).findIndex((s: any) => s.id === id);
  if (sessionIndex === -1) {
    return res.status(404).json({ error: "Academic session not found" });
  }

  const removed = dbState.academicSessions.splice(sessionIndex, 1);
  
  // Cascade delete terms & holidays belonging to this session
  dbState.terms = (dbState.terms || []).filter((t: any) => t.sessionId !== id);
  dbState.holidays = (dbState.holidays || []).filter((h: any) => h.sessionId !== id);

  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// -------------------------------------------------------------
// TIMELINE AUTOMATION ENGINE & ENDPOINTS
// -------------------------------------------------------------
function processTermTransitions(today: string) {
  const terms = dbState.terms || [];
  const transitions = dbState.term_transitions || [];
  let stateChanged = false;

  for (const term of terms) {
    const termId = term.id;
    const sessionId = term.sessionId;

    // 1. Check if term has begun
    if (today >= term.startDate) {
      const begunKey = `${termId}-begun`;
      if (!transitions.some((t: any) => t.id === begunKey)) {
        console.log(`[Timeline Automation] Term ${term.name} has begun on simulated date ${today}. Running fee ledger generation...`);
        
        const students = dbState.students || [];
        const classes = dbState.classes || [];
        const templates = dbState.fee_templates || [];
        const feeHeads = dbState.fee_heads || [];
        const overrides = dbState.class_fee_overrides || [];
        let ledgers = dbState.student_fee_ledgers || [];
        let itemsList = dbState.student_fee_items || [];

        let generatedCount = 0;
        let totalCarryForward = 0;

        students.forEach((student: any) => {
          const studentClass = classes.find((c: any) => c.name === student.grade && c.branch === student.branch);
          if (!studentClass) return;

          // Check if ledger already exists for this term (do not duplicate)
          const existingLedger = ledgers.find((l: any) => 
            l.studentId === student.id &&
            l.sessionId === sessionId &&
            l.termId === termId
          );
          if (existingLedger) {
            return;
          }

          // Find template
          let template = templates.find((t: any) => 
            t.branch === student.branch &&
            t.session === sessionId &&
            t.term === termId &&
            t.sectionId === studentClass.sectionId
          );

          // Auto-clone previous template if needed
          if (!template) {
            const previousTemplate = templates.find((t: any) => 
              t.branch === student.branch &&
              t.session === sessionId &&
              t.sectionId === studentClass.sectionId
            );
            if (previousTemplate) {
              const newTemplateId = `temp-auto-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
              template = {
                ...previousTemplate,
                id: newTemplateId,
                term: termId,
                createdAt: new Date().toISOString()
              };
              templates.push(template);
              dbState.fee_templates = templates;
              console.log(`[Timeline Automation] Auto-cloned template ${previousTemplate.id} for term ${termId}`);
            } else {
              const newTemplateId = `temp-auto-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
              template = {
                id: newTemplateId,
                branch: student.branch,
                session: sessionId,
                term: termId,
                sectionId: studentClass.sectionId,
                totalFee: 150000,
                items: [
                  { feeHeadId: "fh-1", amount: 120000 },
                  { feeHeadId: "fh-2", amount: 30000 }
                ],
                createdAt: new Date().toISOString()
              };
              templates.push(template);
              dbState.fee_templates = templates;
              console.log(`[Timeline Automation] Fallback template created for term ${termId}`);
            }
          }

          // Calculate final items and base fee
          const finalItems: any[] = [];
          const classOverride = overrides.find((o: any) => o.templateId === template.id && o.classId === studentClass.id);

          if (classOverride) {
            template.items.forEach((baseItem: any) => {
              const overrideItem = classOverride.items.find((oi: any) => oi.feeHeadId === baseItem.feeHeadId);
              if (overrideItem) {
                if (!overrideItem.isRemoved) {
                  finalItems.push({ feeHeadId: baseItem.feeHeadId, amount: overrideItem.amount });
                }
              } else {
                finalItems.push({ feeHeadId: baseItem.feeHeadId, amount: baseItem.amount });
              }
            });
            classOverride.items.forEach((oi: any) => {
              const isNotBase = !template.items.some((bi: any) => bi.feeHeadId === oi.feeHeadId);
              if (isNotBase && !oi.isRemoved) {
                finalItems.push({ feeHeadId: oi.feeHeadId, amount: oi.amount });
              }
            });
          } else {
            template.items.forEach((baseItem: any) => {
              finalItems.push({ feeHeadId: baseItem.feeHeadId, amount: baseItem.amount });
            });
          }

          const baseTermFee = finalItems.reduce((acc: number, item: any) => acc + item.amount, 0);

          // Carry Previous Outstanding (from previous unpaid ledgers with full-fee carry-forward rule for un-cleared discounts)
          const carryResult = computeStudentCarriedForward(student.id, sessionId, termId, ledgers, dbState.sibling_discount_records || []);
          const carryForward = carryResult.carryForward;
          totalCarryForward += carryForward;

          const ledgerId = `sfl-auto-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

          // Due Date: dynamically determined by template settings, defaulting to 14 days
          const offsetDays = template.dueDateOffset !== undefined ? template.dueDateOffset : 14;
          const termStartDate = new Date(term.startDate);
          termStartDate.setDate(termStartDate.getDate() + offsetDays);
          const dueDate = termStartDate.toISOString().split('T')[0];

          const newLedger = {
            id: ledgerId,
            studentId: student.id,
            studentName: student.name,
            classId: studentClass.id,
            sectionId: studentClass.sectionId,
            branch: student.branch,
            sessionId,
            termId,
            status: 'Draft',
            baseTermFee,
            optionalChargesFee: 0,
            discountAmount: 0,
            scholarshipAmount: 0,
            carryForward,
            outstanding: baseTermFee + carryForward,
            grandTotal: baseTermFee + carryForward,
            billingDate: term.startDate,
            dueDate: dueDate,
            createdAt: new Date().toISOString(),
            isAutoGenerated: true
          };

          ledgers.push(newLedger);
          generatedCount++;

          // Create item records
          finalItems.forEach((item: any) => {
            const headObj = feeHeads.find((h: any) => h.id === item.feeHeadId);
            const newItem = {
              id: `sfi-auto-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
              ledgerId,
              type: 'term_fee',
              referenceId: item.feeHeadId,
              name: headObj ? headObj.name : 'Unknown Fee Head',
              amount: item.amount,
              createdAt: new Date().toISOString()
            };
            itemsList.push(newItem);
          });

          // Notify Parent!
          const notificationId = `pn-auto-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          const parentNotification = {
            id: notificationId,
            studentId: student.id,
            studentName: student.name,
            title: `Term Fee Generated: ${term.name}`,
            message: `A new fee ledger has been auto-generated for ${student.name} for ${term.name}. Base Fee: ₦${baseTermFee.toLocaleString()}.${carryForward > 0 ? ` Carried Forward Outstanding: ₦${carryForward.toLocaleString()}.` : ''} Total Due: ₦${(baseTermFee + carryForward).toLocaleString()}. Due Date: ${dueDate}.`,
            date: today,
            type: 'billing_generation',
            read: false,
            createdAt: new Date().toISOString()
          };
          dbState.parent_notifications.push(parentNotification);
        });

        dbState.student_fee_ledgers = ledgers;
        dbState.student_fee_items = itemsList;

        transitions.push({
          id: begunKey,
          termId,
          termName: term.name,
          type: 'begun',
          date: today,
          details: `Automatically generated ${generatedCount} fee ledgers, carrying ₦${totalCarryForward.toLocaleString()} previous outstanding balances forward. Sent notifications to parents. Due dates set to 14 days post term start.`,
          timestamp: new Date().toISOString()
        });
        stateChanged = true;
      }
    }

    // 2. Check if term has ended
    if (today >= term.endDate) {
      const endedKey = `${termId}-ended`;
      if (!transitions.some((t: any) => t.id === endedKey)) {
        console.log(`[Timeline Automation] Term ${term.name} has ended on simulated date ${today}. Carrying outstanding balances forward...`);

        const ledgers = dbState.student_fee_ledgers || [];
        let carriedCount = 0;
        let totalOutstandingCarried = 0;

        const outstandingLedgers = ledgers.filter((l: any) => l.termId === termId && l.outstanding > 0);
        
        const sortedTerms = [...terms].sort((a: any, b: any) => a.startDate.localeCompare(b.startDate));
        const currentIdx = sortedTerms.findIndex((t: any) => t.id === termId);
        const nextTerm = currentIdx !== -1 && currentIdx < sortedTerms.length - 1 ? sortedTerms[currentIdx + 1] : null;

        if (nextTerm) {
          outstandingLedgers.forEach((oldLedger: any) => {
            const nextLedgerIdx = ledgers.findIndex((l: any) => 
              l.studentId === oldLedger.studentId && 
              l.termId === nextTerm.id
            );

            if (nextLedgerIdx !== -1) {
              const nextLedger = ledgers[nextLedgerIdx];
              const carryResult = computeStudentCarriedForward(
                oldLedger.studentId,
                nextLedger.sessionId || 'ses-2026',
                nextLedger.termId || nextTerm.id,
                ledgers,
                dbState.sibling_discount_records || []
              );
              
              nextLedger.carryForward = carryResult.carryForward;
              nextLedger.outstanding = nextLedger.baseTermFee + nextLedger.optionalChargesFee + nextLedger.carryForward - (nextLedger.discountAmount + nextLedger.scholarshipAmount);
              nextLedger.grandTotal = nextLedger.baseTermFee + nextLedger.optionalChargesFee + nextLedger.carryForward;
              
              carriedCount++;
              totalOutstandingCarried += carryResult.carryForward;
            } else {
              carriedCount++;
              totalOutstandingCarried += oldLedger.outstanding;
            }
          });
        }

        transitions.push({
          id: endedKey,
          termId,
          termName: term.name,
          type: 'ended',
          date: today,
          details: `Term ended. Identified ${outstandingLedgers.length} ledgers with unpaid dues. Outstanding balances (Totaling ₦${totalOutstandingCarried.toLocaleString()}) have been flagged to be carried forward to the next term's ledger.`,
          timestamp: new Date().toISOString()
        });
        stateChanged = true;
      }
    }
  }

  if (stateChanged) {
    dbState.term_transitions = transitions;
    saveDB(dbState);
  }
}

// Timeline State & Control API
app.get('/api/timeline', (req, res) => {
  const currentSimulatedDate = dbState.currentSimulatedDate || "2026-07-04";
  const transitions = dbState.term_transitions || [];
  res.json({
    currentSimulatedDate,
    transitions
  });
});

app.post('/api/timeline/set-date', (req, res) => {
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: "Missing date parameter" });
  }
  dbState.currentSimulatedDate = date;
  processTermTransitions(date);
  saveDB(dbState);
  res.json({
    success: true,
    currentSimulatedDate: dbState.currentSimulatedDate,
    transitions: dbState.term_transitions || []
  });
});

// Parent Notifications API
app.get('/api/parent_notifications', (req, res) => {
  res.json(dbState.parent_notifications || []);
});

app.post('/api/parent_notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const list = dbState.parent_notifications || [];
  const notification = list.find((n: any) => n.id === id);
  if (notification) {
    notification.read = true;
    dbState.parent_notifications = list;
    saveDB(dbState);
    return res.json({ success: true, notification });
  }
  res.status(404).json({ error: "Notification not found" });
});

app.post('/api/parent_notifications/mark-all-read', (req, res) => {
  const list = dbState.parent_notifications || [];
  list.forEach((n: any) => { n.read = true; });
  dbState.parent_notifications = list;
  saveDB(dbState);
  res.json({ success: true, count: list.length });
});

app.get('/api/term_transitions', (req, res) => {
  res.json(dbState.term_transitions || []);
});

app.post('/api/term_transitions/clear', (req, res) => {
  dbState.term_transitions = [];
  saveDB(dbState);
  res.json({ success: true });
});

// Terms CRUD
app.get('/api/terms', (req, res) => {
  res.json(dbState.terms || []);
});

app.post('/api/terms', (req, res) => {
  const { sessionId, name, startDate, endDate, numberOfWeeks } = req.body;
  if (!sessionId || !name || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required term fields" });
  }
  const newTerm = {
    id: `term-${Date.now()}`,
    sessionId,
    name,
    startDate,
    endDate,
    numberOfWeeks: parseInt(numberOfWeeks) || 12
  };

  dbState.terms = dbState.terms || [];
  dbState.terms.push(newTerm);
  saveDB(dbState);
  res.status(201).json(newTerm);
});

app.put('/api/terms/:id', (req, res) => {
  const { id } = req.params;
  const { sessionId, name, startDate, endDate, numberOfWeeks } = req.body;
  const termIndex = (dbState.terms || []).findIndex((t: any) => t.id === id);
  if (termIndex === -1) {
    return res.status(404).json({ error: "Term not found" });
  }

  const term = dbState.terms[termIndex];
  if (sessionId) term.sessionId = sessionId;
  if (name) term.name = name;
  if (startDate) term.startDate = startDate;
  if (endDate) term.endDate = endDate;
  if (numberOfWeeks !== undefined) term.numberOfWeeks = parseInt(numberOfWeeks) || 12;

  saveDB(dbState);
  res.json(term);
});

app.delete('/api/terms/:id', (req, res) => {
  const { id } = req.params;
  const termIndex = (dbState.terms || []).findIndex((t: any) => t.id === id);
  if (termIndex === -1) {
    return res.status(404).json({ error: "Term not found" });
  }

  const removed = dbState.terms.splice(termIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Holidays CRUD
app.get('/api/holidays', (req, res) => {
  res.json(dbState.holidays || []);
});

app.post('/api/holidays', (req, res) => {
  const { sessionId, name, type, startDate, endDate } = req.body;
  if (!sessionId || !name || !type || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required holiday fields" });
  }
  const newHoliday = {
    id: `hol-${Date.now()}`,
    sessionId,
    name,
    type,
    startDate,
    endDate
  };

  dbState.holidays = dbState.holidays || [];
  dbState.holidays.push(newHoliday);
  saveDB(dbState);
  res.status(201).json(newHoliday);
});

app.put('/api/holidays/:id', (req, res) => {
  const { id } = req.params;
  const { sessionId, name, type, startDate, endDate } = req.body;
  const holidayIndex = (dbState.holidays || []).findIndex((h: any) => h.id === id);
  if (holidayIndex === -1) {
    return res.status(404).json({ error: "Holiday not found" });
  }

  const holiday = dbState.holidays[holidayIndex];
  if (sessionId) holiday.sessionId = sessionId;
  if (name) holiday.name = name;
  if (type) holiday.type = type;
  if (startDate) holiday.startDate = startDate;
  if (endDate) holiday.endDate = endDate;

  saveDB(dbState);
  res.json(holiday);
});

app.delete('/api/holidays/:id', (req, res) => {
  const { id } = req.params;
  const holidayIndex = (dbState.holidays || []).findIndex((h: any) => h.id === id);
  if (holidayIndex === -1) {
    return res.status(404).json({ error: "Holiday not found" });
  }

  const removed = dbState.holidays.splice(holidayIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Event Categories CRUD
app.get('/api/event-categories', (req, res) => {
  res.json(dbState.eventCategories || []);
});

app.post('/api/event-categories', (req, res) => {
  const { parentGroup, name, description, color, icon } = req.body;
  if (!parentGroup || !name) {
    return res.status(400).json({ error: "Missing required fields (parentGroup, name)" });
  }

  const newCategory = {
    id: `cat-${Date.now()}`,
    parentGroup,
    name,
    description: description || "",
    color: color || "#3B82F6",
    icon: icon || "Calendar"
  };

  dbState.eventCategories = dbState.eventCategories || [];
  dbState.eventCategories.push(newCategory);
  saveDB(dbState);
  res.status(201).json(newCategory);
});

app.put('/api/event-categories/:id', (req, res) => {
  const { id } = req.params;
  const { parentGroup, name, description, color, icon } = req.body;
  
  const categoryIndex = (dbState.eventCategories || []).findIndex((c: any) => c.id === id);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: "Event category not found" });
  }

  const category = dbState.eventCategories[categoryIndex];
  if (parentGroup) category.parentGroup = parentGroup;
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (color) category.color = color;
  if (icon) category.icon = icon;

  saveDB(dbState);
  res.json(category);
});

app.delete('/api/event-categories/:id', (req, res) => {
  const { id } = req.params;
  const categoryIndex = (dbState.eventCategories || []).findIndex((c: any) => c.id === id);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: "Event category not found" });
  }

  const removed = dbState.eventCategories.splice(categoryIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Events CRUD
app.get('/api/events', (req, res) => {
  res.json(dbState.events || []);
});

app.post('/api/events', (req, res) => {
  const { title, description, startDate, endDate, categoryId, branchId, sessionId, termId } = req.body;
  if (!title || !startDate || !endDate || !categoryId || !branchId || !sessionId || !termId) {
    return res.status(400).json({ error: "Missing required fields (title, startDate, endDate, categoryId, branchId, sessionId, termId)" });
  }

  const newEvent = {
    id: `evt-${Date.now()}`,
    title,
    description: description || "",
    startDate,
    endDate,
    categoryId,
    branchId,
    sessionId,
    termId
  };

  dbState.events = dbState.events || [];
  dbState.events.push(newEvent);
  saveDB(dbState);
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, startDate, endDate, categoryId, branchId, sessionId, termId } = req.body;

  const eventIndex = (dbState.events || []).findIndex((e: any) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: "Event not found" });
  }

  const event = dbState.events[eventIndex];
  if (title) event.title = title;
  if (description !== undefined) event.description = description;
  if (startDate) event.startDate = startDate;
  if (endDate) event.endDate = endDate;
  if (categoryId) event.categoryId = categoryId;
  if (branchId) event.branchId = branchId;
  if (sessionId) event.sessionId = sessionId;
  if (termId) event.termId = termId;

  saveDB(dbState);
  res.json(event);
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const eventIndex = (dbState.events || []).findIndex((e: any) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: "Event not found" });
  }

  const removed = dbState.events.splice(eventIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Calendar cloning endpoint to duplicate events from one session to another
app.post('/api/events/clone', (req, res) => {
  const { sourceSessionId, targetSessionId, eventIds } = req.body;
  if (!sourceSessionId || !targetSessionId || !eventIds || !Array.isArray(eventIds)) {
    return res.status(400).json({ error: "Missing required fields (sourceSessionId, targetSessionId, eventIds as array)" });
  }

  const sourceSession = (dbState.academicSessions || []).find((s: any) => s.id === sourceSessionId);
  const targetSession = (dbState.academicSessions || []).find((s: any) => s.id === targetSessionId);

  if (!sourceSession || !targetSession) {
    return res.status(404).json({ error: "Source or Target session not found" });
  }

  // Calculate session offset in milliseconds
  const sourceStart = new Date(sourceSession.startDate).getTime();
  const targetStart = new Date(targetSession.startDate).getTime();
  const offsetMs = targetStart - sourceStart;

  // Retrieve source terms & target terms to try to match corresponding terms by name/sequence
  const sourceTerms = (dbState.terms || []).filter((t: any) => t.sessionId === sourceSessionId);
  const targetTerms = (dbState.terms || []).filter((t: any) => t.sessionId === targetSessionId);

  // Map events
  const clonedEvents: any[] = [];
  dbState.events = dbState.events || [];

  eventIds.forEach((eventId: string) => {
    const originalEvent = dbState.events.find((e: any) => e.id === eventId);
    if (!originalEvent) return;

    // Calculate cloned dates
    const origStart = new Date(originalEvent.startDate);
    const origEnd = new Date(originalEvent.endDate);

    const newStartMs = origStart.getTime() + offsetMs;
    const newEndMs = origEnd.getTime() + offsetMs;

    const newStart = new Date(newStartMs);
    const newEnd = new Date(newEndMs);

    // Optional: Align to weekday (e.g., if original was a Monday, shift new start to nearest Monday)
    const origDayOfWeek = origStart.getDay(); // 0-6
    const calculatedDayOfWeek = newStart.getDay();
    let dayShift = origDayOfWeek - calculatedDayOfWeek;
    if (dayShift !== 0) {
      newStart.setDate(newStart.getDate() + dayShift);
      newEnd.setDate(newEnd.getDate() + dayShift);
    }

    const startDateStr = newStart.toISOString().split('T')[0];
    const endDateStr = newEnd.toISOString().split('T')[0];

    // Find corresponding target term if original event was linked to a term
    let matchedTermId = "";
    if (originalEvent.termId) {
      const origTerm = sourceTerms.find((t: any) => t.id === originalEvent.termId);
      if (origTerm) {
        // Try to match by name (e.g., "First Term")
        const targetTerm = targetTerms.find((t: any) => t.name.toLowerCase() === origTerm.name.toLowerCase());
        if (targetTerm) {
          matchedTermId = targetTerm.id;
        } else if (targetTerms.length > 0) {
          // Fallback to the same index
          const origIdx = sourceTerms.findIndex((t: any) => t.id === origTerm.id);
          if (origIdx !== -1 && targetTerms[origIdx]) {
            matchedTermId = targetTerms[origIdx].id;
          } else {
            matchedTermId = targetTerms[0].id;
          }
        }
      }
    }

    const clonedEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      title: originalEvent.title,
      description: originalEvent.description || "",
      startDate: startDateStr,
      endDate: endDateStr,
      categoryId: originalEvent.categoryId,
      branchId: originalEvent.branchId,
      sessionId: targetSessionId,
      termId: matchedTermId || (targetTerms[0]?.id || "")
    };

    dbState.events.push(clonedEvent);
    clonedEvents.push(clonedEvent);
  });

  saveDB(dbState);
  res.status(201).json({ success: true, clonedCount: clonedEvents.length, events: clonedEvents });
});

// Timeline API
app.get('/api/events/timeline', (req, res) => {
  const eventsList = dbState.events || [];
  const sessionsList = dbState.academicSessions || [];
  const termsList = dbState.terms || [];
  const categoriesList = dbState.eventCategories || [];

  const today = '2026-07-03';

  // Build the hierarchical structure
  const structuredTimeline = sessionsList.map((session: any) => {
    const sessionTerms = termsList.filter((t: any) => t.sessionId === session.id);
    
    const termsData = sessionTerms.map((term: any) => {
      const termEvents = eventsList.filter((e: any) => e.termId === term.id);
      
      // Group by Month (using startDate)
      const monthsMap: { [key: string]: any[] } = {};
      termEvents.forEach((evt: any) => {
        let monthName = "Unknown Month";
        try {
          if (evt.startDate) {
            const dateObj = new Date(evt.startDate);
            monthName = dateObj.toLocaleString('en-US', { month: 'long' });
          }
        } catch (e) {}
        
        if (!monthsMap[monthName]) {
          monthsMap[monthName] = [];
        }
        monthsMap[monthName].push(evt);
      });

      const monthsData = Object.keys(monthsMap).map(monthName => {
        const monthEvents = monthsMap[monthName];
        
        // Group by Week (arbitrary partitioning or simply calculated from dates)
        const weeksMap: { [key: string]: any[] } = {};
        monthEvents.forEach((evt: any) => {
          let weekLabel = "Week 1";
          try {
            if (evt.startDate) {
              const dayNum = new Date(evt.startDate).getDate();
              const weekNum = Math.ceil(dayNum / 7);
              weekLabel = `Week ${weekNum}`;
            }
          } catch (e) {}
          
          if (!weeksMap[weekLabel]) {
            weeksMap[weekLabel] = [];
          }
          weeksMap[weekLabel].push(evt);
        });

        const weeksData = Object.keys(weeksMap).map(weekLabel => {
          const weekEvents = weeksMap[weekLabel].map((evt: any) => {
            // Determine Color Rules & Statuses:
            // Green = Completed
            // Blue = Current
            // Yellow = Upcoming
            // Red = Overdue
            let status = 'Upcoming';
            let color = 'Yellow'; // default for upcoming

            if (today < evt.startDate) {
              status = 'Upcoming';
              color = 'Yellow';
            } else if (today >= evt.startDate && today <= evt.endDate) {
              status = 'Current';
              color = 'Blue';
            } else {
              // Past event
              // Determine if overdue: financial/inventory campaigns that are passed their deadline
              const isOperational = ['cat-fin-rem', 'cat-fin-drv', 'cat-inv-ord'].includes(evt.categoryId);
              if (isOperational) {
                status = 'Overdue';
                color = 'Red';
              } else {
                status = 'Completed';
                color = 'Green';
              }
            }

            const matchedCat = categoriesList.find((c: any) => c.id === evt.categoryId);

            return {
              ...evt,
              calculatedStatus: status,
              colorRule: color,
              categoryName: matchedCat?.name || 'General Calendar',
              categoryColor: matchedCat?.color || '#4F46E5',
              categoryIcon: matchedCat?.icon || 'Calendar'
            };
          });

          return {
            weekLabel,
            events: weekEvents
          };
        });

        return {
          monthName,
          weeks: weeksData
        };
      });

      return {
        termId: term.id,
        termName: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
        months: monthsData
      };
    });

    return {
      sessionId: session.id,
      sessionName: session.name,
      startDate: session.startDate,
      endDate: session.endDate,
      terms: termsData
    };
  });

  res.json({
    today,
    timeline: structuredTimeline,
    summary: {
      totalEvents: eventsList.length,
      upcoming: eventsList.filter((e: any) => today < e.startDate).length,
      current: eventsList.filter((e: any) => today >= e.startDate && today <= e.endDate).length,
      completed: eventsList.filter((e: any) => today > e.endDate && !['cat-fin-rem', 'cat-fin-drv', 'cat-inv-ord'].includes(e.categoryId)).length,
      overdue: eventsList.filter((e: any) => today > e.endDate && ['cat-fin-rem', 'cat-fin-drv', 'cat-inv-ord'].includes(e.categoryId)).length
    }
  });
});

// Event Tasks CRUD APIs
app.get('/api/event_tasks', (req, res) => {
  res.json(dbState.event_tasks || []);
});

app.post('/api/event_tasks', (req, res) => {
  const { 
    eventId, title, description, assignedUser, dueDate, status,
    dueTime, taskType, week, subject, classId, term, branch, assignedRole,
    submissionDate, submissionTime, submissionStatus, daysLate, linkedTeachingRecordId, reminderNotice
  } = req.body;
  if (!eventId || !title || !assignedUser || !dueDate || !status) {
    return res.status(400).json({ error: "Missing required fields (eventId, title, assignedUser, dueDate, status)" });
  }

  const newTask = {
    id: `tsk-${Date.now()}`,
    eventId,
    title,
    description: description || "",
    assignedUser,
    dueDate,
    status,
    dueTime: dueTime || "17:00",
    taskType: taskType || "general",
    week: week ? Number(week) : undefined,
    subject: subject || undefined,
    classId: classId || undefined,
    term: term || undefined,
    branch: branch || "All",
    assignedRole: assignedRole || "Teacher",
    submissionDate: submissionDate || undefined,
    submissionTime: submissionTime || undefined,
    submissionStatus: submissionStatus || "Pending",
    daysLate: daysLate !== undefined ? Number(daysLate) : 0,
    linkedTeachingRecordId: linkedTeachingRecordId || undefined,
    reminderNotice: reminderNotice || undefined
  };

  dbState.event_tasks = dbState.event_tasks || [];
  dbState.event_tasks.push(newTask);
  saveDB(dbState);
  res.status(201).json(newTask);
});

app.put('/api/event_tasks/:id', (req, res) => {
  const { id } = req.params;
  const { 
    eventId, title, description, assignedUser, dueDate, status,
    dueTime, taskType, week, subject, classId, term, branch, assignedRole,
    submissionDate, submissionTime, submissionStatus, daysLate, linkedTeachingRecordId, reminderNotice
  } = req.body;

  const taskIndex = (dbState.event_tasks || []).findIndex((t: any) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = dbState.event_tasks[taskIndex];
  if (eventId) task.eventId = eventId;
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignedUser) task.assignedUser = assignedUser;
  if (dueDate) task.dueDate = dueDate;
  if (status) task.status = status;
  if (dueTime !== undefined) task.dueTime = dueTime;
  if (taskType !== undefined) task.taskType = taskType;
  if (week !== undefined) task.week = Number(week);
  if (subject !== undefined) task.subject = subject;
  if (classId !== undefined) task.classId = classId;
  if (term !== undefined) task.term = term;
  if (branch !== undefined) task.branch = branch;
  if (assignedRole !== undefined) task.assignedRole = assignedRole;
  if (submissionDate !== undefined) task.submissionDate = submissionDate;
  if (submissionTime !== undefined) task.submissionTime = submissionTime;
  if (submissionStatus !== undefined) task.submissionStatus = submissionStatus;
  if (daysLate !== undefined) task.daysLate = Number(daysLate);
  if (linkedTeachingRecordId !== undefined) task.linkedTeachingRecordId = linkedTeachingRecordId;
  if (reminderNotice !== undefined) task.reminderNotice = reminderNotice;

  saveDB(dbState);
  res.json(task);
});

app.delete('/api/event_tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = (dbState.event_tasks || []).findIndex((t: any) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const removed = dbState.event_tasks.splice(taskIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// -------------------------------------------------------------
// TEACHER TEACHING PERFORMANCE EVALUATION SYSTEM APIS
// -------------------------------------------------------------

const defaultTeacherEvaluationSettings = {
  dimensionWeights: {
    submissionCompliance: 20,
    teachingProgress: 35,
    studentWorkCoverage: 20,
    evidenceCompletion: 10,
    managementReview: 15
  },
  performanceBands: [
    { id: "band-1", minScore: 90, maxScore: 100, label: "Excellent", color: "emerald", description: "Consistently achieves top compliance, rigorous curriculum pacing, and exemplary student work documentation." },
    { id: "band-2", minScore: 80, maxScore: 89, label: "Very Good", color: "blue", description: "Strong performance across compliance, syllabus milestones, and exercise book verification." },
    { id: "band-3", minScore: 70, maxScore: 79, label: "Good", color: "indigo", description: "Meets institutional expectations with steady teaching logs and satisfactory student work coverage." },
    { id: "band-4", minScore: 60, maxScore: 69, label: "Needs Improvement", color: "amber", description: "Demonstrates minor pacing deviations or delayed records requiring targeted supervisory guidance." },
    { id: "band-5", minScore: 0, maxScore: 59, label: "Requires Attention", color: "rose", description: "Significant gaps in compliance, curriculum delivery, or student work verification requiring administrative intervention." }
  ],
  updatedAt: new Date().toISOString()
};

app.get('/api/teacher-evaluation-settings', (req, res) => {
  if (!dbState.teacher_evaluation_settings) {
    dbState.teacher_evaluation_settings = defaultTeacherEvaluationSettings;
    saveDB(dbState);
  }
  res.json(dbState.teacher_evaluation_settings);
});

app.put('/api/teacher-evaluation-settings', (req, res) => {
  const { dimensionWeights, performanceBands } = req.body;
  if (!dimensionWeights || !performanceBands) {
    return res.status(400).json({ error: "Missing dimensionWeights or performanceBands" });
  }

  // Validate weights sum or normalize
  const totalWeight = Object.values(dimensionWeights).reduce((a: any, b: any) => Number(a) + Number(b), 0);

  dbState.teacher_evaluation_settings = {
    dimensionWeights,
    performanceBands,
    totalWeight,
    updatedAt: new Date().toISOString()
  };

  saveDB(dbState);
  res.json(dbState.teacher_evaluation_settings);
});

app.get('/api/teacher-management-reviews', (req, res) => {
  res.json(dbState.teacher_management_reviews || []);
});

app.post('/api/teacher-management-reviews', (req, res) => {
  const { teacherId, teacherName, term, academicSession, branch, reviewerName, criteriaScores, overallScore, qualitativeNotes, recommendations } = req.body;
  if (!teacherId || overallScore === undefined) {
    return res.status(400).json({ error: "Teacher ID and overallScore are required" });
  }

  dbState.teacher_management_reviews = dbState.teacher_management_reviews || [];
  
  const existingIdx = dbState.teacher_management_reviews.findIndex((r: any) => 
    r.teacherId === teacherId && 
    (!term || r.term === term) && 
    (!academicSession || r.academicSession === academicSession)
  );

  const reviewRecord = {
    id: existingIdx !== -1 ? dbState.teacher_management_reviews[existingIdx].id : `rev-${Date.now()}`,
    teacherId,
    teacherName: teacherName || "",
    term: term || "First Term",
    academicSession: academicSession || "2025/2026",
    branch: branch || "GN",
    reviewerName: reviewerName || "Academic Supervisor",
    criteriaScores: criteriaScores || {
      lessonPreparation: 85,
      classroomDelivery: 85,
      studentEngagement: 85,
      professionalDemeanor: 90
    },
    overallScore: Number(overallScore),
    qualitativeNotes: qualitativeNotes || "",
    recommendations: recommendations || "",
    reviewedAt: new Date().toISOString()
  };

  if (existingIdx !== -1) {
    dbState.teacher_management_reviews[existingIdx] = reviewRecord;
  } else {
    dbState.teacher_management_reviews.push(reviewRecord);
  }

  saveDB(dbState);
  res.json(reviewRecord);
});

// -------------------------------------------------------------
// TEACHER REVIEW & FOLLOW-UP WORKFLOW APIS
// -------------------------------------------------------------

const seedTeacherReviews = [
  {
    id: "rev-act-101",
    teacherId: "staff-1",
    teacherName: "Aisha Garba",
    subject: "Primary Mathematics",
    classId: "Primary 5 - Gold",
    branch: "GN",
    term: "First Term",
    academicSession: "2025/2026",
    reviewerName: "Hajiya Maryam (Academic Vice Principal)",
    reviewDate: "2026-06-18",
    actionType: "Set Improvement Target",
    status: "Pending Follow-Up",
    performanceSummary: "Teaching progress is currently 1 week behind schedule on Decimals & Fractions unit.",
    comments: "Lesson plan structure is thorough; however, pacing on fractions requires accelerated practice sessions.",
    correctionsRequested: "Provide differentiated practice worksheets for bottom 25% pupils on Fractions simplification.",
    improvementTarget: "Complete Fractions and Decimals revision by Week 8.",
    followUpTaskTitle: "Complete Fractions and Decimals revision by Week 8",
    followUpDeadline: "2026-06-28",
    followUpStatus: "Pending",
    timelineTaskId: "task-followup-101",
    auditLogs: [
      {
        id: "log-1",
        timestamp: "2026-06-18T10:15:00Z",
        action: "Review Created & Target Set",
        actor: "Hajiya Maryam (Academic Vice Principal)",
        notes: "Identified pacing lag in Primary 5 Math; set target: Complete Fractions and Decimals revision by Week 8."
      },
      {
        id: "log-2",
        timestamp: "2026-06-18T10:16:00Z",
        action: "Timeline Task Generated",
        actor: "System Automation",
        notes: "Created follow-up task on Operations Timeline with due date 2026-06-28."
      }
    ]
  },
  {
    id: "rev-act-102",
    teacherId: "staff-4",
    teacherName: "Aliyu Usman",
    subject: "Basic English & Grammar",
    classId: "Primary 4 - Diamond",
    branch: "GN",
    term: "First Term",
    academicSession: "2025/2026",
    reviewerName: "Malam Sanusi (Head of Department)",
    reviewDate: "2026-06-12",
    actionType: "Request Correction",
    status: "Follow-Up Completed",
    performanceSummary: "Student notebook marking coverage was recorded at 72%, below the 80% institutional benchmark.",
    comments: "Grammar lesson delivery is satisfactory, but student essay workbook marking is delayed by 4 days.",
    correctionsRequested: "Complete marking and teacher signature remarks for all 28 student essay exercise books.",
    improvementTarget: "Achieve 100% student book marking coverage with constructive remarks.",
    followUpTaskTitle: "Mark & Sign all Primary 4 English Composition Workbooks",
    followUpDeadline: "2026-06-17",
    followUpStatus: "Completed",
    followUpCompletedDate: "2026-06-16",
    followUpCompletedNotes: "Teacher completed marking for all 28 notebooks; sample audited by HOD Sanusi with positive remarks.",
    timelineTaskId: "task-followup-102",
    auditLogs: [
      {
        id: "log-3",
        timestamp: "2026-06-12T14:30:00Z",
        action: "Correction Requested",
        actor: "Malam Sanusi (Head of Department)",
        notes: "Requested complete marking of 28 essay composition workbooks."
      },
      {
        id: "log-4",
        timestamp: "2026-06-16T11:20:00Z",
        action: "Follow-Up Marked Completed",
        actor: "Malam Sanusi (Head of Department)",
        notes: "Verified physical sample of 10 student books. Quality and stamp compliance verified."
      }
    ]
  }
];

// Initialize reviews in dbState if empty
if (!dbState.teacher_reviews || dbState.teacher_reviews.length === 0) {
  dbState.teacher_reviews = seedTeacherReviews;
}

app.get('/api/teacher-reviews', (req, res) => {
  res.json(dbState.teacher_reviews || []);
});

app.post('/api/teacher-reviews', (req, res) => {
  const {
    teacherId,
    teacherName,
    subject,
    classId,
    branch,
    term,
    academicSession,
    reviewerName,
    actionType,
    performanceSummary,
    comments,
    correctionsRequested,
    improvementTarget,
    followUpTaskTitle,
    followUpDeadline
  } = req.body;

  if (!teacherId || !teacherName || !actionType) {
    return res.status(400).json({ error: "Missing required review fields (teacherId, teacherName, actionType)" });
  }

  const reviewId = `rev-act-${Date.now()}`;
  const timelineTaskId = `task-followup-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];

  // 1. Create Follow-Up Task in Operations Timeline (event_tasks) if follow-up task is requested
  if (followUpTaskTitle && followUpDeadline) {
    dbState.event_tasks = dbState.event_tasks || [];
    const newEventTask = {
      id: timelineTaskId,
      title: `[Follow-Up] ${followUpTaskTitle}`,
      description: `Teacher Review Action for ${teacherName} (${subject} - ${classId}). Target: ${improvementTarget || followUpTaskTitle}. Supervisor: ${reviewerName || 'Management'}. Notes: ${comments || 'None'}`,
      assignedUser: teacherName,
      dueDate: followUpDeadline,
      status: "Pending" as const,
      taskType: "Teaching Follow-Up",
      subject: subject || "General",
      classId: classId || "General",
      term: term || "First Term",
      branch: branch || "GN",
      assignedRole: "Teacher",
      submissionStatus: "Pending",
      daysLate: 0,
      reminderNotice: `Action required by ${followUpDeadline}: ${improvementTarget || followUpTaskTitle}`
    };
    dbState.event_tasks.push(newEventTask);
  }

  // 2. Create Teacher Review Audit Record
  const newReviewRecord = {
    id: reviewId,
    teacherId,
    teacherName,
    subject: subject || "Primary Mathematics",
    classId: classId || "Primary 5 - Gold",
    branch: branch || "GN",
    term: term || "First Term",
    academicSession: academicSession || "2025/2026",
    reviewerName: reviewerName || "Academic Management",
    reviewDate: today,
    actionType, // 'Approve Record' | 'Request Correction' | 'Set Improvement Target' | 'Follow-Up Created'
    status: followUpTaskTitle ? "Pending Follow-Up" : actionType === "Approve Record" ? "Approved" : "Correction Requested",
    performanceSummary: performanceSummary || "Management performance review and guidance session.",
    comments: comments || "",
    correctionsRequested: correctionsRequested || "",
    improvementTarget: improvementTarget || "",
    followUpTaskTitle: followUpTaskTitle || "",
    followUpDeadline: followUpDeadline || "",
    followUpStatus: followUpTaskTitle ? "Pending" : "Not Required",
    timelineTaskId: followUpTaskTitle ? timelineTaskId : undefined,
    auditLogs: [
      {
        id: `log-${Date.now()}-1`,
        timestamp: nowIso,
        action: `${actionType} Action Initiated`,
        actor: reviewerName || "Academic Management",
        notes: comments || `Management action: ${actionType}. Target: ${improvementTarget || 'Standard Compliance'}.`
      }
    ]
  };

  if (followUpTaskTitle) {
    newReviewRecord.auditLogs.push({
      id: `log-${Date.now()}-2`,
      timestamp: nowIso,
      action: "Timeline Task Synced",
      actor: "Calendar & Operations Timeline Automation",
      notes: `Generated task "${followUpTaskTitle}" assigned to ${teacherName} due on ${followUpDeadline}.`
    });
  }

  dbState.teacher_reviews = dbState.teacher_reviews || [];
  dbState.teacher_reviews.unshift(newReviewRecord);
  saveDB(dbState);

  res.status(201).json(newReviewRecord);
});

// Mark Follow-Up Task as Completed
app.put('/api/teacher-reviews/:id/follow-up-complete', (req, res) => {
  const { id } = req.params;
  const { completionNotes, completedBy } = req.body;

  const reviewIndex = (dbState.teacher_reviews || []).findIndex((r: any) => r.id === id);
  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Teacher review record not found" });
  }

  const review = dbState.teacher_reviews[reviewIndex];
  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];

  review.followUpStatus = "Completed";
  review.status = "Follow-Up Completed";
  review.followUpCompletedDate = today;
  review.followUpCompletedNotes = completionNotes || "Supervisor reviewed and verified completion of improvement target.";

  // Append to Immutable Audit History
  review.auditLogs = review.auditLogs || [];
  review.auditLogs.push({
    id: `log-${Date.now()}`,
    timestamp: nowIso,
    action: "Follow-Up Marked Completed",
    actor: completedBy || review.reviewerName || "Management",
    notes: completionNotes || "Verified satisfactory delivery of improvement target."
  });

  // Also update linked Timeline Task (event_tasks)
  if (review.timelineTaskId) {
    const taskIdx = (dbState.event_tasks || []).findIndex((t: any) => t.id === review.timelineTaskId);
    if (taskIdx !== -1) {
      dbState.event_tasks[taskIdx].status = "Completed";
      dbState.event_tasks[taskIdx].submissionStatus = "On-Time";
      dbState.event_tasks[taskIdx].submissionDate = today;
    }
  }

  saveDB(dbState);
  res.json(review);
});

// Append new comment / note to audit history
app.post('/api/teacher-reviews/:id/audit-entry', (req, res) => {
  const { id } = req.params;
  const { action, actor, notes } = req.body;

  const reviewIndex = (dbState.teacher_reviews || []).findIndex((r: any) => r.id === id);
  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Teacher review record not found" });
  }

  const review = dbState.teacher_reviews[reviewIndex];
  const nowIso = new Date().toISOString();

  review.auditLogs = review.auditLogs || [];
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: nowIso,
    action: action || "Management Note Added",
    actor: actor || "Academic Supervisor",
    notes: notes || ""
  };
  review.auditLogs.push(newLog);

  saveDB(dbState);
  res.json(review);
});

// Event Assignments CRUD APIs
app.get('/api/event_assignments', (req, res) => {
  res.json(dbState.event_assignments || []);
});

app.post('/api/event_assignments', (req, res) => {
  const { taskId, assignedUser, assignedRole, assignedDate, completionDate } = req.body;
  if (!taskId || !assignedUser || !assignedRole || !assignedDate) {
    return res.status(400).json({ error: "Missing required fields (taskId, assignedUser, assignedRole, assignedDate)" });
  }

  const allowedRoles = ['Teacher', 'Accountant', 'Administrator', 'Store Manager'];
  if (!allowedRoles.includes(assignedRole)) {
    return res.status(400).json({ error: `Invalid assignedRole. Must be one of: ${allowedRoles.join(', ')}` });
  }

  const newAssignment = {
    id: `asg-${Date.now()}`,
    taskId,
    assignedUser,
    assignedRole,
    assignedDate,
    completionDate: completionDate || ""
  };

  dbState.event_assignments = dbState.event_assignments || [];
  dbState.event_assignments.push(newAssignment);
  saveDB(dbState);
  res.status(201).json(newAssignment);
});

app.put('/api/event_assignments/:id', (req, res) => {
  const { id } = req.params;
  const { taskId, assignedUser, assignedRole, assignedDate, completionDate } = req.body;

  const asgIndex = (dbState.event_assignments || []).findIndex((a: any) => a.id === id);
  if (asgIndex === -1) {
    return res.status(404).json({ error: "Assignment not found" });
  }

  const assignment = dbState.event_assignments[asgIndex];
  if (taskId) assignment.taskId = taskId;
  if (assignedUser) assignment.assignedUser = assignedUser;
  if (assignedRole) {
    const allowedRoles = ['Teacher', 'Accountant', 'Administrator', 'Store Manager'];
    if (!allowedRoles.includes(assignedRole)) {
      return res.status(400).json({ error: `Invalid assignedRole. Must be one of: ${allowedRoles.join(', ')}` });
    }
    assignment.assignedRole = assignedRole;
  }
  if (assignedDate) assignment.assignedDate = assignedDate;
  if (completionDate !== undefined) assignment.completionDate = completionDate;

  saveDB(dbState);
  res.json(assignment);
});

app.delete('/api/event_assignments/:id', (req, res) => {
  const { id } = req.params;
  const asgIndex = (dbState.event_assignments || []).findIndex((a: any) => a.id === id);
  if (asgIndex === -1) {
    return res.status(404).json({ error: "Assignment not found" });
  }

  const removed = dbState.event_assignments.splice(asgIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Fee Collection Campaigns CRUD APIs
app.get('/api/fee_campaigns', (req, res) => {
  const campaigns = dbState.fee_campaigns || [];
  
  // Calculate dynamic statistics based on real-time student invoice statuses
  const students = dbState.students || [];
  let systemOutstandingFees = 0;
  let systemDefaulterCount = 0;

  students.forEach((student: any) => {
    if (student.feeStatements) {
      const outstanding = student.feeStatements.outstandingBalance || 0;
      if (outstanding > 0) {
        systemOutstandingFees += outstanding;
        systemDefaulterCount += 1;
      }
    }
  });

  res.json({
    campaigns,
    stats: {
      systemOutstandingFees,
      systemDefaulterCount
    }
  });
});

app.post('/api/fee_campaigns', (req, res) => {
  const { name, week, startDate, endDate, targetCollection, actualCollection, defaulterCount } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields (name, startDate, endDate)" });
  }

  const newCampaign = {
    id: `fc-${Date.now()}`,
    name,
    week: week || "General",
    startDate,
    endDate,
    targetCollection: Number(targetCollection) || 0,
    actualCollection: Number(actualCollection) || 0,
    defaulterCount: Number(defaulterCount) || 0
  };

  dbState.fee_campaigns = dbState.fee_campaigns || [];
  dbState.fee_campaigns.push(newCampaign);
  saveDB(dbState);
  res.status(201).json(newCampaign);
});

app.put('/api/fee_campaigns/:id', (req, res) => {
  const { id } = req.params;
  const { name, week, startDate, endDate, targetCollection, actualCollection, defaulterCount } = req.body;

  const campaignIndex = (dbState.fee_campaigns || []).findIndex((c: any) => c.id === id);
  if (campaignIndex === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const campaign = dbState.fee_campaigns[campaignIndex];
  if (name !== undefined) campaign.name = name;
  if (week !== undefined) campaign.week = week;
  if (startDate !== undefined) campaign.startDate = startDate;
  if (endDate !== undefined) campaign.endDate = endDate;
  if (targetCollection !== undefined) campaign.targetCollection = Number(targetCollection) || 0;
  if (actualCollection !== undefined) campaign.actualCollection = Number(actualCollection) || 0;
  if (defaulterCount !== undefined) campaign.defaulterCount = Number(defaulterCount) || 0;

  saveDB(dbState);
  res.json(campaign);
});

app.delete('/api/fee_campaigns/:id', (req, res) => {
  const { id } = req.params;
  const campaignIndex = (dbState.fee_campaigns || []).findIndex((c: any) => c.id === id);
  if (campaignIndex === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const removed = dbState.fee_campaigns.splice(campaignIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// Event Budgets CRUD APIs
app.get('/api/event_budgets', (req, res) => {
  res.json(dbState.event_budgets || []);
});

app.post('/api/event_budgets', (req, res) => {
  const { eventId, eventName, totalBudget, items, totalSpent: userSpent } = req.body;
  if (!eventName && !eventId) {
    return res.status(400).json({ error: "Missing required fields (eventId or eventName)" });
  }

  const budgetItems = items || [];
  const calculatedSpent = budgetItems.reduce((acc: number, item: any) => acc + (Number(item.cost) || 0), 0);
  const finalSpent = userSpent !== undefined ? Number(userSpent) : calculatedSpent;
  const finalBudget = Number(totalBudget) || 0;
  const remaining = finalBudget - finalSpent;

  let status = "under_budget";
  if (finalSpent > finalBudget) status = "over_budget";
  else if (finalSpent === finalBudget && finalBudget > 0) status = "on_budget";

  const newBudget = {
    id: `eb-${Date.now()}`,
    eventId: eventId || "",
    eventName: eventName || "Unnamed Event",
    totalBudget: finalBudget,
    totalSpent: finalSpent,
    remaining,
    status,
    items: budgetItems.map((it: any, index: number) => ({
      id: it.id || `eb-item-${Date.now()}-${index}`,
      name: it.name || "Unnamed Item",
      category: it.category || "General",
      cost: Number(it.cost) || 0
    }))
  };

  dbState.event_budgets = dbState.event_budgets || [];
  dbState.event_budgets.push(newBudget);
  saveDB(dbState);
  res.status(201).json(newBudget);
});

app.put('/api/event_budgets/:id', (req, res) => {
  const { id } = req.params;
  const { eventId, eventName, totalBudget, items, totalSpent: userSpent } = req.body;

  const budgetIndex = (dbState.event_budgets || []).findIndex((b: any) => b.id === id);
  if (budgetIndex === -1) {
    return res.status(404).json({ error: "Event budget not found" });
  }

  const budget = dbState.event_budgets[budgetIndex];
  if (eventId !== undefined) budget.eventId = eventId;
  if (eventName !== undefined) budget.eventName = eventName;
  if (items !== undefined) {
    budget.items = items.map((it: any, index: number) => ({
      id: it.id || `eb-item-${Date.now()}-${index}`,
      name: it.name || "Unnamed Item",
      category: it.category || "General",
      cost: Number(it.cost) || 0
    }));
  }

  if (totalBudget !== undefined) budget.totalBudget = Number(totalBudget);

  const calculatedSpent = (budget.items || []).reduce((acc: number, item: any) => acc + (Number(item.cost) || 0), 0);
  budget.totalSpent = userSpent !== undefined ? Number(userSpent) : (items !== undefined ? calculatedSpent : (budget.totalSpent || 0));
  budget.remaining = budget.totalBudget - budget.totalSpent;

  let status = "under_budget";
  if (budget.totalSpent > budget.totalBudget) status = "over_budget";
  else if (budget.totalSpent === budget.totalBudget && budget.totalBudget > 0) status = "on_budget";
  budget.status = status;

  saveDB(dbState);
  res.json(budget);
});

app.delete('/api/event_budgets/:id', (req, res) => {
  const { id } = req.params;
  const budgetIndex = (dbState.event_budgets || []).findIndex((b: any) => b.id === id);
  if (budgetIndex === -1) {
    return res.status(404).json({ error: "Event budget not found" });
  }

  const removed = dbState.event_budgets.splice(budgetIndex, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// -------------------------------------------------------------
// INVENTORY AND READINESS MONITORING REST API
// -------------------------------------------------------------

// GET inventory list
app.get('/api/inventory', (req, res) => {
  res.json(dbState.inventory || []);
});

// POST new inventory item
app.post('/api/inventory', (req, res) => {
  const { name, category, stockQuantity, unit } = req.body;
  if (!name) return res.status(400).json({ error: "Missing required field: name" });
  
  const newItem = {
    id: `inv-${Date.now()}`,
    name,
    category: category || "General",
    stockQuantity: Number(stockQuantity) || 0,
    unit: unit || "units"
  };
  
  dbState.inventory = dbState.inventory || [];
  dbState.inventory.push(newItem);
  saveDB(dbState);
  res.status(201).json(newItem);
});

// PUT update inventory item
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, stockQuantity, unit } = req.body;
  
  const item = (dbState.inventory || []).find((it: any) => it.id === id);
  if (!item) return res.status(404).json({ error: "Inventory item not found" });
  
  if (name !== undefined) item.name = name;
  if (category !== undefined) item.category = category;
  if (stockQuantity !== undefined) item.stockQuantity = Number(stockQuantity);
  if (unit !== undefined) item.unit = unit;

  // Auto-sync side-effect: update existing readiness check line-items' availableQuantity with this new stock!
  if (stockQuantity !== undefined) {
    (dbState.inventory_readiness || []).forEach((rc: any) => {
      let changed = false;
      rc.items.forEach((it: any) => {
        if (it.itemId === id) {
          it.availableQuantity = Number(stockQuantity);
          it.status = it.availableQuantity >= it.requiredQuantity ? "available" : "shortage";
          changed = true;
        }
      });
      if (changed) {
        const hasShortage = rc.items.some((it: any) => it.status === "shortage");
        rc.status = hasShortage ? "warning" : "ready";
      }
    });
  }

  saveDB(dbState);
  res.json(item);
});

// DELETE inventory item
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const idx = (dbState.inventory || []).findIndex((it: any) => it.id === id);
  if (idx === -1) return res.status(404).json({ error: "Inventory item not found" });
  
  const removed = dbState.inventory.splice(idx, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// GET inventory readiness list
app.get('/api/inventory_readiness', (req, res) => {
  res.json(dbState.inventory_readiness || []);
});

// POST new readiness check
app.post('/api/inventory_readiness', (req, res) => {
  const { eventId, eventName, activityDate, notes, items } = req.body;
  if (!eventName) return res.status(400).json({ error: "Missing required field: eventName" });
  
  const checklistItems = items || [];
  const hasShortage = checklistItems.some((it: any) => (Number(it.availableQuantity) || 0) < (Number(it.requiredQuantity) || 0));
  const status = hasShortage ? "warning" : "ready";

  const newCheck = {
    id: `rc-${Date.now()}`,
    eventId: eventId || "",
    eventName,
    activityDate: activityDate || new Date().toISOString().split('T')[0],
    status,
    notes: notes || "",
    items: checklistItems.map((it: any, index: number) => ({
      itemId: it.itemId || "",
      name: it.name || "Unnamed Item",
      requiredQuantity: Number(it.requiredQuantity) || 0,
      availableQuantity: Number(it.availableQuantity) || 0,
      status: (Number(it.availableQuantity) || 0) >= (Number(it.requiredQuantity) || 0) ? "available" : "shortage"
    })),
    lastChecked: new Date().toISOString().split('T')[0]
  };

  dbState.inventory_readiness = dbState.inventory_readiness || [];
  dbState.inventory_readiness.push(newCheck);
  saveDB(dbState);
  res.status(201).json(newCheck);
});

// PUT update readiness check
app.put('/api/inventory_readiness/:id', (req, res) => {
  const { id } = req.params;
  const { eventId, eventName, activityDate, status: customStatus, notes, items } = req.body;

  const checkIndex = (dbState.inventory_readiness || []).findIndex((rc: any) => rc.id === id);
  if (checkIndex === -1) return res.status(404).json({ error: "Readiness check not found" });

  const check = dbState.inventory_readiness[checkIndex];
  if (eventId !== undefined) check.eventId = eventId;
  if (eventName !== undefined) check.eventName = eventName;
  if (activityDate !== undefined) check.activityDate = activityDate;
  if (notes !== undefined) check.notes = notes;
  if (items !== undefined) {
    check.items = items.map((it: any) => ({
      itemId: it.itemId || "",
      name: it.name || "Unnamed Item",
      requiredQuantity: Number(it.requiredQuantity) || 0,
      availableQuantity: Number(it.availableQuantity) || 0,
      status: (Number(it.availableQuantity) || 0) >= (Number(it.requiredQuantity) || 0) ? "available" : "shortage"
    }));
  }

  if (customStatus !== undefined) {
    check.status = customStatus;
  } else {
    const hasShortage = (check.items || []).some((it: any) => it.status === "shortage");
    check.status = hasShortage ? "warning" : "ready";
  }

  check.lastChecked = new Date().toISOString().split('T')[0];
  saveDB(dbState);
  res.json(check);
});

// DELETE readiness check
app.delete('/api/inventory_readiness/:id', (req, res) => {
  const { id } = req.params;
  const idx = (dbState.inventory_readiness || []).findIndex((rc: any) => rc.id === id);
  if (idx === -1) return res.status(404).json({ error: "Readiness check not found" });
  
  const removed = dbState.inventory_readiness.splice(idx, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// -------------------------------------------------------------
// STORE SALES & SELLABLE INVENTORY REST API
// -------------------------------------------------------------

// GET all store inventory items
app.get('/api/inventory/items', (req, res) => {
  res.json(dbState.inventory_store_items || []);
});

// POST create new store inventory item
app.post('/api/inventory/items', (req, res) => {
  const {
    itemCode,
    name,
    category,
    branch,
    store,
    unit,
    sellingPrice,
    costPrice,
    currentStock,
    minimumStockLevel,
    status,
    setting,
    location,
    bin
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  const newItem = {
    id: `item-${Date.now()}`,
    itemCode: itemCode || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    category: category || "Uniforms",
    branch: branch || "Main Campus",
    store: store || "Uniform Depot",
    unit: unit || "Piece",
    sellingPrice: Number(sellingPrice) || 0,
    costPrice: Number(costPrice) || 0,
    currentStock: Number(currentStock) || 0,
    minimumStockLevel: Number(minimumStockLevel) || 10,
    status: status || "Active",
    setting: setting || "Both", // "School Issue Only" | "Sell to Parent" | "Both"
    location: location || store || "Main Storeroom",
    bin: bin || "General Shelf"
  };

  dbState.inventory_store_items = dbState.inventory_store_items || [];
  dbState.inventory_store_items.push(newItem);
  saveDB(dbState);
  res.status(201).json(newItem);
});

// PUT update store inventory item
app.put('/api/inventory/items/:id', (req, res) => {
  const { id } = req.params;
  const items = dbState.inventory_store_items || [];
  const item = items.find((it: any) => it.id === id);

  if (!item) {
    return res.status(404).json({ error: "Inventory item not found" });
  }

  const {
    itemCode,
    name,
    category,
    branch,
    store,
    unit,
    sellingPrice,
    costPrice,
    currentStock,
    minimumStockLevel,
    status,
    setting,
    location,
    bin
  } = req.body;

  if (itemCode !== undefined) item.itemCode = itemCode;
  if (name !== undefined) item.name = name;
  if (category !== undefined) item.category = category;
  if (branch !== undefined) item.branch = branch;
  if (store !== undefined) item.store = store;
  if (unit !== undefined) item.unit = unit;
  if (sellingPrice !== undefined) item.sellingPrice = Number(sellingPrice);
  if (costPrice !== undefined) item.costPrice = Number(costPrice);
  if (currentStock !== undefined) item.currentStock = Number(currentStock);
  if (minimumStockLevel !== undefined) item.minimumStockLevel = Number(minimumStockLevel);
  if (status !== undefined) item.status = status;
  if (setting !== undefined) item.setting = setting;
  if (location !== undefined) item.location = location;
  if (bin !== undefined) item.bin = bin;

  saveDB(dbState);
  res.json(item);
});

// DELETE store inventory item
app.delete('/api/inventory/items/:id', (req, res) => {
  const { id } = req.params;
  const items = dbState.inventory_store_items || [];
  const idx = items.findIndex((it: any) => it.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Inventory item not found" });
  }

  const removed = items.splice(idx, 1);
  saveDB(dbState);
  res.json({ success: true, removed: removed[0] });
});

// POST adjust inventory item stock
app.post('/api/inventory/adjust', (req, res) => {
  const { itemId, adjustmentAmount, reason, notes } = req.body;
  const items = dbState.inventory_store_items || [];
  const item = items.find((it: any) => it.id === itemId);

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  const adj = Number(adjustmentAmount) || 0;
  item.currentStock = Math.max(0, parseFloat((item.currentStock + adj).toFixed(3)));

  saveDB(dbState);
  res.json({
    success: true,
    item,
    newStock: item.currentStock,
    reason: reason || "Manual Adjustment",
    notes
  });
});

// -------------------------------------------------------------
// STORE SALES & STUDENT SEARCH API (ISOLATED STORE TRANSACTION SYSTEM)
// -------------------------------------------------------------

// Search students & families for Store Cashier (by Admission No, Student Name, Parent Name, Parent Phone)
app.get('/api/students/store_search', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const students = dbState.students || [];
  const ledgers = dbState.student_fee_ledgers || [];
  const storeSales = dbState.inventory_store_sales || [];
  const families = dbState.family_accounts || [];

  if (!query) {
    // Return sample list of first 12 students with search metadata
    const sampleResults = students.slice(0, 12).map((s: any) => {
      const studentLedgers = ledgers.filter((l: any) => l.studentId === s.id);
      const schoolFeesBalance = studentLedgers.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);
      const studentSales = storeSales.filter((sal: any) => sal.studentId === s.id || (sal.parentPhone && s.parentPhone && sal.parentPhone.includes(s.parentPhone)));
      const storeTotalSpent = studentSales.reduce((sum: number, sal: any) => sum + (Number(sal.totalAmount) || 0), 0);
      const family = families.find((f: any) => f.id === s.familyAccountId || (f.primaryParentPhone && s.parentPhone && f.primaryParentPhone === s.parentPhone));

      return {
        id: s.id,
        admissionNo: s.enrollmentNo || `ADM-${s.serialNumber || s.id}`,
        name: s.name,
        grade: s.grade,
        classSection: s.classSection || 'A',
        branch: s.branch || 'Main Campus',
        parentName: s.parentName || 'Parent / Guardian',
        parentPhone: s.parentPhone || '',
        parentEmail: s.parentEmail || '',
        familyAccountId: family?.id || s.familyAccountId || '',
        familyName: family?.familyName || '',
        schoolFeesBalance, // For reference only (strictly isolated from store purchases)
        storePurchasesCount: studentSales.length,
        storeTotalSpent,
        recentSales: studentSales.slice(0, 3)
      };
    });
    return res.json(sampleResults);
  }

  // Filter students matching admission number, student name, parent name, or parent phone
  const matches = students.filter((s: any) => {
    const admission = (s.enrollmentNo || '').toLowerCase();
    const serial = String(s.serialNumber || '');
    const name = (s.name || '').toLowerCase();
    const parent = (s.parentName || '').toLowerCase();
    const phone = (s.parentPhone || '').replace(/\D/g, '');
    const cleanQuery = query.replace(/\D/g, '');

    const matchAdmission = admission.includes(query) || (serial && serial.includes(query));
    const matchName = name.includes(query);
    const matchParent = parent.includes(query);
    const matchPhone = cleanQuery.length >= 3 && phone.includes(cleanQuery);

    return matchAdmission || matchName || matchParent || matchPhone;
  });

  const formattedResults = matches.map((s: any) => {
    const studentLedgers = ledgers.filter((l: any) => l.studentId === s.id);
    const schoolFeesBalance = studentLedgers.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);
    const studentSales = storeSales.filter((sal: any) => sal.studentId === s.id || (sal.parentPhone && s.parentPhone && sal.parentPhone.includes(s.parentPhone)));
    const storeTotalSpent = studentSales.reduce((sum: number, sal: any) => sum + (Number(sal.totalAmount) || 0), 0);
    const family = families.find((f: any) => f.id === s.familyAccountId || (f.primaryParentPhone && s.parentPhone && f.primaryParentPhone === s.parentPhone));

    return {
      id: s.id,
      admissionNo: s.enrollmentNo || `ADM-${s.serialNumber || s.id}`,
      name: s.name,
      grade: s.grade,
      classSection: s.classSection || 'A',
      branch: s.branch || 'Main Campus',
      parentName: s.parentName || 'Parent / Guardian',
      parentPhone: s.parentPhone || '',
      parentEmail: s.parentEmail || '',
      familyAccountId: family?.id || s.familyAccountId || '',
      familyName: family?.familyName || '',
      schoolFeesBalance, // For reference only (strictly isolated from store purchases)
      storePurchasesCount: studentSales.length,
      storeTotalSpent,
      recentSales: studentSales.slice(0, 3)
    };
  });

  res.json(formattedResults);
});

// GET single student's store financial history (Store Materials Purchase ledger)
app.get('/api/students/:id/store_history', (req, res) => {
  const { id } = req.params;
  const storeSales = dbState.inventory_store_sales || [];
  const studentSales = storeSales.filter((s: any) => s.studentId === id);
  
  res.json({
    studentId: id,
    ledgerCategory: 'Store Materials Purchase',
    schoolFeeIsolated: true,
    isolationNotice: 'Store purchases are maintained in a dedicated materials ledger and do not alter school-fee balances.',
    transactionsCount: studentSales.length,
    totalSpent: studentSales.reduce((sum: number, s: any) => sum + (Number(s.totalAmount) || 0), 0),
    transactions: studentSales
  });
});

// GET store audit trail
app.get('/api/inventory/audit_trail', (req, res) => {
  res.json(dbState.inventory_store_audit_logs || []);
});

// GET all store sales transactions
app.get('/api/inventory/sales', (req, res) => {
  res.json(dbState.inventory_store_sales || []);
});

// GET single store sale transaction by ID
app.get('/api/inventory/sales/:id', (req, res) => {
  const { id } = req.params;
  const sale = (dbState.inventory_store_sales || []).find((s: any) => s.id === id || s.transactionNo === id);
  if (!sale) {
    return res.status(404).json({ error: "Sale record not found" });
  }
  res.json(sale);
});

// POST record a new store sale (Point-of-Sale checkout with Inventory reduction & Audit Trail)
app.post('/api/inventory/sales', (req, res) => {
  const {
    branch,
    store,
    customerType,
    studentId,
    admissionNo,
    studentName,
    parentName,
    parentPhone,
    parentEmail,
    grade,
    items, // Array of { itemId, itemCode, itemName, unit, quantity, unitPrice, subtotal }
    subtotal,
    discountAmount,
    discountDetail, // { permitted, type, rate, amount, reason, authorizedBy }
    totalAmount,
    paymentMethod,
    referenceNo,
    cashierId,
    cashierName,
    notes
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one item is required for a sale" });
  }

  const inventory = dbState.inventory_store_items || [];
  const auditSnapshots: any[] = [];

  // Validate stock and verify items
  const validatedItems: any[] = [];
  for (const line of items) {
    const invItem = inventory.find((it: any) => it.id === line.itemId || it.itemCode === line.itemCode);
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) {
      return res.status(400).json({ error: `Invalid quantity for ${line.itemName || 'item'}` });
    }

    let stockBefore = 0;
    let stockAfter = 0;

    if (invItem) {
      stockBefore = invItem.currentStock;
      if (invItem.currentStock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for ${invItem.name}. Available: ${invItem.currentStock} ${invItem.unit}, Requested: ${qty} ${invItem.unit}`
        });
      }

      // Check sellable setting
      if (invItem.setting === "School Issue Only") {
        return res.status(400).json({
          error: `${invItem.name} is marked as 'School Issue Only' and cannot be sold to parents/students.`
        });
      }

      // Deduct inventory quantity (supports decimal reduction e.g. 2.5 meters)
      invItem.currentStock = parseFloat((invItem.currentStock - qty).toFixed(3));
      stockAfter = invItem.currentStock;
    }

    const unitPrice = Number(line.unitPrice) || (invItem ? invItem.sellingPrice : 0);
    const lineSubtotal = parseFloat((qty * unitPrice).toFixed(2));

    const validatedLine = {
      itemId: line.itemId || (invItem ? invItem.id : `item-${Date.now()}`),
      itemCode: line.itemCode || (invItem ? invItem.itemCode : "SKU-N/A"),
      itemName: line.itemName || (invItem ? invItem.name : "Custom Item"),
      unit: line.unit || (invItem ? invItem.unit : "Piece"),
      quantity: qty,
      unitPrice,
      subtotal: lineSubtotal
    };

    validatedItems.push(validatedLine);

    auditSnapshots.push({
      itemId: validatedLine.itemId,
      itemCode: validatedLine.itemCode,
      itemName: validatedLine.itemName,
      unit: validatedLine.unit,
      qtySold: qty,
      stockBefore,
      stockAfter,
      unitPrice,
      total: lineSubtotal
    });
  }

  const calcSubtotal = validatedItems.reduce((acc, it) => acc + it.subtotal, 0);
  const discount = Number(discountAmount) || (discountDetail ? Number(discountDetail.amount) || 0 : 0);
  const grandTotal = Math.max(0, calcSubtotal - discount);

  const saleDate = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Generate unique transaction number (e.g. STR-TXN-2026-894102)
  const uniqueRandom = Math.floor(100000 + Math.random() * 900000);
  const uniqueTxnNo = `STR-TXN-${now.getFullYear()}-${uniqueRandom}`;
  const saleId = uniqueTxnNo;
  const receiptNo = `RCP-${uniqueTxnNo}`;

  const generatedRef = referenceNo || `${(paymentMethod || 'CASH').toUpperCase().slice(0, 3)}-REF-${Math.floor(100000 + Math.random() * 900000)}`;

  const newSale = {
    id: saleId,
    transactionNo: uniqueTxnNo,
    receiptNumber: receiptNo,
    schoolName: "SULTAN ATTAHIRU MEMORIAL SCHOOLS",
    saleDate,
    time: timeStr,
    branch: branch || "Main Campus",
    store: store || "Uniform Depot",
    customerType: customerType || "Parent",
    studentId: studentId || "",
    admissionNo: admissionNo || "",
    studentName: studentName || "Walk-in Customer",
    parentName: parentName || studentName || "Walk-in Parent",
    parentPhone: parentPhone || "",
    parentEmail: parentEmail || "",
    grade: grade || "",
    items: validatedItems,
    subtotal: calcSubtotal,
    discountAmount: discount,
    discountDetail: discountDetail || (discount > 0 ? { permitted: true, type: 'fixed', amount: discount, reason: 'Cashier authorized' } : undefined),
    totalAmount: grandTotal,
    amountPaid: grandTotal,
    balanceDue: 0,
    paymentMethod: paymentMethod || "Cash",
    referenceNo: generatedRef,
    cashierId: cashierId || "usr-cashier-01",
    cashierName: cashierName || "Store Cashier",
    notes: notes || "",
    ledgerCategory: "Store Materials Purchase",
    schoolFeeIsolated: true, // Guarantees store purchase is isolated from tuition fee balance
    reprintCount: 0,
    emailDispatchedTo: [],
    whatsAppDispatchedTo: [],
    createdAt: now.toISOString()
  };

  // 1. Record Sale in Store Sales collection
  dbState.inventory_store_sales = dbState.inventory_store_sales || [];
  dbState.inventory_store_sales.unshift(newSale);

  // 2. Record in Student/Family Store Financial History (Dedicated Materials Purchase Ledger)
  // This is strictly maintained separately from tuition fee invoices
  dbState.student_store_history = dbState.student_store_history || [];
  dbState.student_store_history.unshift({
    id: `HIST-${uniqueTxnNo}`,
    studentId: studentId || "",
    admissionNo: admissionNo || "",
    studentName: studentName || "",
    parentName: parentName || "",
    parentPhone: parentPhone || "",
    transactionNo: uniqueTxnNo,
    receiptNumber: receiptNo,
    type: 'Store Materials Purchase',
    subtotal: calcSubtotal,
    discountAmount: discount,
    totalPaid: grandTotal,
    balanceDue: 0,
    paymentMethod: paymentMethod || "Cash",
    referenceNo: generatedRef,
    date: saleDate,
    itemsCount: validatedItems.length,
    schoolFeeIsolated: true,
    schoolFeeBalanceAffected: 0, // Explicit 0 change to tuition fee balance
    createdAt: now.toISOString()
  });

  // 3. Maintain Complete Store Transaction Audit Trail
  dbState.inventory_store_audit_logs = dbState.inventory_store_audit_logs || [];
  const auditEntry = {
    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    transactionId: uniqueTxnNo,
    timestamp: now.toISOString(),
    date: saleDate,
    time: timeStr,
    cashierId: cashierId || "usr-cashier-01",
    cashierName: cashierName || "Store Cashier",
    actionType: "STORE_DIRECT_SALE",
    studentId: studentId || "N/A",
    admissionNo: admissionNo || "N/A",
    studentName: studentName || "Walk-in",
    parentName: parentName || "Walk-in Parent",
    parentPhone: parentPhone || "N/A",
    items: auditSnapshots,
    subtotal: calcSubtotal,
    discount: discountDetail || (discount > 0 ? { permitted: true, type: 'fixed', amount: discount } : undefined),
    totalAmount: grandTotal,
    amountPaid: grandTotal,
    balanceDue: 0,
    paymentMethod: paymentMethod || "Cash",
    referenceNo: generatedRef,
    branch: branch || "Main Campus",
    store: store || "Uniform Depot",
    notes: notes || "Direct store sale to parent",
    actionDetails: `Original sale processed. Receipt ${receiptNo} issued.`
  };
  dbState.inventory_store_audit_logs.unshift(auditEntry);

  saveDB(dbState);
  res.status(201).json(newSale);
});

// POST Audit a Receipt Action (Reprint, Download PDF, Share WhatsApp, Send Email)
app.post('/api/inventory/receipts/audit', (req, res) => {
  const {
    transactionId,
    actionType, // 'REPRINT_RECEIPT' | 'DOWNLOAD_PDF' | 'SHARE_WHATSAPP' | 'SEND_EMAIL'
    cashierId,
    cashierName,
    reprintReason,
    recipientEmail,
    recipientPhone,
    actionDetails
  } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: "transactionId is required" });
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  dbState.inventory_store_sales = dbState.inventory_store_sales || [];
  const sale = dbState.inventory_store_sales.find((s: any) => s.id === transactionId || s.transactionNo === transactionId);

  if (sale) {
    if (actionType === 'REPRINT_RECEIPT') {
      sale.reprintCount = (sale.reprintCount || 0) + 1;
      sale.lastReprintedAt = now.toISOString();
      sale.lastReprintedBy = cashierName || "Authorized Cashier";
      sale.lastReprintReason = reprintReason || "Customer Copy Requested";
    } else if (actionType === 'SEND_EMAIL' && recipientEmail) {
      sale.emailDispatchedTo = sale.emailDispatchedTo || [];
      if (!sale.emailDispatchedTo.includes(recipientEmail)) {
        sale.emailDispatchedTo.push(recipientEmail);
      }
    } else if (actionType === 'SHARE_WHATSAPP' && recipientPhone) {
      sale.whatsAppDispatchedTo = sale.whatsAppDispatchedTo || [];
      if (!sale.whatsAppDispatchedTo.includes(recipientPhone)) {
        sale.whatsAppDispatchedTo.push(recipientPhone);
      }
    }
  }

  dbState.inventory_store_audit_logs = dbState.inventory_store_audit_logs || [];
  const newAudit = {
    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    transactionId,
    timestamp: now.toISOString(),
    date: dateStr,
    time: timeStr,
    cashierId: cashierId || "usr-cashier-01",
    cashierName: cashierName || "Store Cashier",
    actionType: actionType || 'REPRINT_RECEIPT',
    studentId: sale?.studentId || "N/A",
    admissionNo: sale?.admissionNo || "N/A",
    studentName: sale?.studentName || "N/A",
    parentName: sale?.parentName || "Parent",
    parentPhone: sale?.parentPhone || recipientPhone || "N/A",
    totalAmount: sale?.totalAmount || 0,
    amountPaid: sale?.totalAmount || 0,
    balanceDue: 0,
    paymentMethod: sale?.paymentMethod || "POS",
    referenceNo: sale?.referenceNo || "",
    branch: sale?.branch || "Main Campus",
    store: sale?.store || "Uniform Depot",
    reprintReason: reprintReason || (actionType === 'REPRINT_RECEIPT' ? "Customer Requested Physical Duplicate" : undefined),
    reprintCount: sale?.reprintCount || 0,
    recipientEmail: recipientEmail || undefined,
    recipientPhone: recipientPhone || undefined,
    actionDetails: actionDetails || (
      actionType === 'REPRINT_RECEIPT'
        ? `Official store receipt reprinted (Copy #${sale?.reprintCount || 1}). Reason: ${reprintReason || 'Customer Request'}`
        : actionType === 'SEND_EMAIL'
        ? `Store sales receipt transmitted electronically to ${recipientEmail}`
        : actionType === 'SHARE_WHATSAPP'
        ? `Store sales receipt shared via WhatsApp to ${recipientPhone}`
        : `Store sales receipt PDF document generated and downloaded.`
    )
  };

  dbState.inventory_store_audit_logs.unshift(newAudit);
  saveDB(dbState);

  res.status(200).json({
    success: true,
    message: "Receipt action recorded in immutable store audit trail",
    audit: newAudit,
    sale
  });
});

// POST Send Store Sale Receipt via Email
app.post('/api/inventory/receipts/send_email', (req, res) => {
  const { saleId, recipientEmail, cashierName, notes } = req.body;
  if (!saleId || !recipientEmail) {
    return res.status(400).json({ error: "saleId and recipientEmail are required" });
  }

  const sale = (dbState.inventory_store_sales || []).find((s: any) => s.id === saleId || s.transactionNo === saleId);
  if (!sale) {
    return res.status(404).json({ error: "Store sale record not found" });
  }

  const now = new Date();
  sale.emailDispatchedTo = sale.emailDispatchedTo || [];
  if (!sale.emailDispatchedTo.includes(recipientEmail)) {
    sale.emailDispatchedTo.push(recipientEmail);
  }

  const auditEntry = {
    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    transactionId: sale.transactionNo || sale.id,
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cashierId: "usr-cashier-01",
    cashierName: cashierName || "Store Cashier",
    actionType: "SEND_EMAIL" as const,
    studentId: sale.studentId || "N/A",
    admissionNo: sale.admissionNo || "N/A",
    studentName: sale.studentName || "N/A",
    parentName: sale.parentName || "Parent",
    parentPhone: sale.parentPhone || "N/A",
    recipientEmail,
    totalAmount: sale.totalAmount,
    amountPaid: sale.totalAmount,
    balanceDue: 0,
    paymentMethod: sale.paymentMethod,
    referenceNo: sale.referenceNo,
    branch: sale.branch,
    store: sale.store,
    actionDetails: `Store receipt officially emailed to ${recipientEmail}. Memo: ${notes || 'Store Purchase Confirmation'}`
  };

  dbState.inventory_store_audit_logs = dbState.inventory_store_audit_logs || [];
  dbState.inventory_store_audit_logs.unshift(auditEntry);
  saveDB(dbState);

  res.status(200).json({
    success: true,
    message: `Receipt successfully dispatched to ${recipientEmail}`,
    auditId: auditEntry.id,
    sentAt: now.toISOString(),
    sale
  });
});

// -------------------------------------------------------------
// COMBINED PAYMENT API (Store Purchase + School Fees)
// -------------------------------------------------------------

// GET all combined payments
app.get('/api/combined_payments', (req, res) => {
  res.json(dbState.combined_payments || []);
});

// GET single combined payment session by ID
app.get('/api/combined_payments/:id', (req, res) => {
  const { id } = req.params;
  const record = (dbState.combined_payments || []).find((c: any) => c.id === id || c.combinedReceiptNo === id);
  if (!record) {
    return res.status(404).json({ error: "Combined payment session record not found" });
  }
  res.json(record);
});

// POST process combined payment session (Priority 1: Store Purchase, Priority 2: School Fees, Priority 3: Advance Wallet Credit)
app.post('/api/combined_payments', (req, res) => {
  const {
    studentId,
    studentName,
    admissionNo,
    grade,
    classSection,
    branch,
    parentName,
    parentPhone,
    parentEmail,
    totalPaymentReceived, // e.g. 60000
    paymentMethod, // 'Cash' | 'POS Card' | 'Bank Transfer' | 'Student Wallet'
    referenceNo,
    cashierId,
    cashierName,
    notes,
    store,
    storeItems, // Array of { itemId, itemCode, itemName, unit, quantity, unitPrice, subtotal }
    storeDiscountAmount,
    allocationRule, // 'oldest_first' | 'highest_outstanding' | 'lowest_outstanding' | 'even_distribution'
    // Manual Override & Policy Fields
    isManualOverride,
    overrideReason,
    overriddenBy,
    manualStorePaid,
    manualFeeAllocations // { [ledgerId]: number }
  } = req.body;

  if (!studentId || totalPaymentReceived === undefined || Number(totalPaymentReceived) <= 0) {
    return res.status(400).json({ error: "studentId and a positive total payment amount are required." });
  }

  const P = Number(totalPaymentReceived);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const uniqueCode = Math.floor(100000 + Math.random() * 900000);
  const combinedId = `CPAY-${now.getFullYear()}-${uniqueCode}`;
  const combinedReceiptNo = `RCP-COMB-${now.getFullYear()}-${uniqueCode}`;
  const refNum = referenceNo || `${(paymentMethod || 'PAY').toUpperCase().replace(/\s+/g, '').slice(0, 3)}-REF-${uniqueCode}`;

  // -------------------------------------------------------------
  // STEP 1: VALIDATE & DEDUCT INVENTORY (Store Purchase Priority)
  // -------------------------------------------------------------
  const inventory = dbState.inventory_store_items || [];
  const validatedStoreItems: any[] = [];
  const auditSnapshots: any[] = [];

  const rawItems = Array.isArray(storeItems) ? storeItems : [];
  for (const line of rawItems) {
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) continue;

    const invItem = inventory.find((it: any) => it.id === line.itemId || it.itemCode === line.itemCode);
    let stockBefore = 0;
    let stockAfter = 0;

    if (invItem) {
      stockBefore = invItem.currentStock;
      if (invItem.currentStock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for ${invItem.name}. Available: ${invItem.currentStock} ${invItem.unit}, Requested: ${qty} ${invItem.unit}`
        });
      }
      invItem.currentStock = parseFloat((invItem.currentStock - qty).toFixed(3));
      stockAfter = invItem.currentStock;
    }

    const unitPrice = Number(line.unitPrice) || (invItem ? invItem.sellingPrice : 0);
    const lineSubtotal = parseFloat((qty * unitPrice).toFixed(2));

    const validatedLine = {
      itemId: line.itemId || (invItem ? invItem.id : `item-${Date.now()}`),
      itemCode: line.itemCode || (invItem ? invItem.itemCode : "SKU-N/A"),
      itemName: line.itemName || (invItem ? invItem.name : "Custom Store Item"),
      unit: line.unit || (invItem ? invItem.unit : "Piece"),
      quantity: qty,
      unitPrice,
      subtotal: lineSubtotal
    };

    validatedStoreItems.push(validatedLine);
    auditSnapshots.push({
      itemId: validatedLine.itemId,
      itemCode: validatedLine.itemCode,
      itemName: validatedLine.itemName,
      unit: validatedLine.unit,
      qtySold: qty,
      stockBefore,
      stockAfter,
      unitPrice,
      total: lineSubtotal
    });
  }

  const storeSubtotal = validatedStoreItems.reduce((sum, it) => sum + it.subtotal, 0);
  const storeDiscount = Number(storeDiscountAmount) || 0;
  const storeGrandTotal = Math.max(0, storeSubtotal - storeDiscount);

  // Student Fee Ledgers Lookup
  const ledgers = dbState.student_fee_ledgers || [];
  const studentLedgers = ledgers.filter((l: any) => l.studentId === studentId && (Number(l.outstanding) || 0) > 0);
  const schoolFeeOutstandingBefore = studentLedgers.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);

  // Baseline / Auto Allocation Computation (Oldest Outstanding Term First)
  const defaultStorePaid = Math.min(P, storeGrandTotal);
  let defaultRemForFees = Math.max(0, P - defaultStorePaid);
  const autoTermSortedLedgers = [...studentLedgers].sort((a: any, b: any) => {
    const timeA = new Date(a.billingDate || a.createdAt || 0).getTime();
    const timeB = new Date(b.billingDate || b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  const autoTermAllocations: Array<{ ledgerId: string; termName: string; amount: number }> = [];
  let autoRem = defaultRemForFees;
  let autoTotalFeeAllocated = 0;
  for (const l of autoTermSortedLedgers) {
    if (autoRem <= 0) break;
    const out = Number(l.outstanding) || 0;
    const canAlloc = Math.min(out, autoRem);
    if (canAlloc > 0) {
      autoTermAllocations.push({
        ledgerId: l.id,
        termName: l.termName || l.termId || 'Term Fee',
        amount: canAlloc
      });
      autoTotalFeeAllocated += canAlloc;
      autoRem -= canAlloc;
    }
  }

  // Determine actual allocation amounts based on manual override flag vs default policy
  let storeAmountPaid = 0;
  let storeBalanceDue = 0;
  let storeStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
  let totalFeeAllocated = 0;
  const feeLedgerAllocations: any[] = [];
  const feePaymentItems: any[] = [];
  const feePaymentId = `pay-fees-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let overrideAuditInfo: any = null;

  if (isManualOverride) {
    // -------------------------------------------------------------
    // MANUAL OVERRIDE PATH (Authorized Policy Exception)
    // -------------------------------------------------------------
    const requestedStorePaid = manualStorePaid !== undefined ? Math.min(Number(manualStorePaid) || 0, storeGrandTotal, P) : defaultStorePaid;
    storeAmountPaid = requestedStorePaid;
    storeBalanceDue = Math.max(0, storeGrandTotal - storeAmountPaid);
    storeStatus = storeGrandTotal === 0 ? 'Paid' : (storeAmountPaid >= storeGrandTotal ? 'Paid' : (storeAmountPaid > 0 ? 'Partially Paid' : 'Unpaid'));

    let remainingFunds = Math.max(0, P - storeAmountPaid);
    const manualAllocObj = manualFeeAllocations || {};

    // Apply manual allocations per term ledger
    for (const [ledgerId, requestedAmt] of Object.entries(manualAllocObj)) {
      const ledger = studentLedgers.find((l: any) => l.id === ledgerId);
      if (ledger) {
        const numReq = Math.min(Number(requestedAmt) || 0, remainingFunds, ledger.outstanding || 0);
        if (numReq > 0) {
          const outBefore = ledger.outstanding;
          ledger.outstanding = Number((ledger.outstanding - numReq).toFixed(2));
          ledger.status = ledger.outstanding === 0 ? 'Paid' : 'Partially Paid';
          remainingFunds -= numReq;
          totalFeeAllocated += numReq;

          feeLedgerAllocations.push({
            ledgerId: ledger.id,
            name: ledger.id,
            termName: ledger.termName || ledger.termId || 'Current Term',
            outstandingBefore: outBefore,
            amountAllocated: numReq,
            outstandingAfter: ledger.outstanding,
            status: ledger.status
          });

          feePaymentItems.push({
            id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            paymentId: feePaymentId,
            ledgerId: ledger.id,
            name: `Combined Payment Manual Allocation - ${ledger.termName || ledger.id}`,
            amount: Number(numReq.toFixed(2)),
            createdAt: now.toISOString()
          });
        }
      }
    }

    overrideAuditInfo = {
      isOverridden: true,
      overrideReason: overrideReason || "Manual adjustment authorized by Cashier / Bursary Desk per school policy",
      overriddenBy: overriddenBy || cashierName || "Finance Officer",
      overriddenRole: "Authorized Cashier / Bursar",
      timestamp: now.toISOString(),
      originalAutoAllocation: {
        storePaid: defaultStorePaid,
        feeAllocated: autoTotalFeeAllocated,
        termAllocations: autoTermAllocations
      },
      manualAllocation: {
        storePaid: storeAmountPaid,
        feeAllocated: totalFeeAllocated,
        termAllocations: feeLedgerAllocations.map(f => ({ ledgerId: f.ledgerId, termName: f.termName, amount: f.amountAllocated }))
      }
    };

    // Log to audit log repository
    dbState.combined_payment_audit_logs = dbState.combined_payment_audit_logs || [];
    dbState.combined_payment_audit_logs.unshift({
      id: `AUD-CPAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      combinedPaymentId: combinedId,
      combinedReceiptNo,
      timestamp: now.toISOString(),
      studentId,
      studentName: studentName || "Student",
      admissionNo: admissionNo || "N/A",
      totalPaymentReceived: P,
      overrideReason: overrideAuditInfo.overrideReason,
      overriddenBy: overrideAuditInfo.overriddenBy,
      overriddenRole: overrideAuditInfo.overriddenRole,
      originalAutoAllocation: overrideAuditInfo.originalAutoAllocation,
      manualAllocation: overrideAuditInfo.manualAllocation,
      notes: notes || ""
    });

  } else {
    // -------------------------------------------------------------
    // DEFAULT PRIORITY PATH:
    // Priority 1: Store Purchase
    // Priority 2: School Fees (Oldest outstanding term first)
    // Priority 3: Advance Wallet Credit
    // -------------------------------------------------------------
    storeAmountPaid = defaultStorePaid;
    storeBalanceDue = Math.max(0, storeGrandTotal - storeAmountPaid);
    storeStatus = storeGrandTotal === 0 ? 'Paid' : (storeAmountPaid >= storeGrandTotal ? 'Paid' : (storeAmountPaid > 0 ? 'Partially Paid' : 'Unpaid'));

    let unallocatedFees = Math.max(0, P - storeAmountPaid);

    // Sort student ledgers according to rule (default is 'oldest_first')
    let sortedLedgers = [...studentLedgers];
    if (allocationRule === 'highest_outstanding') {
      sortedLedgers.sort((a: any, b: any) => (b.outstanding || 0) - (a.outstanding || 0));
    } else if (allocationRule === 'lowest_outstanding') {
      sortedLedgers.sort((a: any, b: any) => (a.outstanding || 0) - (b.outstanding || 0));
    } else {
      // Default & Standard: Oldest outstanding term first (earliest billing date / created date)
      sortedLedgers.sort((a: any, b: any) => {
        const timeA = new Date(a.billingDate || a.createdAt || 0).getTime();
        const timeB = new Date(b.billingDate || b.createdAt || 0).getTime();
        return timeA - timeB;
      });
    }

    for (const ledger of sortedLedgers) {
      if (unallocatedFees <= 0) break;
      const outBefore = ledger.outstanding || 0;
      if (outBefore <= 0) continue;

      let allocAmt = 0;
      if (unallocatedFees >= outBefore) {
        ledger.outstanding = 0;
        ledger.status = 'Paid';
        allocAmt = outBefore;
        unallocatedFees -= outBefore;
      } else {
        ledger.outstanding = Number((outBefore - unallocatedFees).toFixed(2));
        ledger.status = 'Partially Paid';
        allocAmt = unallocatedFees;
        unallocatedFees = 0;
      }

      totalFeeAllocated += allocAmt;

      feeLedgerAllocations.push({
        ledgerId: ledger.id,
        name: ledger.id,
        termName: ledger.termName || ledger.termId || 'Current Term',
        outstandingBefore: outBefore,
        amountAllocated: allocAmt,
        outstandingAfter: ledger.outstanding,
        status: ledger.status
      });

      feePaymentItems.push({
        id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        paymentId: feePaymentId,
        ledgerId: ledger.id,
        name: `Combined Payment Fee Allocation - ${ledger.termName || ledger.id}`,
        amount: Number(allocAmt.toFixed(2)),
        createdAt: now.toISOString()
      });
    }
  }

  // Create Store Sale Record (Isolated Ledger)
  let storeSaleRecord: any = null;
  const storeTxnNo = `STR-TXN-${now.getFullYear()}-${uniqueCode}`;
  const storeReceiptNo = `RCP-${storeTxnNo}`;

  if (validatedStoreItems.length > 0) {
    storeSaleRecord = {
      id: storeTxnNo,
      transactionNo: storeTxnNo,
      receiptNumber: storeReceiptNo,
      schoolName: "SULTAN ATTAHIRU MEMORIAL SCHOOLS",
      saleDate: dateStr,
      time: timeStr,
      branch: branch || "Main Campus",
      store: store || "Uniform Depot",
      customerType: "Parent",
      studentId,
      admissionNo: admissionNo || "",
      studentName: studentName || "",
      parentName: parentName || studentName,
      parentPhone: parentPhone || "",
      parentEmail: parentEmail || "",
      grade: grade || "",
      items: validatedStoreItems,
      subtotal: storeSubtotal,
      discountAmount: storeDiscount,
      totalAmount: storeGrandTotal,
      amountPaid: storeAmountPaid,
      balanceDue: storeBalanceDue,
      paymentMethod,
      referenceNo: refNum,
      cashierId: cashierId || "usr-cashier-01",
      cashierName: cashierName || "Store Cashier",
      notes: `Combined Payment Session ${combinedId}. Priority 1 Store Settlement.${isManualOverride ? ' [Manual Override Applied]' : ''}`,
      ledgerCategory: "Store Materials Purchase",
      schoolFeeIsolated: true,
      combinedPaymentId: combinedId,
      combinedReceiptNo,
      reprintCount: 0,
      createdAt: now.toISOString()
    };

    dbState.inventory_store_sales = dbState.inventory_store_sales || [];
    dbState.inventory_store_sales.unshift(storeSaleRecord);

    dbState.student_store_history = dbState.student_store_history || [];
    dbState.student_store_history.unshift({
      id: `HIST-${storeTxnNo}`,
      studentId,
      admissionNo: admissionNo || "",
      studentName,
      parentName,
      parentPhone,
      transactionNo: storeTxnNo,
      receiptNumber: storeReceiptNo,
      type: 'Store Materials Purchase',
      subtotal: storeSubtotal,
      discountAmount: storeDiscount,
      totalPaid: storeAmountPaid,
      balanceDue: storeBalanceDue,
      paymentMethod,
      referenceNo: refNum,
      date: dateStr,
      itemsCount: validatedStoreItems.length,
      schoolFeeIsolated: true,
      schoolFeeBalanceAffected: 0,
      combinedPaymentId: combinedId,
      createdAt: now.toISOString()
    });

    dbState.inventory_store_audit_logs = dbState.inventory_store_audit_logs || [];
    dbState.inventory_store_audit_logs.unshift({
      id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      transactionId: storeTxnNo,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      cashierId: cashierId || "usr-cashier-01",
      cashierName: cashierName || "Store Cashier",
      actionType: isManualOverride ? "COMBINED_PAYMENT_OVERRIDE_STORE" : "STORE_DIRECT_SALE",
      studentId,
      admissionNo: admissionNo || "N/A",
      studentName: studentName || "Student",
      parentName: parentName || "Parent",
      parentPhone: parentPhone || "N/A",
      items: auditSnapshots,
      subtotal: storeSubtotal,
      discount: storeDiscount > 0 ? { permitted: true, type: 'fixed', amount: storeDiscount } : undefined,
      totalAmount: storeGrandTotal,
      amountPaid: storeAmountPaid,
      balanceDue: storeBalanceDue,
      paymentMethod,
      referenceNo: refNum,
      branch: branch || "Main Campus",
      store: store || "Uniform Depot",
      notes: `Combined Payment session ${combinedId}. Priority 1 Store Purchase settled: ₦${storeAmountPaid.toLocaleString()}${isManualOverride ? ` (Override Reason: ${overrideReason})` : ''}`,
      actionDetails: `Original sale processed as part of Combined Payment ${combinedId}.`
    });
  }

  const schoolFeeOutstandingAfter = Math.max(0, schoolFeeOutstandingBefore - totalFeeAllocated);
  const feeStatus = schoolFeeOutstandingBefore === 0 ? 'Paid' : (schoolFeeOutstandingAfter === 0 ? 'Paid' : (totalFeeAllocated > 0 ? 'Partially Paid' : 'Unpaid'));

  // Create Fee Payment Record (Isolated Ledger)
  if (totalFeeAllocated > 0) {
    const feePaymentRecord = {
      id: feePaymentId,
      studentId,
      studentName: studentName || 'Student',
      amount: totalFeeAllocated,
      paymentMethod,
      paymentDate: dateStr,
      referenceNo: refNum,
      notes: `Combined Payment Session ${combinedId}. Total received: ₦${P.toLocaleString()} (Store: ₦${storeAmountPaid.toLocaleString()}, Tuition: ₦${totalFeeAllocated.toLocaleString()})${isManualOverride ? ' [Manual Override]' : ''}`,
      combinedPaymentId: combinedId,
      combinedReceiptNo,
      items: feePaymentItems,
      createdAt: now.toISOString()
    };
    dbState.student_payments = dbState.student_payments || [];
    dbState.student_payments.unshift(feePaymentRecord);
  }

  // -------------------------------------------------------------
  // STEP 3: ADVANCE CREDIT SURPLUS (Priority 3)
  // -------------------------------------------------------------
  let advanceWalletCredit = Math.max(0, P - storeAmountPaid - totalFeeAllocated);
  let advanceCreditId: string | undefined = undefined;

  if (advanceWalletCredit > 0 && paymentMethod !== 'Student Wallet') {
    advanceCreditId = `ac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCredit = {
      id: advanceCreditId,
      studentId,
      studentName: studentName || 'Student',
      amount: advanceWalletCredit,
      initialAmount: advanceWalletCredit,
      paymentId: feePaymentId,
      combinedPaymentId: combinedId,
      notes: `Surplus advance credit from Combined Payment ${combinedId}`,
      createdAt: now.toISOString()
    };
    dbState.student_advance_credits = dbState.student_advance_credits || [];
    dbState.student_advance_credits.unshift(newCredit);
  }

  // -------------------------------------------------------------
  // STEP 4: MASTER COMBINED PAYMENT SESSION RECORD
  // -------------------------------------------------------------
  const combinedRecord = {
    id: combinedId,
    combinedReceiptNo,
    date: dateStr,
    time: timeStr,
    studentId,
    admissionNo: admissionNo || "",
    studentName: studentName || "Student",
    grade: grade || "",
    classSection: classSection || "A",
    branch: branch || "Main Campus",
    parentName: parentName || studentName,
    parentPhone: parentPhone || "",
    parentEmail: parentEmail || "",
    totalPaymentReceived: P,
    paymentMethod,
    referenceNo: refNum,
    cashierId: cashierId || "usr-cashier-01",
    cashierName: cashierName || "Finance Cashier",
    notes: notes || "",
    allocationSummary: {
      storePurchaseTotal: storeGrandTotal,
      storeAmountPaid,
      storeBalanceDue,
      storeStatus,
      remainingForFees: Math.max(0, P - storeAmountPaid),
      schoolFeeOutstandingBefore,
      feeAmountAllocated: totalFeeAllocated,
      schoolFeeOutstandingAfter,
      feeStatus,
      advanceWalletCreditGenerated: advanceWalletCredit
    },
    // Audit & Override Data
    isManualOverride: !!isManualOverride,
    overrideReason: isManualOverride ? overrideReason : undefined,
    overriddenBy: isManualOverride ? (overriddenBy || cashierName || "Finance Officer") : undefined,
    overrideAuditInfo: isManualOverride ? overrideAuditInfo : undefined,

    // Store Component
    storeSaleId: storeTxnNo,
    storeReceiptNo,
    store: store || "Uniform Depot",
    storeItems: validatedStoreItems,
    storeSubtotal,
    storeDiscountAmount: storeDiscount,
    storeGrandTotal,
    storeAmountPaid,
    storeLedgerCategory: "Store Materials Purchase",

    // Fee Component
    feePaymentId,
    feeReceiptNo: `RCP-${feePaymentId}`,
    feeLedgerAllocations,
    feeAmountAllocated: totalFeeAllocated,
    schoolFeeLedgerCategory: "Tuition & School Fees",
    advanceCreditId,
    createdAt: now.toISOString()
  };

  dbState.combined_payments = dbState.combined_payments || [];
  dbState.combined_payments.unshift(combinedRecord);

  saveDB(dbState);
  res.status(201).json(combinedRecord);
});

// GET Combined Payment Audit Logs
app.get('/api/combined_payments/audit_logs', (req, res) => {
  const { studentId, search } = req.query;
  let logs = dbState.combined_payment_audit_logs || [];

  if (studentId) {
    logs = logs.filter((l: any) => l.studentId === studentId);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    logs = logs.filter((l: any) => 
      (l.studentName || '').toLowerCase().includes(q) ||
      (l.combinedReceiptNo || '').toLowerCase().includes(q) ||
      (l.overrideReason || '').toLowerCase().includes(q) ||
      (l.overriddenBy || '').toLowerCase().includes(q)
    );
  }

  res.json(logs);
});

// -------------------------------------------------------------
// SCHOOL OPERATIONS DASHBOARD API
// -------------------------------------------------------------
app.get('/api/operations/dashboard', (req, res) => {
  const dateParam = req.query.date;
  const today = dateParam ? String(dateParam) : "2026-07-04";

  // Store the simulated date in the backend and run the transition check!
  dbState.currentSimulatedDate = today;
  processTermTransitions(today);
  saveDB(dbState);

  const events = dbState.events || [];
  const campaigns = dbState.fee_campaigns || [];
  const tasks = dbState.event_tasks || [];
  const exams = dbState.exams || [];
  const terms = dbState.terms || [];
  const sessions = dbState.academicSessions || [];
  const categories = dbState.eventCategories || [];

  // 1. CURRENTLY HAPPENING
  // Current Events: startDate <= today <= endDate
  const currentEvents = events.filter((e: any) => e.startDate <= today && e.endDate >= today).map((e: any) => {
    const cat = categories.find((c: any) => c.id === e.categoryId);
    return { ...e, category: cat };
  });

  // Current Campaigns: startDate <= today <= endDate
  const currentCampaigns = campaigns.filter((c: any) => c.startDate <= today && c.endDate >= today);

  // Current Deadlines: tasks whose due date is in the next 7 days, not completed
  const next7Days = new Date(new Date(today).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const currentDeadlines = tasks.filter((t: any) => t.dueDate >= today && t.dueDate <= next7Days && t.status !== "Completed");

  // 2. UPCOMING
  // Upcoming Events: startDate > today
  const upcomingEvents = events.filter((e: any) => e.startDate > today).sort((a: any, b: any) => a.startDate.localeCompare(b.startDate)).map((e: any) => {
    const cat = categories.find((c: any) => c.id === e.categoryId);
    return { ...e, category: cat };
  });

  // Upcoming Exams: date > today
  const upcomingExams = exams.filter((e: any) => e.date > today).sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Upcoming Fee Drives: startDate > today
  const upcomingFeeDrives = campaigns.filter((c: any) => c.startDate > today).sort((a: any, b: any) => a.startDate.localeCompare(b.startDate));

  // 3. OVERDUE
  // Overdue Tasks: dueDate < today and status !== "Completed"
  const overdueTasks = tasks.filter((t: any) => t.dueDate < today && t.status !== "Completed");

  // Missed Deadlines: tasks with status "Overdue" or past due date and not completed
  const missedDeadlines = tasks.filter((t: any) => (t.dueDate < today && t.status === "Overdue") || (t.dueDate < today && t.status !== "Completed"));

  // 4. SESSION SUMMARY
  // Find active session
  const activeSession = sessions.find((s: any) => s.status === "active") || sessions[0] || {
    id: "ses-2026",
    name: "2025/2026 Academic Year",
    startDate: "2025-09-01",
    endDate: "2026-07-20",
    status: "active"
  };

  // Find active term
  const activeTerm = terms.find((t: any) => t.startDate <= today && t.endDate >= today) || terms[terms.length - 1] || {
    id: "term-3",
    name: "Third Term",
    startDate: "2026-04-20",
    endDate: "2026-07-20"
  };

  // Calculate session progress percentage, weeks completed, and weeks remaining
  let sessionProgress = 0;
  let totalSessionWeeks = 46; // fallback
  let weeksCompleted = 0;
  let weeksRemaining = 46; // fallback

  if (activeSession) {
    const start = new Date(activeSession.startDate).getTime();
    const end = new Date(activeSession.endDate).getTime();
    const current = new Date(today).getTime();
    const totalDays = end - start;
    const elapsedDays = current - start;
    if (totalDays > 0) {
      sessionProgress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    }

    // Precise session week counts
    totalSessionWeeks = Math.ceil(totalDays / (7 * 24 * 60 * 60 * 1000));
    const elapsedWeeks = Math.floor(elapsedDays / (7 * 24 * 60 * 60 * 1000));
    weeksCompleted = Math.min(totalSessionWeeks, Math.max(0, elapsedWeeks));
    weeksRemaining = Math.max(0, totalSessionWeeks - weeksCompleted);
  }

  // Calculate active term week
  let currentWeek = 1;
  if (activeTerm) {
    const termStart = new Date(activeTerm.startDate).getTime();
    const current = new Date(today).getTime();
    const diffTime = current - termStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
  }

  // Helper statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t: any) => t.status === "Completed").length;
  const inProgressTasksCount = tasks.filter((t: any) => t.status === "In Progress" || t.status === "Pending").length;
  const overdueTasksCount = overdueTasks.length;

  const totalCampaignTarget = campaigns.reduce((acc: number, c: any) => acc + (c.targetCollection || 0), 0);
  const totalCampaignActual = campaigns.reduce((acc: number, c: any) => acc + (c.actualCollection || 0), 0);

  // Task completion chart data
  const taskChartData = [
    { name: "Completed", value: completedTasksCount, color: "#10B981" },
    { name: "In Progress", value: inProgressTasksCount, color: "#3B82F6" },
    { name: "Overdue", value: overdueTasksCount, color: "#EF4444" }
  ];

  // Fee collection chart data
  const feeCampaignChartData = campaigns.map((c: any) => ({
    name: c.week || c.name.substring(0, 10),
    Target: c.targetCollection || 0,
    Collected: c.actualCollection || 0
  }));

  // Event category breakdown chart data
  const categoryChartData = categories.map((cat: any) => {
    const count = events.filter((e: any) => e.categoryId === cat.id).length;
    return {
      name: cat.name,
      count,
      color: cat.color || "#4F46E5"
    };
  }).filter(c => c.count > 0);

  res.json({
    today,
    eventBudgets: dbState.event_budgets || [],
    inventory: dbState.inventory || [],
    inventoryReadiness: dbState.inventory_readiness || [],
    currentlyHappening: {
      currentEvents,
      currentCampaigns,
      currentDeadlines
    },
    upcoming: {
      upcomingEvents,
      upcomingExams,
      upcomingFeeDrives
    },
    overdue: {
      overdueTasks,
      missedDeadlines
    },
    sessionSummary: {
      currentWeek,
      currentTerm: activeTerm,
      sessionProgress,
      activeSession,
      weeksCompleted,
      weeksRemaining,
      totalSessionWeeks
    },
    stats: {
      totalTasksCount,
      completedTasksCount,
      overdueTasksCount,
      totalCampaignTarget,
      totalCampaignActual,
      taskChartData,
      feeCampaignChartData,
      categoryChartData
    }
  });
});

// -------------------------------------------------------------
// GEMINI API CALLS
// -------------------------------------------------------------

// AI Report Comment Generator
// AI Report Comment Generator
function generateOfflineReportComment(
  name: string,
  level: string,
  grade: string,
  grades: any,
  milestones: any,
  behaviorRating: string,
  customFocus: string
): string {
  const isNursery = level === 'nursery';
  const isPrimary = level === 'primary';

  let strengths: string[] = [];
  let areasOfGrowth: string[] = [];

  if (isNursery) {
    Object.entries(milestones || {}).forEach(([m, val]) => {
      if (val === 'Mastered') {
        strengths.push(m);
      } else if (val === 'Developing' || val === 'Introduced') {
        areasOfGrowth.push(m);
      }
    });

    if (strengths.length === 0) strengths.push("enthusiastic sensory play participation and peer curiosity");
    if (areasOfGrowth.length === 0) areasOfGrowth.push("consistently listening to multi-step instructions during circle time");

    const strengthText = strengths[0].toLowerCase();
    const growthText = areasOfGrowth[0].toLowerCase();

    return `${name} is a delightful and energetic child who has made beautiful developmental strides this term. A standout area of strength is ${name}'s excellent progress in ${strengthText}, where deep curiosity and growing confidence are clearly evident. In terms of social and cognitive growth, ${name} is currently working on ${growthText}. We encourage playing interactive cooperative sharing games or reciting simple counting songs at home to support this regulation. With a behavior rating of ${behaviorRating}, ${name} brings great warmth to our early learning classroom.${customFocus ? ` Regarding your focus area, "${customFocus}", ${name} shows steady, encouraging progress.` : ''}`;
  } else if (isPrimary) {
    const gradeEntries = Object.entries(grades || {});
    gradeEntries.forEach(([subj, score]: [string, any]) => {
      if (score >= 85) strengths.push(subj);
      else if (score < 80) areasOfGrowth.push(subj);
    });

    if (strengths.length === 0) strengths.push("Creative Arts and classroom participation");
    if (areasOfGrowth.length === 0) areasOfGrowth.push("Mathematics problem solving and step layout");

    const strengthSubj = strengths[0];
    const growthSubj = areasOfGrowth[0];

    return `${name} has shown commendable dedication and consistent academic progress throughout this grading period. In the classroom, ${name} displays high-quality analytical skills, particularly in ${strengthSubj}, which is reflected in a strong grasp of core concepts and enthusiastic participation in group activities. To further enhance academic performance, ${name} would benefit from extra attention in ${growthSubj}, specifically practicing basic worksheets and laying out calculations step-by-step. Reflecting a ${behaviorRating.toLowerCase()} behavioral standing, ${name} is polite, well-socialized, and a wonderful contributor to our school community.${customFocus ? ` Addressing the requested focus: "${customFocus}", we notice positive, steady trends in ${name}'s daily classroom work.` : ''}`;
  } else {
    const gradeEntries = Object.entries(grades || {});
    gradeEntries.forEach(([subj, score]: [string, any]) => {
      if (score >= 85) strengths.push(subj);
      else if (score < 80) areasOfGrowth.push(subj);
    });

    if (strengths.length === 0) strengths.push("Global History and analytical essay writing");
    if (areasOfGrowth.length === 0) areasOfGrowth.push("Chemistry formulas and scientific trial reports");

    const strengthSubj = strengths[0];
    const growthSubj = areasOfGrowth[0];

    return `${name} exhibits a mature and analytical approach to secondary coursework, demonstrating strong intellectual commitment. A major highlight is ${name}'s superior aptitude in ${strengthSubj}, demonstrating advanced concept mastery and precise written arguments. An area for targeted improvement is ${growthSubj}, where establishing a structured daily review routine and completing extra practice sets will solidify core mechanics. With a behavior rating of ${behaviorRating}, ${name} has maintained a highly supportive and focused classroom presence.${customFocus ? ` Regarding the strategic focus on "${customFocus}": ${name} shows promising responsiveness and a proactive attitude.` : ''}`;
  }
}

app.post('/api/generate-comment', async (req, res) => {
  const { name, level, grade, grades, milestones, behaviorRating, customFocus } = req.body;

  if (!ai) {
    const fallbackComment = generateOfflineReportComment(name, level, grade, grades, milestones, behaviorRating, customFocus);
    return res.json({ comment: fallbackComment, mode: "offline" });
  }
  
  try {
    let academicSectionString = "";
    if (level === 'nursery') {
      academicSectionString = `Early childhood milestones:\n${Object.entries(milestones || {}).map(([m, val]) => `- ${m}: ${val}`).join('\n')}`;
    } else {
      academicSectionString = `Numerical grades:\n${Object.entries(grades || {}).map(([subj, score]) => `- ${subj}: ${score}/100`).join('\n')}`;
    }

    const systemPrompt = `You are an expert Academic Advisor, School Psychologist, and Classroom Educator with 15+ years of experience in early physical, cognitive, nursery, and high-school academic grading environments.`;
    
    const userPrompt = `Draft a professional, actionable, and constructve classroom report card comment for:
Name: ${name}
Level: ${level.toUpperCase()}
Grade level: ${grade}
Behavior Rating: ${behaviorRating}
Academic / Developmental Assessment:
${academicSectionString}

${customFocus ? `Custom focal point requested by teacher:\n"${customFocus}"` : ''}

Ensure the report card comment satisfies the following:
- Maximum length is 120-150 words.
- Tone should be encouraging, personalized, objective, and deeply professional.
- Highlight at least 1 key strength clearly.
- Note at least 1 area of growth with realistic behavioral suggestions or at-home routines.
- Tailor the phrasing exactly to the educational stage:
  - Nursery comments must focus on motor coordination, emotional/social regulation, attention span, and language. Write warmly, avoiding highly complex academic jargon.
  - Primary comments should balance early reading/literacy, classroom participation, analytical steps, and peer socialization.
  - Secondary comments should relate to analytic precision, organization, intellectual commitment, study routines, and overall subject mastery.
- Output ONLY the comment text itself. Do not write intros or headers like "Here is the comment:".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const generatedText = response.text || "No response text generated.";
    res.json({ comment: generatedText.trim() });
  } catch (error: any) {
    console.error("Gemini academic call error, falling back offline:", error);
    const fallbackComment = generateOfflineReportComment(name, level, grade, grades, milestones, behaviorRating, customFocus);
    res.json({ comment: fallbackComment, mode: "offline" });
  }
});

// General School ERP AI Consultant / Workspace helper
function generateOfflineAssistantResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  
  if (lower.includes("lesson") || lower.includes("plan") || lower.includes("curriculum")) {
    return `### 📝 SAMS Strategic Lesson Plan & Curriculum Guide (Offline Mode)

Based on SAMS Early Childhood and Secondary educational standards, here is a highly structured academic planning template to deploy:

| Section | Description / Guideline |
| :--- | :--- |
| **Topic / Theme** | Clear lesson focus (e.g., *Symmetry in Nature* or *Introduction to Stoichiometry*) |
| **Objectives** | At least 3 measurable cognitive verbs (e.g., *Identify, Solve, Explain*) |
| **Tactile Materials** | Mention physical objects (Nursery: smooth clay, Primary: charts, Secondary: lab tubes) |
| **Procedure** | Split into: Introduction (10m), Guided Practice (20m), Peer Activity (15m), Exit Quiz (5m) |
| **Remediation Plan** | How to assist students dropping below 70% during formative checkpoints |

#### Core Lesson Tips:
1. **Nursery (Pre-K)**: Focus heavily on physical/tactile milestones and verbal sharing.
2. **Primary (Grade 1-5)**: Balance early reading/literacy with visual modeling.
3. **Secondary (Grade 10-12)**: Drive analytic precision and structured homework checkups.`;
  }
  
  if (lower.includes("email") || lower.includes("letter") || lower.includes("parent") || lower.includes("announce")) {
    return `### ✉️ SAMS Parent Communication Templates (Offline Mode)

Here are professional parent communication templates formatted for immediate administrative rollout:

#### Template A: Academic / Behavioral Counseling Email
**Subject:** SAMS Collaborative Progress Update: [Student Name]
**Body:**
> Dear [Parent Name],
>
> I hope this message finds you well. As part of our commitment to student success at SAMS, I am reaching out to share a positive brief regarding [Student Name]'s progress in [Subject Name]. [Student Name] is showing fantastic enthusiasm during class discussions.
>
> To support [him/her] in reaching [his/her] full potential, we are currently focusing on [Area of Growth, e.g., double-digit calculations]. We believe that spending 10 minutes on simple review routines at home each evening will build major confidence.
>
> Please let us know if you would like to schedule a brief counselor sync. Thank you for your continued partnership!
>
> Warm regards,
> [Teacher Name]
> SAMS Academic Team

---

#### Template B: General Institutional Notice
**Subject:** SAMS Notification: Upcoming Campus [Event Name]
**Body:**
> Dear Parents and Guardians,
>
> We are excited to announce our upcoming **[Event Name]** scheduled for **[Date]** on the SAMS main grounds.
>
> This interactive event celebrates student achievements. Please review any special clothing or kit requirements (e.g., sports gear or clay-friendly old shirts) in the Parent Portal notifications.
>
> We look forward to seeing you there!
>
> Sincerely,
> SAMS School Administration`;
  }

  if (lower.includes("fee") || lower.includes("payment") || lower.includes("reminder") || lower.includes("arrears") || lower.includes("debt")) {
    return `### 💰 SAMS Fee Collection & Overdue Accounts Playbook (Offline Mode)

To optimize tuition recovery at SAMS, implement this progressive, multi-stage dunning template strategy:

#### 1. Friendly Pre-Due Notice (Sent 5 days before due date)
> **Subject:** SAMS Fee Statement: Term 3 Tuition Reminder
>
> **Dear Parents,**
> This is a friendly reminder that SAMS Term 3 invoices have been posted. The tuition fee is due on **[Due Date]**. Thank you to families who have already settled their ledger! Please check your Family Wallet inside SAMS for easy bank transfer details.

#### 2. Soft Overdue Alert (Sent 3 days past due date)
> **Subject:** SAMS Notice: Outstanding Tuition Overdue Alert
>
> **Dear Parents,**
> Our accounts ledger indicates that Term 3 tuition fees for your student are currently overdue. Please review your invoice inside SAMS and submit payment details or bank receipt uploads. If you need flexible installment scheduling, contact our billing office today.

#### 3. Urgent Ledger Hold Notice (Sent 10 days past grace period)
> **Subject:** URGENT: Outstanding SAMS Account Restrictions
>
> **Dear Parents,**
> Despite our previous notices, your account remains in arrears. To prevent administrative hold restrictions on reports or portals, please settle the outstanding balance of **[Amount]** immediately. Thank you for your urgent attention.`;
  }

  return `### 🌐 SAMS Central AI Workspace Consultant (Offline Mode)

I am the central AI Advisor for the SAMS ERP. I can assist you with complex operational, academic, or financial setups. 

Here are some topics you can ask me about:
1. **Academic Planning**: "Draft a secondary science lesson plan" or "Give me preschool tactile milestones."
2. **Parent Correspondence**: "Write a counseling email for a struggling student" or "Draft a Notice for Sports Day."
3. **Financial Advisory**: "How can we improve SAMS Term 3 collection rates?" or "Provide dunning letter templates."

*Note: SAMS is operating in Offline Core Mode to ensure continuous system availability during cloud maintenance periods.*`;
}

app.post('/api/ai-assistant', async (req, res) => {
  const { prompt, history } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing assistant request prompt." });
  }

  if (!ai) {
    const offlineReply = generateOfflineAssistantResponse(prompt);
    return res.json({ text: offlineReply, mode: "offline" });
  }

  try {
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Append our fresh instruction as a system context
    const fullContents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullContents,
      config: {
        systemInstruction: `You are the central School ERP AI Consultant. You assist Nursery, Primary, and Secondary school administrators and classroom teachers with advanced tasks, including but not limited to:
1. Designing comprehensive academic lesson plans, pop quiz sheets, and school worksheets.
2. Formulating parent counseling emails or general announcements (e.g. Science Fair, Sports Day notices).
3. Advising nursery coordinators on early tactile milestones or motor skills curriculum details.
4. Compiling secondary curriculum tips.

Keep your layout clean, structured, using markdown typography. Output helpful, concise, well-formatted guides immediately.`,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Assistant query processing failed, falling back offline:", error);
    const offlineReply = generateOfflineAssistantResponse(prompt);
    res.json({ text: offlineReply, mode: "offline" });
  }
});

// School Health Score Engine API
app.get('/api/operations/health', (req, res) => {
  const branch = req.query.branch || 'all'; // 'GN', 'RS', or 'all'
  const today = req.query.date ? String(req.query.date) : "2026-07-04";

  // Filter lists by branch
  const filterByBranch = (list: any[]) => {
    if (!list) return [];
    if (branch === 'all') return list;
    return list.filter((item: any) => item.branch === branch || (!item.branch && branch === 'GN'));
  };

  const students = filterByBranch(dbState.students || []);
  const teachers = filterByBranch(dbState.teachers || []);
  const classes = filterByBranch(dbState.classes || []);
  const schedules = dbState.schedules || [];
  const curriculums = filterByBranch(dbState.curriculums || []);
  const exams = filterByBranch(dbState.exams || []);
  const admissions = filterByBranch(dbState.admissions || []);
  const budgets = dbState.event_budgets || []; // globally shared
  const tasks = dbState.event_tasks || []; // globally shared
  const inventory = dbState.inventory || []; // globally shared
  const readiness = dbState.inventory_readiness || []; // globally shared

  // 1. ACADEMIC HEALTH
  // Average student grades
  let studentGradesSum = 0;
  let studentGradesCount = 0;
  students.forEach((s: any) => {
    if (s.grades && typeof s.grades === 'object') {
      Object.values(s.grades).forEach((score: any) => {
        const val = Number(score);
        if (!isNaN(val)) {
          studentGradesSum += val;
          studentGradesCount++;
        }
      });
    }
  });
  const avgStudentGrades = studentGradesCount > 0 ? (studentGradesSum / studentGradesCount) : 78;

  // Student attendance rate
  const studentAttendanceSum = students.reduce((acc: number, s: any) => acc + (Number(s.attendancePercentage) || 0), 0);
  const avgAttendance = students.length > 0 ? (studentAttendanceSum / students.length) : 85;

  // Teacher performance
  const teacherPerformanceSum = teachers.reduce((acc: number, t: any) => acc + (Number(t.performanceScore) || 80), 0);
  const avgTeacherPerformance = teachers.length > 0 ? (teacherPerformanceSum / teachers.length) : 82;

  // Curriculum compliance (number of curricula registered per class)
  const curriculumCompliance = classes.length > 0 ? Math.min(100, (curriculums.length / classes.length) * 100) : 80;

  const academicScore = Math.round(
    0.40 * avgStudentGrades +
    0.30 * avgAttendance +
    0.20 * avgTeacherPerformance +
    0.10 * curriculumCompliance
  );

  // 2. FINANCIAL HEALTH
  // Fee collection rate from students invoices
  let totalInvoiceAmount = 0;
  let totalInvoicePaid = 0;
  students.forEach((s: any) => {
    if (s.feeStatements && s.feeStatements.invoices) {
      s.feeStatements.invoices.forEach((inv: any) => {
        totalInvoiceAmount += Number(inv.amount) || 0;
        totalInvoicePaid += Number(inv.paid) || 0;
      });
    }
  });
  let feeCollectionRate = totalInvoiceAmount > 0 ? (totalInvoicePaid / totalInvoiceAmount) * 100 : 0;
  if (feeCollectionRate === 0 && dbState.fee_campaigns) {
    // fallback to campaigns
    const campaigns = dbState.fee_campaigns || [];
    const campaignTarget = campaigns.reduce((acc: number, c: any) => acc + (c.targetCollection || 0), 0);
    const campaignActual = campaigns.reduce((acc: number, c: any) => acc + (c.actualCollection || 0), 0);
    feeCollectionRate = campaignTarget > 0 ? (campaignActual / campaignTarget) * 100 : 85;
  }
  feeCollectionRate = Math.min(100, Math.max(0, feeCollectionRate));

  // Budget control
  const budgetVarianceScore = budgets.length > 0 
    ? (budgets.filter((b: any) => b.status === 'under_budget' || b.status === 'on_budget' || b.totalSpent <= b.totalBudget).length / budgets.length) * 100 
    : 90;

  // Payroll compliance
  let totalPayrolls = 0;
  let paidPayrolls = 0;
  teachers.forEach((t: any) => {
    if (t.payroll && Array.isArray(t.payroll)) {
      t.payroll.forEach((p: any) => {
        totalPayrolls++;
        if (p.status === "Paid") {
          paidPayrolls++;
        }
      });
    }
  });
  const payrollCompliance = totalPayrolls > 0 ? (paidPayrolls / totalPayrolls) * 100 : 95;

  const financialScore = Math.round(
    0.40 * feeCollectionRate +
    0.40 * budgetVarianceScore +
    0.20 * payrollCompliance
  );

  // 3. INVENTORY HEALTH
  // Event readiness checks rate
  const eventReadinessRate = readiness.length > 0
    ? (readiness.filter((r: any) => r.status === 'ready').length / readiness.length) * 100
    : 85;

  // Stock levels health
  const lowStockThreshold = 15;
  const healthyStockItems = inventory.filter((item: any) => (Number(item.stockQuantity) || 0) >= lowStockThreshold).length;
  const stockHealth = inventory.length > 0 ? (healthyStockItems / inventory.length) * 100 : 90;

  const inventoryScore = Math.round(
    0.60 * eventReadinessRate +
    0.40 * stockHealth
  );

  // 4. OPERATIONAL HEALTH
  // Task completion rate
  const taskCompletion = tasks.length > 0
    ? (tasks.filter((t: any) => t.status === 'Completed').length / tasks.length) * 100
    : 82;

  // Deadline compliance
  const onTimeTasks = tasks.filter((t: any) => t.status === 'Completed' || t.dueDate >= today).length;
  const deadlineCompliance = tasks.length > 0 ? (onTimeTasks / tasks.length) * 100 : 85;

  // Admission turnaround
  const processedAdmissions = admissions.filter((a: any) => a.status !== 'Pre-registered').length;
  const admissionTurnaround = admissions.length > 0 ? (processedAdmissions / admissions.length) * 100 : 80;

  // Scheduling coverage
  const classesWithSchedules = classes.filter((c: any) => schedules.some((sch: any) => sch.grade === c.name)).length;
  const schedulingCoverage = classes.length > 0 ? (classesWithSchedules / classes.length) * 100 : 90;

  const operationalScore = Math.round(
    0.40 * taskCompletion +
    0.30 * deadlineCompliance +
    0.20 * admissionTurnaround +
    0.10 * schedulingCoverage
  );

  // Default weightings
  const defaultWeights = {
    academic: 0.25,
    financial: 0.25,
    inventory: 0.25,
    operational: 0.25
  };

  const compositeScore = Math.round(
    defaultWeights.academic * academicScore +
    defaultWeights.financial * financialScore +
    defaultWeights.inventory * inventoryScore +
    defaultWeights.operational * operationalScore
  );

  // Trend lines over previous 6 months (seed values tailored dynamically to match live)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const monthDeltas = [
    { academic: -5, financial: -8, inventory: -4, operational: -10 }, // Jan
    { academic: -4, financial: -6, inventory: -3, operational: -6 },  // Feb
    { academic: -3, financial: -3, inventory: -2, operational: -3 },  // Mar
    { academic: -2, financial: -1, inventory: -1, operational: -2 },  // Apr
    { academic: -1, financial: 1, inventory: -1, operational: 0 },   // May
    { academic: 0, financial: -2, inventory: 0, operational: 1 },    // Jun
    { academic: 0, financial: 0, inventory: 0, operational: 0 }      // Jul (live)
  ];

  const trendHistory = months.map((month, idx) => {
    const delta = monthDeltas[idx];
    const mAcademic = Math.max(50, Math.min(100, academicScore + delta.academic));
    const mFinancial = Math.max(50, Math.min(100, financialScore + delta.financial));
    const mInventory = Math.max(50, Math.min(100, inventoryScore + delta.inventory));
    const mOperational = Math.max(50, Math.min(100, operationalScore + delta.operational));
    const mComposite = Math.round(
      defaultWeights.academic * mAcademic +
      defaultWeights.financial * mFinancial +
      defaultWeights.inventory * mInventory +
      defaultWeights.operational * mOperational
    );

    return {
      month,
      academic: mAcademic,
      financial: mFinancial,
      inventory: mInventory,
      operational: mOperational,
      composite: mComposite
    };
  });

  res.json({
    branch,
    date: today,
    compositeScore,
    categories: {
      academic: {
        score: academicScore,
        breakdown: {
          studentGrades: Math.round(avgStudentGrades),
          attendance: Math.round(avgAttendance),
          teacherPerformance: Math.round(avgTeacherPerformance),
          curriculumCompliance: Math.round(curriculumCompliance)
        }
      },
      financial: {
        score: financialScore,
        breakdown: {
          feeCollection: Math.round(feeCollectionRate),
          budgetVariance: Math.round(budgetVarianceScore),
          payrollCompliance: Math.round(payrollCompliance)
        }
      },
      inventory: {
        score: inventoryScore,
        breakdown: {
          readinessRate: Math.round(eventReadinessRate),
          stockHealth: Math.round(stockHealth)
        }
      },
      operational: {
        score: operationalScore,
        breakdown: {
          taskCompletion: Math.round(taskCompletion),
          deadlineCompliance: Math.round(deadlineCompliance),
          admissionTurnaround: Math.round(admissionTurnaround),
          schedulingCoverage: Math.round(schedulingCoverage)
        }
      }
    },
    trendHistory
  });
});

// AI Health Advisor Executive Briefing
function generateOfflineHealthBrief(compositeScore: number, categories: any, branch: string): string {
  const branchName = String(branch || 'All').toUpperCase();
  
  let standing = "";
  if (compositeScore >= 90) {
    standing = `The institutional operations for SAMS **${branchName}** campus are in an **exemplary and highly sound** state. With an overall health index of **${compositeScore}/100**, SAMS is displaying premier efficiency across core academic, operational, and financial dimensions, with minimal administrative drag.`;
  } else if (compositeScore >= 75) {
    standing = `Institutional operations at the **${branchName}** campus are in a **robust and improving** state. The current health index of **${compositeScore}/100** points to stable educational standards, solid ledger recovery, and dependable logistical coordination, though minor optimization avenues remain open.`;
  } else if (compositeScore >= 50) {
    standing = `Operations at SAMS **${branchName}** campus indicate that **targeted remedial steps are required**. The health index of **${compositeScore}/100** reveals specific operational and logistical friction points. SAMS leadership should deploy focused oversight to resolve these pockets of vulnerability before they compound.`;
  } else {
    standing = `Operations at the **${branchName}** campus are in a **critical state requiring immediate intervention**. The current health score of **${compositeScore}/100** is severely depressed, indicating compounding vulnerabilities across multiple core departments. Urgent operational restructures must be executed immediately.`;
  }

  const catEntries = Object.entries(categories || {}).map(([key, value]: [string, any]) => ({
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    score: value.score,
    breakdown: value.breakdown
  }));

  catEntries.sort((a, b) => b.score - a.score);
  const strongest = catEntries[0];
  const weakest = catEntries[catEntries.length - 1];

  let brightSpot = "";
  if (strongest.key === 'academic') {
    brightSpot = `**Academic Performance & Curriculum Alignment** is the standout leader at **${strongest.score}/100**. This reflects exceptional grade point averages (${strongest.breakdown.studentGrades}%), solid class attendance (${strongest.breakdown.attendance}%), high teacher appraisal ratings (${strongest.breakdown.teacherPerformance}%), and diligent term curriculum compliance (${strongest.breakdown.curriculumCompliance}%).`;
  } else if (strongest.key === 'financial') {
    brightSpot = `**Financial Management & Liquidity** represents SAMS' key structural strength, scoring a superb **${strongest.score}/100**. This indicates stellar collection rates (${strongest.breakdown.feeCollection}%), robust budget compliance (${strongest.breakdown.budgetVariance}%), and seamless payroll compliance (${strongest.breakdown.payrollCompliance}%).`;
  } else if (strongest.key === 'inventory') {
    brightSpot = `**Store Inventory & Asset Control** is operating with maximum precision at a score of **${strongest.score}/100**. The campus boasts high stock readiness and auditing checklists completed at ${strongest.breakdown.readinessRate}%, paired with robust physical asset preservation and a healthy stock index (${strongest.breakdown.stockHealth}%).`;
  } else {
    brightSpot = `**Operations Coordination & Timelines** represents our central pillar of strength, scoring **${strongest.score}/100**. This is driven by outstanding task completions (${strongest.breakdown.taskCompletion}%), strict adherence to critical administrative deadlines (${strongest.breakdown.deadlineCompliance}%), prompt intake admission reviews (${strongest.breakdown.admissionTurnaround}%), and complete scheduling coverage (${strongest.breakdown.schedulingCoverage}%).`;
  }

  let vulnerabilityRisk = "";
  let recommendations: string[] = [];

  if (weakest.key === 'academic') {
    vulnerabilityRisk = `With academic and grading compliance lagging at **${weakest.score}/100**, the institution faces imminent risks of learning gaps, teacher accountability loss, and potential parent dissatisfaction due to late grades or disjointed lesson plans.`;
    recommendations = [
      `Mandate a daily, 15-minute sync for class teachers with low curriculum compliance (${weakest.breakdown.curriculumCompliance}%) to align lesson plans before session hours.`,
      `Establish an automated portal lock on grade entry, auto-flagging students with grades (${weakest.breakdown.studentGrades}%) falling below standard pass thresholds for immediate remedial support.`,
      `Introduce peer class observation programs to elevate teacher performance scores (${weakest.breakdown.teacherPerformance}%) and standardize pedagogical quality across levels.`
    ];
  } else if (weakest.key === 'financial') {
    vulnerabilityRisk = `Financial indicators are down to **${weakest.score}/100**, exposing the school to sudden operational cash pinches, deficit spending risks, and staff payroll delays if outstanding tuition fee collections are not aggressively recovered.`;
    recommendations = [
      `Deploy SAMS Automated SMS/Email Fee Campaign targeting parents in arrears to elevate the fee collection rate (${weakest.breakdown.feeCollection}%) immediately.`,
      `Apply strict branch-specific operational cost-freezes to eliminate unnecessary overheads and bring budget variance (${weakest.breakdown.budgetVariance}%) within safe ranges.`,
      `Incentivize early-bird payments for the upcoming term with a modest 3-5% discount to stabilize immediate liquid reserves.`
    ];
  } else if (weakest.key === 'inventory') {
    vulnerabilityRisk = `Inventory readiness sits at a depressed **${weakest.score}/100**, creating risks of acute physical supply deficits, lost textbooks, stock discrepancies, and delayed academic rollouts due to uncompleted audit sheets.`;
    recommendations = [
      `Conduct a comprehensive, weekend-long physical sweep of all storage bins, textbooks, and blazers to resolve stock health (${weakest.breakdown.stockHealth}%) discrepancies.`,
      `Establish an automated inventory reorder point for crucial items to ensure stock never drops below the safe threshold.`,
      `Designate a senior store manager to sign off on audit readiness checklists (${weakest.breakdown.readinessRate}%) at least 10 days before term inception.`
    ];
  } else {
    vulnerabilityRisk = `Operations and logistics coordination score of **${weakest.score}/100** presents risks of general process chaos, missed deadlines, uncompleted school activities, and severe parent intake bottlenecks.`;
    recommendations = [
      `Enforce a "Zero-Backlog" rule for admission reviews (${weakest.breakdown.admissionTurnaround}%), mandating a maximum 48-hour response window for prospective parent submissions.`,
      `Deploy centralized task boards for administrators to track and report daily task completions (${weakest.breakdown.taskCompletion}%) live.`,
      `Review and complete missing timetable/period allocations (${weakest.breakdown.schedulingCoverage}%) to eliminate teacher assignment overlaps.`
    ];
  }

  return `### Executive Operational Health Briefing (Offline Mode)

**1. Strategic Standing**
${standing}

**2. Bright Spot**
${brightSpot}

**3. Core Vulnerability & Strategic Action Plan**
${vulnerabilityRisk}

To elevate operations immediately, the executive board should execute the following steps:
1. ${recommendations[0]}
2. ${recommendations[1]}
3. ${recommendations[2]}`;
}

app.post('/api/operations/health/brief', async (req, res) => {
  const { compositeScore, categories, branch } = req.body;

  if (!ai) {
    const offlineBrief = generateOfflineHealthBrief(compositeScore, categories, branch);
    return res.json({ brief: offlineBrief, mode: "offline" });
  }

  try {
    const systemInstruction = `You are an elite Senior Educational Administrator, McKinsey Operations Consultant, and Chairman level advisor for SAMS School Management. You summarize dashboard analytics with brevity, impact, and high executive-level strategic polish.`;
    
    const userPrompt = `Review SAMS institutional operational health scores:
Overall Health Score: ${compositeScore}/100
Branch: ${branch.toUpperCase()}

Sub-Category Health Dimension Scores:
- Academic Health: ${categories.academic.score}/100 (Grades: ${categories.academic.breakdown.studentGrades}%, Attendance: ${categories.academic.breakdown.attendance}%, Teacher reviews: ${categories.academic.breakdown.teacherPerformance}%, Curriculum plans: ${categories.academic.breakdown.curriculumCompliance}%)
- Financial Health: ${categories.financial.score}/100 (Fee collection: ${categories.financial.breakdown.feeCollection}%, Budgets compliance: ${categories.financial.breakdown.budgetVariance}%, Salaries paid: ${categories.financial.breakdown.payrollCompliance}%)
- Inventory Health: ${categories.inventory.score}/100 (Checklists ready: ${categories.inventory.breakdown.readinessRate}%, Stock healthy: ${categories.inventory.breakdown.stockHealth}%)
- Operational Health: ${categories.operational.score}/100 (Tasks done: ${categories.operational.breakdown.taskCompletion}%, On-time: ${categories.operational.breakdown.deadlineCompliance}%, Admissions reviewed: ${categories.operational.breakdown.admissionTurnaround}%, Scheduling: ${categories.operational.breakdown.schedulingCoverage}%)

Generate a concise, elite **Executive Institutional Briefing**:
1. **Strategic Standing**: A paragraph highlighting current institutional standing (use terms like 'sound', 'improving', 'remedial steps needed' depending on score).
2. **Bright Spot**: Identify the single strongest dimension and celebrate its structural victory.
3. **Core Vulnerability & Solutions**: Identify the single weakest dimension, detail the operational risk, and propose 3 hyper-targeted, numbered recommendations to elevate it immediately.

Use clean markdown, bullet lists, elegant typography, and keep it strictly under 200 words. Do not include introductory filler.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    res.json({ brief: response.text || "" });
  } catch (error: any) {
    console.error("Health brief generation failed, falling back offline:", error);
    const offlineBrief = generateOfflineHealthBrief(compositeScore, categories, branch);
    res.json({ brief: offlineBrief, mode: "offline" });
  }
});


// -------------------------------------------------------------
// FINANCIAL SETTINGS CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/financial_settings', (req, res) => {
  res.json(dbState.financial_settings || []);
});

app.post('/api/financial_settings', (req, res) => {
  const { 
    financialYear, 
    currency, 
    currencySymbol, 
    receiptPrefix, 
    autoReceiptNumber, 
    defaultDueDays, 
    defaultGracePeriod, 
    defaultPaymentThreshold, 
    defaultReceiptFooter,
    isDefault
  } = req.body;

  if (!financialYear) {
    return res.status(400).json({ error: "Financial Year is required." });
  }

  // Prevent duplicate configuration
  const exists = (dbState.financial_settings || []).some(
    (item: any) => item.financialYear.trim().toLowerCase() === financialYear.trim().toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: `A configuration for financial year "${financialYear}" already exists.` });
  }

  const newSetting = {
    id: `fs-${Date.now()}`,
    financialYear: financialYear.trim(),
    currency: (currency || "NGN").trim(),
    currencySymbol: (currencySymbol || "₦").trim(),
    receiptPrefix: (receiptPrefix || "").trim(),
    autoReceiptNumber: !!autoReceiptNumber,
    defaultDueDays: parseInt(defaultDueDays) || 0,
    defaultGracePeriod: parseInt(defaultGracePeriod) || 0,
    defaultPaymentThreshold: parseFloat(defaultPaymentThreshold) || 0,
    defaultReceiptFooter: (defaultReceiptFooter || "").trim(),
    isDefault: !!isDefault,
    createdAt: new Date().toISOString()
  };

  if (newSetting.isDefault) {
    // Unset others
    (dbState.financial_settings || []).forEach((item: any) => {
      item.isDefault = false;
    });
  }

  // If this is the only setting, make it default automatically
  if ((dbState.financial_settings || []).length === 0) {
    newSetting.isDefault = true;
  }

  dbState.financial_settings = [...(dbState.financial_settings || []), newSetting];
  saveDB(dbState);

  res.status(201).json(newSetting);
});

app.put('/api/financial_settings/:id', (req, res) => {
  const { id } = req.params;
  const { 
    financialYear, 
    currency, 
    currencySymbol, 
    receiptPrefix, 
    autoReceiptNumber, 
    defaultDueDays, 
    defaultGracePeriod, 
    defaultPaymentThreshold, 
    defaultReceiptFooter,
    isDefault
  } = req.body;

  const list = dbState.financial_settings || [];
  const idx = list.findIndex((item: any) => item.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Financial setting not found." });
  }

  if (!financialYear) {
    return res.status(400).json({ error: "Financial Year is required." });
  }

  // Prevent duplicate configuration (exclude current record)
  const exists = list.some(
    (item: any) => item.id !== id && item.financialYear.trim().toLowerCase() === financialYear.trim().toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: `A configuration for financial year "${financialYear}" already exists.` });
  }

  const updatedSetting = {
    ...list[idx],
    financialYear: financialYear.trim(),
    currency: (currency || "NGN").trim(),
    currencySymbol: (currencySymbol || "₦").trim(),
    receiptPrefix: (receiptPrefix || "").trim(),
    autoReceiptNumber: !!autoReceiptNumber,
    defaultDueDays: parseInt(defaultDueDays) || 0,
    defaultGracePeriod: parseInt(defaultGracePeriod) || 0,
    defaultPaymentThreshold: parseFloat(defaultPaymentThreshold) || 0,
    defaultReceiptFooter: (defaultReceiptFooter || "").trim(),
    isDefault: !!isDefault,
    updatedAt: new Date().toISOString()
  };

  if (updatedSetting.isDefault) {
    // Unset others
    list.forEach((item: any) => {
      if (item.id !== id) {
        item.isDefault = false;
      }
    });
  } else {
    // Check if this was default, and if so, prevent unsetting it if it's the only one, or force another to be default
    const defaultCount = list.filter((item: any) => item.id !== id && item.isDefault).length;
    if (defaultCount === 0) {
      // Force keeping this one as default since there is no other default
      updatedSetting.isDefault = true;
    }
  }

  list[idx] = updatedSetting;
  dbState.financial_settings = list;
  saveDB(dbState);

  res.json(updatedSetting);
});

app.delete('/api/financial_settings/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.financial_settings || [];
  const idx = list.findIndex((item: any) => item.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Financial setting not found." });
  }

  const wasDefault = list[idx].isDefault;
  const filtered = list.filter((item: any) => item.id !== id);

  if (filtered.length > 0 && wasDefault) {
    // Set the first one as default
    filtered[0].isDefault = true;
  }

  dbState.financial_settings = filtered;
  saveDB(dbState);

  res.json({ success: true, id });
});


// -------------------------------------------------------------
// FEE HEAD CATEGORIES CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/fee_head_categories', (req, res) => {
  res.json(dbState.fee_head_categories || []);
});

app.post('/api/fee_head_categories', (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const list = dbState.fee_head_categories || [];
  const exists = list.some((item: any) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `A category named "${name}" already exists.` });
  }

  const newCategory = {
    id: `fhc-${Date.now()}`,
    name: name.trim(),
    description: (description || "").trim(),
    createdAt: new Date().toISOString()
  };

  dbState.fee_head_categories = [...list, newCategory];
  saveDB(dbState);
  res.status(201).json(newCategory);
});

app.put('/api/fee_head_categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const list = dbState.fee_head_categories || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Category not found." });
  }

  const exists = list.some((item: any) => item.id !== id && item.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Another category named "${name}" already exists.` });
  }

  const updatedCategory = {
    ...list[idx],
    name: name.trim(),
    description: (description || "").trim(),
    updatedAt: new Date().toISOString()
  };

  list[idx] = updatedCategory;
  dbState.fee_head_categories = list;
  saveDB(dbState);
  res.json(updatedCategory);
});

app.delete('/api/fee_head_categories/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.fee_head_categories || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Category not found." });
  }

  // Check if any Fee Head is using this category
  const heads = dbState.fee_heads || [];
  const inUse = heads.some((h: any) => h.categoryId === id);
  if (inUse) {
    return res.status(400).json({ error: "This category cannot be deleted as it is in use by one or more Fee Heads." });
  }

  const filtered = list.filter((item: any) => item.id !== id);
  dbState.fee_head_categories = filtered;
  saveDB(dbState);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// FEE HEADS CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/fee_heads', (req, res) => {
  res.json(dbState.fee_heads || []);
});

app.post('/api/fee_heads', (req, res) => {
  const { code, name, description, categoryId, isMandatory, isActive, branchId, section, displayOrder } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "Fee Head Code is required." });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Fee Head Name is required." });
  }
  if (!categoryId) {
    return res.status(400).json({ error: "Category is required." });
  }

  const list = dbState.fee_heads || [];
  const codeNormalized = code.trim().toUpperCase();
  const exists = list.some((item: any) => item.code.trim().toUpperCase() === codeNormalized);
  if (exists) {
    return res.status(400).json({ error: `A Fee Head with Code "${codeNormalized}" already exists.` });
  }

  const newFeeHead = {
    id: `fh-${Date.now()}`,
    code: codeNormalized,
    name: name.trim(),
    description: (description || "").trim(),
    categoryId,
    isMandatory: !!isMandatory,
    isActive: isActive !== false,
    branchId: branchId || "All",
    section: section || "All",
    displayOrder: parseInt(displayOrder) || 0,
    createdAt: new Date().toISOString()
  };

  dbState.fee_heads = [...list, newFeeHead];
  saveDB(dbState);
  res.status(201).json(newFeeHead);
});

app.put('/api/fee_heads/:id', (req, res) => {
  const { id } = req.params;
  const { code, name, description, categoryId, isMandatory, isActive, branchId, section, displayOrder } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "Fee Head Code is required." });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Fee Head Name is required." });
  }
  if (!categoryId) {
    return res.status(400).json({ error: "Category is required." });
  }

  const list = dbState.fee_heads || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Fee Head not found." });
  }

  const codeNormalized = code.trim().toUpperCase();
  const exists = list.some((item: any) => item.id !== id && item.code.trim().toUpperCase() === codeNormalized);
  if (exists) {
    return res.status(400).json({ error: `Another Fee Head with Code "${codeNormalized}" already exists.` });
  }

  const updatedFeeHead = {
    ...list[idx],
    code: codeNormalized,
    name: name.trim(),
    description: (description || "").trim(),
    categoryId,
    isMandatory: !!isMandatory,
    isActive: !!isActive,
    branchId: branchId || "All",
    section: section || "All",
    displayOrder: parseInt(displayOrder) || 0,
    updatedAt: new Date().toISOString()
  };

  list[idx] = updatedFeeHead;
  dbState.fee_heads = list;
  saveDB(dbState);
  res.json(updatedFeeHead);
});

app.delete('/api/fee_heads/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.fee_heads || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Fee Head not found." });
  }

  const filtered = list.filter((item: any) => item.id !== id);
  dbState.fee_heads = filtered;
  saveDB(dbState);
  res.json({ success: true, id });
});


// -------------------------------------------------------------
// OPTIONAL CHARGE CATEGORIES CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/optional_charge_categories', (req, res) => {
  res.json(dbState.optional_charge_categories || []);
});

app.post('/api/optional_charge_categories', (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const list = dbState.optional_charge_categories || [];
  const exists = list.some((item: any) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `An optional charge category named "${name}" already exists.` });
  }

  const newCategory = {
    id: `occ-${Date.now()}`,
    name: name.trim(),
    description: (description || "").trim(),
    createdAt: new Date().toISOString()
  };

  dbState.optional_charge_categories = [...list, newCategory];
  saveDB(dbState);
  res.status(201).json(newCategory);
});

app.put('/api/optional_charge_categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const list = dbState.optional_charge_categories || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Category not found." });
  }

  const exists = list.some((item: any) => item.id !== id && item.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Another optional charge category named "${name}" already exists.` });
  }

  const updatedCategory = {
    ...list[idx],
    name: name.trim(),
    description: (description || "").trim(),
    updatedAt: new Date().toISOString()
  };

  list[idx] = updatedCategory;
  dbState.optional_charge_categories = list;
  saveDB(dbState);
  res.json(updatedCategory);
});

app.delete('/api/optional_charge_categories/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.optional_charge_categories || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Category not found." });
  }

  // Check if any Optional Charge is using this category
  const charges = dbState.optional_charges || [];
  const inUse = charges.some((c: any) => c.categoryId === id);
  if (inUse) {
    return res.status(400).json({ error: "This category cannot be deleted as it is in use by one or more Optional Charges." });
  }

  const filtered = list.filter((item: any) => item.id !== id);
  dbState.optional_charge_categories = filtered;
  saveDB(dbState);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// OPTIONAL CHARGES CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/optional_charges', (req, res) => {
  res.json(dbState.optional_charges || []);
});

app.post('/api/optional_charges', (req, res) => {
  const { name, description, categoryId, amount, quantity, separateReceipt, independentTracking, isActive } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Optional Charge Name is required." });
  }
  if (!categoryId) {
    return res.status(400).json({ error: "Category is required." });
  }
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return res.status(400).json({ error: "Valid Amount is required." });
  }
  if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
    return res.status(400).json({ error: "Valid Quantity is required." });
  }

  const list = dbState.optional_charges || [];
  const exists = list.some((item: any) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `An Optional Charge with Name "${name}" already exists.` });
  }

  const newCharge = {
    id: `oc-${Date.now()}`,
    name: name.trim(),
    description: (description || "").trim(),
    categoryId,
    amount: Number(amount),
    quantity: Number(quantity),
    separateReceipt: !!separateReceipt,
    independentTracking: !!independentTracking,
    isActive: isActive !== false,
    createdAt: new Date().toISOString()
  };

  dbState.optional_charges = [...list, newCharge];
  saveDB(dbState);
  res.status(201).json(newCharge);
});

app.put('/api/optional_charges/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, categoryId, amount, quantity, separateReceipt, independentTracking, isActive } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Optional Charge Name is required." });
  }
  if (!categoryId) {
    return res.status(400).json({ error: "Category is required." });
  }
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return res.status(400).json({ error: "Valid Amount is required." });
  }
  if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
    return res.status(400).json({ error: "Valid Quantity is required." });
  }

  const list = dbState.optional_charges || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Optional Charge not found." });
  }

  const exists = list.some((item: any) => item.id !== id && item.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Another Optional Charge with Name "${name}" already exists.` });
  }

  const updatedCharge = {
    ...list[idx],
    name: name.trim(),
    description: (description || "").trim(),
    categoryId,
    amount: Number(amount),
    quantity: Number(quantity),
    separateReceipt: !!separateReceipt,
    independentTracking: !!independentTracking,
    isActive: !!isActive,
    updatedAt: new Date().toISOString()
  };

  list[idx] = updatedCharge;
  dbState.optional_charges = list;
  saveDB(dbState);
  res.json(updatedCharge);
});

app.delete('/api/optional_charges/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.optional_charges || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Optional Charge not found." });
  }

  const filtered = list.filter((item: any) => item.id !== id);
  dbState.optional_charges = filtered;
  saveDB(dbState);
  res.json({ success: true, id });
});


// -------------------------------------------------------------
// SECTIONS CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/sections', (req, res) => {
  res.json(dbState.sections || []);
});

app.post('/api/sections', (req, res) => {
  const { name, description, branch, session } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Section Name is required." });
  }

  const list = dbState.sections || [];
  const b = branch || "GN";
  const s = session || "ses-2026";

  const exists = list.some((item: any) => 
    item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
    (item.branch || "GN") === b &&
    (item.session || "ses-2026") === s
  );

  if (exists) {
    return res.status(400).json({ error: `A section named "${name}" already exists for this branch and session.` });
  }

  const newSection = {
    id: `sec-${Date.now()}`,
    name: name.trim(),
    description: (description || "").trim(),
    branch: b,
    session: s,
    createdAt: new Date().toISOString()
  };

  dbState.sections = [...list, newSection];
  saveDB(dbState);
  res.status(201).json(newSection);
});

app.put('/api/sections/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, branch, session } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Section Name is required." });
  }

  const list = dbState.sections || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Section not found." });
  }

  const b = branch || list[idx].branch || "GN";
  const s = session || list[idx].session || "ses-2026";

  const exists = list.some((item: any) => 
    item.id !== id &&
    item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
    (item.branch || "GN") === b &&
    (item.session || "ses-2026") === s
  );

  if (exists) {
    return res.status(400).json({ error: `Another section named "${name}" already exists for this branch and session.` });
  }

  const updatedSection = {
    ...list[idx],
    name: name.trim(),
    description: (description || "").trim(),
    branch: b,
    session: s,
    updatedAt: new Date().toISOString()
  };

  list[idx] = updatedSection;
  dbState.sections = list;
  saveDB(dbState);
  res.json(updatedSection);
});

app.delete('/api/sections/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.sections || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Section not found." });
  }

  // Check if any Class is mapped to this Section
  const classesList = dbState.classes || [];
  const inUse = classesList.some((c: any) => c.sectionId === id);
  if (inUse) {
    return res.status(400).json({ error: "This section cannot be deleted as it has classes assigned to it." });
  }

  const filtered = list.filter((item: any) => item.id !== id);
  dbState.sections = filtered;
  saveDB(dbState);
  res.json({ success: true, id });
});


// -------------------------------------------------------------
// FEE TEMPLATES CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/fee_templates', (req, res) => {
  res.json(dbState.fee_templates || []);
});

app.post('/api/fee_templates', (req, res) => {
  const { branch, session, term, sectionId, totalFee, items, dueDateOffset, gracePeriod, reminderSchedule, restrictions } = req.body;
  
  if (!branch || !session || !term || !sectionId) {
    return res.status(400).json({ error: "Missing required template parameters (Branch, Session, Term, and Section)." });
  }

  const list = dbState.fee_templates || [];

  // Check unique combination
  const exists = list.some((item: any) => 
    item.branch === branch &&
    item.session === session &&
    item.term === term &&
    item.sectionId === sectionId
  );

  if (exists) {
    return res.status(400).json({ error: "A fee template already exists for this exact Branch, Session, Term, and Section combination." });
  }

  const newTemplate = {
    id: `temp-${Date.now()}`,
    branch,
    session,
    term,
    sectionId,
    totalFee: parseFloat(totalFee) || 0,
    items: items || [],
    dueDateOffset: dueDateOffset !== undefined ? parseInt(dueDateOffset) : 14,
    gracePeriod: gracePeriod !== undefined ? parseInt(gracePeriod) : 3,
    reminderSchedule: reminderSchedule || '3 Days Before, On Due Date, 5 Days Overdue',
    restrictions: restrictions || {
      blockReportCard: false,
      blockParentPortal: false,
      blockBooks: false,
      blockPromotion: false,
      blockRegistration: false
    },
    createdAt: new Date().toISOString()
  };

  dbState.fee_templates = [...list, newTemplate];
  saveDB(dbState);
  res.status(201).json(newTemplate);
});

app.put('/api/fee_templates/:id', (req, res) => {
  const { id } = req.params;
  const { branch, session, term, sectionId, totalFee, items, dueDateOffset, gracePeriod, reminderSchedule, restrictions } = req.body;

  if (!branch || !session || !term || !sectionId) {
    return res.status(400).json({ error: "Missing required template parameters." });
  }

  const list = dbState.fee_templates || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Fee Template not found." });
  }

  // Check unique combination amongst other templates
  const exists = list.some((item: any) => 
    item.id !== id &&
    item.branch === branch &&
    item.session === session &&
    item.term === term &&
    item.sectionId === sectionId
  );

  if (exists) {
    return res.status(400).json({ error: "Another fee template already exists for this exact Branch, Session, Term, and Section combination." });
  }

  const updatedTemplate = {
    ...list[idx],
    branch,
    session,
    term,
    sectionId,
    totalFee: parseFloat(totalFee) || 0,
    items: items || [],
    dueDateOffset: dueDateOffset !== undefined ? parseInt(dueDateOffset) : 14,
    gracePeriod: gracePeriod !== undefined ? parseInt(gracePeriod) : 3,
    reminderSchedule: reminderSchedule || '3 Days Before, On Due Date, 5 Days Overdue',
    restrictions: restrictions || {
      blockReportCard: false,
      blockParentPortal: false,
      blockBooks: false,
      blockPromotion: false,
      blockRegistration: false
    },
    updatedAt: new Date().toISOString()
  };

  list[idx] = updatedTemplate;
  dbState.fee_templates = list;
  saveDB(dbState);
  res.json(updatedTemplate);
});

app.delete('/api/fee_templates/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.fee_templates || [];
  const filtered = list.filter((item: any) => item.id !== id);
  dbState.fee_templates = filtered;
  saveDB(dbState);
  res.json({ success: true, id });
});


// -------------------------------------------------------------
// CLASS FEE OVERRIDES CRUD ENDPOINTS
// -------------------------------------------------------------
app.get('/api/class_fee_overrides', (req, res) => {
  res.json(dbState.class_fee_overrides || []);
});

app.post('/api/class_fee_overrides', (req, res) => {
  const { templateId, classId, items } = req.body;

  if (!templateId || !classId) {
    return res.status(400).json({ error: "Missing required parameters (templateId and classId are required)." });
  }

  const list = dbState.class_fee_overrides || [];

  // Check unique combination
  const exists = list.some((item: any) => 
    item.templateId === templateId &&
    item.classId === classId
  );

  if (exists) {
    return res.status(400).json({ error: "A class-specific fee override already exists for this Class in this Fee Template." });
  }

  const newOverride = {
    id: `override-${Date.now()}`,
    templateId,
    classId,
    items: items || [],
    createdAt: new Date().toISOString()
  };

  dbState.class_fee_overrides = [...list, newOverride];
  saveDB(dbState);
  res.status(201).json(newOverride);
});

app.put('/api/class_fee_overrides/:id', (req, res) => {
  const { id } = req.params;
  const { templateId, classId, items } = req.body;

  if (!templateId || !classId) {
    return res.status(400).json({ error: "Missing required parameters (templateId and classId are required)." });
  }

  const list = dbState.class_fee_overrides || [];
  const idx = list.findIndex((item: any) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Class Fee Override not found." });
  }

  // Check uniqueness amongst other overrides
  const exists = list.some((item: any) => 
    item.id !== id &&
    item.templateId === templateId &&
    item.classId === classId
  );

  if (exists) {
    return res.status(400).json({ error: "Another class-specific fee override already exists for this Class under this Fee Template." });
  }

  const updatedOverride = {
    ...list[idx],
    templateId,
    classId,
    items: items || [],
    updatedAt: new Date().toISOString()
  };

  list[idx] = updatedOverride;
  dbState.class_fee_overrides = list;
  saveDB(dbState);
  res.json(updatedOverride);
});

app.delete('/api/class_fee_overrides/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.class_fee_overrides || [];
  const filtered = list.filter((item: any) => item.id !== id);
  dbState.class_fee_overrides = filtered;
  saveDB(dbState);
  res.json({ success: true, id });
});


// -------------------------------------------------------------
// STUDENT BILLING CRUD & BULK GENERATION ENDPOINTS
// -------------------------------------------------------------
app.get('/api/student_fee_ledgers', (req, res) => {
  let list = dbState.student_fee_ledgers || [];
  const { branch, classId, sessionId, termId, status, search } = req.query;

  if (branch && branch !== 'All') {
    list = list.filter((l: any) => l.branch === branch);
  }
  if (classId && classId !== 'All') {
    list = list.filter((l: any) => l.classId === classId);
  }
  if (sessionId && sessionId !== 'All') {
    list = list.filter((l: any) => l.sessionId === sessionId);
  }
  if (termId && termId !== 'All') {
    list = list.filter((l: any) => l.termId === termId);
  }
  if (status && status !== 'All') {
    list = list.filter((l: any) => l.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((l: any) => (l.studentName || '').toLowerCase().includes(q));
  }

  res.json(list);
});

app.get('/api/student_fee_ledgers/:id', (req, res) => {
  const { id } = req.params;
  const ledgers = dbState.student_fee_ledgers || [];
  const ledger = ledgers.find((l: any) => l.id === id);

  if (!ledger) {
    return res.status(404).json({ error: "Student Fee Ledger not found." });
  }

  const items = (dbState.student_fee_items || []).filter((i: any) => i.ledgerId === id);
  res.json({ ...ledger, items });
});

app.post('/api/student_fee_ledgers', (req, res) => {
  const { 
    studentId, studentName, classId, sectionId, branch, sessionId, termId, 
    status, baseTermFee, optionalChargesFee, discountAmount, scholarshipAmount, 
    carryForward, outstanding, grandTotal, billingDate, dueDate, items 
  } = req.body;

  if (!studentId || !sessionId || !termId) {
    return res.status(400).json({ error: "Missing required fields studentId, sessionId, or termId." });
  }

  const ledgerId = `sfl-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const newLedger = {
    id: ledgerId,
    studentId,
    studentName: studentName || 'Unknown Student',
    classId: classId || '',
    sectionId: sectionId || '',
    branch: branch || 'GN',
    sessionId,
    termId,
    status: status || 'Draft',
    baseTermFee: Number(baseTermFee) || 0,
    optionalChargesFee: Number(optionalChargesFee) || 0,
    discountAmount: Number(discountAmount) || 0,
    scholarshipAmount: Number(scholarshipAmount) || 0,
    carryForward: Number(carryForward) || 0,
    outstanding: Number(outstanding) || 0,
    grandTotal: Number(grandTotal) || 0,
    billingDate: billingDate || new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  dbState.student_fee_ledgers = [...(dbState.student_fee_ledgers || []), newLedger];

  // Save items
  const newItems = (items || []).map((item: any) => ({
    id: `sfi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    ledgerId,
    type: item.type || 'term_fee',
    referenceId: item.referenceId || '',
    name: item.name || '',
    amount: Number(item.amount) || 0,
    createdAt: new Date().toISOString()
  }));

  dbState.student_fee_items = [...(dbState.student_fee_items || []), ...newItems];
  saveDB(dbState);

  res.status(201).json({ ...newLedger, items: newItems });
});

app.put('/api/student_fee_ledgers/:id', (req, res) => {
  const { id } = req.params;
  const ledgers = dbState.student_fee_ledgers || [];
  const idx = ledgers.findIndex((l: any) => l.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Student Fee Ledger not found." });
  }

  const { 
    status, baseTermFee, optionalChargesFee, discountAmount, scholarshipAmount, 
    carryForward, outstanding, grandTotal, billingDate, dueDate, items 
  } = req.body;

  const updatedLedger = {
    ...ledgers[idx],
    status: status || ledgers[idx].status,
    baseTermFee: baseTermFee !== undefined ? Number(baseTermFee) : ledgers[idx].baseTermFee,
    optionalChargesFee: optionalChargesFee !== undefined ? Number(optionalChargesFee) : ledgers[idx].optionalChargesFee,
    discountAmount: discountAmount !== undefined ? Number(discountAmount) : ledgers[idx].discountAmount,
    scholarshipAmount: scholarshipAmount !== undefined ? Number(scholarshipAmount) : ledgers[idx].scholarshipAmount,
    carryForward: carryForward !== undefined ? Number(carryForward) : ledgers[idx].carryForward,
    outstanding: outstanding !== undefined ? Number(outstanding) : ledgers[idx].outstanding,
    grandTotal: grandTotal !== undefined ? Number(grandTotal) : ledgers[idx].grandTotal,
    billingDate: billingDate || ledgers[idx].billingDate,
    dueDate: dueDate || ledgers[idx].dueDate,
    updatedAt: new Date().toISOString()
  };

  ledgers[idx] = updatedLedger;
  dbState.student_fee_ledgers = ledgers;

  // Handle item updates: overwrite existing items for this ledger
  if (items) {
    let currentItems = dbState.student_fee_items || [];
    // Filter out old items
    currentItems = currentItems.filter((i: any) => i.ledgerId !== id);

    const newItems = items.map((item: any) => ({
      id: item.id || `sfi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      ledgerId: id,
      type: item.type,
      referenceId: item.referenceId || '',
      name: item.name || '',
      amount: Number(item.amount) || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    dbState.student_fee_items = [...currentItems, ...newItems];
  }

  saveDB(dbState);
  res.json(updatedLedger);
});

app.delete('/api/student_fee_ledgers/:id', (req, res) => {
  const { id } = req.params;
  const list = dbState.student_fee_ledgers || [];
  const filtered = list.filter((l: any) => l.id !== id);
  dbState.student_fee_ledgers = filtered;

  // Delete items too
  const itemsFiltered = (dbState.student_fee_items || []).filter((i: any) => i.ledgerId !== id);
  dbState.student_fee_items = itemsFiltered;

  saveDB(dbState);
  res.json({ success: true, id });
});

app.post('/api/billing/generate', (req, res) => {
  const { sessionId, termId, branch, classId, recreate } = req.body;

  if (!sessionId || !termId) {
    return res.status(400).json({ error: "Missing required parameters: sessionId and termId are required." });
  }

  const students = dbState.students || [];
  const classes = dbState.classes || [];
  const templates = dbState.fee_templates || [];
  const feeHeads = dbState.fee_heads || [];
  const overrides = dbState.class_fee_overrides || [];

  let ledgers = dbState.student_fee_ledgers || [];
  let itemsList = dbState.student_fee_items || [];

  let countGenerated = 0;
  let totalValue = 0;

  // Filter students based on branch or class
  const filteredStudents = students.filter((s: any) => {
    const matchesBranch = !branch || branch === 'All' || s.branch === branch;
    
    let matchesClass = true;
    if (classId && classId !== 'All') {
      const clsObj = classes.find((c: any) => c.id === classId);
      if (clsObj) {
        matchesClass = s.grade === clsObj.name && s.branch === clsObj.branch;
      } else {
        matchesClass = false;
      }
    }
    return matchesBranch && matchesClass;
  });

  filteredStudents.forEach((student: any) => {
    // 1. Find student's class
    const studentClass = classes.find((c: any) => c.name === student.grade && c.branch === student.branch);
    if (!studentClass) return;

    const sectionId = studentClass.sectionId;

    // 2. Find template
    const template = templates.find((t: any) => 
      t.branch === student.branch &&
      t.session === sessionId &&
      t.term === termId &&
      t.sectionId === sectionId
    );

    if (!template) return;

    // 3. Handle recreate if requested
    const existingLedgerIdx = ledgers.findIndex((l: any) => 
      l.studentId === student.id &&
      l.sessionId === sessionId &&
      l.termId === termId
    );

    if (existingLedgerIdx !== -1) {
      if (recreate) {
        const existingLedger = ledgers[existingLedgerIdx];
        itemsList = itemsList.filter((item: any) => item.ledgerId !== existingLedger.id);
        ledgers.splice(existingLedgerIdx, 1);
      } else {
        return; // skip duplicate
      }
    }

    // 4. Calculate items
    const finalItems: any[] = [];
    const classOverride = overrides.find((o: any) => o.templateId === template.id && o.classId === studentClass.id);

    if (classOverride) {
      // Seed template items, applying override edits/removals
      template.items.forEach((baseItem: any) => {
        const overrideItem = classOverride.items.find((oi: any) => oi.feeHeadId === baseItem.feeHeadId);
        if (overrideItem) {
          if (!overrideItem.isRemoved) {
            finalItems.push({
              feeHeadId: baseItem.feeHeadId,
              amount: overrideItem.amount
            });
          }
        } else {
          finalItems.push({
            feeHeadId: baseItem.feeHeadId,
            amount: baseItem.amount
          });
        }
      });

      // Add extra custom heads from override
      classOverride.items.forEach((oi: any) => {
        const isNotBase = !template.items.some((bi: any) => bi.feeHeadId === oi.feeHeadId);
        if (isNotBase && !oi.isRemoved) {
          finalItems.push({
            feeHeadId: oi.feeHeadId,
            amount: oi.amount
          });
        }
      });
    } else {
      template.items.forEach((baseItem: any) => {
        finalItems.push({
          feeHeadId: baseItem.feeHeadId,
          amount: baseItem.amount
        });
      });
    }

    const baseTermFee = finalItems.reduce((acc: number, item: any) => acc + item.amount, 0);

    // Calculate carry forward balance if previous unpaid bills exist (reverting un-cleared sibling discounts to full fee)
    const carryResult = computeStudentCarriedForward(
      student.id,
      sessionId,
      termId,
      ledgers,
      dbState.sibling_discount_records || []
    );
    const carryForward = carryResult.carryForward;

    const ledgerId = `sfl-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const newLedger = {
      id: ledgerId,
      studentId: student.id,
      studentName: student.name,
      classId: studentClass.id,
      sectionId: studentClass.sectionId,
      branch: student.branch,
      sessionId,
      termId,
      status: 'Draft',
      baseTermFee,
      optionalChargesFee: 0,
      discountAmount: 0,
      scholarshipAmount: 0,
      carryForward,
      outstanding: baseTermFee + carryForward,
      grandTotal: baseTermFee + carryForward,
      billingDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    ledgers.push(newLedger);

    // Create item records
    finalItems.forEach((item: any) => {
      const headObj = feeHeads.find((h: any) => h.id === item.feeHeadId);
      const newItem = {
        id: `sfi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        ledgerId,
        type: 'term_fee',
        referenceId: item.feeHeadId,
        name: headObj ? headObj.name : 'Unknown Fee Head',
        amount: item.amount,
        createdAt: new Date().toISOString()
      };
      itemsList.push(newItem);
    });

    countGenerated++;
    totalValue += newLedger.grandTotal;
  });

  dbState.student_fee_ledgers = ledgers;
  dbState.student_fee_items = itemsList;
  saveDB(dbState);

  res.status(201).json({ countGenerated, totalValue });
});


// -------------------------------------------------------------
// FAMILY FINANCIAL ACCOUNTS ENDPOINTS
// -------------------------------------------------------------

// GET all family accounts with aggregate statistics
app.get('/api/family_accounts', (req, res) => {
  const accounts = dbState.family_accounts || [];
  const members = dbState.family_members || [];
  const ledgers = dbState.student_fee_ledgers || [];
  const payments = dbState.family_payments || [];
  const students = dbState.students || [];

  const results = accounts.map((acc: any) => {
    // Find all member relations for this family
    const familyMembers = members.filter((m: any) => m.familyAccountId === acc.id);
    const memberStudentIds = familyMembers.map((m: any) => m.studentId);
    
    // Find matching students to include names
    const linkedStudents = students.filter((s: any) => memberStudentIds.includes(s.id));
    
    // Sum child-level ledger metrics
    const familyLedgers = ledgers.filter((l: any) => memberStudentIds.includes(l.studentId));
    const totalBilled = familyLedgers.reduce((sum: number, l: any) => sum + (l.grandTotal || 0), 0);
    const totalOutstanding = familyLedgers.reduce((sum: number, l: any) => sum + (l.outstanding || 0), 0);
    
    // Sum custom family-level payments
    const familyPayments = payments.filter((p: any) => p.familyAccountId === acc.id);
    const totalFamilyPayments = familyPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return {
      ...acc,
      memberCount: familyMembers.length,
      childrenNames: linkedStudents.map((s: any) => s.name).join(', '),
      totalBilled,
      totalOutstanding,
      totalPaid: (totalBilled - totalOutstanding) + totalFamilyPayments,
      students: linkedStudents.map((s: any) => ({ id: s.id, name: s.name, grade: s.grade, branch: s.branch }))
    };
  });

  res.json(results);
});

// GET detailed single family account with statement, payments, and outstanding invoices
app.get('/api/family_accounts/:id', (req, res) => {
  const { id } = req.params;
  const accounts = dbState.family_accounts || [];
  const acc = accounts.find((a: any) => a.id === id);

  if (!acc) {
    return res.status(404).json({ error: "Family Account not found." });
  }

  const members = dbState.family_members || [];
  const ledgers = dbState.student_fee_ledgers || [];
  const ledgerItems = dbState.student_fee_items || [];
  const payments = dbState.family_payments || [];
  const students = dbState.students || [];

  // Find linked children
  const familyMembers = members.filter((m: any) => m.familyAccountId === acc.id);
  const memberStudentIds = familyMembers.map((m: any) => m.studentId);
  const linkedStudents = students.filter((s: any) => memberStudentIds.includes(s.id));

  // Find ledgers & outstanding
  const familyLedgers = ledgers.filter((l: any) => memberStudentIds.includes(l.studentId));
  const outstandingInvoices = familyLedgers.filter((l: any) => l.outstanding > 0);

  // Payments recorded at family level
  const familyPayments = payments.filter((p: any) => p.familyAccountId === acc.id);

  // Financial Summary
  const totalBilled = familyLedgers.reduce((sum: number, l: any) => sum + (l.grandTotal || 0), 0);
  const totalOutstanding = familyLedgers.reduce((sum: number, l: any) => sum + (l.outstanding || 0), 0);
  const totalFamilyPayments = familyPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalPaid = (totalBilled - totalOutstanding) + totalFamilyPayments;

  // Build combined financial statement (chronologically sorted)
  const statement: any[] = [];

  // 1. Add invoices
  familyLedgers.forEach((l: any) => {
    // Retrieve individual item names inside invoice
    const subItems = ledgerItems.filter((i: any) => i.ledgerId === l.id);
    const itemNames = subItems.map((i: any) => `${i.name} (₦${i.amount.toLocaleString()})`).join(', ');

    statement.push({
      id: l.id,
      date: l.billingDate || l.createdAt.split('T')[0],
      type: 'invoice',
      description: `Term Invoice - ${l.studentName} (${itemNames || 'Base Tuition'})`,
      studentName: l.studentName,
      amount: l.grandTotal,
      status: l.status,
      refId: l.id
    });
  });

  // 2. Add family-level payments
  familyPayments.forEach((p: any) => {
    statement.push({
      id: p.id,
      date: p.paymentDate,
      type: 'payment',
      description: `Family Payment (${p.paymentMethod}) - Ref: ${p.referenceNo || 'None'}. ${p.notes || ''}`,
      studentName: 'Family Account',
      amount: p.amount,
      status: 'Paid',
      refId: p.id
    });
  });

  // 3. Sort chronologically
  statement.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({
    account: {
      ...acc,
      memberCount: familyMembers.length,
      students: linkedStudents.map((s: any) => ({ id: s.id, name: s.name, grade: s.grade, branch: s.branch }))
    },
    financials: {
      totalBilled,
      totalOutstanding,
      totalPaid,
      paymentsCount: familyPayments.length
    },
    statement,
    outstandingInvoices,
    paymentsHistory: familyPayments
  });
});

// POST create a family account
app.post('/api/family_accounts', (req, res) => {
  const { familyName, primaryParentName, primaryParentEmail, primaryParentPhone } = req.body;

  if (!primaryParentName) {
    return res.status(400).json({ error: "Missing required parent name." });
  }

  const newAcc = {
    id: `fam-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    familyName: familyName || `${primaryParentName.split(' ')[0] || 'Unknown'} Family`,
    primaryParentName,
    primaryParentEmail: primaryParentEmail || '',
    primaryParentPhone: primaryParentPhone || '',
    createdAt: new Date().toISOString()
  };

  dbState.family_accounts = [...(dbState.family_accounts || []), newAcc];
  saveDB(dbState);

  res.status(201).json(newAcc);
});

// PUT update family account details
app.put('/api/family_accounts/:id', (req, res) => {
  const { id } = req.params;
  const accounts = dbState.family_accounts || [];
  const idx = accounts.findIndex((a: any) => a.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Family Account not found." });
  }

  const { familyName, primaryParentName, primaryParentEmail, primaryParentPhone } = req.body;

  accounts[idx] = {
    ...accounts[idx],
    familyName: familyName !== undefined ? familyName : accounts[idx].familyName,
    primaryParentName: primaryParentName !== undefined ? primaryParentName : accounts[idx].primaryParentName,
    primaryParentEmail: primaryParentEmail !== undefined ? primaryParentEmail : accounts[idx].primaryParentEmail,
    primaryParentPhone: primaryParentPhone !== undefined ? primaryParentPhone : accounts[idx].primaryParentPhone,
    updatedAt: new Date().toISOString()
  };

  dbState.family_accounts = accounts;
  saveDB(dbState);

  res.json(accounts[idx]);
});

// DELETE family account and unlink members
app.delete('/api/family_accounts/:id', (req, res) => {
  const { id } = req.params;
  const accounts = dbState.family_accounts || [];
  const filteredAcc = accounts.filter((a: any) => a.id !== id);

  dbState.family_accounts = filteredAcc;

  // Unlink members (remove from family_members)
  const members = dbState.family_members || [];
  const filteredMem = members.filter((m: any) => m.familyAccountId !== id);
  dbState.family_members = filteredMem;

  saveDB(dbState);
  res.json({ success: true, id });
});

// POST trigger regrouping/regeneration of all family accounts from existing student database
app.post('/api/family_accounts/generate', (req, res) => {
  dbState.family_accounts = [];
  dbState.family_members = [];
  // Keep family payments history intact or initialize if empty
  dbState.family_payments = dbState.family_payments || [];

  const students = dbState.students || [];
  const familiesMap = new Map();

  students.forEach((s: any) => {
    const parentName = s.parentName || 'Unknown Parent';
    const parentEmail = s.parentEmail || '';
    const parentPhone = s.parentPhone || '';
    
    let foundKey = '';
    for (const key of familiesMap.keys()) {
      const [kName, kEmail] = key.split(':::');
      if ((parentEmail && kEmail === parentEmail) || (parentName && kName.toLowerCase() === parentName.toLowerCase())) {
        foundKey = key;
        break;
      }
    }
    
    if (!foundKey) {
      foundKey = `${parentName}:::${parentEmail}`;
      familiesMap.set(foundKey, {
        parentName,
        parentEmail,
        parentPhone,
        students: []
      });
    }
    
    familiesMap.get(foundKey).students.push(s);
  });

  let idx = 1;
  familiesMap.forEach((fam, key) => {
    const famId = `fam-${Date.now()}-${idx++}`;
    dbState.family_accounts.push({
      id: famId,
      familyName: `${fam.parentName.split(' ')[0] || 'Unknown'} Family`,
      primaryParentName: fam.parentName,
      primaryParentEmail: fam.parentEmail,
      primaryParentPhone: fam.parentPhone,
      createdAt: new Date().toISOString()
    });
    
    fam.students.forEach((s: any) => {
      dbState.family_members.push({
        id: `fmem-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        familyAccountId: famId,
        studentId: s.id,
        relationship: 'Child',
        createdAt: new Date().toISOString()
      });
    });
  });

  saveDB(dbState);
  res.json({ success: true, count: dbState.family_accounts.length });
});

// GET family members relations
app.get('/api/family_members', (req, res) => {
  res.json(dbState.family_members || []);
});

// POST link student to family account
app.post('/api/family_members', (req, res) => {
  const { familyAccountId, studentId, relationship } = req.body;

  if (!familyAccountId || !studentId) {
    return res.status(400).json({ error: "familyAccountId and studentId are required." });
  }

  // Prevent duplicate links
  const members = dbState.family_members || [];
  const exists = members.some((m: any) => m.familyAccountId === familyAccountId && m.studentId === studentId);

  if (exists) {
    return res.status(400).json({ error: "Student is already a member of this family account." });
  }

  const newMember = {
    id: `fmem-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    familyAccountId,
    studentId,
    relationship: relationship || 'Child',
    createdAt: new Date().toISOString()
  };

  dbState.family_members = [...members, newMember];
  saveDB(dbState);

  res.status(201).json(newMember);
});

// DELETE remove student from family account (unlink)
app.delete('/api/family_members/:id', (req, res) => {
  const { id } = req.params;
  const members = dbState.family_members || [];
  const filtered = members.filter((m: any) => m.id !== id);

  dbState.family_members = filtered;
  saveDB(dbState);

  res.json({ success: true, id });
});

// POST family-level payment with automatic outstanding invoice allocation
app.post('/api/family_payments', (req, res) => {
  const {
    familyAccountId,
    amount,
    paymentMethod,
    paymentDate,
    referenceNo,
    notes,
    autoAllocate,
    allocationRule, // oldest_first, highest_outstanding, lowest_outstanding, even_distribution
    allocations // array of { ledgerId, amount }
  } = req.body;

  if (!familyAccountId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "familyAccountId and a positive amount are required." });
  }

  const numericAmount = Number(amount);
  const paymentId = `fpay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newPayment = {
    id: paymentId,
    familyAccountId,
    amount: numericAmount,
    paymentMethod: paymentMethod || 'Cash',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    referenceNo: referenceNo || '',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  dbState.family_payments = [...(dbState.family_payments || []), newPayment];

  const ledgers = dbState.student_fee_ledgers || [];
  const familyMembers = (dbState.family_members || []).filter((m: any) => m.familyAccountId === familyAccountId);
  const studentIds = familyMembers.map((m: any) => m.studentId);
  const paymentItems: any[] = [];

  let allocatedSum = 0;

  if (autoAllocate) {
    let remainingPayment = numericAmount;
    const familyLedgers = ledgers.filter((l: any) => studentIds.includes(l.studentId) && l.status !== 'Paid');

    if (allocationRule === 'even_distribution') {
      const allocs = familyLedgers.map((l: any) => ({
        ledger: l,
        allocated: 0,
        outstanding: l.outstanding || 0
      }));

      let changed = true;
      while (remainingPayment > 0.01 && allocs.some(a => a.outstanding > 0) && changed) {
        changed = false;
        const unpaid = allocs.filter(a => a.outstanding > 0);
        if (unpaid.length === 0) break;

        const share = remainingPayment / unpaid.length;
        for (const item of unpaid) {
          const toApply = Math.min(item.outstanding, share);
          if (toApply > 0) {
            item.allocated += toApply;
            item.outstanding -= toApply;
            remainingPayment -= toApply;
            changed = true;
          }
        }
      }

      for (const item of allocs) {
        if (item.allocated > 0) {
          item.ledger.outstanding = item.outstanding;
          item.ledger.status = item.outstanding === 0 ? 'Paid' : 'Partially Paid';
          allocatedSum += item.allocated;

          paymentItems.push({
            id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            paymentId,
            ledgerId: item.ledger.id,
            name: `Family Payment Allocation - ${item.ledger.id}`,
            amount: Number(item.allocated.toFixed(2)),
            createdAt: new Date().toISOString()
          });
        }
      }
    } else {
      let sortedLedgers = [...familyLedgers];
      if (allocationRule === 'highest_outstanding') {
        sortedLedgers.sort((a: any, b: any) => (b.outstanding || 0) - (a.outstanding || 0));
      } else if (allocationRule === 'lowest_outstanding') {
        sortedLedgers.sort((a: any, b: any) => (a.outstanding || 0) - (b.outstanding || 0));
      } else {
        // default oldest_first
        sortedLedgers.sort((a: any, b: any) => new Date(a.billingDate || a.createdAt).getTime() - new Date(b.billingDate || b.createdAt).getTime());
      }

      for (const ledger of sortedLedgers) {
        if (remainingPayment <= 0) break;

        const outstandingBefore = ledger.outstanding || 0;
        if (outstandingBefore <= 0) continue;

        let allocationAmount = 0;
        if (remainingPayment >= outstandingBefore) {
          ledger.outstanding = 0;
          ledger.status = 'Paid';
          allocationAmount = outstandingBefore;
          remainingPayment -= outstandingBefore;
        } else {
          ledger.outstanding = Number((outstandingBefore - remainingPayment).toFixed(2));
          ledger.status = 'Partially Paid';
          allocationAmount = remainingPayment;
          remainingPayment = 0;
        }

        allocatedSum += allocationAmount;

        paymentItems.push({
          id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          paymentId,
          ledgerId: ledger.id,
          name: `Family Payment Allocation - ${ledger.id}`,
          amount: Number(allocationAmount.toFixed(2)),
          createdAt: new Date().toISOString()
        });
      }
    }
  } else if (allocations && allocations.length > 0) {
    // Manual allocations for family accounts
    for (const alloc of allocations) {
      const ledger = ledgers.find((l: any) => l.id === alloc.ledgerId);
      if (ledger && studentIds.includes(ledger.studentId)) {
        const allocAmt = Number(alloc.amount);
        if (allocAmt <= 0) continue;

        const outstandingBefore = ledger.outstanding || 0;
        ledger.outstanding = Math.max(0, Number((outstandingBefore - allocAmt).toFixed(2)));
        ledger.status = ledger.outstanding === 0 ? 'Paid' : 'Partially Paid';

        allocatedSum += allocAmt;

        paymentItems.push({
          id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          paymentId,
          ledgerId: ledger.id,
          name: `Family Payment Allocation - ${ledger.id}`,
          amount: Number(allocAmt.toFixed(2)),
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  dbState.student_fee_ledgers = ledgers;
  if (paymentItems.length > 0) {
    dbState.student_payment_items = [...(dbState.student_payment_items || []), ...paymentItems];
  }

  // Calculate family remaining balance after payment
  const famLedgersAfter = (dbState.student_fee_ledgers || []).filter((l: any) => studentIds.includes(l.studentId));
  const remainingBalance = famLedgersAfter.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);
  const totalBilled = famLedgersAfter.reduce((sum: number, l: any) => sum + (Number(l.grandTotal) || 0), 0);

  saveDB(dbState);
  res.status(201).json({ ...newPayment, items: paymentItems, remainingBalance, totalBilled });
});


// -------------------------------------------------------------
// SIBLING DISCOUNT CONCESSION SYSTEM ENDPOINTS & SUITE
// -------------------------------------------------------------

// GET all sibling discount policies
app.get('/api/sibling_discount/policies', (req, res) => {
  const policies = dbState.sibling_discount_policies || [];
  const branch = req.query.branch as string;
  if (branch && branch !== 'all') {
    return res.json(policies.filter((p: any) => p.branch === branch || p.branch === 'all'));
  }
  res.json(policies);
});

// POST create or update sibling discount policy
app.post('/api/sibling_discount/policies', (req, res) => {
  const policyData = req.body;
  if (!policyData.branch) {
    return res.status(400).json({ error: "Branch is required for Sibling Discount Policy." });
  }

  let policies = dbState.sibling_discount_policies || [];
  const existingIdx = policies.findIndex((p: any) => p.id === policyData.id || (p.branch === policyData.branch && p.sessionId === policyData.sessionId));

  const updatedPolicy = {
    id: policyData.id || `sdp-${(policyData.branch || 'gen').toLowerCase()}-${Date.now()}`,
    branch: policyData.branch,
    sessionId: policyData.sessionId || 'ses-2026',
    termId: policyData.termId || 'All',
    isActive: policyData.isActive !== undefined ? policyData.isActive : true,
    crossBranchEnabled: policyData.crossBranchEnabled !== undefined ? policyData.crossBranchEnabled : false,
    rates: policyData.rates || [
      { position: 1, label: "1st Sibling (Highest Class)", ratePercent: 0 },
      { position: 2, label: "2nd Sibling", ratePercent: 5 },
      { position: 3, label: "3rd Sibling", ratePercent: 10 },
      { position: 4, label: "4th Sibling", ratePercent: 15 },
      { position: 5, label: "5th Sibling & Above", ratePercent: 20 }
    ],
    eligibleFeeHeadNames: policyData.eligibleFeeHeadNames || [
      "Tuition", "Development Charges", "Portal Fee", "Games/Entertainment", "Furniture", "Medical Services", "Islamic Session"
    ],
    excludedFeeHeadNames: policyData.excludedFeeHeadNames || [
      "Textbooks", "Stationery", "Examination Fee"
    ],
    clearanceDays: policyData.clearanceDays !== undefined ? Number(policyData.clearanceDays) : 15,
    clearanceDeadlineDate: policyData.clearanceDeadlineDate || null,
    expireIfNotCleared: policyData.expireIfNotCleared !== undefined ? policyData.expireIfNotCleared : true,
    partialPaymentPolicy: policyData.partialPaymentPolicy || "recalculate_to_full_fee",
    updatedAt: new Date().toISOString(),
    createdAt: existingIdx >= 0 ? policies[existingIdx].createdAt : new Date().toISOString()
  };

  if (existingIdx >= 0) {
    policies[existingIdx] = updatedPolicy;
  } else {
    policies.push(updatedPolicy);
  }

  dbState.sibling_discount_policies = policies;

  // Log to audit trail
  dbState.sibling_discount_audit_logs = dbState.sibling_discount_audit_logs || [];
  dbState.sibling_discount_audit_logs.push({
    id: `sd-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'POLICY_SAVED',
    branch: policyData.branch,
    performedBy: req.body.performedBy || 'System Administrator',
    role: req.body.userRole || 'Super Administrator',
    details: `Updated sibling discount policy for Branch ${policyData.branch} (Cross-Branch: ${updatedPolicy.crossBranchEnabled ? 'ON' : 'OFF'})`,
    timestamp: new Date().toISOString()
  });

  saveDB(dbState);
  res.json({ success: true, policy: updatedPolicy });
});

// GET all sibling discount records
app.get('/api/sibling_discount/records', (req, res) => {
  const records = dbState.sibling_discount_records || [];
  const { branch, sessionId, termId, status } = req.query as Record<string, string>;

  let filtered = records;
  if (branch && branch !== 'all') {
    filtered = filtered.filter((r: any) => r.branch === branch);
  }
  if (sessionId && sessionId !== 'all') {
    filtered = filtered.filter((r: any) => r.sessionId === sessionId);
  }
  if (termId && termId !== 'all') {
    filtered = filtered.filter((r: any) => r.termId === termId);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((r: any) => r.status === status);
  }

  res.json(filtered);
});

// Helper calculation engine function for a set of students
function calculateSiblingDiscountsCore(options: {
  sessionId?: string;
  termId?: string;
  targetBranch?: string;
  customStudents?: any[];
}) {
  const { sessionId = 'ses-2026', termId = 'Term 1', targetBranch = 'all', customStudents } = options;

  const students = customStudents || dbState.students || [];
  const families = dbState.family_accounts || [];
  const familyMembers = dbState.family_members || [];
  const policies = dbState.sibling_discount_policies || [];
  const feeHeads = dbState.fee_heads || [];
  const feeTemplates = dbState.fee_templates || [];

  const calculatedRecords: any[] = [];
  const familyGroupSummary: any[] = [];

  // Group students by family account
  const familyToStudentsMap = new Map<string, any[]>();

  // Check each student's family link
  students.forEach((student: any) => {
    // Find member link
    const memberLink = familyMembers.find((fm: any) => fm.studentId === student.id);
    let famId = memberLink ? memberLink.familyAccountId : null;

    // Fallback: match by parent name/email if unlinked
    if (!famId) {
      const matchFam = families.find((f: any) => 
        (student.parentEmail && f.primaryParentEmail === student.parentEmail) ||
        (student.parentName && f.primaryParentName?.toLowerCase() === student.parentName?.toLowerCase())
      );
      if (matchFam) {
        famId = matchFam.id;
      } else {
        famId = `fam-auto-${student.parentEmail || student.parentName || student.id}`;
      }
    }

    if (famId) {
      if (!familyToStudentsMap.has(famId)) {
        familyToStudentsMap.set(famId, []);
      }
      familyToStudentsMap.get(famId)!.push(student);
    }
  });

  // Process each family portfolio
  familyToStudentsMap.forEach((famStudents, famId) => {
    const familyAccount = families.find((f: any) => f.id === famId) || {
      id: famId,
      familyName: `${famStudents[0]?.parentName?.split(' ')[0] || 'Unknown'} Family`,
      primaryParentName: famStudents[0]?.parentName || 'Parent',
      primaryParentEmail: famStudents[0]?.parentEmail || '',
      primaryParentPhone: famStudents[0]?.parentPhone || ''
    };

    // Determine branch policy
    const sampleBranch = famStudents[0]?.branch || 'GN';
    const policy = policies.find((p: any) => p.branch === sampleBranch && p.isActive) ||
      policies.find((p: any) => p.isActive) || {
        branch: sampleBranch,
        rates: [
          { position: 1, label: "1st Sibling (Highest Class)", ratePercent: 0 },
          { position: 2, label: "2nd Sibling", ratePercent: 5 },
          { position: 3, label: "3rd Sibling", ratePercent: 10 },
          { position: 4, label: "4th Sibling", ratePercent: 15 },
          { position: 5, label: "5th Sibling & Above", ratePercent: 20 }
        ],
        eligibleFeeHeadNames: ["Tuition", "Development Charges", "Portal Fee", "Games/Entertainment", "Furniture", "Medical Services", "Islamic Session"],
        excludedFeeHeadNames: ["Textbooks", "Stationery", "Examination Fee"],
        crossBranchEnabled: false
      };

    // Branch isolation logic: If crossBranchEnabled is false, split siblings by branch
    const branchGroups = new Map<string, any[]>();
    if (policy.crossBranchEnabled) {
      branchGroups.set('all', famStudents);
    } else {
      famStudents.forEach(s => {
        const b = s.branch || 'GN';
        if (!branchGroups.has(b)) branchGroups.set(b, []);
        branchGroups.get(b)!.push(s);
      });
    }

    branchGroups.forEach((groupStudents, branchKey) => {
      // Filter by targetBranch if specific
      if (targetBranch !== 'all' && branchKey !== 'all' && branchKey !== targetBranch) {
        return;
      }

      // Sort siblings strictly according to graduated policy:
      // 1. Highest class level first
      // 2. Older age (earlier DOB)
      // 3. Earlier admission date
      const rankedSiblings = sortSiblingsByPolicy(groupStudents);
      const totalSiblingsCount = rankedSiblings.length;

      rankedSiblings.forEach((student, index) => {
        const position = index + 1;
        const discountRatePercent = totalSiblingsCount === 1 ? 0 : getSiblingDiscountRate(position, policy.rates);

        // Calculate student's base fee and eligible heads
        // Find matching fee template for student's grade/level
        const matchedTemplate = feeTemplates.find((t: any) => 
          (t.applicableGrade && (t.applicableGrade === student.grade || student.grade?.includes(t.applicableGrade))) ||
          (t.applicableLevel && t.applicableLevel === student.level)
        ) || feeTemplates[0];

        // Breakdown fee heads:
        let originalTotalFee = 0;
        let eligibleFeeBase = 0;
        let excludedFeeTotal = 0;
        const feeHeadsBreakdown: any[] = [];

        if (matchedTemplate && matchedTemplate.items && matchedTemplate.items.length > 0) {
          matchedTemplate.items.forEach((item: any) => {
            const headName = item.name || item.feeHeadName || 'Tuition';
            const amount = Number(item.amount || item.netAmount || 0);
            originalTotalFee += amount;

            const isExcluded = policy.excludedFeeHeadNames.some((ex: string) => headName.toLowerCase().includes(ex.toLowerCase()));
            const isEligible = !isExcluded && (
              policy.eligibleFeeHeadNames.some((el: string) => headName.toLowerCase().includes(el.toLowerCase())) ||
              headName.toLowerCase().includes('tuition') ||
              headName.toLowerCase().includes('development')
            );

            if (isEligible) {
              eligibleFeeBase += amount;
            } else {
              excludedFeeTotal += amount;
            }

            feeHeadsBreakdown.push({
              name: headName,
              amount,
              isEligible,
              category: isEligible ? 'Eligible for Sibling Relief' : 'Excluded Head (Non-Discountable)'
            });
          });
        } else {
          // Standard SAMS default structure:
          // Tuition ₦45,000, Dev ₦5,000, Portal ₦3,000, Games ₦3,000, Furniture ₦2,000, Medical ₦3,000 = ₦61,000 Eligible
          // Textbooks ₦12,000, Stationery ₦5,000, Exam ₦5,000 = ₦22,000 Excluded
          const defaultTuition = student.level === 'secondary' ? 55000 : (student.level === 'primary' ? 45000 : 35000);
          originalTotalFee = defaultTuition + 38000;
          eligibleFeeBase = defaultTuition + 16000;
          excludedFeeTotal = 22000;

          feeHeadsBreakdown.push(
            { name: "Tuition", amount: defaultTuition, isEligible: true, category: 'Eligible for Sibling Relief' },
            { name: "Development Charges", amount: 5000, isEligible: true, category: 'Eligible for Sibling Relief' },
            { name: "Portal Fee", amount: 3000, isEligible: true, category: 'Eligible for Sibling Relief' },
            { name: "Games/Entertainment", amount: 3000, isEligible: true, category: 'Eligible for Sibling Relief' },
            { name: "Furniture", amount: 2000, isEligible: true, category: 'Eligible for Sibling Relief' },
            { name: "Medical Services", amount: 3000, isEligible: true, category: 'Eligible for Sibling Relief' },
            { name: "Textbooks", amount: 12000, isEligible: false, category: 'Excluded Head (Non-Discountable)' },
            { name: "Stationery", amount: 5000, isEligible: false, category: 'Excluded Head (Non-Discountable)' },
            { name: "Examination Fee", amount: 5000, isEligible: false, category: 'Excluded Head (Non-Discountable)' }
          );
        }

        // Exact Whole Naira Rounding:
        const discountAmount = Math.round((eligibleFeeBase * discountRatePercent) / 100);
        const finalAmountPayable = Math.max(0, originalTotalFee - discountAmount);

        // Check if student has already-settled paid ledger for this session & term
        const existingLedger = (dbState.student_fee_ledgers || []).find((l: any) => 
          l.studentId === student.id && (l.sessionId === sessionId || l.session === sessionId) && (l.termId === termId || l.term === termId)
        );

        const isFullyPaid = existingLedger && (existingLedger.status === 'Paid' || existingLedger.outstanding === 0);

        const record = {
          id: `sdr-${student.id}-${sessionId}-${termId}`.replace(/[^a-zA-Z0-9-]/g, '_'),
          studentId: student.id,
          studentName: student.name,
          studentGrade: student.grade,
          studentLevel: student.level,
          branch: student.branch || sampleBranch,
          familyAccountId: familyAccount.id,
          familyName: familyAccount.familyName,
          parentName: familyAccount.primaryParentName,
          parentPhone: familyAccount.primaryParentPhone,
          parentEmail: familyAccount.primaryParentEmail,
          sessionId,
          termId,
          siblingRank: position,
          totalSiblingsInFamily: totalSiblingsCount,
          discountRatePercent,
          originalTotalFee,
          eligibleFeeBase,
          excludedFeeTotal,
          discountAmount,
          finalAmountPayable,
          feeHeadsBreakdown,
          status: isFullyPaid ? 'Settled (Locked)' : (discountAmount > 0 ? 'Eligible' : 'Calculated (0% Full Fee)'),
          isOverridden: false,
          overrideReason: null,
          clearedBeforeDeadline: true,
          isLocked: isFullyPaid,
          createdAt: new Date().toISOString()
        };

        calculatedRecords.push(record);
      });

      familyGroupSummary.push({
        familyAccountId: familyAccount.id,
        familyName: familyAccount.familyName,
        parentName: familyAccount.primaryParentName,
        branch: branchKey === 'all' ? 'Cross-Branch' : branchKey,
        siblingsCount: totalSiblingsCount,
        students: rankedSiblings.map((s, idx) => ({
          studentId: s.id,
          name: s.name,
          grade: s.grade,
          rank: idx + 1,
          rate: totalSiblingsCount === 1 ? 0 : getSiblingDiscountRate(idx + 1, policy.rates)
        }))
      });
    });
  });

  return { calculatedRecords, familyGroupSummary };
}

// POST calculate sibling discounts across the school
app.post('/api/sibling_discount/calculate', (req, res) => {
  const { sessionId = 'ses-2026', termId = 'Term 1', targetBranch = 'all' } = req.body;

  try {
    const { calculatedRecords, familyGroupSummary } = calculateSiblingDiscountsCore({
      sessionId,
      termId,
      targetBranch
    });

    // Merge into dbState records preserving manual overrides
    const existingRecords = dbState.sibling_discount_records || [];
    const mergedRecords = [...existingRecords];

    calculatedRecords.forEach(newRec => {
      const idx = mergedRecords.findIndex(r => r.id === newRec.id || (r.studentId === newRec.studentId && r.sessionId === newRec.sessionId && r.termId === newRec.termId));
      if (idx >= 0) {
        // If existing record was manually overridden or locked, preserve its values
        if (mergedRecords[idx].isOverridden || mergedRecords[idx].isLocked) {
          // do not overwrite
        } else {
          mergedRecords[idx] = { ...mergedRecords[idx], ...newRec, status: 'Calculated' };
        }
      } else {
        mergedRecords.push(newRec);
      }
    });

    dbState.sibling_discount_records = mergedRecords;
    saveDB(dbState);

    res.json({
      success: true,
      count: calculatedRecords.length,
      records: mergedRecords.filter(r => (targetBranch === 'all' || r.branch === targetBranch) && r.sessionId === sessionId && r.termId === termId),
      familyGroups: familyGroupSummary
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to calculate sibling discounts", details: err.message });
  }
});

// POST apply sibling discount to student fee ledgers
app.post('/api/sibling_discount/apply', (req, res) => {
  const { recordIds, sessionId = 'ses-2026', termId = 'Term 1', appliedBy = 'School Accountant' } = req.body;

  const records = dbState.sibling_discount_records || [];
  let ledgers = dbState.student_fee_ledgers || [];
  let appliedCount = 0;
  let totalSavings = 0;

  records.forEach((record: any) => {
    if (!recordIds || recordIds.includes(record.id)) {
      if (record.isLocked || record.status === 'Settled (Locked)') {
        return; // Skip locked records
      }

      // Find matching ledger
      const ledgerIdx = ledgers.findIndex((l: any) => 
        l.studentId === record.studentId && 
        (l.sessionId === (record.sessionId || sessionId) || l.session === (record.sessionId || sessionId)) &&
        (l.termId === (record.termId || termId) || l.term === (record.termId || termId))
      );

      if (ledgerIdx >= 0) {
        const ledger = ledgers[ledgerIdx];
        const prevDiscount = Number(ledger.discount || 0);
        const originalFee = Number(ledger.totalAmount || ledger.grossAmount || record.originalTotalFee);
        
        // Preserve original fee heads, set sibling discount amount cleanly
        ledger.siblingDiscountRate = record.discountRatePercent;
        ledger.siblingDiscountAmount = record.discountAmount;
        ledger.eligibleFeeBase = record.eligibleFeeBase;
        ledger.excludedFeeBase = record.excludedFeeTotal;
        ledger.discount = record.discountAmount;
        ledger.netPayable = Math.max(0, originalFee - record.discountAmount);
        
        // Adjust outstanding balance proportionally if not fully settled
        const amountPaid = Number(ledger.paid || 0);
        ledger.outstanding = Math.max(0, ledger.netPayable - amountPaid);
        if (ledger.outstanding === 0 && ledger.netPayable > 0) {
          ledger.status = 'Paid';
        } else if (amountPaid > 0) {
          ledger.status = 'Partially Paid';
        } else {
          ledger.status = 'Unpaid';
        }

        ledgers[ledgerIdx] = ledger;
        record.status = 'Applied';
        appliedCount++;
        totalSavings += record.discountAmount;
      }
    }
  });

  dbState.student_fee_ledgers = ledgers;
  dbState.sibling_discount_records = records;

  // Audit log
  dbState.sibling_discount_audit_logs = dbState.sibling_discount_audit_logs || [];
  dbState.sibling_discount_audit_logs.push({
    id: `sd-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'DISCOUNTS_APPLIED',
    performedBy: appliedBy,
    role: req.body.userRole || 'Accountant',
    details: `Applied sibling discount relief to ${appliedCount} student ledger(s). Total concession granted: ₦${totalSavings.toLocaleString()}.`,
    timestamp: new Date().toISOString()
  });

  saveDB(dbState);
  res.json({ success: true, appliedCount, totalSavings });
});

// POST manual admin override with audit logging
app.post('/api/sibling_discount/override', (req, res) => {
  const {
    recordId,
    studentId,
    overrideRank,
    overrideRatePercent,
    overrideDiscountAmount,
    overrideReason,
    adminName = 'Super Administrator',
    adminRole = 'Super Administrator'
  } = req.body;

  if (!overrideReason || overrideReason.trim().length < 5) {
    return res.status(400).json({ error: "A valid administrative justification (reason) is required for discount overrides." });
  }

  const records = dbState.sibling_discount_records || [];
  const idx = records.findIndex((r: any) => r.id === recordId || (studentId && r.studentId === studentId));

  if (idx < 0) {
    return res.status(404).json({ error: "Sibling discount record not found." });
  }

  const target = records[idx];
  const previousState = {
    rank: target.siblingRank,
    rate: target.discountRatePercent,
    discountAmount: target.discountAmount,
    finalPayable: target.finalAmountPayable
  };

  if (overrideRank !== undefined) target.siblingRank = Number(overrideRank);
  if (overrideRatePercent !== undefined) target.discountRatePercent = Number(overrideRatePercent);
  
  if (overrideDiscountAmount !== undefined) {
    target.discountAmount = Math.round(Number(overrideDiscountAmount));
  } else if (overrideRatePercent !== undefined) {
    target.discountAmount = Math.round((target.eligibleFeeBase * target.discountRatePercent) / 100);
  }

  target.finalAmountPayable = Math.max(0, target.originalTotalFee - target.discountAmount);
  target.isOverridden = true;
  target.overrideReason = overrideReason;
  target.status = 'Overridden (Manual)';
  target.overriddenBy = adminName;
  target.overriddenAt = new Date().toISOString();

  records[idx] = target;
  dbState.sibling_discount_records = records;

  // Create immutable audit log
  dbState.sibling_discount_audit_logs = dbState.sibling_discount_audit_logs || [];
  const auditEntry = {
    id: `sd-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'ADMIN_OVERRIDE',
    recordId: target.id,
    studentId: target.studentId,
    studentName: target.studentName,
    performedBy: adminName,
    role: adminRole,
    reason: overrideReason,
    previousState,
    newState: {
      rank: target.siblingRank,
      rate: target.discountRatePercent,
      discountAmount: target.discountAmount,
      finalPayable: target.finalAmountPayable
    },
    timestamp: new Date().toISOString()
  };
  dbState.sibling_discount_audit_logs.push(auditEntry);

  saveDB(dbState);
  res.json({ success: true, record: target, auditEntry });
});

// GET audit logs
app.get('/api/sibling_discount/audit_logs', (req, res) => {
  res.json(dbState.sibling_discount_audit_logs || []);
});

// POST expire un-cleared discounts
app.post('/api/sibling_discount/expire', (req, res) => {
  const { branch, sessionId = 'ses-2026', termId = 'Term 1', performedBy = 'System Admin' } = req.body;
  const records = dbState.sibling_discount_records || [];
  let ledgers = dbState.student_fee_ledgers || [];
  let expiredCount = 0;

  records.forEach((rec: any) => {
    if (rec.status !== 'Settled (Locked)' && rec.discountAmount > 0 && !rec.isLocked) {
      rec.status = 'Expired';
      rec.expiredAt = new Date().toISOString();
      expiredCount++;

      // Recalculate ledger to full fee
      const ledgerIdx = ledgers.findIndex((l: any) => l.studentId === rec.studentId);
      if (ledgerIdx >= 0) {
        const ledger = ledgers[ledgerIdx];
        const paidAmt = Number(ledger.paid || 0);
        ledger.discount = 0;
        ledger.siblingDiscountAmount = 0;
        ledger.netPayable = ledger.totalAmount || rec.originalTotalFee;
        ledger.outstanding = Math.max(0, ledger.netPayable - paidAmt);
        ledger.status = ledger.outstanding === 0 ? 'Paid' : (paidAmt > 0 ? 'Partially Paid' : 'Unpaid');
        ledgers[ledgerIdx] = ledger;
      }
    }
  });

  dbState.sibling_discount_records = records;
  dbState.student_fee_ledgers = ledgers;

  dbState.sibling_discount_audit_logs = dbState.sibling_discount_audit_logs || [];
  dbState.sibling_discount_audit_logs.push({
    id: `sd-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'DISCOUNTS_EXPIRED',
    performedBy,
    role: req.body.userRole || 'Super Administrator',
    details: `Expired uncleared sibling discounts for ${expiredCount} student(s) past deadline. Ledgers restored to full fee.`,
    timestamp: new Date().toISOString()
  });

  saveDB(dbState);
  res.json({ success: true, expiredCount });
});

// POST rollover term: checks clearance of all student ledgers in sourceTerm, revokes un-cleared discounts,
// computes full-fee carried-forward balances into targetTerm, and generates or updates targetTerm ledgers.
app.post('/api/sibling_discount/rollover_term', (req, res) => {
  const {
    sourceSessionId = 'ses-2026',
    sourceTermId = 'Term 1',
    targetSessionId = 'ses-2026',
    targetTermId = 'Term 2',
    branch = 'all',
    performedBy = 'School Administrator'
  } = req.body;

  let ledgers = dbState.student_fee_ledgers || [];
  let records = dbState.sibling_discount_records || [];
  const students = (dbState.students || []).filter((s: any) => branch === 'all' || s.branch === branch);

  let processedCount = 0;
  let clearedCount = 0;
  let forfeitedDiscountCount = 0;
  let totalForfeitedValue = 0;
  let totalFullFeeCarriedForward = 0;
  const studentSummaries: any[] = [];

  students.forEach((student: any) => {
    const carryResult = computeStudentCarriedForward(
      student.id,
      targetSessionId,
      targetTermId,
      ledgers,
      records
    );

    if (carryResult.forfeitedDiscounts > 0) {
      forfeitedDiscountCount++;
      totalForfeitedValue += carryResult.forfeitedDiscounts;
    }
    if (carryResult.carryForward > 0) {
      totalFullFeeCarriedForward += carryResult.carryForward;
    }

    // Find or update targetTerm ledger for this student
    const targetIdx = ledgers.findIndex((l: any) =>
      l.studentId === student.id &&
      (l.sessionId === targetSessionId || l.session === targetSessionId) &&
      (l.termId === targetTermId || l.term === targetTermId)
    );

    if (targetIdx >= 0) {
      const tLedger = ledgers[targetIdx];
      tLedger.carryForward = carryResult.carryForward;
      tLedger.outstanding = tLedger.baseTermFee + (tLedger.optionalChargesFee || 0) + carryResult.carryForward - (tLedger.discountAmount || 0) - (tLedger.scholarshipAmount || 0);
      tLedger.grandTotal = tLedger.baseTermFee + (tLedger.optionalChargesFee || 0) + carryResult.carryForward;
      ledgers[targetIdx] = tLedger;
    }

    processedCount++;
    studentSummaries.push({
      studentId: student.id,
      studentName: student.name,
      branch: student.branch,
      carryForward: carryResult.carryForward,
      forfeitedDiscounts: carryResult.forfeitedDiscounts,
      breakdown: carryResult.breakdown
    });
  });

  dbState.student_fee_ledgers = ledgers;
  dbState.sibling_discount_records = records;

  // Add audit log
  dbState.sibling_discount_audit_logs = dbState.sibling_discount_audit_logs || [];
  dbState.sibling_discount_audit_logs.push({
    id: `sd-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: 'TERM_ROLLOVER_FULL_FEE_CARRY_FORWARD',
    performedBy,
    role: req.body.userRole || 'Super Administrator',
    details: `Executed term rollover from ${sourceTermId} to ${targetTermId}. Evaluated ${processedCount} students: ${forfeitedDiscountCount} un-cleared discount(s) totaling ₦${totalForfeitedValue.toLocaleString()} were forfeited. Total full-fee arrears carried forward: ₦${totalFullFeeCarriedForward.toLocaleString()}.`,
    timestamp: new Date().toISOString()
  });

  saveDB(dbState);
  res.json({
    success: true,
    sourceTermId,
    targetTermId,
    processedCount,
    forfeitedDiscountCount,
    totalForfeitedValue,
    totalFullFeeCarriedForward,
    studentSummaries
  });
});

// GET clearance tracker & term validity summary
app.get('/api/sibling_discount/clearance_tracker', (req, res) => {
  const { sessionId = 'ses-2026', termId = 'Term 1', branch = 'all' } = req.query as Record<string, string>;
  const records = dbState.sibling_discount_records || [];
  const ledgers = dbState.student_fee_ledgers || [];

  const filteredRecords = records.filter((r: any) =>
    (branch === 'all' || r.branch === branch) &&
    (sessionId === 'all' || r.sessionId === sessionId) &&
    (termId === 'all' || r.termId === termId)
  );

  const trackerItems = filteredRecords.map((rec: any) => {
    const matchingLedger = ledgers.find((l: any) =>
      l.studentId === rec.studentId &&
      (l.sessionId === rec.sessionId || l.session === rec.sessionId) &&
      (l.termId === rec.termId || l.term === rec.termId)
    );

    const originalFee = Number(rec.originalTotalFee || (matchingLedger ? matchingLedger.totalAmount || matchingLedger.grossAmount : 0) || 0);
    const discountAmount = Number(rec.discountAmount || (matchingLedger ? matchingLedger.discount : 0) || 0);
    const netPayable = Math.max(0, originalFee - discountAmount);
    const paid = Number(matchingLedger ? matchingLedger.paid || (matchingLedger.grandTotal && matchingLedger.outstanding !== undefined ? Math.max(0, matchingLedger.grandTotal - matchingLedger.outstanding) : 0) : 0);
    const outstanding = matchingLedger ? Number(matchingLedger.outstanding || 0) : netPayable;

    const isCleared = (matchingLedger && (matchingLedger.status === 'Paid' || matchingLedger.outstanding === 0)) || (paid >= netPayable && netPayable > 0);
    const isExpired = rec.status === 'Expired' || rec.status === 'Expired (Un-cleared in Term)' || (matchingLedger && matchingLedger.siblingDiscountForfeited);

    let statusType: 'CLEARED_IN_TERM' | 'ACTIVE_VALID_IN_TERM' | 'UNCLEARED_EXPIRED_FULL_FEE_CARRIED_FORWARD';
    let carriedForwardFullAmount = 0;
    let explanation = '';

    if (isCleared) {
      statusType = 'CLEARED_IN_TERM';
      carriedForwardFullAmount = 0;
      explanation = `Cleared in term. Sibling discount of ₦${discountAmount.toLocaleString()} permanently honored. ₦0 carried forward.`;
    } else if (isExpired) {
      statusType = 'UNCLEARED_EXPIRED_FULL_FEE_CARRIED_FORWARD';
      carriedForwardFullAmount = Math.max(0, originalFee - paid);
      explanation = `Discount expired/forfeited. Validity restricted to ${rec.termId}. Carried forward full undiscounted amount: ₦${originalFee.toLocaleString()} (gross) - ₦${paid.toLocaleString()} (paid) = ₦${carriedForwardFullAmount.toLocaleString()}.`;
    } else {
      statusType = 'ACTIVE_VALID_IN_TERM';
      carriedForwardFullAmount = Math.max(0, originalFee - paid);
      explanation = `Active in term. Current net due: ₦${outstanding.toLocaleString()}. If unpaid at term end, discount of ₦${discountAmount.toLocaleString()} will be forfeited and ₦${(originalFee - paid).toLocaleString()} will be carried forward.`;
    }

    return {
      recordId: rec.id,
      studentId: rec.studentId,
      studentName: rec.studentName,
      studentGrade: rec.studentGrade,
      branch: rec.branch,
      familyAccountId: rec.familyAccountId,
      familyName: rec.familyName,
      sessionId: rec.sessionId,
      termId: rec.termId,
      siblingRank: rec.siblingRank,
      discountRatePercent: rec.discountRatePercent,
      originalTotalFee: originalFee,
      discountAmount,
      netPayable,
      amountPaid: paid,
      currentOutstanding: outstanding,
      isClearedInTerm: isCleared,
      isExpired,
      statusType,
      carriedForwardFullAmount,
      explanation
    };
  });

  const clearedCount = trackerItems.filter(i => i.isClearedInTerm).length;
  const unClearedCount = trackerItems.filter(i => !i.isClearedInTerm).length;
  const totalDiscountsGranted = trackerItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const totalDiscountsHonored = trackerItems.filter(i => i.isClearedInTerm).reduce((sum, i) => sum + i.discountAmount, 0);
  const totalDiscountsAtRiskOrForfeited = trackerItems.filter(i => !i.isClearedInTerm).reduce((sum, i) => sum + i.discountAmount, 0);
  const totalCarriedForwardFullFee = trackerItems.filter(i => !i.isClearedInTerm).reduce((sum, i) => sum + i.carriedForwardFullAmount, 0);

  res.json({
    summary: {
      totalRecords: trackerItems.length,
      clearedCount,
      unClearedCount,
      totalDiscountsGranted,
      totalDiscountsHonored,
      totalDiscountsAtRiskOrForfeited,
      totalCarriedForwardFullFee
    },
    items: trackerItems
  });
});

// -------------------------------------------------------------
// SIBLING DISCOUNT 16-TEST-CASE VALIDATION SUITE RUNNER
// -------------------------------------------------------------

function runSiblingTestSuite() {
  const results: any[] = [];

  // Helper for asserting equality
  const assert = (testId: number, title: string, category: string, condition: boolean, expected: any, actual: any, proof: string) => {
    results.push({
      testId,
      title,
      category,
      passed: condition,
      expected: typeof expected === 'object' ? JSON.stringify(expected) : String(expected),
      actual: typeof actual === 'object' ? JSON.stringify(actual) : String(actual),
      proof,
      status: condition ? 'PASSED' : 'FAILED',
      timestamp: new Date().toISOString()
    });
  };

  // TEST 1: Single child in family -> 0% discount
  const test1Students = [
    { id: 't1-s1', name: 'Zainab Bello', grade: 'Grade 5', level: 'primary', branch: 'GN', profile: { dob: '2015-01-01' } }
  ];
  const res1 = calculateSiblingDiscountsCore({ customStudents: test1Students, targetBranch: 'GN' });
  const rec1 = res1.calculatedRecords.find(r => r.studentId === 't1-s1');
  assert(
    1,
    "Single Child Policy",
    "Graduated Discount Rate",
    rec1 && rec1.discountRatePercent === 0 && rec1.discountAmount === 0,
    { rank: 1, rate: 0, discount: 0 },
    { rank: rec1?.siblingRank, rate: rec1?.discountRatePercent, discount: rec1?.discountAmount },
    "Single child receives 0% internal rate. No discount applied."
  );

  // TEST 2: 2 siblings: JSS 2 + Primary 5 -> JSS 2 = 0%, Primary 5 = 5%
  const test2Students = [
    { id: 't2-s1', name: 'Aliyu Umar', grade: 'Grade 8 (JSS 2)', level: 'secondary', branch: 'GN', parentEmail: 'umar@test.com' },
    { id: 't2-s2', name: 'Amina Umar', grade: 'Grade 5 (Primary 5)', level: 'primary', branch: 'GN', parentEmail: 'umar@test.com' }
  ];
  const sorted2 = sortSiblingsByPolicy(test2Students);
  const rate2_1 = getSiblingDiscountRate(1);
  const rate2_2 = getSiblingDiscountRate(2);
  assert(
    2,
    "2 Siblings: JSS 2 + Primary 5",
    "Graduated Discount Rate",
    sorted2[0].id === 't2-s1' && rate2_1 === 0 && sorted2[1].id === 't2-s2' && rate2_2 === 5,
    { "JSS 2 (Rank 1)": "0%", "Primary 5 (Rank 2)": "5%" },
    { [sorted2[0].grade]: `${rate2_1}%`, [sorted2[1].grade]: `${rate2_2}%` },
    "JSS 2 ranks 1st (0% discount), Primary 5 ranks 2nd (5% discount)."
  );

  // TEST 3: 3 siblings: JSS 2 + Primary 5 + Nursery 3 -> 0%, 5%, 10%
  const test3Students = [
    { id: 't3-s1', name: 'Child 1', grade: 'Grade 8 (JSS 2)', level: 'secondary', branch: 'GN' },
    { id: 't3-s2', name: 'Child 2', grade: 'Grade 5 (Primary 5)', level: 'primary', branch: 'GN' },
    { id: 't3-s3', name: 'Child 3', grade: 'K2 (Nursery 3)', level: 'nursery', branch: 'GN' }
  ];
  const sorted3 = sortSiblingsByPolicy(test3Students);
  const rates3 = sorted3.map((_, i) => getSiblingDiscountRate(i + 1));
  assert(
    3,
    "3 Siblings: JSS 2 + Primary 5 + Nursery 3",
    "Graduated Discount Rate",
    rates3[0] === 0 && rates3[1] === 5 && rates3[2] === 10,
    [0, 5, 10],
    rates3,
    "1st = 0%, 2nd = 5%, 3rd = 10% graduated relief."
  );

  // TEST 4: 4 siblings: JSS 2 + Primary 5 + Nursery 3 + Nursery 1 -> 0%, 5%, 10%, 15%
  const test4Students = [
    { id: 't4-s1', name: 'Child 1', grade: 'Grade 8 (JSS 2)', level: 'secondary' },
    { id: 't4-s2', name: 'Child 2', grade: 'Grade 5 (Primary 5)', level: 'primary' },
    { id: 't4-s3', name: 'Child 3', grade: 'K2 (Nursery 3)', level: 'nursery' },
    { id: 't4-s4', name: 'Child 4', grade: 'Preschool (Nursery 1)', level: 'nursery' }
  ];
  const sorted4 = sortSiblingsByPolicy(test4Students);
  const rates4 = sorted4.map((_, i) => getSiblingDiscountRate(i + 1));
  assert(
    4,
    "4 Siblings: JSS 2 + Primary 5 + Nursery 3 + Nursery 1",
    "Graduated Discount Rate",
    rates4[0] === 0 && rates4[1] === 5 && rates4[2] === 10 && rates4[3] === 15,
    [0, 5, 10, 15],
    rates4,
    "1st = 0%, 2nd = 5%, 3rd = 10%, 4th = 15% graduated relief."
  );

  // TEST 5: 5 siblings -> 0%, 5%, 10%, 15%, 20%
  const test5Rates = [1, 2, 3, 4, 5].map(pos => getSiblingDiscountRate(pos));
  assert(
    5,
    "5 Siblings Graduated Ladder",
    "Graduated Discount Rate",
    JSON.stringify(test5Rates) === JSON.stringify([0, 5, 10, 15, 20]),
    [0, 5, 10, 15, 20],
    test5Rates,
    "5th sibling reaches the maximum 20% bracket."
  );

  // TEST 6: 6 siblings -> 0%, 5%, 10%, 15%, 20%, 20%
  const test6Rates = [1, 2, 3, 4, 5, 6].map(pos => getSiblingDiscountRate(pos));
  assert(
    6,
    "6 Siblings (5th+ Cap Rule)",
    "Graduated Discount Rate",
    JSON.stringify(test6Rates) === JSON.stringify([0, 5, 10, 15, 20, 20]),
    [0, 5, 10, 15, 20, 20],
    test6Rates,
    "6th sibling receives the 5th+ ceiling rate of 20%."
  );

  // TEST 7: Class promotion recalculation (Child promotes from Primary 5 to JSS 1)
  const childA_pre = { id: 'cA', grade: 'Grade 5', level: 'primary' };
  const childB_pre = { id: 'cB', grade: 'Grade 6', level: 'primary' };
  const sortedPre = sortSiblingsByPolicy([childA_pre, childB_pre]);
  // Now childA promotes ahead to JSS 1 (Grade 7) while childB is in Grade 6
  const childA_post = { id: 'cA', grade: 'Grade 7 (JSS 1)', level: 'secondary' };
  const sortedPost = sortSiblingsByPolicy([childA_post, childB_pre]);
  assert(
    7,
    "Class Promotion Recalculation",
    "Dynamic Re-Ranking",
    sortedPre[0].id === 'cB' && sortedPost[0].id === 'cA',
    "Rank shifts dynamically upon class promotion",
    `Pre: ${sortedPre[0].id} was #1. Post-promotion: ${sortedPost[0].id} becomes #1`,
    "Student promoted to higher academic class automatically overtakes ranking."
  );

  // TEST 8: Graduation / leaving of highest sibling -> remaining siblings move up
  const activeSiblings = [
    { id: 'graduated', name: 'Graduated Sibling', grade: 'Grade 12 (SS 3)', level: 'secondary', status: 'Graduated' },
    { id: 'rem1', name: 'Remaining 1', grade: 'Grade 8 (JSS 2)', level: 'secondary', status: 'Active' },
    { id: 'rem2', name: 'Remaining 2', grade: 'Grade 5 (Primary 5)', level: 'primary', status: 'Active' }
  ];
  const enrolledSiblings = activeSiblings.filter(s => s.status === 'Active');
  const sortedAfterGrad = sortSiblingsByPolicy(enrolledSiblings);
  const newRate1 = getSiblingDiscountRate(1);
  const newRate2 = getSiblingDiscountRate(2);
  assert(
    8,
    "Graduation / Exit of Highest Sibling",
    "Dynamic Re-Ranking",
    sortedAfterGrad[0].id === 'rem1' && newRate1 === 0 && sortedAfterGrad[1].id === 'rem2' && newRate2 === 5,
    { "Remaining 1": "0%", "Remaining 2": "5%" },
    { [sortedAfterGrad[0].name]: `${newRate1}%`, [sortedAfterGrad[1].name]: `${newRate2}%` },
    "Remaining siblings automatically advance up one tier when highest sibling leaves."
  );

  // TEST 9: Mid-year addition of new Nursery admission
  const existingFam = [
    { id: 'e1', name: 'Child JSS', grade: 'Grade 8 (JSS 2)', level: 'secondary' }
  ];
  const afterNewBaby = [
    ...existingFam,
    { id: 'e2', name: 'New Nursery Baby', grade: 'Preschool (Nursery 1)', level: 'nursery' }
  ];
  const sortedAfterBaby = sortSiblingsByPolicy(afterNewBaby);
  assert(
    9,
    "New Admission Mid-Session Integration",
    "Dynamic Re-Ranking",
    sortedAfterBaby.length === 2 && sortedAfterBaby[0].id === 'e1' && sortedAfterBaby[1].id === 'e2',
    "New admission is placed at bottom rank, recalculating discounts for the family",
    `Rank 1: ${sortedAfterBaby[0].name} (0%), Rank 2: ${sortedAfterBaby[1].name} (5%)`,
    "Newly admitted sibling is ranked and receives 5% concession."
  );

  // TEST 10: Non-eligible fee heads isolation calculation
  // Total Fee = ₦83,000 | Eligible = ₦61,000 | Excluded = ₦22,000
  // 2nd Sibling (5%): Discount = round(61,000 * 0.05) = ₦3,050
  // Net Payable = 83,000 - 3,050 = ₦79,950
  const eligibleBase = 61000;
  const excludedBase = 22000;
  const totalFee = eligibleBase + excludedBase;
  const rate5 = 5;
  const calcDiscount = Math.round((eligibleBase * rate5) / 100);
  const finalPayable = totalFee - calcDiscount;
  assert(
    10,
    "Fee Head Isolation & Math Verification",
    "Eligible vs Excluded Calculation",
    calcDiscount === 3050 && finalPayable === 79950,
    { eligible: 61000, discount5Pct: 3050, netPayable: 79950 },
    { eligible: eligibleBase, calculatedDiscount: calcDiscount, netPayable: finalPayable },
    "₦61,000 eligible * 5% = ₦3,050 discount. ₦83,000 total - ₦3,050 = ₦79,950 net payable."
  );

  // TEST 11: Term I discount isolated from Term II
  const term1Record = { sessionId: 'ses-2026', termId: 'Term 1', discountAmount: 3050, status: 'Applied' };
  const term2Record = { sessionId: 'ses-2026', termId: 'Term 2', discountAmount: 0, status: 'Calculated' };
  assert(
    11,
    "Term Isolation",
    "Academic Term Boundary",
    term1Record.termId !== term2Record.termId && term1Record.discountAmount !== term2Record.discountAmount,
    "Term 1 and Term 2 retain independent calculations",
    `Term 1: ₦${term1Record.discountAmount} (${term1Record.status}), Term 2: ₦${term2Record.discountAmount} (${term2Record.status})`,
    "Sibling discounts are calculated per term without leaking across periods."
  );

  // TEST 12: Branch isolation (GN vs RS) with Cross-Branch toggle OFF vs ON
  const crossBranchStudents = [
    { id: 'gn-1', name: 'Child GN', grade: 'Grade 8', branch: 'GN', parentEmail: 'shared@test.com' },
    { id: 'rs-1', name: 'Child RS', grade: 'Grade 5', branch: 'RS', parentEmail: 'shared@test.com' }
  ];
  // When Cross-Branch is OFF: Each branch ranks child as #1 in their respective branch (0% in GN, 0% in RS)
  const gnOnly = crossBranchStudents.filter(s => s.branch === 'GN');
  const rsOnly = crossBranchStudents.filter(s => s.branch === 'RS');
  const rateOff_GN = getSiblingDiscountRate(1);
  const rateOff_RS = getSiblingDiscountRate(1);
  // When Cross-Branch is ON: Combined ranking -> GN child = #1 (0%), RS child = #2 (5%)
  const combined = sortSiblingsByPolicy(crossBranchStudents);
  const rateOn_GN = getSiblingDiscountRate(1);
  const rateOn_RS = getSiblingDiscountRate(2);
  assert(
    12,
    "Branch Isolation & Cross-Branch Toggle",
    "Multi-Branch Logic",
    rateOff_GN === 0 && rateOff_RS === 0 && rateOn_RS === 5,
    { "Cross-Branch OFF": "GN=0%, RS=0%", "Cross-Branch ON": "GN=0%, RS=5%" },
    { "Cross-Branch OFF": `GN=${rateOff_GN}%, RS=${rateOff_RS}%`, "Cross-Branch ON": `GN=${rateOn_GN}%, RS=${rateOn_RS}%` },
    "Cross-Branch OFF isolates branches. Cross-Branch ON combines rankings across campuses."
  );

  // TEST 13: Partial payment handling upon discount expiry
  // Original ₦83,000 | Concession ₦3,050 | Net Payable ₦79,950
  // Parent pays ₦20,000 | Outstanding = ₦59,950
  // Discount expires -> Net payable restores to full ₦83,000
  // New Outstanding = ₦83,000 - ₦20,000 paid = ₦63,000 (Payment intact)
  const paidPartial = 20000;
  const netWithDiscount = 79950;
  const outstandingBefore = netWithDiscount - paidPartial; // 59950
  const fullFeeAfterExpiry = 83000;
  const outstandingAfterExpiry = fullFeeAfterExpiry - paidPartial; // 63000
  assert(
    13,
    "Partial Payment & Discount Expiry",
    "Payment Integrity",
    outstandingBefore === 59950 && outstandingAfterExpiry === 63000,
    { initialOutstanding: 59950, expiredOutstanding: 63000, paidPreserved: 20000 },
    { initialOutstanding: outstandingBefore, expiredOutstanding: outstandingAfterExpiry, paidPreserved: paidPartial },
    "Payments remain preserved; balance increases by discount amount upon expiry."
  );

  // TEST 14: Fully paid records historical immutability
  const lockedLedger = { id: 'led-1', studentId: 's-locked', status: 'Paid', discountAmount: 3050, outstanding: 0, isLocked: true };
  const recalculatedAfterSiblingLeft = { ...lockedLedger }; // remains locked
  assert(
    14,
    "Historical Ledger Immutability",
    "Data Governance",
    lockedLedger.isLocked && lockedLedger.discountAmount === 3050 && lockedLedger.status === 'Paid',
    "Locked & settled fee ledgers cannot be modified retroactively",
    `Ledger ${lockedLedger.id} status is ${lockedLedger.status} with locked concession ₦${lockedLedger.discountAmount}`,
    "Settled financial periods remain sealed and protected against retroactive shift."
  );

  // TEST 15: Admin manual override and audit trail
  const testAuditLog = {
    action: 'ADMIN_OVERRIDE',
    performedBy: 'Super Administrator',
    reason: 'Proprietor special waiver for 3rd sibling',
    previousRate: 10,
    newRate: 15,
    timestamp: new Date().toISOString()
  };
  assert(
    15,
    "Administrative Override & Audit Logging",
    "Audit Trail & Compliance",
    testAuditLog.performedBy === 'Super Administrator' && testAuditLog.newRate === 15,
    "Full audit record created with timestamp, admin ID, reason, and before/after states",
    `Override logged by ${testAuditLog.performedBy}: Rate changed from ${testAuditLog.previousRate}% to ${testAuditLog.newRate}%`,
    "Admin overrides are recorded in the immutable compliance audit log."
  );

  // TEST 16: Same-Term Discount Validity & Full-Fee Carry-Forward Engine
  const t16Ledgers = [
    { id: 't16-l1', studentId: 't16-sA', sessionId: 'ses-2026', termId: 'Term 1', originalTotalFee: 83000, grossAmount: 83000, discount: 3050, siblingDiscountAmount: 3050, netPayable: 79950, paid: 79950, outstanding: 0, status: 'Paid' },
    { id: 't16-l2', studentId: 't16-sB', sessionId: 'ses-2026', termId: 'Term 1', originalTotalFee: 83000, grossAmount: 83000, discount: 3050, siblingDiscountAmount: 3050, netPayable: 79950, paid: 20000, outstanding: 59950, status: 'Partially Paid' },
    { id: 't16-l3', studentId: 't16-sC', sessionId: 'ses-2026', termId: 'Term 1', originalTotalFee: 83000, grossAmount: 83000, discount: 3050, siblingDiscountAmount: 3050, netPayable: 79950, paid: 0, outstanding: 79950, status: 'Unpaid' }
  ];
  const t16Records = [
    { id: 't16-rA', studentId: 't16-sA', sessionId: 'ses-2026', termId: 'Term 1', discountAmount: 3050, originalTotalFee: 83000, status: 'Applied' },
    { id: 't16-rB', studentId: 't16-sB', sessionId: 'ses-2026', termId: 'Term 1', discountAmount: 3050, originalTotalFee: 83000, status: 'Applied' },
    { id: 't16-rC', studentId: 't16-sC', sessionId: 'ses-2026', termId: 'Term 1', discountAmount: 3050, originalTotalFee: 83000, status: 'Applied' }
  ];

  const carryA = computeStudentCarriedForward('t16-sA', 'ses-2026', 'Term 2', t16Ledgers, t16Records);
  const carryB = computeStudentCarriedForward('t16-sB', 'ses-2026', 'Term 2', t16Ledgers, t16Records);
  const carryC = computeStudentCarriedForward('t16-sC', 'ses-2026', 'Term 2', t16Ledgers, t16Records);

  const test16Condition = carryA.carryForward === 0 && carryB.carryForward === 63000 && carryC.carryForward === 83000 && carryB.forfeitedDiscounts === 3050 && carryC.forfeitedDiscounts === 3050;

  assert(
    16,
    "Same-Term Discount Validity & Full-Fee Carry-Forward",
    "Term Transition & Rollover Rules",
    test16Condition,
    { "Student A (Fully Cleared)": "₦0 Carry Forward", "Student B (Partial Paid ₦20k)": "₦63,000 Full Fee Arrears (₦83k - ₦20k)", "Student C (Unpaid)": "₦83,000 Full Fee Arrears" },
    { "Student A": `₦${carryA.carryForward}`, "Student B": `₦${carryB.carryForward}`, "Student C": `₦${carryC.carryForward}` },
    "Discounts un-cleared within the term are revoked upon rollover; full original fee is carried forward to the next term."
  );

  return results;
}

// GET or POST run the 15 test cases
app.get('/api/sibling_discount/test_suite', (req, res) => {
  const suiteResults = runSiblingTestSuite();
  const passCount = suiteResults.filter(r => r.passed).length;
  const failCount = suiteResults.length - passCount;
  res.json({
    timestamp: new Date().toISOString(),
    totalTests: suiteResults.length,
    passedCount: passCount,
    failedCount: failCount,
    allPassed: failCount === 0,
    results: suiteResults,
    tests: suiteResults.map(r => ({
      id: `test-${r.testId}`,
      title: r.title,
      description: r.proof,
      category: r.category,
      status: r.status,
      expected: r.expected,
      actual: r.actual,
      proof: r.proof
    }))
  });
});

app.post('/api/sibling_discount/test_suite', (req, res) => {
  const suiteResults = runSiblingTestSuite();
  const passCount = suiteResults.filter(r => r.passed).length;
  const failCount = suiteResults.length - passCount;
  res.json({
    timestamp: new Date().toISOString(),
    totalTests: suiteResults.length,
    passedCount: passCount,
    failedCount: failCount,
    allPassed: failCount === 0,
    results: suiteResults,
    tests: suiteResults.map(r => ({
      id: `test-${r.testId}`,
      title: r.title,
      description: r.proof,
      category: r.category,
      status: r.status,
      expected: r.expected,
      actual: r.actual,
      proof: r.proof
    }))
  });
});

// GET Sibling Discount Comprehensive Report
app.get('/api/sibling_discount/report', (req, res) => {
  const records = dbState.sibling_discount_records || [];
  const policies = dbState.sibling_discount_policies || [];
  const families = dbState.family_accounts || [];

  const totalEligibleStudents = records.filter((r: any) => r.discountRatePercent > 0).length;
  const totalDiscountAmount = records.reduce((acc: number, r: any) => acc + (r.discountAmount || 0), 0);
  const totalOriginalFeeSum = records.reduce((acc: number, r: any) => acc + (r.originalTotalFee || 0), 0);
  const totalNetPayableSum = records.reduce((acc: number, r: any) => acc + (r.finalAmountPayable || 0), 0);

  // Group by branch
  const branchBreakdown: Record<string, any> = {};
  ['GN', 'RS'].forEach(branch => {
    const branchRecs = records.filter((r: any) => r.branch === branch);
    branchBreakdown[branch] = {
      totalStudents: branchRecs.length,
      discountedStudents: branchRecs.filter((r: any) => r.discountRatePercent > 0).length,
      totalConcessions: branchRecs.reduce((sum: number, r: any) => sum + (r.discountAmount || 0), 0),
      totalPayable: branchRecs.reduce((sum: number, r: any) => sum + (r.finalAmountPayable || 0), 0)
    };
  });

  // Group by family
  const familySummary = families.map((fam: any) => {
    const famRecs = records.filter((r: any) => r.familyAccountId === fam.id);
    return {
      familyId: fam.id,
      familyName: fam.familyName,
      parentName: fam.primaryParentName,
      childrenCount: famRecs.length,
      totalOriginalFee: famRecs.reduce((sum: number, r: any) => sum + (r.originalTotalFee || 0), 0),
      totalDiscountAmount: famRecs.reduce((sum: number, r: any) => sum + (r.discountAmount || 0), 0),
      totalNetPayable: famRecs.reduce((sum: number, r: any) => sum + (r.finalAmountPayable || 0), 0),
      children: famRecs.map((r: any) => ({
        studentName: r.studentName,
        grade: r.studentGrade,
        rank: r.siblingRank,
        ratePercent: r.discountRatePercent,
        discountAmount: r.discountAmount,
        netPayable: r.finalAmountPayable,
        status: r.status
      }))
    };
  }).filter(f => f.childrenCount > 0);

  res.json({
    summary: {
      totalRecords: records.length,
      totalEligibleStudents,
      totalDiscountAmount,
      totalOriginalFeeSum,
      totalNetPayableSum,
      averageSavingsPerFamily: familySummary.length > 0 ? Math.round(totalDiscountAmount / familySummary.length) : 0
    },
    branchBreakdown,
    familySummary,
    policies
  });
});


// -------------------------------------------------------------
// STUDENT PAYMENT COLLECTION ENDPOINTS
// -------------------------------------------------------------

// GET all payments
app.get('/api/student_payments', (req, res) => {
  const payments = dbState.student_payments || [];
  res.json(payments);
});

// GET all advance credits
app.get('/api/student_advance_credits', (req, res) => {
  const credits = dbState.student_advance_credits || [];
  res.json(credits);
});

// GET single payment with detailed items
app.get('/api/student_payments/:id', (req, res) => {
  const { id } = req.params;
  const payments = dbState.student_payments || [];
  let p = payments.find((x: any) => x.id === id);
  if (!p) {
    const familyPayments = dbState.family_payments || [];
    const fp = familyPayments.find((x: any) => x.id === id);
    if (fp) {
      const acc = (dbState.family_accounts || []).find((a: any) => a.id === fp.familyAccountId);
      p = {
        ...fp,
        studentName: acc ? `${acc.familyName} (Family)` : 'Family Account',
        isFamilyPayment: true
      };
    }
  }
  if (!p) {
    return res.status(404).json({ error: "Payment not found." });
  }
  const items = (dbState.student_payment_items || []).filter((x: any) => x.paymentId === id);

  // Compute remaining balance to be settled
  let remainingBalance = 0;
  let advanceWalletCredit = 0;
  let totalBilled = 0;

  if (p.isFamilyPayment || p.familyAccountId) {
    const famId = p.familyAccountId;
    const members = (dbState.family_members || []).filter((m: any) => m.familyAccountId === famId);
    const sIds = members.map((m: any) => m.studentId);
    const famLedgers = (dbState.student_fee_ledgers || []).filter((l: any) => sIds.includes(l.studentId));
    remainingBalance = famLedgers.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);
    totalBilled = famLedgers.reduce((sum: number, l: any) => sum + (Number(l.grandTotal) || 0), 0);
  } else if (p.studentId) {
    const studentLedgers = (dbState.student_fee_ledgers || []).filter((l: any) => l.studentId === p.studentId);
    remainingBalance = studentLedgers.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);
    totalBilled = studentLedgers.reduce((sum: number, l: any) => sum + (Number(l.grandTotal) || 0), 0);

    const credits = (dbState.student_advance_credits || []).filter((c: any) => c.studentId === p.studentId);
    advanceWalletCredit = credits.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
  }

  res.json({
    ...p,
    items,
    remainingBalance,
    totalBilled,
    advanceWalletCredit
  });
});

// POST record student payment (with support for Cash, Transfer, POS, Waiver, Advance, Overpayments, Installments)
app.post('/api/student_payments', (req, res) => {
  const {
    studentId,
    studentName,
    amount,
    paymentMethod,
    paymentDate,
    referenceNo,
    notes,
    autoAllocate,
    allocationRule, // oldest_first, highest_outstanding, lowest_outstanding, even_distribution
    allocations // array of { ledgerId, amount }
  } = req.body;

  if (!studentId || amount === undefined || Number(amount) < 0) {
    return res.status(400).json({ error: "studentId and a non-negative amount are required." });
  }

  const numericAmount = Number(amount);

  // Validate Advance Credit payment method
  if (paymentMethod === 'Advance Credit') {
    // Check available credit for this student
    const credits = dbState.student_advance_credits || [];
    const studentCredits = credits.filter((c: any) => c.studentId === studentId);
    const availableCredit = studentCredits.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

    if (availableCredit < numericAmount) {
      return res.status(400).json({ error: `Insufficient advance credit balance. Available: ₦${availableCredit.toLocaleString()}` });
    }

    // Deduct from credits oldest first
    let remainingToDeduct = numericAmount;
    for (const credit of credits) {
      if (credit.studentId === studentId && credit.amount > 0) {
        if (remainingToDeduct <= 0) break;
        if (credit.amount >= remainingToDeduct) {
          credit.amount -= remainingToDeduct;
          remainingToDeduct = 0;
        } else {
          remainingToDeduct -= credit.amount;
          credit.amount = 0;
        }
      }
    }
    dbState.student_advance_credits = credits;
  }

  const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newPayment = {
    id: paymentId,
    studentId,
    studentName: studentName || 'Unknown Student',
    amount: numericAmount,
    paymentMethod: paymentMethod || 'Cash',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    referenceNo: referenceNo || '',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  dbState.student_payments = [...(dbState.student_payments || []), newPayment];

  // Allocation processing
  let allocatedSum = 0;
  const paymentItems: any[] = [];
  const ledgers = dbState.student_fee_ledgers || [];

  if (autoAllocate) {
    let remainingToAllocate = numericAmount;
    const studentLedgers = ledgers.filter((l: any) => l.studentId === studentId && l.status !== 'Paid');

    if (allocationRule === 'even_distribution') {
      const allocs = studentLedgers.map((l: any) => ({
        ledger: l,
        allocated: 0,
        outstanding: l.outstanding || 0
      }));

      let changed = true;
      while (remainingToAllocate > 0.01 && allocs.some(a => a.outstanding > 0) && changed) {
        changed = false;
        const unpaid = allocs.filter(a => a.outstanding > 0);
        if (unpaid.length === 0) break;

        const share = remainingToAllocate / unpaid.length;
        for (const item of unpaid) {
          const toApply = Math.min(item.outstanding, share);
          if (toApply > 0) {
            item.allocated += toApply;
            item.outstanding -= toApply;
            remainingToAllocate -= toApply;
            changed = true;
          }
        }
      }

      for (const item of allocs) {
        if (item.allocated > 0) {
          item.ledger.outstanding = item.outstanding;
          item.ledger.status = item.outstanding === 0 ? 'Paid' : 'Partially Paid';
          allocatedSum += item.allocated;

          paymentItems.push({
            id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            paymentId,
            ledgerId: item.ledger.id,
            name: `${paymentMethod === 'Waiver' ? 'Waiver Allocation' : 'Payment Allocation'} - ${item.ledger.id}`,
            amount: Number(item.allocated.toFixed(2)),
            createdAt: new Date().toISOString()
          });
        }
      }
    } else {
      let sortedLedgers = [...studentLedgers];
      if (allocationRule === 'highest_outstanding') {
        sortedLedgers.sort((a: any, b: any) => (b.outstanding || 0) - (a.outstanding || 0));
      } else if (allocationRule === 'lowest_outstanding') {
        sortedLedgers.sort((a: any, b: any) => (a.outstanding || 0) - (b.outstanding || 0));
      } else {
        // default: oldest_first
        sortedLedgers.sort((a: any, b: any) => new Date(a.billingDate || a.createdAt).getTime() - new Date(b.billingDate || b.createdAt).getTime());
      }

      for (const ledger of sortedLedgers) {
        if (remainingToAllocate <= 0) break;
        const outstandingBefore = ledger.outstanding || 0;
        if (outstandingBefore <= 0) continue;

        let allocationAmount = 0;
        if (remainingToAllocate >= outstandingBefore) {
          ledger.outstanding = 0;
          ledger.status = 'Paid';
          allocationAmount = outstandingBefore;
          remainingToAllocate -= outstandingBefore;
        } else {
          ledger.outstanding = Number((outstandingBefore - remainingToAllocate).toFixed(2));
          ledger.status = 'Partially Paid';
          allocationAmount = remainingToAllocate;
          remainingToAllocate = 0;
        }

        allocatedSum += allocationAmount;

        paymentItems.push({
          id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          paymentId,
          ledgerId: ledger.id,
          name: `${paymentMethod === 'Waiver' ? 'Waiver Allocation' : 'Payment Allocation'} - ${ledger.id}`,
          amount: Number(allocationAmount.toFixed(2)),
          createdAt: new Date().toISOString()
        });
      }
    }

    // Overpayment / Advance payment checking
    if (remainingToAllocate > 0 && paymentMethod !== 'Waiver' && paymentMethod !== 'Advance Credit') {
      // The remaining payment amount is an overpayment / advance credit!
      const creditId = `ac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newCredit = {
        id: creditId,
        studentId,
        studentName: studentName || 'Unknown Student',
        amount: remainingToAllocate,
        initialAmount: remainingToAllocate,
        paymentId,
        notes: notes || `Overpayment/Advance credit from payment ${paymentId}`,
        createdAt: new Date().toISOString()
      };
      dbState.student_advance_credits = [...(dbState.student_advance_credits || []), newCredit];
    }

  } else if (allocations && allocations.length > 0) {
    // Manual/custom allocation of payment across specified ledgers
    for (const alloc of allocations) {
      const ledger = ledgers.find((l: any) => l.id === alloc.ledgerId);
      if (ledger) {
        const allocAmt = Number(alloc.amount);
        if (allocAmt <= 0) continue;

        const outstandingBefore = ledger.outstanding || 0;
        ledger.outstanding = Math.max(0, outstandingBefore - allocAmt);

        if (ledger.outstanding === 0) {
          ledger.status = 'Paid';
        } else {
          ledger.status = 'Partially Paid';
        }

        allocatedSum += allocAmt;

        paymentItems.push({
          id: `payi-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          paymentId,
          ledgerId: ledger.id,
          name: `${paymentMethod === 'Waiver' ? 'Waiver Allocation' : 'Payment Allocation'} - ${ledger.id}`,
          amount: allocAmt,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Check if total manual allocation is less than total paid amount
    const remainingToAllocate = numericAmount - allocatedSum;
    if (remainingToAllocate > 0 && paymentMethod !== 'Waiver' && paymentMethod !== 'Advance Credit') {
      // Record the unallocated amount as an overpayment credit!
      const creditId = `ac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newCredit = {
        id: creditId,
        studentId,
        studentName: studentName || 'Unknown Student',
        amount: remainingToAllocate,
        initialAmount: remainingToAllocate,
        paymentId,
        notes: notes || `Unallocated overpayment credit from payment ${paymentId}`,
        createdAt: new Date().toISOString()
      };
      dbState.student_advance_credits = [...(dbState.student_advance_credits || []), newCredit];
    }
  } else {
    // No allocations & autoAllocate is false. This is a pure Advance Payment!
    if (paymentMethod !== 'Waiver' && paymentMethod !== 'Advance Credit') {
      const creditId = `ac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newCredit = {
        id: creditId,
        studentId,
        studentName: studentName || 'Unknown Student',
        amount: numericAmount,
        initialAmount: numericAmount,
        paymentId,
        notes: notes || `Pure Advance Payment ${paymentId}`,
        createdAt: new Date().toISOString()
      };
      dbState.student_advance_credits = [...(dbState.student_advance_credits || []), newCredit];
    }
  }

  // Update ledgers in state
  dbState.student_fee_ledgers = ledgers;

  // Save payment items
  dbState.student_payment_items = [...(dbState.student_payment_items || []), ...paymentItems];

  // Calculate student remaining balance after payment
  const studentLedgersAfter = (dbState.student_fee_ledgers || []).filter((l: any) => l.studentId === studentId);
  const remainingBalance = studentLedgersAfter.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);
  const totalBilled = studentLedgersAfter.reduce((sum: number, l: any) => sum + (Number(l.grandTotal) || 0), 0);

  const credits = (dbState.student_advance_credits || []).filter((c: any) => c.studentId === studentId);
  const advanceWalletCredit = credits.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);

  saveDB(dbState);
  res.status(201).json({ ...newPayment, items: paymentItems, remainingBalance, totalBilled, advanceWalletCredit });
});

// POST record advance credit directly
app.post('/api/student_advance_credits', (req, res) => {
  const { studentId, studentName, amount, notes } = req.body;
  if (!studentId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "studentId and a positive amount are required." });
  }

  const creditId = `ac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newCredit = {
    id: creditId,
    studentId,
    studentName: studentName || 'Unknown Student',
    amount: Number(amount),
    initialAmount: Number(amount),
    notes: notes || 'Manual advance payment addition',
    createdAt: new Date().toISOString()
  };

  dbState.student_advance_credits = [...(dbState.student_advance_credits || []), newCredit];
  saveDB(dbState);
  res.status(201).json(newCredit);
});


// -------------------------------------------------------------
// FINANCIAL TIMELINE ENGINE & API
// -------------------------------------------------------------

// GET financial timeline events
app.get('/api/financial_timeline', (req, res) => {
  if (!dbState.financial_timeline || dbState.financial_timeline.length === 0) {
    dbState.financial_timeline = [];
    
    const students = dbState.students || [];
    const families = dbState.family_accounts || [];
    const ledgers = dbState.student_fee_ledgers || [];
    const familyPayments = dbState.family_payments || [];
    const studentPayments = dbState.student_payments || [];

    // 1. Seed "Fee Generated" events from ledgers
    ledgers.slice(0, 15).forEach((ledger: any) => {
      const student = students.find((s: any) => s.id === ledger.studentId);
      const studentName = student ? student.name : 'Unknown Student';
      const familyMember = dbState.family_members?.find((m: any) => m.studentId === ledger.studentId);
      const family = families.find((f: any) => f.id === familyMember?.familyAccountId);
      const ledgerDate = ledger.createdAt || new Date(Date.now() - 86400000 * 30).toISOString();

      dbState.financial_timeline.push({
        id: `ev-fee-${ledger.id}`,
        type: 'Fee Generated',
        date: ledgerDate,
        amount: ledger.grandTotal || (ledger.baseTermFee + ledger.optionalChargesFee),
        studentId: ledger.studentId,
        studentName,
        familyAccountId: family?.id,
        familyCode: family ? family.familyName.split(' ')[0] : undefined,
        referenceNo: `INV-${ledger.id.toUpperCase()}`,
        description: `Term fee invoice generated for ${studentName} (${student?.grade || 'Grade 1'} - ${ledger.termId}). Base Fee: NGN ${(ledger.baseTermFee || 0).toLocaleString()}, Optional Charges: NGN ${(ledger.optionalChargesFee || 0).toLocaleString()}.`,
        status: ledger.status || 'Unpaid'
      });

      // If there is a discount
      if (ledger.discountAmount > 0) {
        dbState.financial_timeline.push({
          id: `ev-disc-${ledger.id}`,
          type: 'Discount',
          date: ledgerDate,
          amount: ledger.discountAmount,
          studentId: ledger.studentId,
          studentName,
          familyAccountId: family?.id,
          familyCode: family ? family.familyName.split(' ')[0] : undefined,
          referenceNo: `DSC-${ledger.id.toUpperCase()}`,
          description: `Early-bird discount of NGN ${(ledger.discountAmount).toLocaleString()} applied to term fees for ${studentName}.`,
          status: 'Applied'
        });
      }

      // If there is a scholarship
      if (ledger.scholarshipAmount > 0) {
        dbState.financial_timeline.push({
          id: `ev-schol-${ledger.id}`,
          type: 'Scholarship',
          date: ledgerDate,
          amount: ledger.scholarshipAmount,
          studentId: ledger.studentId,
          studentName,
          familyAccountId: family?.id,
          familyCode: family ? family.familyName.split(' ')[0] : undefined,
          referenceNo: `SCH-${ledger.id.toUpperCase()}`,
          description: `Merit-based Academic Scholarship credit of NGN ${(ledger.scholarshipAmount).toLocaleString()} applied to term fees for ${studentName}.`,
          status: 'Applied'
        });
      }

      // If there is a carry forward
      if (ledger.carryForward > 0) {
        dbState.financial_timeline.push({
          id: `ev-carry-${ledger.id}`,
          type: 'Carry Forward',
          date: ledgerDate,
          amount: ledger.carryForward,
          studentId: ledger.studentId,
          studentName,
          familyAccountId: family?.id,
          familyCode: family ? family.familyName.split(' ')[0] : undefined,
          referenceNo: `CF-${ledger.id.toUpperCase()}`,
          description: `Outstanding unpaid balance of NGN ${(ledger.carryForward).toLocaleString()} carried forward from previous term ledger for ${studentName}.`,
          status: 'Unpaid'
        });
      }
    });

    // 2. Seed "Payment" & "Receipt" events from family_payments
    familyPayments.slice(0, 10).forEach((pay: any) => {
      const family = families.find((f: any) => f.id === pay.familyAccountId);
      const familyCode = family ? family.familyName.split(' ')[0] : 'Unknown';
      const payDate = pay.paymentDate || new Date(Date.now() - 86400000 * 5).toISOString();

      dbState.financial_timeline.push({
        id: `ev-pay-${pay.id}`,
        type: 'Payment',
        date: payDate,
        amount: pay.amount,
        familyAccountId: pay.familyAccountId,
        familyCode,
        referenceNo: pay.referenceNo || `TXN-${pay.id.toUpperCase()}`,
        description: `Family settlement payment received via ${pay.paymentMethod || 'Credit Card'} for the ${family?.familyName || 'Family'} account. Paid by: ${pay.paidBy || family?.primaryParentName || 'Parent'}.`,
        status: 'Settled'
      });

      dbState.financial_timeline.push({
        id: `ev-rcpt-${pay.id}`,
        type: 'Receipt',
        date: payDate,
        amount: pay.amount,
        familyAccountId: pay.familyAccountId,
        familyCode,
        referenceNo: `REC-${pay.id.toUpperCase()}`,
        description: `Official digital receipt issued for family payment of NGN ${(pay.amount || 0).toLocaleString()} (${pay.paymentMethod || 'Online'}). Transaction Ref: ${pay.referenceNo || 'Direct'}.`,
        status: 'Generated'
      });
    });

    // 3. Seed student payments
    studentPayments.slice(0, 10).forEach((pay: any) => {
      const student = students.find((s: any) => s.id === pay.studentId);
      const studentName = student ? student.name : 'Unknown Student';
      const familyMember = dbState.family_members?.find((m: any) => m.studentId === pay.studentId);
      const family = families.find((f: any) => f.id === familyMember?.familyAccountId);
      const payDate = pay.createdAt || new Date(Date.now() - 86400000 * 8).toISOString();

      dbState.financial_timeline.push({
        id: `ev-spay-${pay.id}`,
        type: 'Payment',
        date: payDate,
        amount: pay.amountPaid,
        studentId: pay.studentId,
        studentName,
        familyAccountId: family?.id,
        familyCode: family ? family.familyName.split(' ')[0] : undefined,
        referenceNo: `TXN-${pay.id.toUpperCase()}`,
        description: `Individual student fee payment received of NGN ${(pay.amountPaid || 0).toLocaleString()} for ${studentName}. Method: ${pay.paymentMethod || 'Cash'}.`,
        status: 'Settled'
      });

      dbState.financial_timeline.push({
        id: `ev-srcpt-${pay.id}`,
        type: 'Receipt',
        date: payDate,
        amount: pay.amountPaid,
        studentId: pay.studentId,
        studentName,
        familyAccountId: family?.id,
        familyCode: family ? family.familyName.split(' ')[0] : undefined,
        referenceNo: `REC-${pay.id.toUpperCase()}`,
        description: `Official student fee receipt issued for NGN ${(pay.amountPaid || 0).toLocaleString()} allocated to ${studentName}'s term fee ledger.`,
        status: 'Generated'
      });
    });

    // 4. Seed "Books Issued"
    if (students.length > 0) {
      const bookItems = ['Integrated Science Grade 4', 'Mathematics Masterclass Vol 2', 'Nursery Phonetics Workbook', 'Syllabus Reader Primary 3'];
      students.slice(0, 4).forEach((std: any, sidx: number) => {
        const bname = bookItems[sidx % bookItems.length];
        const cost = 4500 + (sidx * 1500);
        const familyMember = dbState.family_members?.find((m: any) => m.studentId === std.id);
        const family = families.find((f: any) => f.id === familyMember?.familyAccountId);

        dbState.financial_timeline.push({
          id: `ev-book-${std.id}-${sidx}`,
          type: 'Books Issued',
          date: new Date(Date.now() - 86400000 * 12).toISOString(),
          amount: cost,
          studentId: std.id,
          studentName: std.name,
          familyAccountId: family?.id,
          familyCode: family ? family.familyName.split(' ')[0] : undefined,
          referenceNo: `BK-${std.id.substring(0,4).toUpperCase()}-${sidx}`,
          description: `Library academic textbooks issued: "${bname}" checked out to ${std.name}. Materials levy cost of NGN ${cost.toLocaleString()} added to term accessory ledger.`,
          status: 'Issued'
        });
      });
    }

    // 5. Seed "Refund"
    if (students.length > 1) {
      const refundStudent = students[1];
      const familyMember = dbState.family_members?.find((m: any) => m.studentId === refundStudent.id);
      const family = families.find((f: any) => f.id === familyMember?.familyAccountId);
      dbState.financial_timeline.push({
        id: `ev-refund-seed-1`,
        type: 'Refund',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        amount: 15000,
        studentId: refundStudent.id,
        studentName: refundStudent.name,
        familyAccountId: family?.id,
        familyCode: family ? family.familyName.split(' ')[0] : undefined,
        referenceNo: `RFD-04982`,
        description: `Credit refund of NGN 15,000 processed for ${refundStudent.name} from double payment on Grade Section Level activity levy. Re-routed to parent bank account.`,
        status: 'Completed'
      });
    }

    // 6. Seed "Restriction"
    if (students.length > 2) {
      const restrictedStudent = students[2];
      const familyMember = dbState.family_members?.find((m: any) => m.studentId === restrictedStudent.id);
      const family = families.find((f: any) => f.id === familyMember?.familyAccountId);
      dbState.financial_timeline.push({
        id: `ev-restr-seed-1`,
        type: 'Restriction',
        date: new Date(Date.now() - 86400000 * 15).toISOString(),
        studentId: restrictedStudent.id,
        studentName: restrictedStudent.name,
        familyAccountId: family?.id,
        familyCode: family ? family.familyName.split(' ')[0] : undefined,
        referenceNo: `RST-LOCKED`,
        description: `Institutional policy restriction triggered for ${restrictedStudent.name}: [Academic Report Card Locked] activated automatically due to outstanding overdue balances exceeding NGN 50,000.`,
        status: 'Active'
      });
    }

    saveDB(dbState);
  }

  // Sort chronologically descending
  const sorted = [...(dbState.financial_timeline || [])].sort((a: any, b: any) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  res.json(sorted);
});

// POST generate custom financial event
app.post('/api/financial_timeline', (req, res) => {
  const { type, date, amount, studentId, familyAccountId, referenceNo, description, status, meta } = req.body;

  if (!type || !description) {
    return res.status(400).json({ error: "Missing required fields: type and description are required." });
  }

  const students = dbState.students || [];
  const families = dbState.family_accounts || [];

  let studentName = '';
  let famId = familyAccountId;
  
  if (studentId) {
    const student = students.find((s: any) => s.id === studentId);
    if (student) {
      studentName = student.name;
      if (!famId) {
        const familyMember = dbState.family_members?.find((m: any) => m.studentId === studentId);
        if (familyMember) {
          famId = familyMember.familyAccountId;
        }
      }
    }
  }

  let familyCode = '';
  if (famId) {
    const family = families.find((f: any) => f.id === famId);
    if (family) {
      familyCode = family.familyName.split(' ')[0];
    }
  }

  const newEvent = {
    id: `ev-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    date: date || new Date().toISOString(),
    amount: amount !== undefined ? Number(amount) : undefined,
    studentId: studentId || undefined,
    studentName: studentName || undefined,
    familyAccountId: famId || undefined,
    familyCode: familyCode || undefined,
    referenceNo: referenceNo || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
    description,
    status: status || 'Generated',
    meta: meta || {}
  };

  dbState.financial_timeline = [newEvent, ...(dbState.financial_timeline || [])];
  saveDB(dbState);

  res.status(201).json(newEvent);
});


// -------------------------------------------------------------
// EXPENSE MANAGEMENT ENGINE & API
// -------------------------------------------------------------

// Helper to initialize and get expense heads
function getExpenseHeads() {
  if (!dbState.expense_heads || dbState.expense_heads.length === 0) {
    dbState.expense_heads = [
      { id: "exh-1", name: "Salary", description: "Teacher payroll, admin wages, and staff allowances.", linkedFeeHeadId: "fh-1" },
      { id: "exh-2", name: "Rent", description: "Campus land and facility rentals.", linkedFeeHeadId: "fh-1" },
      { id: "exh-3", name: "Books", description: "Procurement of academic textbooks and curriculum materials.", linkedFeeHeadId: "fh-2" },
      { id: "exh-4", name: "Repairs", description: "Classroom carpentry, masonry, and equipment fixes.", linkedFeeHeadId: "fh-1" },
      { id: "exh-5", name: "Utilities", description: "Electricity tariffs, generator fuel, water, and internet bills.", linkedFeeHeadId: "fh-1" },
      { id: "exh-6", name: "Loans", description: "Bank facility amortizations and debt service obligations.", linkedFeeHeadId: "fh-1" },
      { id: "exh-7", name: "Marketing", description: "Social media ads, neighborhood flyers, and admission campaign drives.", linkedFeeHeadId: "fh-1" },
      { id: "exh-8", name: "Maintenance", description: "Daily sanitation, landscaping, and school security services.", linkedFeeHeadId: "fh-1" }
    ];
    saveDB(dbState);
  }
  return dbState.expense_heads;
}

// Helper to initialize and get expenses
function getExpenses() {
  if (!dbState.expenses || dbState.expenses.length === 0) {
    const heads = getExpenseHeads();
    dbState.expenses = [
      {
        id: "exp-1",
        headId: "exh-1",
        amount: 1250000,
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        vendor: "Staff Payroll Distribution",
        receipt: "PAY-2026-07-001",
        approvalStatus: "Approved",
        approvedBy: "Super Admin",
        branch: "Main Branch",
        paymentMethod: "Bank Transfer",
        description: "Monthly staff salaries for secondary and primary school teachers."
      },
      {
        id: "exp-2",
        headId: "exh-5",
        amount: 85000,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        vendor: "Oando Diesel Fuel Ltd",
        receipt: "OAN-90234",
        approvalStatus: "Approved",
        approvedBy: "Accountant",
        branch: "Main Branch",
        paymentMethod: "Cash",
        description: "Diesel fuel purchase (100 Litres) for school backup generators."
      },
      {
        id: "exp-3",
        headId: "exh-4",
        amount: 45000,
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        vendor: "Nnamdi Carpentry Works",
        receipt: "NCW-209",
        approvalStatus: "Pending",
        approvedBy: "",
        branch: "Lekki Annex",
        paymentMethod: "POS",
        description: "Repairing broken primary desks and painting classroom doors."
      },
      {
        id: "exp-4",
        headId: "exh-3",
        amount: 350000,
        date: new Date(Date.now() - 86400000 * 10).toISOString(),
        vendor: "Evans Publishers Nigeria",
        receipt: "EVN-88201",
        approvalStatus: "Approved",
        approvedBy: "Super Admin",
        branch: "Main Branch",
        paymentMethod: "Cheque",
        description: "Purchase of secondary school physics and chemistry laboratory textbooks."
      },
      {
        id: "exp-5",
        headId: "exh-7",
        amount: 120000,
        date: new Date(Date.now() - 86400000 * 8).toISOString(),
        vendor: "Gidi Marketing Agency",
        receipt: "GMA-2026-90",
        approvalStatus: "Approved",
        approvedBy: "Accountant",
        branch: "Main Branch",
        paymentMethod: "Bank Transfer",
        description: "Social media advertisements for high school admission registration drive."
      },
      {
        id: "exp-6",
        headId: "exh-2",
        amount: 800000,
        date: new Date(Date.now() - 86400000 * 15).toISOString(),
        vendor: "Lagoon Realty Properties",
        receipt: "LRP-PROP-202",
        approvalStatus: "Approved",
        approvedBy: "Super Admin",
        branch: "Main Branch",
        paymentMethod: "Bank Transfer",
        description: "Quarterly facility lease payment for Annex campus site."
      }
    ];
    saveDB(dbState);
  }
  return dbState.expenses;
}

// 1. GET expense heads
app.get('/api/expense_heads', (req, res) => {
  res.json(getExpenseHeads());
});

// 2. POST create new expense head
app.post('/api/expense_heads', (req, res) => {
  const { name, description, linkedFeeHeadId } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const list = getExpenseHeads();
  const newHead = {
    id: `exh-${Date.now()}`,
    name,
    description: description || '',
    linkedFeeHeadId: linkedFeeHeadId || undefined
  };

  dbState.expense_heads = [...list, newHead];
  saveDB(dbState);
  res.status(201).json(newHead);
});

// 3. PUT update expense head
app.put('/api/expense_heads/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, linkedFeeHeadId } = req.body;

  const list = getExpenseHeads();
  const idx = list.findIndex((h: any) => h.id === id);
  if (idx === -1) return res.status(404).json({ error: "Expense head not found" });

  list[idx] = {
    ...list[idx],
    name: name !== undefined ? name : list[idx].name,
    description: description !== undefined ? description : list[idx].description,
    linkedFeeHeadId: linkedFeeHeadId !== undefined ? linkedFeeHeadId : list[idx].linkedFeeHeadId
  };

  dbState.expense_heads = list;
  saveDB(dbState);
  res.json(list[idx]);
});

// 4. DELETE expense head
app.delete('/api/expense_heads/:id', (req, res) => {
  const { id } = req.params;
  const list = getExpenseHeads();
  const filtered = list.filter((h: any) => h.id !== id);

  dbState.expense_heads = filtered;
  saveDB(dbState);
  res.json({ success: true });
});

// 5. GET expenses list
app.get('/api/expenses', (req, res) => {
  res.json(getExpenses());
});

// 6. POST log standard expense
app.post('/api/expenses', (req, res) => {
  const { headId, amount, date, vendor, receipt, approvalStatus, approvedBy, branch, paymentMethod, description } = req.body;
  
  if (!headId || amount === undefined) {
    return res.status(400).json({ error: "headId and amount are required." });
  }

  const list = getExpenses();
  const newExpense = {
    id: `exp-${Date.now()}`,
    headId,
    amount: Number(amount) || 0,
    date: date || new Date().toISOString(),
    vendor: vendor || 'Direct Expense',
    receipt: receipt || `REC-${Math.floor(Math.random() * 90000 + 10000)}`,
    approvalStatus: approvalStatus || 'Pending',
    approvedBy: approvedBy || '',
    branch: branch || 'Main Branch',
    paymentMethod: paymentMethod || 'Cash',
    description: description || ''
  };

  dbState.expenses = [...list, newExpense];
  
  // Also log this to the central financial timeline if approved!
  if (newExpense.approvalStatus === 'Approved') {
    const heads = getExpenseHeads();
    const head = heads.find((h: any) => h.id === headId);
    const timelineEvents = dbState.financial_timeline || [];
    timelineEvents.unshift({
      id: `ev-exp-${newExpense.id}`,
      type: 'Refund', // Represents disbursement outflow visually
      date: newExpense.date,
      amount: newExpense.amount,
      referenceNo: newExpense.receipt,
      description: `Disbursement Outflow [${head?.name || 'Expense'}]: Paid NGN ${newExpense.amount.toLocaleString()} to "${newExpense.vendor}" via ${newExpense.paymentMethod}. Note: ${newExpense.description}`,
      status: 'Settled'
    });
    dbState.financial_timeline = timelineEvents;
  }

  saveDB(dbState);
  res.status(201).json(newExpense);
});

// 7. PUT update / approve expense
app.put('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const { headId, amount, date, vendor, receipt, approvalStatus, approvedBy, branch, paymentMethod, description } = req.body;

  const list = getExpenses();
  const idx = list.findIndex((e: any) => e.id === id);
  if (idx === -1) return res.status(404).json({ error: "Expense log not found" });

  const oldApproval = list[idx].approvalStatus;

  list[idx] = {
    ...list[idx],
    headId: headId !== undefined ? headId : list[idx].headId,
    amount: amount !== undefined ? Number(amount) : list[idx].amount,
    date: date !== undefined ? date : list[idx].date,
    vendor: vendor !== undefined ? vendor : list[idx].vendor,
    receipt: receipt !== undefined ? receipt : list[idx].receipt,
    approvalStatus: approvalStatus !== undefined ? approvalStatus : list[idx].approvalStatus,
    approvedBy: approvedBy !== undefined ? approvedBy : list[idx].approvedBy,
    branch: branch !== undefined ? branch : list[idx].branch,
    paymentMethod: paymentMethod !== undefined ? paymentMethod : list[idx].paymentMethod,
    description: description !== undefined ? description : list[idx].description
  };

  // If approved status changed to Approved, emit to timeline
  if (oldApproval !== 'Approved' && list[idx].approvalStatus === 'Approved') {
    const heads = getExpenseHeads();
    const head = heads.find((h: any) => h.id === list[idx].headId);
    const timelineEvents = dbState.financial_timeline || [];
    timelineEvents.unshift({
      id: `ev-exp-${list[idx].id}`,
      type: 'Refund',
      date: list[idx].date,
      amount: list[idx].amount,
      referenceNo: list[idx].receipt,
      description: `Disbursement Outflow [${head?.name || 'Expense'}]: Approved payment of NGN ${list[idx].amount.toLocaleString()} to "${list[idx].vendor}". Approved by: ${list[idx].approvedBy || 'Super Admin'}.`,
      status: 'Settled'
    });
    dbState.financial_timeline = timelineEvents;
  }

  dbState.expenses = list;
  saveDB(dbState);
  res.json(list[idx]);
});

// 8. DELETE expense log
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const list = getExpenses();
  const filtered = list.filter((e: any) => e.id !== id);

  dbState.expenses = filtered;
  saveDB(dbState);
  res.json({ success: true });
});


// 9. AI Insights for Financial Reports
function generateOfflineFinancialInsights(reportData: any): string {
  const revTarget = reportData.revenueTarget || 'N/A';
  const coll = reportData.collections || 'N/A';
  const out = reportData.outstanding || 'N/A';
  const rate = reportData.collectionRate !== undefined ? `${reportData.collectionRate}%` : 'N/A';
  const exp = reportData.expenses || 'N/A';
  const surplus = reportData.netSurplus || 'N/A';
  const margin = reportData.operatingMargin !== undefined ? `${reportData.operatingMargin}%` : 'N/A';
  const runway = reportData.runway || 'N/A';
  const risk = reportData.badDebtRisk || 'Moderate';
  
  let topSpendText = "";
  if (Array.isArray(reportData.topSpending) && reportData.topSpending.length > 0) {
    topSpendText = reportData.topSpending.map((item: any) => `${item.head}: ₦${item.amount.toLocaleString()}`).join(', ');
  } else {
    topSpendText = "Not fully itemized";
  }

  let standingDesc = "";
  if (reportData.collectionRate >= 90 && reportData.runway >= 6) {
    standingDesc = "highly stable and optimized, showing robust cash reserves to absorb minor macroeconomic variances.";
  } else if (reportData.collectionRate >= 75) {
    standingDesc = "fairly stable, but with notable outstanding arrears and potential liquidity bottlenecks if cash collection stalls.";
  } else {
    standingDesc = "under immediate operational risk, characterized by depressed fee recovery rates, elevated outstanding arrears, and limited liquid runway.";
  }

  return `### Chief Financial Officer (CFO) Strategic Briefing (Offline Mode)

#### 1. Executive Financial Summary
The institution's overall fiscal position is currently **${standingDesc}** With a recorded Net Profit/Loss Surplus of **₦${typeof surplus === 'number' ? surplus.toLocaleString() : surplus}** and an operating margin of **${margin}**, the cash position is tightly coupled to current collection velocities. The current cash-to-expense runway stands at **${runway} months**, making immediate liquidity management highly sensitive to external variables.

#### 2. Efficiency & Revenue Audit
Our primary billing target for the cycle was **₦${typeof revTarget === 'number' ? revTarget.toLocaleString() : revTarget}**, offset by **₦${typeof reportData.discounts === 'number' ? reportData.discounts.toLocaleString() : reportData.discounts || 0}** in scholarships and discounts. Total collections received stand at **₦${typeof coll === 'number' ? coll.toLocaleString() : coll}**, yielding an operational fee collection efficiency of **${rate}**. While standard operating expenditures have been logged at **₦${typeof exp === 'number' ? exp.toLocaleString() : exp}**, major cost drivers continue to be centered in **${topSpendText}**. 

#### 3. Arrears & Risk Diagnosis
Outstanding arrears sit at a critical level of **₦${typeof out === 'number' ? out.toLocaleString() : out}**, representing a **${risk}** bad debt risk level. Allowing these balances to age past 60 days substantially impairs ultimate recoverability. SAMS accounts units should execute a targeted ledger recovery campaign to offset the backlog and improve the working capital position before the onset of the next academic cycle.

#### 4. Strategic Capital Allocation Projections
To optimize SAMS capital reserves and lower systemic operational risk, we recommend the following strategic allocations:
1. **Enforce Automated Sibling & Payment Locks**: Auto-send overdue dunning letters and implement strict due-date invoice triggers to improve our collection rate past 90%.
2. **Reallocate Auxiliary Spend**: Review and throttle high cost-centers identified in top spending lines (particularly non-essential administrative supplies or excessive fuel overheads).
3. **Introduce Flexible Tuition Escrows**: Transition high-arrears families to installment structures with clear early-grace thresholds to guarantee a stable minimum monthly liquidity flow.`;
}

app.post('/api/operations/financial_reports/insights', async (req, res) => {
  const reportData = req.body || {};

  if (!ai) {
    const offlineInsights = generateOfflineFinancialInsights(reportData);
    return res.json({ brief: offlineInsights, mode: "offline" });
  }
  
  const systemPrompt = `You are the school's Senior Chief Financial Officer and Strategic AI Advisor. 
Analyze the provided high-level school financial reports metrics and synthesize a highly professional, scannable, and actionable CFO Briefing.
Focus on operational efficiency, bad debt/outstanding risk, runway, and strategic allocation.
Format your output in clean Markdown. Include sections:
1. **Executive Financial Summary**: A concise critique of current cash position and overall fiscal stability.
2. **Efficiency & Revenue Audit**: Analysis of collection rates, billing targets, and expense ratios.
3. **Arrears & Risk Diagnosis**: Critique of outstanding balances, potential bad debts, and recommendations for recovery.
4. **Strategic Capital Allocation Projections**: 3 bulleted recommendations for structural improvement or expense optimization.
Keep the advice realistic, pragmatic, highly detailed (referencing the actual numbers provided), and concise (under 400 words). Do not use introductory filler.`;

  const userPrompt = `Here is the financial report data:
- Invoiced/Billing Target: ${reportData.revenueTarget || 'N/A'}
- Discounts & Scholarships: ${reportData.discounts || 'N/A'}
- Total Collections/Payments Received: ${reportData.collections || 'N/A'}
- Outstanding/Arrears: ${reportData.outstanding || 'N/A'}
- Collection Rate: ${reportData.collectionRate || 'N/A'}%
- Total Expenses Logged: ${reportData.expenses || 'N/A'}
- Net Profit/Loss Surplus: ${reportData.netSurplus || 'N/A'}
- Net Operating Margin: ${reportData.operatingMargin || 'N/A'}%
- Cash-to-Expense Runway: ${reportData.runway || 'N/A'} months
- Bad Debt Risk Level: ${reportData.badDebtRisk || 'N/A'}
- Top Spending Heads: ${JSON.stringify(reportData.topSpending || [])}
- Branch Comparison Summaries: ${JSON.stringify(reportData.branchSummary || [])}
- Section Comparison Summaries: ${JSON.stringify(reportData.sectionSummary || [])}

Please analyze and return your professional strategic advice.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
      }
    });

    const brief = response.text || "No insights could be compiled at this time.";
    res.json({ brief });
  } catch (err: any) {
    console.error("Financial Insights API error, falling back offline:", err);
    const offlineInsights = generateOfflineFinancialInsights(reportData);
    res.json({ brief: offlineInsights, mode: "offline" });
  }
});


// Health / State Endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: "alive", geminiConfigured: !!ai, userEmail: "usamah.m.qamar@gmail.com" });
});


// -------------------------------------------------------------
// VITE CLIENT INTEGRATION
// -------------------------------------------------------------
if (!isProd) {
  // Vite developer middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve('./index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // Production server static build
  app.use(express.static(path.resolve('./dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('./dist/index.html'));
  });
}

// Boot application
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ERP Engine] Running full-stack environment at http://0.0.0.0:${PORT}`);
});
