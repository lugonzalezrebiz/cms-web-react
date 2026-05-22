import { apiClient } from "../config/apiClient";

type Severity = "info" | "warning" | "error" | "fatal";

type EventType =
    | "react-error-boundary"
    | "window-error"
    | "unhandled-rejection"
    | "manual"
    | "api-error";

export type CrashUserContext = {
    userID?: number | string | null;
    roleID?: number | string | null;
    username?: string | null;
    email?: string | null;
};

export type CrashWorkflowContext = {
    route?: string;
    screen?: string;
    workflow?: string;
    monitoringID?: string | null;
    storeID?: string | number | null;
    locationID?: string | number | null;
    companyID?: string | number | null;
    cameraID?: string | number | null;
    trackerID?: string | number | null;
    action?: string | null;
};

export type CrashLogPayload = {
    eventType: EventType;
    severity: Severity;
    message: string;
    stack?: string;
    componentStack?: string;
    timestamp?: string;
    appContext?: Record<string, unknown>;
    userContext?: CrashUserContext;
    workflowContext?: CrashWorkflowContext;
    breadcrumbs?: CrashBreadcrumb[];
};

export type CrashBreadcrumb = {
    timestamp: string;
    type: string;
    message: string;
    data?: Record<string, unknown>;
};

const MAX_BREADCRUMBS = 50;
const breadcrumbs: CrashBreadcrumb[] = [];
let userContext: CrashUserContext = {};
let workflowContext: CrashWorkflowContext = {};
let installed = false;
let sending = false;

const toPlainObject = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== "object") return undefined;

    try {
        return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
        return { value: String(value) };
    }
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (typeof error === "object" && error && "message" in error) {
        return String((error as { message?: unknown }).message);
    }
    return "Unknown application error";
};

const getErrorStack = (error: unknown) => {
    if (error instanceof Error) return error.stack;
    if (typeof error === "object" && error && "stack" in error) {
        return String((error as { stack?: unknown }).stack ?? "");
    }
    return undefined;
};

const inferScreen = (pathname: string) => {
    if (pathname.includes("/monitor/timeline")) return "Monitoring timeline";
    if (pathname.includes("/monitor")) return "Monitoring review";
    if (pathname.includes("/assignments")) return "Assignment dashboard";
    if (pathname.includes("/login")) return "Login";
    return pathname || "Unknown screen";
};

const inferWorkflow = (pathname: string) => {
    if (pathname.includes("/monitor/timeline")) return "monitoring-timeline";
    if (pathname.includes("/monitor")) return "monitoring-review";
    if (pathname.includes("/assignments")) return "assignment-dashboard";
    if (pathname.includes("/login")) return "login";
    return "unknown";
};

const readWorkflowFromLocation = (): CrashWorkflowContext => {
    const route = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const hashRoute = window.location.hash.replace(/^#/, "");
    const routeForParsing =
        hashRoute || `${window.location.pathname}${window.location.search}`;
    const [pathnamePart, searchPart = ""] = routeForParsing.split("?");
    const params = new URLSearchParams(searchPart);

    return {
        route,
        screen: inferScreen(pathnamePart),
        workflow: inferWorkflow(pathnamePart),
        monitoringID: params.get("monitoringID"),
        storeID:
            params.get("store") ??
            params.get("storeID") ??
            params.get("location"),
        locationID: params.get("location") ?? params.get("locationID"),
        companyID: params.get("company") ?? params.get("companyID"),
        cameraID: params.get("camera") ?? params.get("cameraID"),
        trackerID: params.get("tracker") ?? params.get("trackerID"),
    };
};

const buildPayload = async (
    payload: CrashLogPayload,
): Promise<CrashLogPayload> => {
    const baseWorkflow = readWorkflowFromLocation();
    const electronContext = await window.api
        ?.crashContext?.()
        .catch(() => undefined);

    return {
        ...payload,
        timestamp: payload.timestamp ?? new Date().toISOString(),
        appContext: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            language: navigator.language,
            online: navigator.onLine,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio,
            },
            ...(electronContext ?? {}),
            ...(payload.appContext ?? {}),
        },
        userContext: {
            ...userContext,
            ...(payload.userContext ?? {}),
        },
        workflowContext: {
            ...baseWorkflow,
            ...workflowContext,
            ...(payload.workflowContext ?? {}),
        },
        breadcrumbs: [...breadcrumbs, ...(payload.breadcrumbs ?? [])].slice(
            -MAX_BREADCRUMBS,
        ),
    };
};

export const crashLogger = {
    install() {
        if (installed) return;
        installed = true;

        window.addEventListener("error", (event) => {
            void this.log({
                eventType: "window-error",
                severity: "fatal",
                message: event.message || getErrorMessage(event.error),
                stack: getErrorStack(event.error),
                appContext: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                },
            });
        });

        window.addEventListener("unhandledrejection", (event) => {
            void this.log({
                eventType: "unhandled-rejection",
                severity: "fatal",
                message: getErrorMessage(event.reason),
                stack: getErrorStack(event.reason),
                appContext: {
                    reason: toPlainObject(event.reason),
                },
            });
        });
    },

    setUser(context: CrashUserContext) {
        userContext = context;
    },

    setWorkflow(context: CrashWorkflowContext) {
        workflowContext = {
            ...workflowContext,
            ...context,
        };
    },

    addBreadcrumb(
        type: string,
        message: string,
        data?: Record<string, unknown>,
    ) {
        breadcrumbs.push({
            timestamp: new Date().toISOString(),
            type,
            message,
            data,
        });

        if (breadcrumbs.length > MAX_BREADCRUMBS) {
            breadcrumbs.splice(0, breadcrumbs.length - MAX_BREADCRUMBS);
        }
    },

    async log(payload: CrashLogPayload) {
        if (sending) return;

        try {
            sending = true;
            const finalPayload = await buildPayload(payload);

            if (window.api?.logCrash) {
                await window.api.logCrash(finalPayload);
                return;
            }

            await apiClient.post("log/crash", finalPayload);
        } catch (error) {
            console.error("Failed to send crash log", error);
        } finally {
            sending = false;
        }
    },
};
