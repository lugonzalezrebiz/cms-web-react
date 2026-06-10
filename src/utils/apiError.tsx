export function  getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        (error as any).response !== null &&
        "data" in (error as any).response
    ) {
        const data = (error as any).response.data as { message?: string };
        return data.message || fallback;
    }

    return fallback;
}