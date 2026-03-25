import { checkModuleAccess } from '../../../../lib/check-module-access';

export default async function BoardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;
    await checkModuleAccess(id, 'board');
    return <>{children}</>;
}
