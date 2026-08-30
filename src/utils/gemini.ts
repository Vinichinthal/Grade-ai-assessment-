import { QuestionNode, StudentAnswerNode, AssessmentResult, MOCK_ASSESSMENT_RESULT } from "./mockData";

/**
 * Extract question structures directly from a PDF question paper client-side (used in simulated mode).
 */
export async function extractQuestionsFromPdfText(file: File): Promise<QuestionNode[]> {
  try {
    // If the file is the default auto-filled demo file or has negligible size, return sample Physics questions.
    if (file.name === "physics_final_exam.pdf" || file.size < 100) {
      return [...MOCK_ASSESSMENT_RESULT.questions];
    }

    // Load pdfjs-dist dynamically to prevent server-side evaluation errors during build prerendering
    const pdfjsLib = await import("pdfjs-dist");

    // Configure PDF worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const questions: QuestionNode[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];

      // Sort items by vertical position descending, then horizontal position ascending
      items.sort((a, b) => {
        if (Math.abs(a.transform[5] - b.transform[5]) < 5) {
          return a.transform[4] - b.transform[4];
        }
        return b.transform[5] - a.transform[5];
      });

      // Group into lines
      let lines: string[] = [];
      let currentY = -1;
      let currentLine = "";

      for (const item of items) {
        if (currentY === -1 || Math.abs(item.transform[5] - currentY) > 5) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentY = item.transform[5];
          currentLine = item.str;
        } else {
          currentLine += " " + item.str;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      // Parse lines for question numbering patterns
      for (const line of lines) {
        const trimmed = line.trim();
        // Match numbers like: "Q1.", "Q 1.", "1.", "3(a)", "11(a)", "11(b)"
        const match = trimmed.match(/^(?:q|question)?\s*(\d+(?:\([a-z]\))?)\.?\s+(.+)$/i);
        if (match) {
          const num = match[1];
          const text = match[2].trim();
          
          // Heuristic marks detection (e.g., [2 marks], (3), [5], 10 marks)
          const marksMatch = text.match(/[\(\[\{](\d+(?:\.\d+)?)\s*(?:marks?|pts?|points?)?[\)\]\}]/i) ||
                             text.match(/(\d+(?:\.\d+)?)\s*(?:marks?|pts?|points?)/i);
          const maxMarks = marksMatch ? parseFloat(marksMatch[1]) : 2;

          // Clean text from marks indicator
          const cleanText = text.replace(/[\(\[\{]\d+(?:\.\d+)?\s*(?:marks?|pts?|points?)?[\)\]\}]/gi, "").trim();

          questions.push({
            id: `q_${num.replace(/[\(\)\s]/g, "").toLowerCase()}`,
            number: num,
            text: cleanText || text,
            maxMarks: maxMarks,
            section: i === 1 ? "Section A" : i === 2 ? "Section B" : "Section C",
          });
        }
      }
    }

    // Fallback if no structured questions matched
    if (questions.length === 0) {
      let qNum = 1;
      const arrayBufferRaw = await file.arrayBuffer();
      const pdfRaw = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBufferRaw) }).promise;
      for (let i = 1; i <= pdfRaw.numPages; i++) {
        const page = await pdfRaw.getPage(i);
        const textContent = await page.getTextContent();
        const textStr = textContent.items.map((item: any) => item.str).join(" ");
        const sentences = textStr.split(/[\.\?\!]\s+/);
        
        for (const sentence of sentences) {
          if (sentence.trim().length > 25 && questions.length < 6) {
            questions.push({
              id: `q_${qNum}`,
              number: `${qNum}`,
              text: sentence.trim() + "?",
              maxMarks: 5,
              section: i === 1 ? "Section A" : "Section B",
            });
            qNum++;
          }
        }
      }
    }

    // Ultimate fallback if still empty
    if (questions.length === 0) {
      questions.push({
        id: "q_1",
        number: "1",
        text: `Evaluate and analyze page details of "${file.name}".`,
        maxMarks: 10,
        section: "Section A",
      });
    }

    return questions;
  } catch (err) {
    console.error("PDF question parser error:", err);
    return [
      {
        id: "q_1",
        number: "1",
        text: `Evaluate and analyze page details of "${file.name}".`,
        maxMarks: 10,
        section: "Section A",
      }
    ];
  }
}

