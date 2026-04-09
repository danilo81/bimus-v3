'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

async function getAuthUserId() {
    const cookieStore = await cookies();
    return cookieStore.get('userId')?.value;
}

export async function createBimIssue(data: {
    projectId: string;
    elementId: string;
    elementName?: string;
    title: string;
    description: string;
}) {
    try {
        const userId = await getAuthUserId();
        
        const issue = await prisma.bimIssue.create({
            data: {
                projectId: data.projectId,
                elementId: data.elementId,
                elementName: data.elementName,
                title: data.title,
                description: data.description,
                status: 'pendiente',
                authorId: userId
            }
        });
        
        revalidatePath(`/projects/${data.projectId}/model`);
        revalidatePath(`/projects/${data.projectId}/design`);
        
        return { success: true, issue };
    } catch (error: any) {
        console.error('Error creating BIM issue:', error);
        return { success: false, error: error.message };
    }
}

export async function getBimIssues(projectId: string) {
    try {
        const issues = await prisma.bimIssue.findMany({
            where: { projectId },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return { success: true, issues: JSON.parse(JSON.stringify(issues)) };
    } catch (error: any) {
        console.error('Error fetching BIM issues:', error);
        return { success: false, error: error.message };
    }
}

export async function updateBimIssueStatus(issueId: string, status: string) {
    try {
        const issue = await prisma.bimIssue.update({
            where: { id: issueId },
            data: { status }
        });
        
        revalidatePath(`/projects/${issue.projectId}/model`);
        
        return { success: true, issue };
    } catch (error: any) {
        console.error('Error updating BIM issue status:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteBimIssue(issueId: string) {
    try {
        const issue = await prisma.bimIssue.delete({
            where: { id: issueId }
        });
        
        revalidatePath(`/projects/${issue.projectId}/model`);
        
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting BIM issue:', error);
        return { success: false, error: error.message };
    }
}
