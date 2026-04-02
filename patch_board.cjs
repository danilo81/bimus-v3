const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('app', 'projects', '[id]', 'board', 'page.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Imports
code = code.replace(
    /import { getBimDocument, upsertBimTopic, deleteBimTopic, applyBimTemplate, createTopicWithChildren, getProjectById } from '@\/actions';/,
    `import { getBimDocument, upsertBimTopic, deleteBimTopic, applyBimTemplate, createTopicWithChildren, getProjectById, saveBimTemplateToCloud, applyCloudBimTemplate, getCloudBimTemplates } from '@/actions';`
);

code = code.replace(
    /import \{\n    Select,\n    SelectContent,\n    SelectItem,\n    SelectTrigger,\n    SelectValue,\n\} from "\.\.\/\.\.\/\.\.\/\.\.\/components\/ui\/select";/,
    `import {\n    Select,\n    SelectContent,\n    SelectGroup,\n    SelectItem,\n    SelectLabel,\n    SelectTrigger,\n    SelectValue,\n} from "../../../../components/ui/select";`
);

// 2. State
code = code.replace(
    /const \[drafts, setDrafts\] = useState/,
    `const [cloudTemplates, setCloudTemplates] = useState<any[]>([]);\n    const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);\n    const [newTemplateName, setNewTemplateName] = useState('');\n\n    const [drafts, setDrafts] = useState`
);

// 3. fetchData
code = code.replace(
    /const \[proj, bimDoc\] = await Promise\.all\(\[\n\s+getProjectById\(projectId\),\n\s+getBimDocument\(projectId\)\n\s+\]\);/,
    `const [proj, bimDoc, cTemplates] = await Promise.all([\n                getProjectById(projectId),\n                getBimDocument(projectId),\n                getCloudBimTemplates()\n            ]);\n\n            if (cTemplates) setCloudTemplates(cTemplates);`
);

// 4. handleApplyTemplate
code = code.replace(
    /const result = await applyBimTemplate\(projectId, templateId\);/,
    `let result;\n            if (templateId.startsWith('cloud_')) {\n                const fileId = templateId.replace('cloud_', '');\n                result = await applyCloudBimTemplate(projectId, fileId);\n            } else {\n                result = await applyBimTemplate(projectId, templateId);\n            }`
);

// 5. handleSaveAsTemplate
code = code.replace(
    /const handleSelectTopic = \(newTopicId: string\) => \{/,
    `const handleSaveAsTemplate = async () => {\n        if (!projectId) return;\n        if (!newTemplateName.trim()) {\n            toast({ title: "Validación", description: "El nombre de la plantilla es obligatorio.", variant: "destructive" });\n            return;\n        }\n\n        setIsSaving(true);\n        try {\n            const result = await saveBimTemplateToCloud(projectId, newTemplateName.trim());\n\n            if (result.success) {\n                toast({ title: "Plantilla guardada en la nube con éxito" });\n                setIsSaveTemplateModalOpen(false);\n                setNewTemplateName('');\n                const templates = await getCloudBimTemplates();\n                setCloudTemplates(templates);\n            } else {\n                throw new Error(result.error);\n            }\n        } catch (error: any) {\n            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });\n        } finally {\n            setIsSaving(false);\n        }\n    };\n\n    const handleSelectTopic = (newTopicId: string) => {`
);

// 6. SelectItems
code = code.replace(
    /<SelectItem value="iso_19650" className="text-\[9px\] font-bold uppercase">ISO 19650 Requerimientos<\/SelectItem>\n\s+<SelectItem value="bep_only" className="text-\[9px\] font-bold uppercase">Plan de Ejecución \(BEP\)<\/SelectItem>\n\s+<SelectItem value="construction_phase" className="text-\[9px\] font-bold uppercase">Protocolos de Obra<\/SelectItem>/g,
    `<SelectGroup>\n                                        <SelectLabel className="text-[8px] text-muted-foreground uppercase font-black tracking-widest pl-2">General</SelectLabel>\n                                        <SelectItem value="iso_19650" className="text-[9px] font-bold uppercase">ISO 19650 Requerimientos</SelectItem>\n                                        <SelectItem value="bep_only" className="text-[9px] font-bold uppercase">Plan de Ejecución (BEP)</SelectItem>\n                                        <SelectItem value="construction_phase" className="text-[9px] font-bold uppercase">Protocolos de Obra</SelectItem>\n                                    </SelectGroup>\n                                    {cloudTemplates.length > 0 && (\n                                        <SelectGroup>\n                                            <SelectLabel className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-2 border-t border-accent pt-2 pl-2">Mis Plantillas en Nube</SelectLabel>\n                                            {cloudTemplates.map(t => (\n                                                <SelectItem key={t.id} value={\`cloud_\${t.id}\`} className="text-[9px] font-bold uppercase">{t.name}</SelectItem>\n                                            ))}\n                                        </SelectGroup>\n                                    )}`
);

// 7. Button
code = code.replace(
    /<div className="flex items-center gap-2">\n\s+<Button\n\s+onClick=\{handlePersistChanges\}/,
    `<div className="flex items-center gap-2">\n                                        <Button\n                                            variant="outline"\n                                            onClick={() => setIsSaveTemplateModalOpen(true)}\n                                            className="h-9 px-4 text-[9px] font-black uppercase tracking-widest text-primary border-accent hover:bg-primary/5"\n                                        >\n                                            <Save className="h-3.5 w-3.5 mr-2" /> Guardar Plantilla\n                                        </Button>\n                                        <Button\n                                            onClick={handlePersistChanges}`
);

// 8. Dialog
code = code.replace(
    /<\/div>\n\s+<\/div>\n\s+\);\n\}/,
    `            <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>\n                <DialogContent className="sm:max-w-md bg-card border-accent text-primary">\n                    <DialogHeader>\n                        <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Guardar como Plantilla</DialogTitle>\n                        <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground">\n                            Se guardará toda la estructura actual y su contenido en la nube para uso posterior.\n                        </DialogDescription>\n                    </DialogHeader>\n                    <div className="py-4 space-y-3">\n                        <Label className="text-[10px] font-black uppercase tracking-widest">Nombre de la Plantilla</Label>\n                        <Input \n                            value={newTemplateName} \n                            onChange={(e) => setNewTemplateName(e.target.value)} \n                            placeholder="Ej. Plantilla Institucional V1" \n                            className="bg-background border-accent font-bold text-sm h-12 uppercase"\n                        />\n                    </div>\n                    <DialogFooter>\n                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => setIsSaveTemplateModalOpen(false)}>Cancelar</Button>\n                        <Button disabled={isSaving || !newTemplateName.trim()} onClick={handleSaveAsTemplate} className="font-black uppercase tracking-widest text-[10px] bg-primary h-12 text-background hover:bg-primary/90">\n                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}\n                            Guardar Nube\n                        </Button>\n                    </DialogFooter>\n                </DialogContent>\n            </Dialog>\n        </div>\n    );\n}`
);

fs.writeFileSync(targetFile, code);
console.log('Patch complete.');