/**
 * Generate simulated answers corresponding exactly to the extracted questions (used in simulated mode).
 */
export function generateSimulatedAnswers(questions: QuestionNode[], file: File): StudentAnswerNode[] {
  // If the file matches default auto-filled student answers file, load static Physics mock responses.
  if (file.name === "student_answers_sheets.png" || file.name === "student_answers.pdf" || file.size < 100) {
    return [...MOCK_ASSESSMENT_RESULT.answers];
  }

  const answers: StudentAnswerNode[] = [];
  
  questions.forEach((q, idx) => {
    const pageNum = Math.min(Math.floor(idx / 2) + 1, 3);
    const boxTop = 120 + (idx % 2) * 260;
    
    // Simulate that the student left the last question unanswered (to test missing answers flow)
    if (idx === questions.length - 1 && questions.length > 2) {
      return;
    }

    answers.push({
      id: `a_${q.id}`,
      questionId: q.id,
      extractedText: `Handwritten response for Question ${q.number}. The candidate explains that solving this involves analyzing parameters from "${q.text.slice(0, 35)}..." and executing step-by-step computations.`,
      pages: [pageNum],
      marksAwarded: Math.min(Math.round((q.maxMarks * 0.8) * 2) / 2, q.maxMarks), // award ~80% marks
      aiConfidence: 86 + (idx % 10),
      feedback: `Transcribed text aligns with Newton/general physics criteria for "${q.text.slice(0, 25)}". Derivation steps and SI units are correct.`,
      boundingBoxes: [
        {
          page: pageNum,
          box: [boxTop, 100, boxTop + 160, 900]
        }
      ]
    });
  });

  // Add one unmatched scribble anomaly block
  answers.push({
    id: `unmatched_anomaly_${Date.now()}`,
    questionId: null,
    extractedText: `Einstein's theory of relativity E = mc^2 relating mass and energy. Discovered in 1905. (Simulated unmatched scribble from student answer sheet "${file.name}").`,
    pages: [3],
    marksAwarded: 0,
    aiConfidence: 82,
    feedback: "Extracted scribble does not match any question in the printed paper. Classified as an unmatched answer block.",
    boundingBoxes: [{ page: 3, box: [650, 100, 820, 900] }]
  });

  return answers;
}


/**
 * Utility to read File object as Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Call Gemini API endpoint
 */
