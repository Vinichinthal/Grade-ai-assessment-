import { AssessmentResult } from "./mockData";

export interface BuilderQuestion {
  id: string;
  number: string;
  text: string;
  type: "MCQ" | "Short Answer" | "Long Answer" | "Descriptive" | "True/False" | "Fill in the Blank" | "Match the Following";
  marks: number;
  section: string;
  isOptional?: boolean;
  parentId?: string;
  subQuestions?: BuilderQuestion[];
}

export interface QuestionPaperMetadata {
  id: string;
  name: string;
  uploadDate: string;
  type: string; // "application/pdf" | "image/png" | "builder"
  pages: number;
  status: "Ready" | "Analyzed";
  subject?: string;
  grade?: string;
  examType?: string;
  duration?: string;
  maxMarks?: number;
  questions?: BuilderQuestion[];
  instructions?: string[];
}

export interface AnswerSheetMetadata {
  id: string;
  studentName: string;
  name: string;
  uploadDate: string;
  type: string;
  pages: number;
  assessmentName: string;
  status: "Ready" | "Analyzed";
}

export interface AssessmentRecord {
  id: string;
  name: string;
  date: string;
  qpId: string;
  asId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  status: "Completed" | "Pending";
  result: AssessmentResult | null;
}

export interface UserSession {
  email: string;
  name: string;
  role: string;
}

export interface BankQuestion {
  id: string;
  subject: string;
  chapter: string;
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: string;
  marks: number;
  tags: string[];
}

export interface QPTemplate {
  id: string;
  name: string;
  subject: string;
  grade: string;
  examType: string;
  duration: string;
  maxMarks: number;
  instructions: string[];
  questions: BuilderQuestion[];
}

export const DEFAULT_TEMPLATES: QPTemplate[] = [
  {
    id: "tpl_physics_midterm",
    name: "Standard Physics Mid-Term Exam",
    subject: "Physics",
    grade: "Grade 11",
    examType: "Mid Term",
    duration: "2 Hours",
    maxMarks: 25,
    instructions: [
      "All questions are compulsory.",
      "Show final answers along with SI units.",
      "For calculations, take gravity g = 10 m/s^2."
    ],
    questions: [
      { id: "q1", number: "1", text: "State Newton's first law of motion.", type: "Short Answer", marks: 2, section: "Section A" },
      { id: "q2", number: "2", text: "Explain the difference between speed and velocity with examples.", type: "Short Answer", marks: 3, section: "Section A" },
      { id: "q3a", number: "3(a)", text: "Define kinetic energy and state its SI unit.", type: "Short Answer", marks: 2, section: "Section B" },
      { id: "q3b", number: "3(b)", text: "Calculate the kinetic energy of a 2kg mass moving at a velocity of 5m/s.", type: "Match the Following", marks: 3, section: "Section B" },
      { id: "q4", number: "4", text: "Discuss the law of conservation of momentum and describe one real-world application.", type: "Long Answer", marks: 5, section: "Section B" },
      { id: "q5", number: "5", text: "Describe an experiment to measure gravity (g) using a simple pendulum. List two key sources of error.", type: "Descriptive", marks: 10, section: "Section C" }
    ]
  },
  {
    id: "tpl_maths_quiz",
    name: "Algebraic Equations Unit Test",
    subject: "Mathematics",
    grade: "Grade 10",
    examType: "Unit Test",
    duration: "1 Hour",
    maxMarks: 10,
    instructions: [
      "Simplify all terms completely.",
      "Rough calculations must be shown on the side."
    ],
    questions: [
      { id: "mq1", number: "1", text: "Solve for x: 3x + 7 = 22.", type: "Short Answer", marks: 2, section: "Section A" },
      { id: "mq2", number: "2", text: "Find the roots of the quadratic equation: x^2 - 5x + 6 = 0.", type: "Short Answer", marks: 3, section: "Section A" },
      { id: "mq3", number: "3", text: "State whether the equation y = 2x^2 + 3 is linear or quadratic.", type: "True/False", marks: 1, section: "Section B" },
      { id: "mq4", number: "4", text: "Factorize completely: 2x^2 - 8x.", type: "Short Answer", marks: 4, section: "Section B" }
    ]
  },
  {
    id: "tpl_chemistry_final",
    name: "Organic Compounds Review",
    subject: "Chemistry",
    grade: "Grade 12",
    examType: "Final",
    duration: "3 Hours",
    maxMarks: 50,
    instructions: [
      "Include chemical structure equations in Section B & C.",
      "Periodic table values are provided at the end."
    ],
    questions: [
      { id: "cq1", number: "1", text: "Define homologous series and list two characteristics.", type: "Short Answer", marks: 5, section: "Section A" },
      { id: "cq2", number: "2", text: "Explain the substitution reaction of methane with chlorine in sunlight.", type: "Long Answer", marks: 10, section: "Section B" },
      { id: "cq3", number: "3", text: "What is the IUPAC name for CH3-CH2-OH?", type: "MCQ", marks: 5, section: "Section A" }
    ]
  }
];

