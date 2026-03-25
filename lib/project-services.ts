
import { Project, Level } from './types';
import projectData from './placeholder-images.json';

const PROJECTS_KEY = 'project_showcase_projects';

const mockLevelNames = ['Fundaciones', 'Nivel 1', 'Nivel 2', 'Nivel 3'];
const makeMockLevels = (projectId: string): Level[] =>
    mockLevelNames.map((name, i) => ({
        id: `l-${projectId}-${i}`,
        name,
        projectId,
    }));

// Initial projects from placeholder data
const initialProjects: Project[] = projectData.placeholderImages.map((img, index) => {
    const projectId = `p-${index}`;
    return {
        id: projectId,
        title: img.description.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: `A state-of-the-art ${img.description.toLowerCase()} designed for modern businesses. Built with cutting-edge technologies and user-centric design principles.`,
        imageUrl: img.imageUrl,
        links: [
            { label: 'View Demo', url: '#' },
            { label: 'GitHub', url: '#' }
        ],
        authorId: 'system',
        createdAt: new Date().toISOString(),
        levels: makeMockLevels(projectId),
        status: 'activo',
        config: {
            id: `c-${projectId}`,
            utility: 10,
            adminExpenses: 5,
            iva: 13,
            it: 3,
            socialCharges: 55,
            toolWear: 3,
            exchangeRate: 6.96,
            financing: 0,
            guaranteeRetention: 7,
            projectId: projectId
        }
    };
});

export const ProjectService = {
    getAll: (): Project[] => {
        if (typeof window === 'undefined') return initialProjects;
        const saved = localStorage.getItem(PROJECTS_KEY);
        return saved ? JSON.parse(saved) : initialProjects;
    },

    getById: (id: string): Project | undefined => {
        return ProjectService.getAll().find(p => p.id === id);
    },

    create: (project: Omit<Project, 'id' | 'createdAt'>): Project => {
        const newProject: Project = {
            ...project,
            id: `p-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
        };
        const projects = ProjectService.getAll();
        localStorage.setItem(PROJECTS_KEY, JSON.stringify([...projects, newProject]));
        return newProject;
    },

    update: (id: string, project: Partial<Project>): Project => {
        const projects = ProjectService.getAll();
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Project not found');

        const updated = { ...projects[index], ...project };
        projects[index] = updated;
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        return updated;
    },

    delete: (id: string): void => {
        const projects = ProjectService.getAll().filter(p => p.id !== id);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
};
