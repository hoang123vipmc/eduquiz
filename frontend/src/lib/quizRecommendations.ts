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
 * Remove Vietnamese accents and special characters for fuzzy string comparison
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if a quiz matches a subject name
 */
export function isQuizMatchingSubject(quiz: QuizItem, subject: string): boolean {
  if (!subject) return false;
  
  const normSubject = normalizeVietnamese(subject);
  if (!normSubject) return false;

  const subjectTokens = normSubject.split(" ").filter(w => w.length > 2);
  const quizText = normalizeVietnamese(
    `${quiz.title || ""} ${quiz.description || ""} ${quiz.category?.name || ""}`
  );

  // Direct substring check
  if (quizText.includes(normSubject)) {
    return true;
  }

  // Token matching: if at least 2 key words match, or single distinctive subject word matches (e.g. 'java', 'python')
  const distinctiveWords = ["java", "python", "php", "c#", "c++", "linux", "cloud", "ai", "sql", "iot"];
  for (const token of subjectTokens) {
    if (distinctiveWords.includes(token) && quizText.includes(token)) {
      return true;
    }
  }

  if (subjectTokens.length >= 2) {
    const matchedCount = subjectTokens.filter(token => quizText.includes(token)).length;
    // Over 60% of significant words in the subject name matched
    if (matchedCount / subjectTokens.length >= 0.6) {
      return true;
    }
  }

  return false;
}

/**
 * Rank and annotate quizzes according to a student's exam schedules
 */
export function rankQuizzesBySchedule(quizzes: QuizItem[], schedules: ScheduleItem[]): RecommendedQuiz[] {
  if (!schedules || schedules.length === 0) {
    return quizzes.map(q => ({ ...q, isRecommended: false }));
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
          priority = 20;  // Completed / general course
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
