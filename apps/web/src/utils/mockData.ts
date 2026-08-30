export interface QuestionNode {
  id: string;
  number: string;          // e.g., "1", "2", "3(a)", "3(b)"
  text: string;            // The printed question text
  maxMarks: number;        // Maximum marks allocated
  section?: string;        // section name e.g. "Section A"
}

export interface BoundingBoxNode {
  page: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
}

export interface StudentAnswerNode {
  id: string;
  questionId: string | null;  // null if unmatched/not matching any question
  extractedText: string;      // The OCR transcribed text
  pages: number[];            // Page numbers e.g. [1] or [2, 3] (spanning multiple pages)
  marksAwarded: number;
  aiConfidence: number;       // Percentage confidence e.g. 92
  feedback: string;           // AI-generated grading feedback
  isConfidenceLow?: boolean;
  boundingBoxes?: BoundingBoxNode[];
}

export interface GradingSummary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  aiNotes: string;
  questionsCount: number;
  mappedCount: number;
  unansweredCount: number;
  unmatchedCount: number;
}

export interface AssessmentResult {
  questions: QuestionNode[];
  answers: StudentAnswerNode[];
  summary: GradingSummary;
}

export const MOCK_ASSESSMENT_RESULT: AssessmentResult = {
  questions: [
    {
      id: "q1",
      number: "1",
      text: "State Newton's first law of motion.",
      maxMarks: 2,
      section: "Section A",
    },
    {
      id: "q2",
      number: "2",
      text: "Explain the difference between speed and velocity with examples.",
      maxMarks: 3,
      section: "Section A",
    },
    {
      id: "q3a",
      number: "3(a)",
      text: "Define kinetic energy and state its SI unit.",
      maxMarks: 2,
      section: "Section B",
    },
    {
      id: "q3b",
      number: "3(b)",
      text: "Calculate the kinetic energy of a 2kg mass moving at a velocity of 5m/s.",
      maxMarks: 3,
      section: "Section B",
    },
    {
      id: "q4",
      number: "4",
      text: "Discuss the law of conservation of momentum and describe one real-world application.",
      maxMarks: 5,
      section: "Section B",
    },
    {
      id: "q5",
      number: "5",
      text: "Describe an experiment to measure gravity (g) using a simple pendulum. List two key sources of error.",
      maxMarks: 10,
      section: "Section C",
    },
  ],
  answers: [
    {
      id: "a1",
      questionId: "q1",
      extractedText: "Newton's first law of motion: It states that an object will remain at rest or continue to move at a constant velocity in a straight line unless it is acted on by an external net force. For example, a book resting on a table stays there unless pushed.",
      pages: [1],
      marksAwarded: 2,
      aiConfidence: 96,
      feedback: "Perfect transcription. The definition is fully correct, outlining both the rest state and the uniform motion state. The external force condition is clearly stated. Full marks awarded.",
      boundingBoxes: [{ page: 1, box: [120, 100, 320, 900] }],
    },
    {
      id: "a3a",
      questionId: "q3a",
      extractedText: "Kinetic energy is defined as the energy possessed by an object due to its motion. Work needs to be done to accelerate it. The SI unit of kinetic energy is the Joule (J).",
      pages: [1],
      marksAwarded: 2,
      aiConfidence: 91,
      feedback: "Accurate definition. Explicitly mentions that it is energy due to motion and correctly identifies the SI unit as Joule (J). Full marks.",
      boundingBoxes: [{ page: 1, box: [380, 100, 520, 900] }],
    },
    {
      id: "a2",
      questionId: "q2",
      extractedText: "Speed is a scalar quantity which represents how fast an object is moving. Velocity is a vector quantity, representing rate of movement and direction. Example: Speed is 10 m/s. Velocity is 10 m/s North.",
      pages: [2],
      marksAwarded: 3,
      aiConfidence: 94,
      feedback: "Answered out of order on page 2. Excellent and complete explanation. The student clearly distinguishes between scalar (speed) and vector (velocity) properties. The examples given are accurate. Full marks.",
      boundingBoxes: [{ page: 2, box: [100, 100, 300, 900] }],
    },
    {
      id: "a3b",
      questionId: "q3b",
      extractedText: "Given: Mass m = 2kg, Velocity v = 5m/s. Formula: KE = 1/2 * m * v^2. Calculation: KE = 0.5 * 2 * (5 * 5) = 1 * 25 = 25. The final kinetic energy is 25 Joules.",
      pages: [2, 3], // Spans multiple pages!
      marksAwarded: 3,
      aiConfidence: 89,
      feedback: "Spans across page 2 and page 3. The student correctly states the formula, shows clear substitution steps, performs the arithmetic calculation without error, and provides the correct unit (Joules). Full marks.",
      boundingBoxes: [
        { page: 2, box: [350, 100, 500, 900] },
        { page: 3, box: [100, 100, 200, 900] },
      ],
    },
    {
      id: "a5",
      questionId: "q5",
      extractedText: "Pendulum Experiment: Hang a mass from a string. Measure length L. Displace it slightly and time 20 oscillations. T = time / 20. Formula: T = 2pi * sqrt(L/g), so g = 4pi^2 * L / T^2. Errors: 1. Air resistance slowing the pendulum. 2. Human reaction time during stopwatch starts.",
      pages: [3],
      marksAwarded: 7.5,
      aiConfidence: 85,
      feedback: "Answered out of order on page 3. Good experimental layout, correct formula derivation for g. However, the student missed describing the measurement of string length with detail, and timing oscillations could mention averaging. Awarded 7.5/10.",
      boundingBoxes: [{ page: 3, box: [250, 100, 600, 900] }],
    },
    {
      id: "unmatched1",
      questionId: null, // Unmatched answer!
      extractedText: "Extra scribble: Einstein's theory of relativity relates energy and mass by E = mc^2. E is energy, m is mass, c is the speed of light in a vacuum (3 * 10^8 m/s). This was discovered in 1905.",
      pages: [3],
      marksAwarded: 0,
      aiConfidence: 78,
      feedback: "Extracted scribble does not match any question in the printed paper. Classified as an unmatched answer block.",
      boundingBoxes: [{ page: 3, box: [650, 100, 850, 900] }],
    },
  ],
  summary: {
    totalScore: 19.5,
    maxScore: 25,
    percentage: 78,
    grade: "B+",
    aiNotes: "The student performed very well in Section A and B, getting full marks for Newtonian laws, speed/velocity differences, and kinetic energy computations. However, Question 4 (5 marks) was left completely unanswered, which lowered the overall score. The pendulum experiment (Question 5) had small details missing regarding experimental controls but was mostly correct.",
    questionsCount: 6,
    mappedCount: 5,
    unansweredCount: 1,
    unmatchedCount: 1,
  },
};
