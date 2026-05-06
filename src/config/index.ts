export const URL_API = import.meta.env.VITE_URL_API as string;
export const MONITORING_ID = import.meta.env.VITE_MONITORING_ID as string;
export const REVIEWER_ROLE = Number(import.meta.env.VITE_REVIEWER_ROLE);
export const AGENT_ROLE = Number(import.meta.env.VITE_AGENT_ROLE);
export const ADMIN_ROLE = Number(import.meta.env.VITE_ADMIN_ROLE);
export const USE_STATIC_IDS = import.meta.env.VITE_USE_STATIC_IDS === "true";