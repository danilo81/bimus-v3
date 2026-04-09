"use client"
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getProjectDocuments } from '@/actions/projects/getProjectDocuments';
import { ProjectDocument } from '@/types/types';
import { FileText, Loader2, Cloud, Download, Trash2, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IfcCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSelect: (url: string, name: string) => void;
}

export function IfcCloudModal({ isOpen, onClose, projectId, onSelect }: IfcCloudModalProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchDocuments();
    }
  }, [isOpen, projectId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await getProjectDocuments(projectId);
      // Filter for IFC files
      const ifcDocs = docs.filter(doc =>
        doc.name.toLowerCase().endsWith('.ifc') ||
        (doc as any).type?.toLowerCase() === 'ifc' ||
        (doc as any).mimeType?.includes('ifc')
      );
      setDocuments(ifcDocs);
    } catch (error) {
      console.error("Error fetching IFC documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Cloud className="w-6 h-6 text-sky-400" />
            IFC Cloud Manager
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select an IFC model saved in the cloud to load it into the workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Available Models</h3>
            <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-400">
              {documents.length} Found
            </span>
          </div>

          <ScrollArea className="h-[400px] rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                <p className="text-xs text-zinc-400">Scanning cloud storage...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-20 text-zinc-500">
                <Box className="h-10 w-10 opacity-20" />
                <p className="text-sm">No IFC files found in this project.</p>
                <p className="text-xs text-zinc-600 px-10 text-center">
                  Upload IFC files to the documentation module to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group relative flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-zinc-700 hover:bg-zinc-800/50 transition-all cursor-pointer"
                    onClick={() => onSelect(doc.url, doc.name)}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-2 bg-zinc-800 rounded-lg text-sky-400 group-hover:bg-sky-500/10 transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-zinc-200 truncate">{doc.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                          <span>{formatSize(doc.size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(doc.url, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose} className="hover:bg-zinc-900 text-zinc-400 border-zinc-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
