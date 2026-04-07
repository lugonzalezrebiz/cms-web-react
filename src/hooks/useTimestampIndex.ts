import { useState, useEffect } from "react";

// Module-level cache: key → sorted seconds array
// Persists across re-renders and camera switches for the session lifetime
const INDEX_CACHE = new Map<string, number[]>();

function cacheKey(company: number, location: number, date: string, camera: number) {
    return `${company}/${location}/${date}/${camera}`;
}

// Binary search — find nearest timestamp in a sorted array
export function snapToNearest(timestamps: number[], targetSec: number): number | null {
    if (timestamps.length === 0) return null;

    let lo = 0, hi = timestamps.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (timestamps[mid] < targetSec) lo = mid + 1;
        else hi = mid;
    }
    // Compare candidate with its left neighbour
    if (lo > 0 && targetSec - timestamps[lo - 1] < timestamps[lo] - targetSec) {
        lo--;
    }
    return timestamps[lo];
}

export function useTimestampIndex(
    company: number,
    location: number,
    date: string,
    camera: number,
) {
    const key = cacheKey(company, location, date, camera);
    const [timestamps, setTimestamps] = useState<number[]>(() => INDEX_CACHE.get(key) ?? []);

    useEffect(() => {
        if (!company || !location || !date || camera === undefined) return;
        if (INDEX_CACHE.has(key)) {
            setTimestamps(INDEX_CACHE.get(key)!);
            return;
        }
        window.api
            .timestamps({ company, location, date, camera })
            .then((ts) => {
                INDEX_CACHE.set(key, ts);
                setTimestamps(ts);
            })
            .catch(console.error);
    }, [key, company, location, date, camera]);

    return timestamps;
}
