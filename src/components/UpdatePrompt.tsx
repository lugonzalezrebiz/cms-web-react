import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Dialog from "./Dialog";
import Button from "./Button";

type UpdateState = "idle" | "available" | "downloading" | "downloaded" | "error";

export default function UpdatePrompt() {
    const [state, setState] = useState<UpdateState>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!window.api?.onUpdateAvailable) return;

        window.api.onUpdateAvailable(() => {
            setState("available");
        });

        window.api.onUpdateProgress((p) => {
            setState("downloading");
            setProgress(Math.round(p.percent || 0));
        });

        window.api.onUpdateDownloaded(() => {
            setState("downloaded");
        });

        window.api.onUpdateError((err) => {
            setError(err.message);
            setState("error");
        });
    }, []);

    if (state === "idle") return null;

    return (
        <Dialog
            open
            onClose={() => setState("idle")}
            maxWidth="420px"
            padding="24px"
            footer={
                <>
                    {state === "available" && (
                        <Button
                            square
                            onClick={() => {
                                setState("downloading");
                                window.api.downloadUpdate();
                            }}
                        >
                            Install Update
                        </Button>
                    )}

                    {state === "downloaded" && (
                        <Button square onClick={() => window.api.installUpdate()}>
                            Restart Now
                        </Button>
                    )}

                    {state === "error" && (
                        <Button square color="secondary" onClick={() => setState("idle")}>
                            Close
                        </Button>
                    )}
                </>
            }
        >
            <Box>
                {state === "available" && (
                    <>
                        <Typography fontWeight={700}>New update available</Typography>
                        <Typography mt={1}>
                            A newer version of CMSW is available. Click install to download and apply it.
                        </Typography>
                    </>
                )}

                {state === "downloading" && (
                    <>
                        <Typography fontWeight={700}>Downloading update</Typography>
                        <Typography mt={1}>{progress}% downloaded...</Typography>
                    </>
                )}

                {state === "downloaded" && (
                    <>
                        <Typography fontWeight={700}>Update ready</Typography>
                        <Typography mt={1}>
                            The update has been downloaded. Restart the app to install it.
                        </Typography>
                    </>
                )}

                {state === "error" && (
                    <>
                        <Typography fontWeight={700}>Update failed</Typography>
                        <Typography mt={1}>{error}</Typography>
                    </>
                )}
            </Box>
        </Dialog>
    );
}