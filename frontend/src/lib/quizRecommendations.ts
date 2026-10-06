/**
 * Utility helper to match and score quizzes based on student exam schedules.
 */

export interface ScheduleItem {
  subject: string;
  status: "upcoming" | "today" | "passed";
  date: string;
  time: string;
  countdownText?: string;
  searchKeyword?: string;
  room?: string;
}

export interface QuizItem {
  id: number;
  title: string;
  description?: string | null;
  category?: {
    id: number;
    name: string;
  } | null;
  total_questions?: number;
  duration_minutes?: number;
  [key: string]: any;
}

export interface RecommendedQuiz extends QuizItem {
  isRecommended?: boolean;
  matchedSubject?: ScheduleItem;
  recommendPriority?: number; // Higher means more urgent / relevant
}

/**
 * Remove Vietnamese accents, normalize symbols and special keywords
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/c\+\+/g, " cpp ")
    .replace(/c#/g, " csharp ")
    .replace(/\.net/g, " dotnet ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common generic words that should NOT be used alone to match subjects
 * (e.g., 'cong', 'nghe' in 'Cong nghe Java' vs category 'Cong nghe thong tin')
 */
const STOP_WORDS = new Set([
  "cong", "nghe", "thong", "tin", "mon", "hoc", "dai", "cuong",
  "co", "ban", "nang", "cao", "va", "cac", "nhung", "ung", "dung",
  "phan", "he", "thuat", "toan", "tap", "khoa", "chuong", "bai",
  "kiem", "tra", "thi", "de", "ngan", "hang", "cau", "hoi", "trac", "nghiem",
  "lap", "trinh"
]);

/**
 * Common University IT & General Acronyms <-> Full subject names
 */
const SUBJECT_ACRONYMS: Record<string, string[]> = {
  "dtdm": ["dien toan dam may", "cloud"],
  "qtm": ["quan tri mang"],
  "csdl": ["co so du lieu", "database"],
  "hdt": ["huong doi tuong"],
  "oop": ["huong doi tuong", "lap trinh huong doi tuong"],
  "cnpm": ["cong nghe phan mem"],
  "hdh": ["he dieu hanh"],
  "mmt": ["mang may tinh"],
  "hqtcsdl": ["he quan tri co so du lieu"],
  "tthcm": ["tu tuong ho chi minh", "tu tuong hcm"],
  "ktct": ["kinh te chinh tri"],
  "cnxhkh": ["chu nghia xa hoi khoa hoc"],
  "lsd": ["lich su dang"],
  "lsdcsvn": ["lich su dang"],
  "pldc": ["phap luat dai cuong"],
  "mnm": ["ma nguon mo", "open source"],
  "dss": ["he ho tro", "ho tro ra quyet dinh"],
};

/**
 * Highly distinctive technical keywords where presence in subject requires presence in title
 */
const DISTINCTIVE_WORDS = [
  "java", "python", "php", "cpp", "csharp", "linux", "cloud",
  "ai", "sql", "iot", "android", "flutter", "golang", "kotlin", "swift"
];

/**
 * Check if a quiz specifically matches a subject from the student exam schedule.
 * Precision is critical: only matches quiz.title, never generic category/description!
 */
