
"use client";

import { useState, useEffect } from 'react';
import { User, UserRole } from '../types/types';
import { useRouter } from 'next/navigation';
import { logout as serverLogout } from '@/actions';

const AUTH_KEY = 'project_showcase_auth';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const saved = localStorage.getItem(AUTH_KEY);
        if (saved) {
            setUser(JSON.parse(saved));
        }
        setLoading(false);
    }, []);

    const login = (userData: User) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = async () => {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
        await serverLogout();
        router.push('/');
    };

    const updateUser = (userData: User) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        setUser(userData);
    };

    const hasRole = (roles: UserRole[]) => {
        return user && roles.includes(user.role);
    };

    return {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        hasRole,
    };
}
