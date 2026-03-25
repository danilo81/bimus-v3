"use client";

import { createContext, useContext, ReactNode } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ModuleId =
    | 'board'
    | 'design'
    | 'construction'
    | 'operations'
    | 'purchasing'
    | 'warehouses'
    | 'accounting'
    | 'documents'
    | 'tasks';

export interface ModulePermission {
    view: boolean;
    edit: boolean;
}

export type PermissionsMap = Partial<Record<ModuleId, ModulePermission>>;

export interface ProjectPermissionsValue {
    isAuthor: boolean;
    permissions: PermissionsMap;
    canView: (moduleId: ModuleId | null) => boolean;
    canEdit: (moduleId: ModuleId | null) => boolean;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const ProjectPermissionsContext = createContext<ProjectPermissionsValue>({
    isAuthor: false,
    permissions: {},
    canView: () => true,
    canEdit: () => false,
});

// ─── Provider ──────────────────────────────────────────────────────────────────

interface ProjectPermissionsProviderProps {
    isAuthor: boolean;
    permissions: PermissionsMap;
    children: ReactNode;
}

export function ProjectPermissionsProvider({
    isAuthor,
    permissions,
    children,
}: ProjectPermissionsProviderProps) {
    const canView = (moduleId: ModuleId | null): boolean => {
        if (isAuthor || moduleId === null) return true;
        return permissions[moduleId]?.view === true;
    };

    const canEdit = (moduleId: ModuleId | null): boolean => {
        if (isAuthor || moduleId === null) return true;
        return permissions[moduleId]?.edit === true;
    };

    return (
        <ProjectPermissionsContext.Provider value={{ isAuthor, permissions, canView, canEdit }}>
            {children}
        </ProjectPermissionsContext.Provider>
    );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useProjectPermissions() {
    return useContext(ProjectPermissionsContext);
}
