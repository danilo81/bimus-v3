
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated || user?.role !== 'admin') {
                router.push('/dashboard');
            }
        }
    }, [user, loading, isAuthenticated, router]);

    if (loading || !isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                    Verificando credenciales de seguridad...
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Navbar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
