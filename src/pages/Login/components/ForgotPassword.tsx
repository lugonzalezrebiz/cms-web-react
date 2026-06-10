import { Grid } from "@mui/system";
import { TextField } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import Button from "../../../components/Button";
import useForgotPassword from "../hooks/useForgotPassword";

const TextFieldLabel = styled("p")({
    color: Colors.main,
    fontFamily: Fonts.main,
    fontWeight: 400,
    fontSize: "14px",
    margin: "10px 0 10px 0",
});

const MessageText = styled("p")<{ variant?: "error" | "success" }>(({ variant }) => ({
    color: variant === "success" ? Colors.green : Colors.red,
    fontFamily: Fonts.main,
    fontSize: "13px",
    margin: "4px 0 0 0",
}));

const TextFieldStyled = styled(TextField)({
    "width": "100%",
    "& .MuiOutlinedInput-root": {
        "& fieldset": {
            borderColor: Colors.mutedSteelBlue,
            borderRadius: "8px",
            boxShadow: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
            border: "solid 1px #d0d5dd",
        },
        "&:hover fieldset": {
            border: "solid 1px #d0d5dd",
        },
        "&.Mui-focused fieldset": {
            border: "solid 1px #d0d5dd",
        },
    },
    "& .MuiInputBase-input": {
        fontFamily: Fonts.main,
        fontSize: "14px",
        color: Colors.lightBlack,
        borderRadius: "8px",
        border: "solid 1px #d0d5dd",
    },
});

type ForgotPasswordProps = {
    onCancel: () => void;
    onEmailSent: () => void;
};

export default function ForgotPassword({
    onCancel,
    onEmailSent,
}: ForgotPasswordProps) {
    const { username, setUsername, message, error, setError, loading, submit } =
        useForgotPassword();

    async function handleSubmit() {
        const success = await submit();

        if (success) {
            onEmailSent();
        }
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
            }}
        >
            <Grid container margin="28px 0" spacing={1}>
                <Grid size={12}>
                    <TextFieldLabel>USERNAME:</TextFieldLabel>
                    <TextFieldStyled
                        id="resetUsername"
                        variant="outlined"
                        type="text"
                        value={username}
                        autoComplete="username"
                        onChange={(event: any) => {
                            setUsername(event.target.value);
                            setError("");
                        }}
                    />
                </Grid>

                {message && (
                    <Grid size={12}>
                        <MessageText variant="success">{message}</MessageText>
                    </Grid>
                )}

                {error && (
                    <Grid size={12}>
                        <MessageText variant="error">{error}</MessageText>
                    </Grid>
                )}
            </Grid>

            <Button
                fullWidth
                outfit
                square
                type="submit"
                style={{ marginTop: "16px" }}
                disabled={loading}
            >
                {loading ? "Sending..." : "Send Reset Email"}
            </Button>

            <Button
                fullWidth
                outfit
                square
                type="button"
                style={{ marginTop: "12px" }}
                onClick={onCancel}
            >
                Back to Login
            </Button>
        </form>
    );
}
