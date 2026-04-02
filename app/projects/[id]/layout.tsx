import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '../../../lib/prisma';
import { ProjectPermissionsProvider, PermissionsMap } from '../../../contexts/project-permissions-context';

// Sub-route segments that are NOT project IDs
const RESERVED = [
    'reportes', 'construction', 'operations', 'documentation',
    'tasks', 'model', 'board', 'desing', 'shop', 'warehouse',
    'accounting', 'undefined', 'null'
];

export default async function ProjectIdLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Skip guard for reserved keywords (child pages handle these)
    if (!id || RESERVED.includes(id)) {
        return <>{children}</>;
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/');
    }

    // Fetch project + user email concurrently
    const [project, user] = await Promise.all([
        prisma.project.findUnique({ where: { id }, select: { id: true, authorId: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    ]);

    // Project doesn't exist → let page handle "not found"
    if (!project) {
        return (
            <ProjectPermissionsProvider isAuthor={false} permissions={{}}>
                {children}
            </ProjectPermissionsProvider>
        );
    }

    // Author has full access — no DB permission lookup needed
    if (project.authorId === userId) {
        return (
            <ProjectPermissionsProvider isAuthor={true} permissions={{}}>
                {children}
            </ProjectPermissionsProvider>
        );
    }

    // Check collaboration access
    let collabContact: { permissions: unknown } | null = null;
    if (user?.email) {
        collabContact = await prisma.projectContact.findFirst({
            where: {
                projectId: id,
                contact: {
                    email: { equals: user.email, mode: 'insensitive' },
                    type: { equals: 'personal', mode: 'insensitive' },
                    status: 'active',
                },
            },
        }) as any;
    }

    // Not a collaborator → deny
    if (!collabContact) {
        redirect('/projects?access=denied');
    }

    const permissions = ((collabContact as any)?.permissions ?? {}) as PermissionsMap;

    return (
        <ProjectPermissionsProvider isAuthor={false} permissions={permissions}>
            {children}
        </ProjectPermissionsProvider>
    );
}
