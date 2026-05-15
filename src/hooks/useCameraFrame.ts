import { useState, useEffect, useRef } from "react";
import { useTimestampIndex, snapToNearest } from "./useTimestampIndex";
import { timestampToSec, secToCompact } from "./utils";

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
            setSrc(`dvr://local/${company}/${location}/${date}/${camera}/${date.slice(2)}_${ts}.jpg`);
        }, 50);

        return () => clearTimeout(debounceRef.current);
    }, [company, location, date, camera, timestamp, timestamps]);

    return src;
}
