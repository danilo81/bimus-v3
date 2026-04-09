import { SVGProps } from "react";

export type UserRole = "admin" | "editor" | "viewer";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    storageLimit?: string; // e.g. "1GB"
    telefono?: string;
    cargo?: string;
}

export interface ProjectConfig {
    id: string;
    utility: number;
    adminExpenses: number;
    iva: number;
    it: number;
    socialCharges: number;
    toolWear: number;
    exchangeRate: number;
    financing: number;
    guaranteeRetention: number;
    mainCurrency?: string;
    secondaryCurrency?: string;
    workingDays?: number;
    workingDaysSelection?: number[];
    projectId: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    links: {
        label: string;
        url: string;
    }[];
    authorId: string | null;
    createdAt: string;
    startDate?: string | null;
    config?: ProjectConfig | null;
    client?: string | null;
    location?: string | null;
    projectType?: string | null;
    area?: number | null;
    status?: 'activo' | 'espera' | 'finalizado' | 'construccion' | null;
    team?: Contact[] | null;
    levels?: Level[] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?: any[] | null;
}

export interface CreateProjectData {
    title: string;
    description: string;
    client: string;
    location: string;
    projectType: string;
    area: number;
    status: 'activo' | 'espera' | 'finalizado' | 'construccion';
    imageUrl: string;
    config?: Partial<ProjectConfig>;
}

export type ContactType = "cliente" | "proveedor" | "personal";
export type ContactStatus = "active" | "inactive";

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    swiftCode?: string | null;
    isPreferred: boolean;
    contactId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: ContactType;
    status: ContactStatus;
    company?: string;
    nit?: string;
    address?: string;
    notes?: string;
    userId: string;
    bankAccounts?: BankAccount[];
    createdAt?: Date;
    updatedAt?: Date;
    addedBy?: string; // Nombre del usuario que vinculó este contacto al proyecto
}

export type TaskStatus = "pendiente" | "enprogreso" | "completado";
export type TaskPriority = "baja" | "media" | "alta";

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    assignee: string;
    projectId?: string;
    userId?: string;
}

export interface SupplyCost {
    id: string;
    supplyId: string;
    supplierId: string;
    price: number;
    date: string;
    isPreferred: boolean;
    notes?: string;
    supplier?: Contact;
}

export interface Supply {
    id: string;
    typology: string;
    description: string;
    unit: string;
    price: number;
    updatedAt?: string;
    userId?: string;
    tag?: string;
    costs?: SupplyCost[];
}

export interface QualityControl {
    id: string;
    description: string;
    itemId: string;
    subPoints: {
        id: string;
        description: string;
    }[];
}

export interface ConstructionItem {
    id: string;
    chapter: string;
    description: string;
    unit: string;
    performance: number;
    directCost: number;
    total: number;
    userId: string;
    supplies?: {
        id: string;
        description: string;
        unit: string;
        price: number;
        quantity: number;
        subtotal: number;
        typology: string;
    }[];
    qualityControls?: QualityControl[];
}

export interface UnitOfMeasure {
    id: string;
    name: string;
    abbreviation: string;
    magnitude: string;
}

export interface Chapter {
    id: string;
    name: string;
}

