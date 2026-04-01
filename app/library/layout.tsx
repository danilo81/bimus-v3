import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LibraryLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    return (
        <main className="flex-1 overflow-y-auto">
            {children}
        </main>
    );
}