const DB_NAME = "GradeAIDatabase";
const DB_VERSION = 1;
const STORE_NAME = "files";

// IndexedDB Helper Functions
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveFile(id: string, file: File | Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFile(id: string): Promise<File | Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// LocalStorage Helper Functions

// Session
export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const session = localStorage.getItem("gradeai_session");
  return session ? JSON.parse(session) : null;
}

export function setSession(user: UserSession): void {
  localStorage.setItem("gradeai_session", JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem("gradeai_session");
}

// Question Papers Metadata
export function getQuestionPapers(): QuestionPaperMetadata[] {
  if (typeof window === "undefined") return [];
  const papers = localStorage.getItem("gradeai_question_papers");
  return papers ? JSON.parse(papers) : [];
}

export function saveQuestionPaper(paper: QuestionPaperMetadata): void {
  const papers = getQuestionPapers();
  const index = papers.findIndex((p) => p.id === paper.id);
  if (index >= 0) {
    papers[index] = paper;
  } else {
    papers.push(paper);
  }
  localStorage.setItem("gradeai_question_papers", JSON.stringify(papers));
}

export function deleteQuestionPaper(id: string): void {
  const papers = getQuestionPapers().filter((p) => p.id !== id);
  localStorage.setItem("gradeai_question_papers", JSON.stringify(papers));
  deleteFile(id).catch(console.error);
}

// Answer Sheets Metadata
export function getAnswerSheets(): AnswerSheetMetadata[] {
  if (typeof window === "undefined") return [];
  const sheets = localStorage.getItem("gradeai_answer_sheets");
  return sheets ? JSON.parse(sheets) : [];
}

export function saveAnswerSheet(sheet: AnswerSheetMetadata): void {
  const sheets = getAnswerSheets();
  const index = sheets.findIndex((s) => s.id === sheet.id);
  if (index >= 0) {
    sheets[index] = sheet;
  } else {
    sheets.push(sheet);
  }
  localStorage.setItem("gradeai_answer_sheets", JSON.stringify(sheets));
}

export function deleteAnswerSheet(id: string): void {
  const sheets = getAnswerSheets().filter((s) => s.id !== id);
  localStorage.setItem("gradeai_answer_sheets", JSON.stringify(sheets));
  deleteFile(id).catch(console.error);
}

// Assessments Metadata & Results
export function getAssessments(): AssessmentRecord[] {
  if (typeof window === "undefined") return [];
  const assessments = localStorage.getItem("gradeai_assessments");
  return assessments ? JSON.parse(assessments) : [];
}

export function saveAssessment(assessment: AssessmentRecord): void {
  const assessments = getAssessments();
  const index = assessments.findIndex((a) => a.id === assessment.id);
  if (index >= 0) {
    assessments[index] = assessment;
  } else {
    assessments.push(assessment);
  }
  localStorage.setItem("gradeai_assessments", JSON.stringify(assessments));
}

export function deleteAssessment(id: string): void {
  const assessments = getAssessments().filter((a) => a.id !== id);
  localStorage.setItem("gradeai_assessments", JSON.stringify(assessments));
}

// Question Bank
export function getBankQuestions(): BankQuestion[] {
  if (typeof window === "undefined") return [];
  const questions = localStorage.getItem("gradeai_question_bank");
  if (!questions) {
    // Populate default questions if empty
    const defaultQuestions: BankQuestion[] = [
      { id: "bq_1", subject: "Physics", chapter: "Newtonian Mechanics", question: "State Newton's first law of motion.", difficulty: "Easy", type: "Short Answer", marks: 2, tags: ["Newton", "Laws of Motion"] },
      { id: "bq_2", subject: "Physics", chapter: "Newtonian Mechanics", question: "Explain the difference between speed and velocity with examples.", difficulty: "Medium", type: "Short Answer", marks: 3, tags: ["Speed", "Velocity", "Vectors"] },
      { id: "bq_3", subject: "Physics", chapter: "Work & Energy", question: "Define kinetic energy and state its SI unit.", difficulty: "Easy", type: "Short Answer", marks: 2, tags: ["Energy", "Kinetic Energy", "SI Units"] },
      { id: "bq_4", subject: "Physics", chapter: "Work & Energy", question: "Calculate the kinetic energy of a 2kg mass moving at a velocity of 5m/s.", difficulty: "Medium", type: "Match the Following", marks: 3, tags: ["Kinetic Energy", "Energy Calculations"] },
      { id: "bq_5", subject: "Physics", chapter: "Conservation Laws", question: "Discuss the law of conservation of momentum and describe one real-world application.", difficulty: "Hard", type: "Long Answer", marks: 5, tags: ["Momentum", "Conservation Laws"] },
      { id: "bq_6", subject: "Physics", chapter: "Gravity & Pendulum", question: "Describe an experiment to measure gravity (g) using a simple pendulum. List two key sources of error.", difficulty: "Hard", type: "Descriptive", marks: 10, tags: ["Gravity", "Pendulum", "Experiment"] }
    ];
    localStorage.setItem("gradeai_question_bank", JSON.stringify(defaultQuestions));
    return defaultQuestions;
  }
  return JSON.parse(questions);
}

export function saveBankQuestion(question: BankQuestion): void {
  const questions = getBankQuestions();
  const index = questions.findIndex((q) => q.id === question.id);
  if (index >= 0) {
    questions[index] = question;
  } else {
    questions.push(question);
  }
  localStorage.setItem("gradeai_question_bank", JSON.stringify(questions));
}

export function deleteBankQuestion(id: string): void {
  const questions = getBankQuestions().filter((q) => q.id !== id);
  localStorage.setItem("gradeai_question_bank", JSON.stringify(questions));
}

// Templates Customizations
export function getCustomTemplates(): QPTemplate[] {
  if (typeof window === "undefined") return [];
  const templates = localStorage.getItem("gradeai_custom_templates");
  return templates ? JSON.parse(templates) : [];
}

export function saveCustomTemplate(template: QPTemplate): void {
  const templates = getCustomTemplates();
  const index = templates.findIndex((t) => t.id === template.id);
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem("gradeai_custom_templates", JSON.stringify(templates));
}

export function deleteCustomTemplate(id: string): void {
  const templates = getCustomTemplates().filter((t) => t.id !== id);
  localStorage.setItem("gradeai_custom_templates", JSON.stringify(templates));
}

// Teacher Mapping
export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  grade: string;
  section: string;
}

