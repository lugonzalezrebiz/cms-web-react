import { useState, useEffect } from "react";

// Module-level cache: key → sorted seconds array
// Persists across re-renders and camera switches for the session lifetime
const INDEX_CACHE = new Map<string, number[]>();

const cacheKey=(company: number, location: number, date: string, camera: number) =>{
    return `${company}/${location}/${date}/${camera}`;
}

// Binary search — find nearest timestamp in a sorted array
export const snapToNearest=(timestamps: number[], targetSec: number): number | null => {
    if (timestamps.length === 0) return null;

    let lo = 0, hi = timestamps.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (timestamps[mid] < targetSec) lo = mid + 1;
        else hi = mid;
    }
    // Compare candidate with its left neighbor
    if (lo > 0 && targetSec - timestamps[lo - 1] < timestamps[lo] - targetSec) {
        lo--;
    }
    return timestamps[lo];
}

export const useTimestampIndex =(
    company: number,
    location: number,
    date: string,
    camera: number,
)=> {
    const key = cacheKey(company, location, date, camera);
    const [timestamps, setTimestamps] = useState<number[]>(() => INDEX_CACHE.get(key) ?? []);
    const [activeKey, setActiveKey] = useState(key);

    if (activeKey !== key) {
        setActiveKey(key);
        setTimestamps(INDEX_CACHE.get(key) ?? []);
    }

    useEffect(() => {
        if (!company || !location || !date || camera === undefined) return;
        if (INDEX_CACHE.has(key)) return;
        window.api
            .timestamps({ company, location, date, camera })
            .then((ts) => {
                INDEX_CACHE.set(key, ts);
                setTimestamps(ts);
            })
            .catch(() => {});
    }, [key, company, location, date, camera]);

    return timestamps;
}
