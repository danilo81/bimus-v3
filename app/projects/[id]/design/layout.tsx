import { checkModuleAccess } from '../../../../lib/check-module-access';

export default async function DesingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;
    await checkModuleAccess(id, 'design');
    return <>{children}</>;
}
