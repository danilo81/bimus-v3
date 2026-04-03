import { checkModuleAccess } from '@/lib/check-module-access';

export default async function DocumentationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await checkModuleAccess(id, 'documentation');
    } catch (error) {
        console.error("Documentation Access Check Error:", error);
    }
    return <>{children}</>;
}
