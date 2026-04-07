import { useState, useEffect } from "react";
import { useCameraFrame } from "../hooks/useCameraFrame";

type Props = {
    company: number;
    location: number;
    date: string;
    camera: number;
    cameraName: string;
    timestamp: string;
};

export function CameraFrame({ company, location, date, camera, cameraName, timestamp }: Props) {
    const src = useCameraFrame({ company, location, date, camera, timestamp });
    const [errored, setErrored] = useState(false);

    // Reset error state when src changes
    useEffect(() => { setErrored(false); }, [src]);

    return (
        <div
            data-id={camera}
            data-loaded={String(!!src && !errored)}
            style={{ width: "100%", height: "100%", position: "relative" }}
        >
            <img
                src={src}
                alt={cameraName}
                onError={() => setErrored(true)}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                    opacity: src && !errored ? 1 : 0,
                }}
            />
            {(!src || errored) && (
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "#888",
                }}>
                    {cameraName}
                </div>
            )}
        </div>
    );
}
