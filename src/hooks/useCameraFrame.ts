import { useState, useEffect, useRef } from "react";
import { useTimestampIndex, snapToNearest } from "./useTimestampIndex";

function secToCompact(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}${String(s).padStart(2, "0")}`;
}

function timestampToSec(ts: string): number {
    if (!ts) return -1;
    if (ts.includes(":")) {
        const [h, m, s] = ts.split(":").map(Number);
        return h * 3600 + m * 60 + (s || 0);
    }
    if (ts.length === 6) {
        return Number(ts.slice(0, 2)) * 3600 + Number(ts.slice(2, 4)) * 60 + Number(ts.slice(4, 6));
    }
    return -1;
}

export function useCameraFrame(params: {
    company: number;
    location: number;
    date: string;
    camera: number;
    timestamp: string; // HH:mm:ss
}) {
    const { company, location, date, camera, timestamp } = params;

    // Load file index once per camera — cached at module level
    const timestamps = useTimestampIndex(company, location, date, camera);

    const [src, setSrc] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (!date || !timestamp || timestamps.length === 0) {
                setSrc("");
                return;
            }

            const targetSec = timestampToSec(timestamp);
            const snapped = snapToNearest(timestamps, targetSec);
            if (snapped === null) { setSrc(""); return; }

            const ts = secToCompact(snapped);
            setSrc(`dvr://local/${company}/${location}/${date}/${camera}/${date}_${ts}.jpg`);
        }, 50);

        return () => clearTimeout(debounceRef.current);
    }, [company, location, date, camera, timestamp, timestamps]);

    return src;
}
