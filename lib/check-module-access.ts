import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from './prisma';

// Maps URL route segment → permission key
export const MODULE_PERMISSION_MAP: Record<string, string | null> = {
    board: 'board',
    desing: 'design',        // Note: typo in route name is intentional (existing route)
    construction: 'construction',
    operations: 'operations',
    shop: 'purchasing',
    warehouse: 'warehouses',
    accounting: 'accounting',
    documentation: 'documents',
    tasks: 'tasks',
    model: null,             // author-only, already blocked at [id]/layout level
    reportes: null,          // always allowed for collaborators
};

/**
 * Server-side guard that checks if the current user has `view` permission
 * for a given module within a project. Call from module-level layout.tsx files.
 * 
 * - Authors always pass.
 * - Collaborators must have permissions[permissionKey].view === true.
 * - Unknown users are redirected to /login.
 * - Unauthorized collaborators are redirected to /projects/[projectId].
 */
export async function checkModuleAccess(projectId: string, routeSegment: string): Promise<void> {
    const permissionKey = MODULE_PERMISSION_MAP[routeSegment] ?? null;

    // No permission restriction for this module (e.g. reportes)
    if (permissionKey === null) return;

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) redirect('/login');

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { authorId: true },
    });

    if (!project) return; // let page handle not-found

    // Authors always have access
    if (project.authorId === userId) return;

    // Collaborator — fetch their permissions
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
    });

    if (!user?.email) redirect(`/projects/${projectId}`);

    const contact = await prisma.projectContact.findFirst({
        where: {
            projectId,
            contact: {
                email: { equals: user.email, mode: 'insensitive' },
                type: { equals: 'personal', mode: 'insensitive' },
                status: 'active',
            },
        },
    }) as any;

    if (!contact) redirect(`/projects/${projectId}`);

    const perms = contact.permissions ?? {};
    const hasView = perms[permissionKey]?.view === true;

    if (!hasView) {
        redirect(`/projects/${projectId}?module_denied=${routeSegment}`);
    }
}
