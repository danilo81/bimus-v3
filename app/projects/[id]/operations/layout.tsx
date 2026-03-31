import { checkModuleAccess } from '@/lib/check-module-access';

export default async function OperationsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;
    await checkModuleAccess(id, 'operations');
    return <>{children}</>;
}
