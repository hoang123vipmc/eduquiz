# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are university students, college students, and test takers (e.g. university students preparing for semester exams like HUBT coursework, IoT, MIS, general subjects, and certification candidates) who need to rapidly convert syllabus question sheets (.docx, raw text) into interactive quiz practice sets.

Their situation:
- Studying under time pressure before midterm and final exams.
- Possessing long question lists or syllabus documents with multiple-choice questions without an easy way to self-test.
- Seeking quick feedback, repetition of missed questions, and motivation through streaks and performance metrics.

## Product Purpose

EduQuiz exists to make exam preparation fast, intuitive, and highly effective by turning static question banks and study guides into interactive practice and testing environments.

Success means:
- Frictionless import from Word documents (.docx) and raw text into fully configured quizzes in seconds.
- High engagement during study sessions through instant feedback (practice mode), realistic timed simulations (exam mode), and targeted review of incorrect answers.
- Clear sense of academic progress via streak tracking, accuracy statistics, and competitive leaderboards.

## Positioning

Unlike complex enterprise Learning Management Systems (LMS) or generic flashcard apps, EduQuiz is optimized specifically for rapid syllabus-to-quiz ingestion with automated parsing of Vietnamese question formats (`Câu X:`, `A.`, `B.`, `=> Đáp án:`, etc.), accompanied by instant self-grading and a focused, distraction-free study interface.

## Operating Context

- **Workflow**:
  1. Upload or paste study syllabus / question banks (`.docx` or text).
  2. Inspect and confirm question format preview.
  3. Start practice mode (instant answer reveal, review explanations, redo mistakes) or exam mode (countdown timer, realistic test conditions).
  4. Review comprehensive result breakdown: scores, timing, accuracy, question-by-question explanations, and retry wrong questions.
  5. Monitor long-term retention and consistency via stats, streaks, and leaderboards.
- **Environment**: Modern web browsers on desktop laptops and mobile smartphones.
- **Typical Session**: 15 to 45 minutes of intensive quiz repetition, often in evenings or study groups before test day.

## Capabilities and Constraints

- **Core Capabilities**:
  - Word (.docx) and text parsing supporting Vietnamese exam conventions.
  - Two primary quiz modes: Practice Mode (real-time feedback & immediate explanations) and Exam Mode (strict countdown timer, hidden answers until submission).
  - Flexible quiz options: shuffle questions, shuffle options, auto-advance on answer selection, unlimited vs timed mode.
  - In-depth Quiz Result Analysis with full answer review, filterable by correct/incorrect/skipped.
  - Question bank management with pagination and search.
  - Gamified Leaderboard with rankings and user statistics (accuracy, study time, streak days).
  - Full Responsive layout with mobile drawer navigation.
- **Technical Architecture**:
  - Frontend: Next.js 15 (Turbopack, App Router), React 19, Tailwind CSS v4, Zustand, Lucide Icons, Recharts. Deployed on Vercel (`eduquiz-delta.vercel.app`).
  - Backend: Laravel 11 / PHP 8.4 REST API with Laravel Sanctum authentication. Dockerized and deployed on Render.
  - Database: Relational DB (PostgreSQL / MySQL / SQLite support).

## Brand Commitments

- **Name**: EduQuiz (EQ)
- **Tagline**: Học tập thông minh.
- **Aesthetic Direction**: Sáng sủa, giáo dục thân thiện (Friendly Educational / Clean Modern Light Mode as primary orientation, supported by sleek dark themes).
- **Tone & Voice**: Khích lệ, chuyên nghiệp, gọn gàng, tôn trọng thời gian của người học.

## Evidence on Hand

- Live web application deployed at: `https://eduquiz-delta.vercel.app`
- GitHub repository: `https://github.com/hoang123vipmc/eduquiz`
- Real syllabus test files: `de_cuong.docx`, `de_cuong.txt`, `sample_data.json`

## Product Principles

1. **Zero-friction Ingestion**: Creating a quiz from existing notes or syllabus files must take less than 30 seconds with intelligent format tolerance.
2. **Actionable Feedback Over Mere Scoring**: Test results must clearly guide the student on what they got wrong, why, and offer instant one-click remediation ("Làm lại câu sai").
3. **Focused Study Ergonomics**: The quiz interface must eliminate unnecessary visual noise, allowing rapid keyboard navigation (`ArrowLeft` / `ArrowRight`) and quick option selection.
4. **Friendly & Inviting Aesthetics**: The interface should feel clean, bright, and encouraging rather than intimidating or clinical.

## Accessibility & Inclusion

- Responsive layout adapted for mobile and desktop screens.
- Clear visual hierarchy with distinct contrast between correct (emerald), wrong (rose), and selected options.
- Keyboard accessible navigation for test taking.