export function getTeachers(): Teacher[] {
  if (typeof window === "undefined") return [];
  const teachers = localStorage.getItem("gradeai_teachers");
  if (!teachers) {
    const defaultTeachers: Teacher[] = [
      { id: "t_1", name: "Dr. Sarah Jenkins", email: "sarah.jenkins@gradeai.edu", subject: "Mathematics", grade: "Grade 10", section: "A" },
      { id: "t_2", name: "Prof. Michael Chen", email: "m.chen@gradeai.edu", subject: "Science", grade: "Grade 10", section: "A" },
      { id: "t_3", name: "Mrs. Emily Davis", email: "e.davis@gradeai.edu", subject: "English", grade: "Grade 10", section: "A" }
    ];
    localStorage.setItem("gradeai_teachers", JSON.stringify(defaultTeachers));
    return defaultTeachers;
  }
  return JSON.parse(teachers);
}

export function saveTeacher(teacher: Teacher): void {
  const teachers = getTeachers();
  const index = teachers.findIndex((t) => t.id === teacher.id);
  if (index >= 0) {
    teachers[index] = teacher;
  } else {
    teachers.push(teacher);
  }
  localStorage.setItem("gradeai_teachers", JSON.stringify(teachers));
}

export function deleteTeacher(id: string): void {
  const teachers = getTeachers().filter((t) => t.id !== id);
  localStorage.setItem("gradeai_teachers", JSON.stringify(teachers));
}
