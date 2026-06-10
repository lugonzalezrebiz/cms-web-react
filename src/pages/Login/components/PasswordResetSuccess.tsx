import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import Button from "../../../components/Button";

const MessageText = styled("p")({
    color: Colors.green,
    fontFamily: Fonts.main,
    fontSize: "13px",
    margin: "4px 0 0 0",
    textAlign: "center",
});

type PasswordResetSuccessProps = {
    onBackToLogin: () => void;
};

export default function PasswordResetSuccess({
    onBackToLogin,
}: PasswordResetSuccessProps) {
    return (
        <Box margin="28px 0 0 0">
            <MessageText>Password updated successfully.</MessageText>

            <Button
                fullWidth
                outfit
                square
                type="button"
                style={{ marginTop: "16px" }}
                onClick={onBackToLogin}
            >
                Back to Login
            </Button>
        </Box>
    );
}
