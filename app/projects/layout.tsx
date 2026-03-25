
"use client";

import { DotPattern } from '@/components/ui/dot-pattern';
import { Navbar } from '../../components/layout/Navbar';
import { cn } from '@/lib/utils';

export default function ProjectLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Navbar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
