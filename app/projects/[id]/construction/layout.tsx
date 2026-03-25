import { checkModuleAccess } from '../../../../lib/check-module-access';

export default async function ConstructionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;
    await checkModuleAccess(id, 'construction');
    return <>{children}</>;
}
