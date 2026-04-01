export function handleUploadError(error: any): string {
    if (error.name === "NetworkError") {
        return "Network connection failed. Please check your internet connection.";
    }

    if (error.status === 413) {
        return "File is too large. Please reduce file size and try again.";
    }

    if (error.status === 415) {
        return "File type not supported. Please choose a different file.";
    }

    if (error.status >= 500) {
        return "Server error occurred. Please try again later.";
    }

    return "Upload failed. Please try again.";
}
