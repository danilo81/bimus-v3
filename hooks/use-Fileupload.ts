// hooks/useFileUpload.ts
import { useState, useCallback } from "react";
import { FileWithMetadata } from "@/components/ui/dropzone";

export function useFileUpload() {
    const [files, setFiles] = useState<FileWithMetadata[]>([]);

    const addFiles = useCallback((newFiles: FileWithMetadata[]) => {
        setFiles((prev) => [...prev, ...newFiles]);
    }, []);

    const updateFile = useCallback(
        (fileId: string, updates: Partial<FileWithMetadata>) => {
            setFiles((prev) =>
                prev.map((file) =>
                    file.id === fileId ? { ...file, ...updates } : file
                )
            );
        },
        []
    );

    const removeFile = useCallback((fileId: string) => {
        setFiles((prev) => {
            const fileToRemove = prev.find((f) => f.id === fileId);
            if (fileToRemove?.objectUrl) {
                URL.revokeObjectURL(fileToRemove.objectUrl);
            }
            return prev.filter((f) => f.id !== fileId);
        });
    }, []);

    const clearFiles = useCallback(() => {
        files.forEach((file) => {
            if (file.objectUrl) {
                URL.revokeObjectURL(file.objectUrl);
            }
        });
        setFiles([]);
    }, [files]);

    const getFilesByStatus = useCallback(
        (status: "uploading" | "completed" | "error") => {
            switch (status) {
                case "uploading":
                    return files.filter((f) => f.uploading);
                case "completed":
                    return files.filter((f) => !f.uploading && !f.error);
                case "error":
                    return files.filter((f) => f.error);
                default:
                    return files;
            }
        },
        [files]
    );

    return {
        files,
        addFiles,
        updateFile,
        removeFile,
        clearFiles,
        getFilesByStatus,
        stats: {
            total: files.length,
            totalSize: files.reduce((sum, file) => sum + file.file.size, 0),
            completed: files.filter((f) => !f.uploading && !f.error).length,
            uploading: files.filter((f) => f.uploading).length,
            errors: files.filter((f) => f.error).length,
        },
    };
}
