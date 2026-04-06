"use client";

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../../components/ui/table';
import {
    Card,
    CardContent,
    CardDescription
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
    Users,
    Search,
    Plus,
    MoreVertical,
    Mail,
    Phone,
    Building2,
    Trash2,
    Edit,
    UserCircle,
    Loader2,
    UserPlus,
    X,
    Save,
    Landmark,
    Star,
    Check,
    ArrowRight,
    MapPin,
    Hash,
    Clock,
    Wallet,
    Folder,
    Banknote,
    FileText,
    History,
    DollarSign,
    Upload,
    ArrowDownLeft,
    ArrowUpRight,
    Lock
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../../components/ui/select';
import { Contact, ContactType } from '../../../types/types';
import { useToast } from '../../../hooks/use-toast';
import { Separator } from '../../../components/ui/separator';
import { getContacts, createContact, updateContact, deleteContact, createBankAccount, updateBankAccount, deleteBankAccount, getContactAccountingInfo } from '@/actions';
import { ScrollArea, ScrollBar } from '../../../components/ui/scroll-area';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { getContactDocumentUploadUrl, deleteContactDocument, getContactDocuments } from '@/actions/contacts/contact-documents';
import { getStorageStats } from "@/actions/auth/getStorageStats";
import { Progress } from "../../../components/ui/progress";
import { useRef } from 'react';

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [accountingInfo, setAccountingInfo] = useState<any>(null);
    const [isLoadingAccounting, setIsLoadingAccounting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [storageStats, setStorageStats] = useState<{ used: number; total: number; percentage: number } | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        nit: '',
        address: '',
        type: 'cliente' as ContactType,
        status: 'active' as 'active' | 'inactive',
        notes: ''
    });

    const [profileFormData, setProfileFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        nit: '',
        address: '',
        type: 'cliente' as ContactType,
        status: 'active' as 'active' | 'inactive',
        notes: ''
    });

    const [isBankFormOpen, setIsBankFormOpen] = useState(false);
    const [editingBankId, setEditingBankId] = useState<string | null>(null);
    const [bankFormData, setBankFormData] = useState({
        bankName: '',
        accountNumber: '',
        swiftCode: '',
        isPreferred: false
    });
    const [contactDocuments, setContactDocuments] = useState<any[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
        loadContacts();
        fetchStorageStats();
    }, []);

    async function fetchStorageStats() {
        try {
            const res = await getStorageStats();
            setStorageStats({
                used: res.used ?? 0,
                total: res.total ?? 1024 * 1024 * 1024,
                percentage: res.percentage ?? 0
            });
        } catch (e) {
            console.error('Failed to fetch storage stats:', e);
            setStorageStats({
                used: 0,
                total: 1024 * 1024 * 1024,
                percentage: 0
            });
        }
    }

    async function loadContacts() {
        setIsLoading(true);
        try {
            const data = await getContacts();
            setContacts(data as any);
        } catch (error) {
            console.error('Failed to load contacts:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los contactos.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (selectedContact && isProfileDialogOpen) {
            loadAccounting();
            loadDocuments(selectedContact.id);
        }
    }, [selectedContact, isProfileDialogOpen]);

    async function loadAccounting() {
        if (!selectedContact) return;
        setIsLoadingAccounting(true);
        try {
            const info = await getContactAccountingInfo(selectedContact.id);
            setAccountingInfo(info);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingAccounting(false);
        }
    }

    async function loadDocuments(contactId: string) {
        setIsLoadingDocs(true);
        try {
            const docs = await getContactDocuments(contactId);
            setContactDocuments(docs);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingDocs(false);
        }
    }

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedContact) return;
        setIsUploadingDoc(true);
        try {
            const result = await getContactDocumentUploadUrl(
                selectedContact.id,
                file.name,
                file.type || 'application/pdf',
                file.size,
            );
            if (!result.success) throw new Error('Error generando URL de subida');

            // Subir directo a R2
            const uploadRes = await fetch(result.presignedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type || 'application/pdf' },
            });
            if (!uploadRes.ok) throw new Error('Error al subir el archivo');

            toast({ title: 'Documento subido', description: file.name });
            await loadDocuments(selectedContact.id);
            fetchStorageStats();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsUploadingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDocumentDelete = async (docId: string, docName: string) => {
        if (!confirm(`¿Eliminar permanentemente "${docName}"?`)) return;
        try {
            const result = await deleteContactDocument(docId);
            if (!result.success) throw new Error(result.error);
            toast({ title: 'Documento eliminado' });
            setContactDocuments(prev => prev.filter(d => d.id !== docId));
            fetchStorageStats();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    function formatFileSize(bytes: number) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (contact.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || contact.type === activeTab;
        return matchesSearch && matchesTab;
    });

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case 'cliente': return 'default';
            case 'proveedor': return 'secondary';
            case 'personal': return 'outline';
            default: return 'default';
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setProfileFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileSelectChange = (field: string, value: string) => {
        setProfileFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await createContact(formData);
            if (result.success) {
                toast({ title: "Contacto creado" });
                setIsCreateDialogOpen(false);
                setFormData({
                    name: '', email: '', phone: '', company: '', nit: '', address: '', type: 'cliente', status: 'active', notes: ''
                });
                loadContacts();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este contacto?')) return;
        try {
            const result = await deleteContact(id);
            if (result.success) {
                toast({ title: "Contacto eliminado" });
                loadContacts();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const openEditModal = (contact: any) => {
        setSelectedContact(contact);
        setProfileFormData({
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone,
            company: contact.company || '',
            nit: contact.nit || '',
            address: contact.address || '',
            type: contact.type,
            status: contact.status as any,
            notes: contact.notes || ''
        });
        setIsProfileDialogOpen(true);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact) return;
        setIsSubmitting(true);
        try {
            const result = await updateContact(selectedContact.id, profileFormData);
            if (result.success) {
                toast({ title: "Contacto actualizado" });
                setIsProfileDialogOpen(false);
                loadContacts();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBankSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact) return;
        setIsSubmitting(true);
        try {
            let result;
            if (editingBankId) result = await updateBankAccount(editingBankId, bankFormData);
            else result = await createBankAccount({ ...bankFormData, contactId: selectedContact.id });

            if (result.success) {
                toast({ title: "Cuenta procesada" });
                setIsBankFormOpen(false);
                setEditingBankId(null);
                setBankFormData({ bankName: '', accountNumber: '', swiftCode: '', isPreferred: false });
                loadContacts();

                const updated = await getContacts();
                const fresh = updated.find((c: any) => c.id === selectedContact.id);
                if (fresh) setSelectedContact(fresh as any);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBank = async (bankId: string) => {
        if (!confirm('¿Eliminar esta cuenta bancaria?')) return;
        try {
            const result = await deleteBankAccount(bankId);
            if (result.success) {
                toast({ title: "Cuenta eliminada" });
                loadContacts();
                const updated = await getContacts();
                const fresh = updated.find((c: any) => c.id === selectedContact?.id);
                if (fresh) setSelectedContact(fresh as any);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!isMounted) return null;

    if (isLoading && contacts.length === 0) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card w-fit">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" /> Contactos
                    </h1>
                    <p className="text-muted-foreground mt-1 ">Directorio unificado de clientes, proveedores y personal del proyecto.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-muted/50 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, email o empresa..."
                        className="pl-10 bg-background/50 h-11 border-muted/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Tabs value={activeTab} className="hidden lg:block" onValueChange={setActiveTab}>
                        <TabsList className="bg-background/50 border border-muted/50 h-11">
                            <TabsTrigger value="all" className="text-[10px] font-black uppercase px-6 data-[state=active]:bg-card data-[state=active]:text-primary">Todos</TabsTrigger>
                            <TabsTrigger value="cliente" className="text-[10px] font-black uppercase px-6 data-[state=active]:bg-card data-[state=active]:text-primary">Clientes</TabsTrigger>
                            <TabsTrigger value="proveedor" className="text-[10px] font-black uppercase px-6 data-[state=active]:bg-card data-[state=active]:text-primary">Proveedores</TabsTrigger>
                            <TabsTrigger value="personal" className="text-[10px] font-black uppercase px-6 data-[state=active]:bg-card data-[state=active]:text-primary">Personal</TabsTrigger>
                        </TabsList>
                    </Tabs>

                </div>
                <div className="flex items-center gap-4">
                    <Button
                        className="bg-foreground hover:bg-primary/40 text-background font-black text-[10px] uppercase tracking-widest px-8 h-11 cursor-pointer"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Contacto
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-30 h-[60vh]">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Directorio...</p>
                </div>
            ) : filteredContacts.length > 0 ? (
                <Card className="border-accent overflow-y-auto bg-card p-0 max-h-[60vh] w-full">
                    <ScrollArea className="">
                        <CardContent className="p-0">
                            <Table className="tracking-widest">
                                <TableHeader className="bg-accent">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-5 px-8 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Contacto / Empresa</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground text-center">Tipo</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Nit / C.I.</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Ubicación</TableHead>
                                        <TableHead className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Teléfono</TableHead>
                                        <TableHead className="text-right px-8 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredContacts.map((contact) => (
                                        <TableRow key={contact.id} className="hover:bg-muted/20 transition-colors border-accent group ">
                                            <TableCell className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("h-2.5 w-2.5 rounded-full", contact.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-destructive')} />
                                                    <Avatar className="h-11 w-11 rounded-full bg-card flex items-center justify-center text-primary font-black border border-primary/20 text-xl uppercase">
                                                        <AvatarFallback>{contact.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-primary uppercase group-hover:text-primary transition-colors">{contact.name}</span>
                                                        <span className="text-[12px] text-muted-foreground font-medium">{contact.email || 'SIN CORREO REGISTRADO'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={getBadgeVariant(contact.type)} className="text-[10px] font-black uppercase tracking-widest py-0.5 px-2">
                                                    {contact.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[14px] font-black font-mono text-muted-foreground">{contact.nit || '—'}</TableCell>
                                            <TableCell className="text-[14px] font-bold uppercase text-muted-foreground/60 max-w-50 truncate">{contact.address || '—'}</TableCell>
                                            <TableCell className="text-[14px] font-black text-primary font-mono">{contact.phone}</TableCell>
                                            <TableCell className="text-right px-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 cursor-pointer">
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border-accent text-primary  p-1.5 rounded-xl">
                                                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[12px] font-black uppercase tracking-tighter py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary" onClick={() => openEditModal(contact)}>
                                                            <Edit className="h-3.5 w-3.5" /> Editar Perfil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-[12px] font-black uppercase tracking-tighter py-2.5 rounded-lg mt-1" onClick={() => handleDelete(contact.id)}>
                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" /> Eliminar Contacto
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <ScrollBar orientation="horizontal" />
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 border border-dashed border-accent rounded-3xl opacity-20">
                    <Users className="h-16 w-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No se encontraron contactos que coincidan con la búsqueda.</p>
                </div>
            )}

            {/* Modal de Nuevo Contacto */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden flex flex-col  h-fit">
                    <ScrollArea className='h-fit'>
                        <div className="flex flex-col h-full">
                            <DialogHeader className="p-8 border-b border-accent bg-white/2 flex flex-row items-center gap-6 shrink-0 space-y-0">
                                <div className="h-12 w-12 rounded-sm bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-black text-primary uppercase ">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <DialogTitle className="text-2xl font-primary uppercase tracking-tight">Registro de Contacto Maestro</DialogTitle>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary text-background font-foreground uppercase text-[10px]">PENDIENTE</Badge>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Estado: Nuevo Registro
                                        </span>
                                    </div>
                                </div>
                                <DialogDescription />
                            </DialogHeader>

                            <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-8  shrink-0">
                                    <TabsList className="h-14 p-0 gap-8 w-full bg-transparent" >
                                        <TabsTrigger value="info" className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                            Información General
                                        </TabsTrigger>
                                        <TabsTrigger value="locked1" disabled className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                            <Lock className="h-3 w-3 mr-2" /> Bancos
                                        </TabsTrigger>
                                        <TabsTrigger value="locked2" disabled className="flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                            <Lock className="h-3 w-3 mr-2" /> Documentos
                                        </TabsTrigger>
                                        <TabsTrigger value="locked3" disabled className="  flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                            <Lock className="h-3 w-3 mr-2" /> Contabilidad
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <ScrollArea className="flex-1">
                                    <TabsContent value="info" className="m-0 p-8 space-y-10">
                                        <form onSubmit={handleSubmit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ">
                                                        <UserCircle className="h-3.5 w-3.5" /> Nombre Completo
                                                    </Label>
                                                    <Input id="name" value={formData.name} onChange={handleInputChange} required className="h-12 bg-white/5 border-accent uppercase font-bold text-sm" placeholder="Ej: JUAN PEREZ" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Building2 className="h-3.5 w-3.5" /> Empresa / Razón Social
                                                    </Label>
                                                    <Input id="company" value={formData.company} onChange={handleInputChange} className="h-12 bg-white/5 border-accent uppercase font-bold text-sm" placeholder="Opcional" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Mail className="h-3.5 w-3.5" /> Email corporativo
                                                    </Label>
                                                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="h-12 bg-white/5 border-accent font-mono text-sm" placeholder="usuario@ejemplo.com" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Phone className="h-3.5 w-3.5" /> Teléfono Móvil
                                                    </Label>
                                                    <Input id="phone" value={formData.phone} onChange={handleInputChange} required className="h-12 bg-white/5 border-accent font-mono font-black" placeholder="+591 ..." />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Hash className="h-3.5 w-3.5" /> NIT / Identificación
                                                    </Label>
                                                    <Input id="nit" value={formData.nit} onChange={handleInputChange} className="h-12 bg-white/5 border-accent font-mono font-bold" placeholder="00000000" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <MapPin className="h-3.5 w-3.5" /> Dirección Física
                                                    </Label>
                                                    <Input id="address" value={formData.address} onChange={handleInputChange} className="h-12 bg-white/5 border-accent uppercase font-bold" placeholder="Calle, Nro, Ciudad" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Tipo de Contacto</Label>
                                                    <Select value={formData.type} onValueChange={(v: any) => handleSelectChange('type', v)}>
                                                        <SelectTrigger className="h-12 bg-white/5 border-accent uppercase font-black text-[12px] w-full"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-card text-primary border-accent">
                                                            <SelectItem value="cliente" className="text-[12px] font-bold uppercase">CLIENTE</SelectItem>
                                                            <SelectItem value="proveedor" className="text-[12px] font-bold uppercase">PROVEEDOR</SelectItem>
                                                            <SelectItem value="personal" className="text-[12px] font-bold uppercase">PERSONAL</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Estado Operativo</Label>
                                                    <Select value={formData.status} onValueChange={(v: any) => handleSelectChange('status', v)}>
                                                        <SelectTrigger className="h-12 bg-white/5 border-accent uppercase font-black text-[12px] w-full"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-card text-primary border-accent">
                                                            <SelectItem value="active" className="text-[12px] font-bold uppercase">ACTIVO</SelectItem>
                                                            <SelectItem value="inactive" className="text-[12px] font-bold uppercase">INACTIVO</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Notas del Sistema</Label>
                                                <Textarea id="notes" value={formData.notes} onChange={handleInputChange} className="bg-card border-accent min-h-12 text-xs uppercase resize-none" placeholder="Observaciones preliminares..." />
                                            </div>
                                        </form>
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>

                            <DialogFooter className="p-6 border-t border-white/5 bg-transparent shrink-0">
                                <div className="flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="w-full text-[10px] font-black uppercase tracking-widest h-12 hover:bg-primary/20 transition-all cursor-pointer">
                                        CANCELAR OPERACIÓN DE REGISTRO
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={(e) => handleSubmit(e as any)}
                                        className="bg-primary text-background font-black uppercase text-[11px] h-12 px-12 tracking-widest  transition-all active:scale-95 cursor-pointer"
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Finalizar Registro
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    </ScrollArea>
                </DialogContent>

            </Dialog>

            {/* Modal de Perfil / Edición */}
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>

                <DialogContent className="min-w-7xl bg-card border-accent text-primary p-0 overflow-hidden  flex flex-col h-[95vh]">
                    {selectedContact && (
                        <div className="flex flex-col h-full">
                            <DialogHeader className="p-8 border-b border-accent bg-white/2 flex flex-row items-center gap-6 shrink-0 space-y-0">
                                <div className="h-20 w-20 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-black text-primary uppercase ">
                                    {selectedContact.name[0]}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">{selectedContact.name}</DialogTitle>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary text-secondary font-black uppercase text-[10px]">{selectedContact.type}</Badge>
                                        <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest opacity-50 flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Registrado: {selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <DialogDescription />
                            </DialogHeader>

                            <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-8  shrink-0">
                                    <TabsList className="h-14  p-0 gap-0 w-full bg-transparent">
                                        <TabsTrigger value="info" className="  flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                            Información General
                                        </TabsTrigger>
                                        <TabsTrigger value="banks" className="  flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                            Cuentas Bancarias
                                        </TabsTrigger>
                                        <TabsTrigger value="docs" className="  flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-smy">
                                            Documentos
                                        </TabsTrigger>
                                        <TabsTrigger value="accounting" className="  flex-1 h-full px-4 md:px-8 data-[state=active]:bg-primary data-[state=active]:text-background rounded-2xl border-r border-accent text-xs md:text-sm">
                                            Contabilidad
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <ScrollArea className="flex-1 h-50">
                                    <TabsContent value="info" className="m-0 p-8 space-y-10">
                                        <form onSubmit={handleProfileUpdate} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <UserCircle className="h-3.5 w-3.5" /> Nombre / Contacto
                                                    </Label>
                                                    <Input id="name" value={profileFormData.name} onChange={handleProfileInputChange} className="h-12 bg-white/5 border-accent uppercase font-bold" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Building2 className="h-3.5 w-3.5" /> Razón Social
                                                    </Label>
                                                    <Input id="company" value={profileFormData.company} onChange={handleProfileInputChange} className="h-12 bg-white/5 border-accent uppercase font-bold" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Mail className="h-3.5 w-3.5" /> Email
                                                    </Label>
                                                    <Input id="email" type="email" value={profileFormData.email} onChange={handleProfileInputChange} className="h-12 bg-white/5 border-accent font-mono" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Phone className="h-3.5 w-3.5" /> Teléfono
                                                    </Label>
                                                    <Input id="phone" value={profileFormData.phone} onChange={handleProfileInputChange} className="h-12 bg-white/5 border-accent font-mono font-black text-emerald-500" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <Hash className="h-3.5 w-3.5" /> NIT / Identificación
                                                    </Label>
                                                    <Input id="nit" value={profileFormData.nit} onChange={handleProfileInputChange} className="h-12 bg-white/5 border-accent font-mono font-bold" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                        <MapPin className="h-3.5 w-3.5" /> Dirección
                                                    </Label>
                                                    <Input id="address" value={profileFormData.address} onChange={handleProfileInputChange} className="h-12 bg-white/5 border-accent uppercase font-bold" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Tipo de Contacto</Label>
                                                    <Select value={profileFormData.type} onValueChange={(v: any) => handleProfileSelectChange('type', v)}>
                                                        <SelectTrigger className="h-12 bg-white/5 border-accent uppercase font-black text-[12px] w-full"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-card text-primary border-accent">
                                                            <SelectItem value="cliente" className="text-[12px] font-bold uppercase">CLIENTE</SelectItem>
                                                            <SelectItem value="proveedor" className="text-[12px] font-bold uppercase">PROVEEDOR</SelectItem>
                                                            <SelectItem value="personal" className="text-[12px] font-bold uppercase">PERSONAL</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Estado de Cuenta</Label>
                                                    <Select value={profileFormData.status} onValueChange={(v: any) => handleProfileSelectChange('status', v)}>
                                                        <SelectTrigger className="h-12 bg-white/5 border-accent uppercase font-black text-[12px] w-full"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-card text-primary border-accent">
                                                            <SelectItem value="active" className="text-[12px] font-bold uppercase">ACTIVO</SelectItem>
                                                            <SelectItem value="inactive" className="text-[12px] font-bold uppercase text-destructive">INACTIVO</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Observaciones Técnicas</Label>
                                                <Textarea id="notes" value={profileFormData.notes} onChange={handleProfileInputChange} className="bg-white/5 border-accent min-h-24 text-xs uppercase resize-none" placeholder="Notas adicionales..." />
                                            </div>
                                        </form>
                                    </TabsContent>

                                    <TabsContent value="banks" className="m-0 p-8 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight">Cuentas Vinculadas</h3>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Cuentas para conciliación bancaria y pagos</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setIsBankFormOpen(true);
                                                    setEditingBankId(null);
                                                    setBankFormData({ bankName: '', accountNumber: '', swiftCode: '', isPreferred: false });
                                                }}
                                                className="bg-primary text-background font-black text-[10px] uppercase h-10 px-6 border border-accent cursor-pointer "
                                            >
                                                <Plus className="mr-2 h-4 w-4" /> Añadir Cuenta
                                            </Button>
                                        </div>

                                        <Separator className="bg-accent" />

                                        {isBankFormOpen && (
                                            <Card className="bg-primary/5 border-accents  p-0 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                                <CardContent className="p-6 space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase text-primary">Entidad Financiera (Banco)</Label>
                                                            <Input
                                                                value={bankFormData.bankName}
                                                                onChange={(e) => setBankFormData(p => ({ ...p, bankName: e.target.value }))}
                                                                className="h-11 bg-card border-accent uppercase font-bold"
                                                                placeholder="EJ: BANCO CENTRAL"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase text-primary">Número de Cuenta</Label>
                                                            <Input
                                                                value={bankFormData.accountNumber}
                                                                onChange={(e) => setBankFormData(p => ({ ...p, accountNumber: e.target.value }))}
                                                                className="h-11 bg-card border-accent font-mono text-emerald-500 font-bold"
                                                                placeholder="000-000000-00"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase text-primary">Código SWIFT / Otros (Opcional)</Label>
                                                            <Input
                                                                value={bankFormData.swiftCode}
                                                                onChange={(e) => setBankFormData(p => ({ ...p, swiftCode: e.target.value }))}
                                                                className="h-11 bg-card border-accent font-mono"
                                                            />
                                                        </div>
                                                        <div className="flex items-end pb-2">
                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={bankFormData.isPreferred}
                                                                    onChange={(e) => setBankFormData(p => ({ ...p, isPreferred: e.target.checked }))}
                                                                    className="h-5 w-5 accent-primary bg-card border-accent rounded"
                                                                />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Marcar como cuenta principal</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                                                        <Button variant="ghost" onClick={() => setIsBankFormOpen(false)} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Cancelar</Button>
                                                        <Button onClick={handleBankSubmit} disabled={isSubmitting} className="bg-primary text-background font-black uppercase text-[10px] h-10 px-8 cursor-pointer">
                                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                                            {editingBankId ? 'Actualizar Cuenta' : 'Vincular Cuenta'}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <div className="space-y-4">
                                            {selectedContact.bankAccounts && selectedContact.bankAccounts.length > 0 ? (
                                                selectedContact.bankAccounts.map((acc) => (
                                                    <div key={acc.id} className="flex items-center justify-between p-5 rounded-2xl bg-accent border border-white/5 hover:border-primary/30 transition-all group ">
                                                        <div className="flex items-center gap-5">
                                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                                                <Landmark className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black uppercase text-primary">{acc.bankName}</span>
                                                                    {acc.isPreferred && (
                                                                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] h-4 font-black uppercase tracking-widest">PRINCIPAL</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-lg font-mono font-black text-emerald-500 tracking-tighter">{acc.accountNumber}</p>
                                                                {acc.swiftCode && <p className="text-[9px] font-mono text-muted-foreground uppercase opacity-40">SWIFT: {acc.swiftCode}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => {
                                                                    setEditingBankId(acc.id);
                                                                    setBankFormData({
                                                                        bankName: acc.bankName,
                                                                        accountNumber: acc.accountNumber,
                                                                        swiftCode: acc.swiftCode || '',
                                                                        isPreferred: acc.isPreferred
                                                                    });
                                                                    setIsBankFormOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="h-4.5 w-4.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleDeleteBank(acc.id)}
                                                            >
                                                                <Trash2 className="h-4.5 w-4.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-24 flex flex-col items-center justify-center opacity-20 rounded-3xl gap-4">
                                                    <Wallet className="h-12 w-12" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin cuentas bancarias vinculadas</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="docs" className="m-0 p-8 space-y-8 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight">Expediente Digital</h3>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Contratos, identificaciones y certificados técnicos</p>
                                            </div>
                                            {/* --- STORAGE STATS --- */}
                                            {storageStats && (
                                                <div className=" rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 w-full md:max-w-md shrink-0">
                                                    <div className="flex-1 w-full space-y-1.5">
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Almacenamiento Cloud</p>
                                                            <p className="text-xs font-bold text-primary">
                                                                {(storageStats.used / (1024 * 1024)).toFixed(1)} MB / {(storageStats.total / (1024 * 1024 * 1024)).toFixed(1)} GB
                                                                <span className="ml-2 text-muted-foreground opacity-50">({storageStats.percentage.toFixed(1)}%)</span>
                                                            </p>
                                                        </div>
                                                        <Progress
                                                            value={storageStats.percentage}
                                                            className={cn(
                                                                "h-2",
                                                                storageStats.percentage > 90 ? "bg-red-500/20" :
                                                                    storageStats.percentage > 70 ? "bg-amber-500/20" : "bg-primary/20"
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <Button
                                                className="bg-primary text-background font-black text-[10px] uppercase h-10 px-6 border border-primary/20 cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingDoc}
                                            >
                                                {isUploadingDoc
                                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    : <Upload className="mr-2 h-4 w-4" />
                                                }
                                                {isUploadingDoc ? 'Subiendo...' : 'Subir Documento'}
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                className="hidden"
                                                onChange={handleDocumentUpload}
                                            />
                                        </div>

                                        <Separator className="bg-accent" />

                                        {isLoadingDocs ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                <p className="text-[10px] font-black uppercase">Cargando documentos...</p>
                                            </div>
                                        ) : contactDocuments.length === 0 ? (
                                            <div className="py-24 flex flex-col items-center justify-center  rounded-3xl opacity-20 gap-4">
                                                <FileText className="h-12 w-12" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin documentos adjuntos</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {contactDocuments.map((doc) => (
                                                    <Card key={doc.id} className="bg-white/2 border-accent group hover:border-primary/30 transition-all p-0 overflow-hidden">
                                                        <CardContent className="p-4 flex flex-col gap-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                                                    <FileText className="h-6 w-6 text-primary" />
                                                                </div>
                                                                <Badge variant="outline" className="text-[10px] font-black uppercase border-white/10">PDF</Badge>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[11px] font-bold text-primary uppercase truncate" title={doc.name}>{doc.name}</p>
                                                                <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
                                                                    {formatFileSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 pt-2 border-t border-accent mt-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="flex-1 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 h-7"
                                                                    onClick={() => window.open(doc.publicUrl, '_blank')}
                                                                >
                                                                    Ver
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="flex-1 text-[9px] font-black uppercase tracking-widest hover:bg-destructive/10 text-destructive h-7"
                                                                    onClick={() => handleDocumentDelete(doc.id, doc.name)}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="accounting" className="m-0 p-8 space-y-10 animate-in fade-in duration-300">
                                        {isLoadingAccounting ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                <p className="text-[10px] font-black uppercase">Consolidando datos financieros...</p>
                                            </div>
                                        ) : accountingInfo ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <Card className="bg-emerald-500/5 border-emerald-500/20 p-0 overflow-hidden relative">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                                        <CardContent className="p-6">
                                                            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest opacity-70">Pagos Realizados</span>
                                                            <p className="text-2xl font-black text-primary font-mono mt-2">${accountingInfo.totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="bg-red-500/5 border-red-500/20 p-0 overflow-hidden relative">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                                                        <CardContent className="p-6">
                                                            <span className="text-[10px] font-black uppercase text-red-500 tracking-widest opacity-70">Total Cuenta por Pagar del Contacto</span>
                                                            <p className="text-2xl font-black text-primary font-mono mt-2">${accountingInfo.totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                                                        <History className="h-4 w-4 text-primary" /> Historial de Movimientos Vinculados
                                                    </h3>
                                                    <div className="border border-accent rounded-2xl overflow-hidden bg-card ">
                                                        <Table>
                                                            <TableHeader className="bg-card">
                                                                <TableRow className="border-accent hover:bg-transparent">
                                                                    <TableHead className="text-[10px] font-black uppercase py-4 px-6">Fecha</TableHead>
                                                                    <TableHead className="text-[10px] font-black uppercase">Tipo</TableHead>
                                                                    <TableHead className="text-[10px] font-black uppercase">Concepto / Proyecto</TableHead>
                                                                    <TableHead className="text-[10px] font-black uppercase text-center">Estado</TableHead>
                                                                    <TableHead className="text-[10px] font-black uppercase text-right pr-8">Importe (USD)</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {accountingInfo.recentMovements.length > 0 ? (
                                                                    accountingInfo.recentMovements.map((tx: any, i: number) => (
                                                                        <TableRow key={i} className="border-accent hover:bg-white/3 transition-all">
                                                                            <TableCell className="px-6 py-4 font-mono text-[10px] text-muted-foreground uppercase">{tx.date}</TableCell>
                                                                            <TableCell>
                                                                                <Badge variant="outline" className={cn("text-[8px] font-black uppercase border-none h-4 px-2", tx.type === 'ingreso' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
                                                                                    {tx.type}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-bold text-primary uppercase">{tx.desc}</span>
                                                                                    <span className="text-[9px] text-muted-foreground font-black uppercase opacity-40">{tx.project}</span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <Badge className={cn(
                                                                                    "text-[8px] font-black uppercase px-2 h-4",
                                                                                    tx.status === 'PAGO' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                                                                )}>
                                                                                    {tx.status}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="text-right pr-8 font-mono text-xs font-black text-primary">
                                                                                ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))
                                                                ) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={5} className="text-center py-20 text-[10px] font-black uppercase text-muted-foreground opacity-20">Sin movimientos registrados</TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-20 gap-4">
                                                <DollarSign className="h-12 w-12" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Sin datos contables disponibles</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>

                            <DialogFooter className="p-6 border-t border-white/5 bg-transparent shrink-0">
                                <div className="flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setIsProfileDialogOpen(false)} className="w-full text-[10px]  uppercase tracking-[0.2em] h-12 hover:bg-primary/20 transition-all cursor-pointer">
                                        Cerrar
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={(e) => handleProfileUpdate(e as any)}
                                        className="bg-primary text-background font-black uppercase text-[11px] h-12 px-12 tracking-widest  transition-all active:scale-95 cursor-pointer"
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Actualizar Datos del Perfil
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>

            </Dialog>
        </div>
    );
}