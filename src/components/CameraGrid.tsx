import { useEffect } from "react";
import { CameraFrame } from "./CameraFrame";
import { useTimestampIndex, snapToNearest } from "../hooks/useTimestampIndex";

export type Camera = { id: number; name: string };

export type CameraGridProps = {
    company: number;
    location: number;
    date: string;
    cameras: Camera[];
    timestamp: string;
};

function parseTimestamp(ts: string): number {
    if (!ts) return 0;
    if (ts.includes(":")) {
        const [h, m, s] = ts.split(":").map(Number);
        return h * 3600 + m * 60 + (s || 0);
    }
    if (ts.length === 6) {
        return Number(ts.slice(0, 2)) * 3600 + Number(ts.slice(2, 4)) * 60 + Number(ts.slice(4, 6));
    }
    return 0;
}

function formatTimestamp(sec: number): string {
    const s = Math.max(0, Math.min(86399, sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// Prefetch the N real frames before and after current position for one camera.
// Uses the timestamp index so it only requests files that actually exist.
function CameraPrefetch({
    company, location, date, camera, timestamp, windowFrames = 15,
}: { company: number; location: number; date: string; camera: number; timestamp: string; windowFrames?: number }) {
    const index = useTimestampIndex(company, location, date, camera);

    useEffect(() => {
        if (index.length === 0 || !timestamp) return;

        const id = requestIdleCallback(() => {
            const targetSec = parseTimestamp(timestamp);
            const nearest = snapToNearest(index, targetSec);
            if (nearest === null) return;

            const pos = index.indexOf(nearest);
            const start = Math.max(0, pos - windowFrames);
            const end = Math.min(index.length - 1, pos + windowFrames);

            for (let i = start; i <= end; i++) {
                if (i === pos) continue;
                const ts = formatTimestamp(index[i]).replace(/:/g, "");
                new Image().src = `dvr://local/${company}/${location}/${date}/${camera}/${date}_${ts}.jpg`;
            }
        });

        return () => cancelIdleCallback(id);
    }, [index, company, location, date, camera, timestamp, windowFrames]);

    return null;
}

export function CameraGrid({ company, location, date, cameras, timestamp }: CameraGridProps) {
    return (
        <div style={{ display: "contents" }}>
            {cameras.map((cam) => (
                <>
                    <CameraPrefetch
                        key={`prefetch-${cam.id}`}
                        company={company}
                        location={location}
                        date={date}
                        camera={cam.id}
                        timestamp={timestamp}
                    />
                    <CameraFrame
                        key={cam.id}
                        company={company}
                        location={location}
                        date={date}
                        camera={cam.id}
                        cameraName={cam.name}
                        timestamp={timestamp}
                    />
                </>
            ))}
        </div>
    );
}
