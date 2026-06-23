import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

interface Option {
    id: number;
    option_text: string;
    order: number;
    is_correct?: boolean | number;
}

interface Question {
    id: number;
    question_text: string;
    type: string;
    options: Option[];
}

interface QuizState {
    attemptId: number | null;
    questions: Question[];
    answers: Record<number, number>; // question_id -> option_id
    remainingTime: number | null;
    elapsedTime: number;
    status: 'idle' | 'doing' | 'submitted';
    isPractice: boolean;
    
    startQuiz: (quizId: number, mode: string, unlimited?: boolean) => Promise<void>;
    retryWrong: (oldAttemptId: number) => Promise<any>;
    clearWrongAnswers: () => Promise<void>;
    resumeQuiz: (attemptId: number) => Promise<void>;
    selectAnswer: (questionId: number, optionId: number) => Promise<void>;
    submitQuiz: () => Promise<any>;
    tick: () => void;
    clearQuiz: () => void;
}

export const useQuizStore = create<QuizState>()(
    persist(
        (set, get) => ({
            attemptId: null,
            questions: [],
            answers: {},
            remainingTime: null,
            elapsedTime: 0,
            status: 'idle',
            isPractice: false,

            startQuiz: async (quizId, mode, unlimited = false) => {
                const { data } = await api.post('/attempts/start', { quiz_id: quizId, mode, unlimited });
                if (data.success) {
                    set({
                        attemptId: data.data.attempt_id,
                        questions: data.data.questions,
                        remainingTime: data.data.remaining_time,
                        elapsedTime: data.data.elapsed_time || 0,
                        answers: {},
                        status: 'doing',
                        isPractice: data.data.mode === 'practice',
                    });
                }
            },

            resumeQuiz: async (attemptId) => {
                const { data } = await api.get(`/attempts/${attemptId}/resume`);
                if (data.success) {
                    set({
                        attemptId: data.data.attempt_id,
                        remainingTime: data.data.remaining_time,
                        elapsedTime: data.data.elapsed_time || 0,
                        answers: data.data.answers,
                        status: 'doing',
                        isPractice: data.data.mode === 'practice',
                    });
                }
            },

            retryWrong: async (oldAttemptId: number) => {
                const { data } = await api.post(`/attempts/${oldAttemptId}/retry-wrong`);
                if (data.success) {
                    set({
                        attemptId: data.data.attempt_id,
                        status: 'doing',
                        questions: data.data.questions || [],
                        answers: data.data.answers ? { ...data.data.answers } : {},
                        remainingTime: data.data.remaining_time,
                        elapsedTime: data.data.elapsed_time || 0,
                        isPractice: data.data.mode === 'practice',
                    });
                    return data.data;
                }
                return null;
            },

            clearWrongAnswers: async () => {
                const { attemptId, status } = get();
                if (status !== 'doing' || !attemptId) return;

                try {
                    const { data } = await api.post(`/attempts/${attemptId}/clear-wrong`);
                    if (data.success) {
                        set({
                            answers: data.data.answers ? { ...data.data.answers } : {}
                        });
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa đáp án sai:", error);
                    throw error;
                }
            },

            selectAnswer: async (questionId, optionId) => {
                const { attemptId, status } = get();
                if (status !== 'doing' || !attemptId) return;

                // Optimistic update UI
                set((state) => ({
                    answers: { ...state.answers, [questionId]: optionId }
                }));

                // Send to backend
                try {
                    await api.post(`/attempts/${attemptId}/answer`, {
                        question_id: questionId,
                        option_id: optionId
                    });
                } catch (e) {
                    // Nếu lỗi có thể rollback state, nhưng tạm thời để đơn giản
                    console.error("Lỗi lưu đáp án", e);
                }
            },

            submitQuiz: async () => {
                const { attemptId, status } = get();
                if (status !== 'doing' || !attemptId) return null;

                try {
                    const { data } = await api.post(`/attempts/${attemptId}/submit`);
                    if (data.success) {
                        set({ status: 'submitted' });
                        return data.data; // Trả về object result
                    }
                } catch (e: any) {
                    console.error("Lỗi nộp bài", e);
                    throw new Error(e.response?.data?.message || e.message || "Lỗi nộp bài");
                }
            },

            tick: () => {
                const { remainingTime, elapsedTime, status } = get();
                if (status === 'doing') {
                    if (remainingTime !== null && remainingTime > 0) {
                        const newTime = remainingTime - 1;
                        set({ remainingTime: newTime });
                        if (newTime === 0) {
                            get().submitQuiz();
                        }
                    } else if (remainingTime === null) {
                        set({ elapsedTime: elapsedTime + 1 });
                    }
                }
            },

            clearQuiz: () => {
                set({
                    attemptId: null,
                    questions: [],
                    answers: {},
                    remainingTime: null,
                    elapsedTime: 0,
                    status: 'idle',
                    isPractice: false,
                });
            }
        }),
        {
            name: 'quiz-storage',
            partialize: (state) => ({ 
                attemptId: state.attemptId, 
                answers: state.answers, 
                status: state.status,
                remainingTime: state.remainingTime,
                elapsedTime: state.elapsedTime,
                questions: state.questions,
                isPractice: state.isPractice
            }),
        }
    )
);