async function callGemini(apiKey: string, prompt: string, base64File?: string, mimeType?: string): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      base64File,
      mimeType,
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const errData = await response.json().catch(() => null);
      if (errData?.error) {
        throw new Error(errData.error);
      }
    }
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`Gemini API error: ${response.status} - ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.text;
}

/**
 * Clean up question numbers for matching
 * e.g., "Q1" -> "1", "3(a)" -> "3a", "11a." -> "11a"
 */
function normalizeNumber(numStr: string | null): string {
  if (!numStr) return "";
  return numStr
    .toLowerCase()
    .replace(/^q/, "") // remove leading Q
    .replace(/[\s\.\-\(\)]/g, ""); // remove spaces, dots, dashes, parentheses
}

/**
 * Clean up text returned by Gemini to retrieve the clean JSON payload.
 * Handles markdown code block wraps and accidental prefix/suffix text.
 */
function cleanJsonText(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  }
  const firstBracket = Math.min(
    cleaned.indexOf("[") === -1 ? Infinity : cleaned.indexOf("["),
    cleaned.indexOf("{") === -1 ? Infinity : cleaned.indexOf("{")
  );
  const lastBracket = Math.max(
    cleaned.lastIndexOf("]"),
    cleaned.lastIndexOf("}")
  );
  if (firstBracket !== Infinity && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned;
}

/**
 * Core pipeline orchestrator
 */
export async function runGradingPipeline(
  apiKey: string,
  questionPaper: File,
  answerSheet: File,
  onStageChange: (stage: number, statusText: string) => void,
  customQuestions?: QuestionNode[]
): Promise<AssessmentResult> {
  try {
    // Stage 1: Uploading & Base64 encoding
    onStageChange(1, "Encoding uploaded documents to payload...");
    
    // Check if files are small / mock demo files to prevent Gemini API 400 invalid argument errors
    const isQpDemo = questionPaper.name === "physics_final_exam.pdf" || questionPaper.size < 100;
    const isAsDemo = answerSheet.name === "student_answers_sheets.png" || answerSheet.name === "student_answers.pdf" || answerSheet.size < 100;

    const qpBase64 = isQpDemo ? undefined : await fileToBase64(questionPaper);
    const asBase64 = isAsDemo ? undefined : await fileToBase64(answerSheet);
    const qpMime = isQpDemo ? undefined : questionPaper.type;
    const asMime = isAsDemo ? undefined : answerSheet.type;

    let questions: QuestionNode[] = [];

    if (customQuestions && customQuestions.length > 0) {
      // Stage 2: Bypass OCR extraction if structured question catalog is present
      onStageChange(2, "Using structured builder question outline (skipping OCR)...");
      questions = customQuestions;
    } else {
      // Stage 2: Extracting Questions
      onStageChange(2, "Sending Question Paper to AI OCR compiler...");
      let qpPrompt = `
        Extract all printed questions from this question paper.
        Preserve the exact printed order and original numbering.
        Treat labeled sub-parts (e.g., 3(a), 3(b), 11(a)) as separate questions.
        For each question, extract:
        1. id: unique string (e.g., q1, q2, q3a)
        2. number: original printed number label (e.g., "1", "2", "3(a)")
        3. text: question text as printed
        4. maxMarks: maximum marks allocated (look for [2], (3), 5 marks, etc. Defaults to 2 if not found)
        5. section: section name if applicable (e.g., "Section A")

        Return the result strictly as a JSON array of QuestionNode:
        interface QuestionNode {
          id: string;
          number: string;
          text: string;
          maxMarks: number;
          section?: string;
        }
      `;

      if (isQpDemo) {
        qpPrompt += `
          
          The question paper has the following text content:
          Section A:
          Q1. State Newton's first law of motion. [2 marks]
          Q2. Explain the difference between speed and velocity with examples. [3 marks]
          Section B:
          Q3(a). Define kinetic energy and state its SI unit. [2 marks]
          Q3(b). Calculate the kinetic energy of a 2kg mass moving at a velocity of 5m/s. [3 marks]
          Q4. Discuss the law of conservation of momentum and describe one real-world application. [5 marks]
          Section C:
          Q5. Describe an experiment to measure gravity (g) using a simple pendulum. List two key sources of error. [10 marks]
        `;
      }

      const qpJsonText = await callGemini(apiKey, qpPrompt, qpBase64, qpMime);
      try {
        const cleaned = cleanJsonText(qpJsonText);
        const parsed = JSON.parse(cleaned);
        questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      } catch (e: any) {
        console.error("Failed to parse question paper JSON:", e, qpJsonText);
        throw new Error("AI extraction failed to parse the question paper structure. Please check the document format and try again.");
      }
    }

    // Stage 3: Extracting Answers
    onStageChange(3, "Transcribing student handwriting and extracting layout regions...");
    let asPrompt = `
      You are an expert handwriting transcription and spatial layout analyzer.
      Analyze the student's handwritten answer sheet.
      Transcribe all answers.
      For each answer block, extract:
      1. id: unique string (e.g. a1, a2, a3)
      2. questionNumber: the question label written by the student (e.g. "1", "Q3(a)", or null if not identifiable)
      3. extractedText: the student's handwritten answer text transcribed as accurately as possible
      4. page: the page number of the answer sheet containing this response (1-indexed)
      5. box: the exact bounding box of the handwritten answer text on that page, represented as normalized coordinates [ymin, xmin, ymax, xmax] from 0 to 1000. For example: [200, 150, 450, 850] means the box starts at 20% from top, 15% from left, ends at 45% from top, 85% from left.
      6. confidence: score from 0 to 100 for handwriting recognition quality.

      Return the result strictly as a JSON array conforming to this structure:
      [
        {
          "id": "string",
          "questionNumber": "string or null",
          "extractedText": "string",
          "page": number,
          "box": [number, number, number, number],
          "confidence": number
        }
      ]
    `;

    if (isAsDemo) {
      asPrompt += `
        
        The student's answer sheet contains the following handwritten text on each page:
        Page 1:
        - "Newton's first law of motion: It states that an object will remain at rest or continue to move at a constant velocity in a straight line unless it is acted on by an external net force. For example, a book resting on a table stays there unless pushed." (Written as response to Q1, coordinates: [120, 100, 320, 900], confidence: 96)
        - "Kinetic energy is defined as the energy possessed by an object due to its motion. Work needs to be done to accelerate it. The SI unit of kinetic energy is the Joule (J)." (Written as response to Q3(a), coordinates: [380, 100, 520, 900], confidence: 91)
        
        Page 2:
        - "Speed is a scalar quantity which represents how fast an object is moving. Velocity is a vector quantity, representing rate of movement and direction. Example: Speed is 10 m/s. Velocity is 10 m/s North." (Written as response to Q2, coordinates: [100, 100, 300, 900], confidence: 94)
        - "Given: Mass m = 2kg, Velocity v = 5m/s. Formula: KE = 1/2 * m * v^2. Calculation: KE = 0.5 * 2 * (5 * 5) = 1 * 25 = 25. The final kinetic energy is 25 Joules." (Written as response to Q3(b), coordinates: [350, 100, 500, 900], confidence: 89)

        Page 3:
        - "Pendulum Experiment: Hang a mass from a string. Measure length L. Displace it slightly and time 20 oscillations. T = time / 20. Formula: T = 2pi * sqrt(L/g), so g = 4pi^2 * L / T^2. Errors: 1. Air resistance slowing the pendulum. 2. Human reaction time during stopwatch starts." (Written as response to Q5, coordinates: [250, 100, 600, 900], confidence: 85)
        - "Extra scribble: Einstein's theory of relativity relates energy and mass by E = mc^2. E is energy, m is mass, c is the speed of light in a vacuum (3 * 10^8 m/s). This was discovered in 1905." (Unmatched text block on page 3, coordinates: [650, 100, 850, 900], confidence: 78)
      `;
    }

    const asJsonText = await callGemini(apiKey, asPrompt, asBase64, asMime);
    let rawAnswers: any[] = [];
    try {
      const cleaned = cleanJsonText(asJsonText);
      const parsed = JSON.parse(cleaned);
      rawAnswers = Array.isArray(parsed) ? parsed : (parsed.answers || []);
    } catch (e: any) {
      console.error("Failed to parse student answers JSON:", e, asJsonText);
      throw new Error("AI extraction failed to parse the handwritten answers. Please check the document layout and try again.");
    }

    // Convert raw answers to StudentAnswerNode structure
    let answers: StudentAnswerNode[] = rawAnswers.map((ans) => {
      return {
        id: ans.id || `a_${Math.random().toString(36).substr(2, 9)}`,
        questionId: null, // Will map next
        extractedText: ans.extractedText,
        pages: [ans.page],
        marksAwarded: 0, // Will grade next
        aiConfidence: ans.confidence || 85,
        feedback: "", // Will grade next
        boundingBoxes: [
          {
            page: ans.page,
            box: ans.box || [100, 100, 300, 900], // fallback
          },
        ],
      };
    });

    // Stage 4: Question-Answer Mapping & Merging
    onStageChange(4, "Aligning handwritten answer blocks to printed question sheet...");
    
    // 1. Initial mapping by explicit question numbers (normalized)
    answers.forEach((ans) => {
      const rawNum = rawAnswers.find((ra) => ra.id === ans.id)?.questionNumber;
      if (rawNum) {
        const normRaw = normalizeNumber(rawNum);
        const matchedQ = questions.find((q) => normalizeNumber(q.number) === normRaw);
        if (matchedQ) {
          ans.questionId = matchedQ.id;
        }
      }
    });

    // 2. OCR keyword matching fallback (matching key terms from question text)
    answers.forEach((ans) => {
      if (ans.questionId === null) {
        for (const q of questions) {
          if (answers.some((a) => a.questionId === q.id)) continue;

          const terms = q.text.toLowerCase().split(/\s+/).filter(w => w.length > 4);
          let matchCount = 0;
          const ansLower = ans.extractedText.toLowerCase();
          
          terms.forEach(t => {
            if (ansLower.includes(t)) matchCount++;
          });

          if (terms.length > 0 && (matchCount >= 3 || matchCount / terms.length >= 0.5)) {
            ans.questionId = q.id;
            break;
          }
        }
      }
    });

    // 3. Semantic similarity fallback using Gemini
    for (const ans of answers) {
      if (ans.questionId === null) {
        const unmatchedQ = questions.filter((q) => !answers.some((a) => a.questionId === q.id));
        if (unmatchedQ.length > 0) {
          onStageChange(4, `Resolving semantic mapping for page ${ans.pages.join(", ")}...`);
          const mapPrompt = `
            Determine which of these questions this student answer is responding to.
            Student Answer: "${ans.extractedText}"
            
            Available Questions:
            ${unmatchedQ.map((q) => `- ID: ${q.id}, Text: "${q.text}"`).join("\n")}
            
            Return the matching ID as JSON object: { "matchedId": "string or null" }
          `;
          try {
            const mapResText = await callGemini(apiKey, mapPrompt);
            const cleaned = cleanJsonText(mapResText);
            const mapRes = JSON.parse(cleaned);
            if (mapRes.matchedId) {
              ans.questionId = mapRes.matchedId;
            }
          } catch (e) {
            console.error("Semantic mapping error:", e);
          }
        }
      }
    }

    // 4. Merge duplicate mappings (for answers spanning multiple pages)
    let processedAnswers: StudentAnswerNode[] = [];
    const processedQuestionIds = new Set<string>();

    questions.forEach((q) => {
      const mapped = answers.filter((a) => a.questionId === q.id);
      if (mapped.length === 0) return;

      processedQuestionIds.add(q.id);

      if (mapped.length === 1) {
        processedAnswers.push(mapped[0]);
      } else {
        // Sort by page number to merge chronologically
        mapped.sort((a, b) => a.pages[0] - b.pages[0]);
        
        const first = mapped[0];
        const mergedText = mapped.map((m) => m.extractedText).join(" ... ");
        const mergedPages = Array.from(new Set(mapped.flatMap((m) => m.pages))).sort((a, b) => a - b);
        const mergedBoxes = mapped.flatMap((m) => m.boundingBoxes || []);
        const avgConfidence = Math.round(mapped.reduce((sum, m) => sum + m.aiConfidence, 0) / mapped.length);

        processedAnswers.push({
          ...first,
          extractedText: mergedText,
          pages: mergedPages,
          boundingBoxes: mergedBoxes,
          aiConfidence: avgConfidence,
        });
      }
    });

    // Add unmatched answers
    answers.forEach((ans) => {
      if (ans.questionId === null) {
        processedAnswers.push(ans);
      }
    });

    answers = processedAnswers;

    // Stage 5: Grading
    onStageChange(5, "Running AI evaluation compiler and marks allocation...");
    const mappedPairs = answers
      .filter((a) => a.questionId !== null)
      .map((a) => ({
        question: questions.find((q) => q.id === a.questionId)!,
        answer: a,
      }));

    if (mappedPairs.length > 0) {
      const gradingPrompt = `
        You are an expert educational grading assistant.
        Grade these student responses against the questions.
        For each response, compare it with the question text and award marks based on correctness.
        Return a JSON array of grading objects matching the exact input order.
        
        Pairs to grade:
        ${mappedPairs
          .map(
            (p, idx) => `
          Index: ${idx}
          Question: "${p.question.text}"
          Max Marks: ${p.question.maxMarks}
          Student Answer: "${p.answer.extractedText}"
        `
          )
          .join("\n")}

        Return strictly a JSON array:
        [
          {
            "marksAwarded": number (up to maxMarks of question, can use decimals like 1.5, 7.5),
            "feedback": "string (short grading explanation)"
          }
        ]
      `;
      const gradingJsonText = await callGemini(apiKey, gradingPrompt);
      let grades: any[] = [];
      try {
        const cleaned = cleanJsonText(gradingJsonText);
        const parsed = JSON.parse(cleaned);
        grades = Array.isArray(parsed) ? parsed : (parsed.grades || []);
      } catch (e: any) {
        console.error("Failed to parse grading evaluation JSON:", e, gradingJsonText);
      }

      mappedPairs.forEach((pair, idx) => {
        if (grades[idx]) {
          pair.answer.marksAwarded = Math.min(grades[idx].marksAwarded, pair.question.maxMarks);
          pair.answer.feedback = grades[idx].feedback;
        }
      });
    }

    // Handle unmatched answers feedback
    answers.forEach((ans) => {
      if (ans.questionId === null) {
        ans.marksAwarded = 0;
        ans.feedback = "Extracted scribble does not match any question in the printed paper. Classified as an unmatched answer block.";
      }
    });

    // Stage 6: Generating Summary & Notes
    onStageChange(6, "Compiling final assessment report...");
    const totalScore = answers.reduce((sum, a) => sum + (a.questionId ? a.marksAwarded : 0), 0);
    const maxScore = questions.reduce((sum, q) => sum + q.maxMarks, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    let grade = "F";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 85) grade = "A";
    else if (percentage >= 80) grade = "B+";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 60) grade = "C";
    else if (percentage >= 50) grade = "D";

    const unansweredQuestions = questions.filter((q) => !answers.some((a) => a.questionId === q.id));
    const unmatchedAnswers = answers.filter((a) => a.questionId === null);
    const mappedAnswers = answers.filter((a) => a.questionId !== null);

    const summaryPrompt = `
      Generate an overall summary of this student's exam performance.
      Total Score: ${totalScore} / ${maxScore}
      Percentage: ${percentage}%
      Grade: ${grade}
      
      Questions graded:
      ${mappedPairs.map((p) => `- Q${p.question.number}: ${p.answer.marksAwarded}/${p.question.maxMarks}`).join("\n")}
      
      Unanswered questions: ${unansweredQuestions.map((q) => q.number).join(", ") || "None"}
      Unmatched scribbles: ${unmatchedAnswers.length}
      
      Provide a brief educational feedback summary (max 3 sentences) highlighting what the student did well and what they need to study.
      Return JSON: { "aiNotes": "string" }
    `;
    const summaryJsonText = await callGemini(apiKey, summaryPrompt);
    let summaryData: any = {};
    try {
      const cleaned = cleanJsonText(summaryJsonText);
      summaryData = JSON.parse(cleaned);
    } catch (e: any) {
      console.error("Failed to parse summary report JSON:", e, summaryJsonText);
    }

    const result: AssessmentResult = {
      questions: questions,
      answers: answers,
      summary: {
        totalScore: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        grade: grade,
        aiNotes: summaryData.aiNotes || "Evaluation completed successfully.",
        questionsCount: questions.length,
        mappedCount: mappedAnswers.length,
        unansweredCount: unansweredQuestions.length,
        unmatchedCount: unmatchedAnswers.length,
      },
    };

    return result;
  } catch (error: any) {
    console.error("Grading pipeline error:", error);
    throw error;
  }
}
