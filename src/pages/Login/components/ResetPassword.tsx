import { Grid } from "@mui/system";
import { TextField } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import Button from "../../../components/Button";
import useResetPassword from "../hooks/useResetPassword";

const TextFieldLabel = styled("p")({
    color: Colors.main,
    fontFamily: Fonts.main,
    fontWeight: 400,
    fontSize: "14px",
    margin: "10px 0 10px 0",
});

const MessageText = styled("p")({
    color: Colors.red,
    fontFamily: Fonts.main,
    fontSize: "13px",
    margin: "4px 0 0 0",
});

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

type ResetPasswordProps = {
    onCancel: () => void;
    onPasswordReset: () => void;
};

export default function ResetPassword({
    onCancel,
    onPasswordReset,
}: ResetPasswordProps) {
    const {
        token,
        setToken,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        error,
        setError,
        loading,
        submit,
    } = useResetPassword();

    async function handleSubmit() {
        const success = await submit();

        if (success) {
            onPasswordReset();
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
                    <TextFieldLabel>RESET TOKEN:</TextFieldLabel>
                    <TextFieldStyled
                        id="resetToken"
                        variant="outlined"
                        type="text"
                        value={token}
                        autoComplete="one-time-code"
                        onChange={(event: any) => {
                            setToken(event.target.value);
                            setError("");
                        }}
                    />
                </Grid>

                <Grid size={12}>
                    <TextFieldLabel>NEW PASSWORD:</TextFieldLabel>
                    <TextFieldStyled
                        id="newPassword"
                        variant="outlined"
                        type="password"
                        value={newPassword}
                        autoComplete="new-password"
                        onChange={(event: any) => {
                            setNewPassword(event.target.value);
                            setError("");
                        }}
                    />
                </Grid>

                <Grid size={12}>
                    <TextFieldLabel>CONFIRM PASSWORD:</TextFieldLabel>
                    <TextFieldStyled
                        id="confirmPassword"
                        variant="outlined"
                        type="password"
                        value={confirmPassword}
                        autoComplete="new-password"
                        onChange={(event: any) => {
                            setConfirmPassword(event.target.value);
                            setError("");
                        }}
                    />
                </Grid>

                {error && (
                    <Grid size={12}>
                        <MessageText>{error}</MessageText>
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
                {loading ? "Updating..." : "Update Password"}
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
