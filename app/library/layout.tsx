
"use client";

export default function LibraryLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
    );
}
