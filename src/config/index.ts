const trimWrappedQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "");

const resolveApiUrl = () => {
	const rawApiUrl = (import.meta.env.VITE_URL_API as string | undefined)?.trim() || "/api/";
	const rawHost = (import.meta.env.VITE_HOST as string | undefined)?.trim();
	const host = rawHost ? trimWrappedQuotes(rawHost).replace(/\/+$/, "") : "";
	const isAbsoluteApi = /^https?:\/\//i.test(rawApiUrl);
	const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";

	if (isAbsoluteApi) return rawApiUrl;

	// In packaged Electron, relative API paths resolve against file:// and break requests.
	if (isFileProtocol && host) {
		const normalizedApiPath = rawApiUrl.startsWith("/") ? rawApiUrl : `/${rawApiUrl}`;
		return `${host}${normalizedApiPath}`;
	}

	return rawApiUrl;
};

export const URL_API = resolveApiUrl();
export const MONITORING_ID = import.meta.env.VITE_MONITORING_ID as string;
export const REVIEWER_ROLE = Number(import.meta.env.VITE_REVIEWER_ROLE);
export const AGENT_ROLE = Number(import.meta.env.VITE_AGENT_ROLE);
export const ADMIN_ROLE = Number(import.meta.env.VITE_ADMIN_ROLE);
export const USE_STATIC_IDS = import.meta.env.VITE_USE_STATIC_IDS === "true";
export const ASSIGNMENT_COMPLETED = import.meta.env.VITE_ASSIGNMENT_COMPLETED === "true";
export const PASSWORD_VALIDATION = import.meta.env.VITE_PASSWORD_VALIDATION !== "false";
export const STRICT_GEOLOCATION = import.meta.env.VITE_STRICT_GEOLOCATION === "true";