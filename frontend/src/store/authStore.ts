import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    avatar: string | null;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (token, user) => {
                localStorage.setItem('auth_token', token);
                set({ user, token, isAuthenticated: true });
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (e) {
                    // Bỏ qua lỗi mạng khi logout
                }
                localStorage.removeItem('auth_token');
                set({ user: null, token: null, isAuthenticated: false });
            },

            checkAuth: async () => {
                const { token } = get();
                if (!token) return;

                try {
                    const response = await api.get('/user');
                    if (response.data.success) {
                        set({ user: response.data.data, isAuthenticated: true });
                    }
                } catch (error) {
                    get().logout();
                }
            },
            
            updateUser: (data) => {
                const current = get().user;
                if (current) {
                    set({ user: { ...current, ...data } });
                }
            }
        }),
        {
            name: 'auth-storage', // Tên key trong localStorage
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
