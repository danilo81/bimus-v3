export const debug = {
    log: (message: string, data?: any) => {
        if (process.env.NODE_ENV === "development") {
            console.log(`[Upload Debug]: ${message}`, data);
        }
    },
    error: (message: string, error?: any) => {
        if (process.env.NODE_ENV === "development") {
            console.error(`[Upload Error]: ${message}`, error);
        }
    },
};