export function isQuizMatchingSubject(quiz: QuizItem, subject: string): boolean {
  if (!subject || !quiz.title) return false;

  const normSubject = normalizeVietnamese(subject);
  // Match exclusively against quiz title to avoid false positives with category names
  const normTitle = normalizeVietnamese(quiz.title);

  if (!normSubject || !normTitle) return false;

  // 1. Direct phrase containment (e.g. "ma nguon mo" inside "de thi ma nguon mo k24")
  if (normTitle.includes(normSubject)) {
    return true;
  }
  if (normSubject.includes(normTitle) && normTitle.length >= 5) {
    return true;
  }

  // 2. Acronym & Alias Matching (e.g. "ĐTĐM-UD" matching "Điện toán đám mây và ứng dụng")
  const titleTokens = normTitle.split(" ");
  for (const [acronym, aliases] of Object.entries(SUBJECT_ACRONYMS)) {
    const subjectMatchesAcronym =
      normSubject.includes(acronym) || aliases.some((a) => normSubject.includes(a));

    if (subjectMatchesAcronym) {
      // Check if title has this exact acronym as a word or contains one of the aliases
      const titleHasAcronym = titleTokens.includes(acronym) || normTitle.startsWith(acronym) || normTitle.includes(`${acronym} `) || normTitle.includes(` ${acronym}`);
      const titleHasAlias = aliases.some((a) => normTitle.includes(a));
      if (titleHasAcronym || titleHasAlias) {
        return true;
      }
    }
  }

  // 3. Distinctive keyword gatekeeper:
  // If the subject contains a specialized word like "java", the title MUST also have it!
  const subjectWords = normSubject.split(" ");
  for (const dw of DISTINCTIVE_WORDS) {
    if (subjectWords.includes(dw)) {
      if (!titleTokens.includes(dw) && !normTitle.includes(dw)) {
        return false; // Subject is specific to this language/tech, title doesn't have it -> REJECT
      }
    }
  }

  // Also vice versa: if title has a distinctive word like "cpp", but subject does not -> REJECT
  for (const dw of DISTINCTIVE_WORDS) {
    if (titleTokens.includes(dw)) {
      if (!subjectWords.includes(dw)) {
        return false;
      }
    }
  }

  // If both share a distinctive technical keyword (e.g. java, cpp, python), it's a confirmed match
  const sharedDistinctive = DISTINCTIVE_WORDS.some(
    (dw) => (subjectWords.includes(dw) || normSubject.includes(dw)) && (titleTokens.includes(dw) || normTitle.includes(dw))
  );
  if (sharedDistinctive) {
    return true;
  }

  // 4. Meaningful words matching:
  // Remove stop words (cong, nghe, hoc, dai, cuong...)
  const meaningfulSubjectWords = subjectWords.filter(
    (w) => w.length >= 3 && !STOP_WORDS.has(w)
  );

  if (meaningfulSubjectWords.length === 0) {
    return false;
  }

  // Check how many meaningful words appear in the title
  const matchedCount = meaningfulSubjectWords.filter(
    (w) => titleTokens.includes(w) || normTitle.includes(w)
  ).length;

  if (meaningfulSubjectWords.length === 1) {
    // Only 1 significant keyword (e.g., 'java', 'triet', 'logic')
    return titleTokens.includes(meaningfulSubjectWords[0]) || normTitle.includes(meaningfulSubjectWords[0]);
  }

  // For multi-word subjects (e.g., 'co so du lieu huong doi tuong'):
  // At least 2 meaningful words must match and >= 60% of significant words
  return matchedCount >= 2 && matchedCount / meaningfulSubjectWords.length >= 0.6;
}

/**
 * Rank and annotate quizzes according to a student's exam schedules.
 * Ensures only real matches get highlighted with exam dates.
 */
export function rankQuizzesBySchedule(
  quizzes: QuizItem[],
  schedules: ScheduleItem[]
): RecommendedQuiz[] {
  if (!schedules || schedules.length === 0) {
    return quizzes.map((q) => ({ ...q, isRecommended: false }));
  }

  const annotated: RecommendedQuiz[] = quizzes.map((quiz) => {
    let bestMatch: ScheduleItem | undefined = undefined;
    let maxPriority = 0;

    for (const schedule of schedules) {
      if (isQuizMatchingSubject(quiz, schedule.subject)) {
        let priority = 10; // Base match

        if (schedule.status === "today") {
          priority = 100; // Exam is today
        } else if (schedule.status === "upcoming") {
          priority = 50;  // Upcoming exam
        } else {
          priority = 20;  // Passed exam
        }

        if (priority > maxPriority) {
          maxPriority = priority;
          bestMatch = schedule;
        }
      }
    }

    if (bestMatch) {
      return {
        ...quiz,
        isRecommended: true,
        matchedSubject: bestMatch,
        recommendPriority: maxPriority,
      };
    }

    return {
      ...quiz,
      isRecommended: false,
      recommendPriority: 0,
    };
  });

  // Sort so highest recommendPriority is first, fallback to id desc
  return annotated.sort((a, b) => {
    const diff = (b.recommendPriority || 0) - (a.recommendPriority || 0);
    if (diff !== 0) return diff;
    return b.id - a.id;
  });
}