export interface SiteLogEntry {
    id: string;
    date: string;
    author: string;
    type: 'info' | 'incident' | 'milestone';
    content: string;
    observations?: string;
}
export interface Level {
    id: string;
    name: string;
    projectId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type AssetStatus = "disponible" | "en_uso" | "mantenimiento" | "baja";

export interface FixedAsset {
    id: string;
    name: string;
    code: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchasePrice: number;
    purchaseDate: string;
    location?: string;
    status: AssetStatus;
    userId?: string;
    projectId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isRead: boolean;
    createdAt: string;
}

export type BimTopicStatus = 'in_progress' | 'reviewed' | 'approved';

export interface BimTopic {
    id: string;
    documentId: string;
    parentId?: string | null;
    title: string;
    content?: string | null;
    order: number;
    status: BimTopicStatus;
    children?: BimTopic[];
    createdAt?: string;
    updatedAt?: string;
}

export interface BimTopic {
    id: string;
    documentId: string;
    parentId?: string | null;
    title: string;
    content?: string | null;
    order: number;
    status: BimTopicStatus;
    children?: BimTopic[];
    createdAt?: string;
    updatedAt?: string;
}

export interface BimBranch {
    id: string;
    projectId: string;
    name: string;
    isMain: boolean;
    createdAt: string;
}

export interface BimVersion {
    id: string;
    branchId: string;
    authorId: string;
    authorName: string;
    message: string;
    hash: string;
    createdAt: string;
}

export interface ProjectItem {
    id: string;
    projectId: string;
    itemId: string;
    quantity: number;
    progress: number;
    performance?: number | null;
    extraDays?: number;
    ganttStatus?: string;
    item?: ConstructionItem;
    levelQuantities?: any[];
}

export interface ProjectDocument {
    id: string;
    projectId: string;
    name: string;
    type: string;
    size: number;
    url: string;
    folder: string;
    isFolder: boolean;
    bimRole?: string | null;
    source: 'local' | 'google_drive';
    status: string;
    authorName: string;
    createdAt: string;
    updatedAt?: string;
}

export interface PurchaseOrder {
    id: string;
    number: string;
    projectId: string;
    supplierId: string;
    authorId: string;
    status: string;
    totalAmount: number;
    paymentType?: string;
    dueDate?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface WarehouseMovement {
    id: string;
    projectId: string;
    supplyId: string;
    authorId: string;
    quantity: number;
    type: 'entry' | 'exit' | 'adjustment';
    reference?: string;
    createdAt?: string;
    updatedAt?: string;
}


export interface WarehouseItem {
    supplyId: string;
    quantity: number;
    itemId?: string;
    levelId?: string;
}

export interface CreateWarehouseMovementData {
    projectId: string;
    purchaseOrderId?: string;
    items: WarehouseItem[];
    notes?: string;
}



/// <reference types="@react-three/fiber" />

export interface BimClass {
    id: string;
    name: string;
    parentId: string | null;
}

export interface WallLayer {
    id: string;
    name: string;
    isCore: boolean;
    function: string;
    bimClass: string;
    material: string;
    thickness: number;
    lambda: number;
}

export interface WallType {
    id: string;
    name: string;
    type: 'standard' | 'curtain';
    layers: WallLayer[];
    totalThickness: number;
    height: number;
    topBound: string;
    bottomBound: string;
    topOffset: number;
    bottomOffset: number;
    caps: string;
    bimClass: string;
}

export interface SlabLayer {
    id: string;
    name: string;
    isCore: boolean;
    function: string;
    bimClass: string;
    material: string;
    thickness: number;
    lambda: number;
}

export interface SlabType {
    id: string;
    name: string;
    layers: SlabLayer[];
    totalThickness: number;
    datum: 'top' | 'bottom';
    bimClass: string;
}

export interface LineType {
    id: string;
    name: string;
    color: string;
    thickness: number;
    segmentation: number[];
}

export interface Level {
    id: string;
    name: string;
    isStory: boolean;
    elevation: number;
    defaultWallHeight: number;
    cutPlane: number;
}

export interface ScaleSettings {
    type: 'imperial' | 'metric' | 'enlargement' | 'paper';
    value: string;
    precision: number;
    allLayers: boolean;
    scaleText: boolean;
}

export interface ArcConfig {
    creationMode: 'centerRadiusPoints' | 'startChordEnd' | 'startTangentEnd' | 'centerStartEnd';
    lineColor: string;
    opacity: number;
    lineType: string;
    bimClass: string;
}

export interface SavedView {
    id: string;
    name: string;
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
}

export interface IssueNote {
    id: string;
    elementId: string;
    elementName?: string;
    title: string;
    description: string;
    createdAt: number;
    status: 'open' | 'resolved';
}

export interface BimElement {
    id: string;
    category: string;
    name: string;
    level: string;
    bimClass?: string;
    wallTypeId?: string;
    slabTypeId?: string;
    visibility?: 'visible' | 'hidden' | 'xray';
    material: string;
    volume: number;
    area: number;
    color: string;
    lineColor?: string;
    lineType?: string;
    lineWidth?: number;
    fillType?: 'solid' | 'gradient' | 'texture' | 'hatch';
    fillColor2?: string;
    textureUrl?: string;
    hatchType?: string;
    opacity?: number;
    origin?: 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';
    groupId?: string;
    locked?: boolean;
    geometry: {
        type: 'box' | 'cylinder' | 'line' | 'rectangle' | 'polygon' | 'arc' | 'ifc' | 'slab';
        args: [number, number, number] | [number, number, number, number] | [number, number, number, number, number, number] | number[] | any;
        position: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number];
    };
}
