import { useState } from "react";
import { TextField } from "@mui/material";
import { Box, Grid } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import useLogin from "./hooks/useLogin";
import { LoginStep } from "./constants";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import PasswordResetSuccess from "./components/PasswordResetSuccess";

const SubTitle = styled("p")({
  color: Colors.main,
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "15px",
  margin: "0",
  textAlign: "center",
});

const TextFieldLabel = styled("p")({
  color: Colors.main,
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "14px",
  margin: "10px 0 10px 0",
});

const LinkLabel = styled("button")({
  appearance: "none",
  background: "transparent",
  border: "none",
  color: Colors.main,
  cursor: "pointer",
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "14px",
  margin: "0",
  padding: "0",
  textDecoration: "none",
});

const FooterLabel = styled("span")({
  color: Colors.main,
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "14px",
  margin: "0",
});

const MessageText = styled("p")({
  color: Colors.red,
  fontFamily: Fonts.main,
  fontSize: "13px",
  margin: "4px 0 0 0",
});

const TextFieldStyled = styled(TextField)({
  width: "100%",
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

const titleByStep = {
  [LoginStep.Login]: "PLEASE LOG IN TO YOUR ACCOUNT",
  [LoginStep.ForgotPassword]: "RESET YOUR PASSWORD",
  [LoginStep.ResetPassword]: "CREATE A NEW PASSWORD",
  [LoginStep.PasswordResetSuccess]: "PASSWORD UPDATED",
};

const Login = () => {
  const [step, setStep] = useState<LoginStep>(LoginStep.Login);

  const {
    username,
    setUsername,
    password,
    setPassword,
    error,
    setError,
    loading,
    handleLogin,
  } = useLogin();

  function backToLogin() {
    setStep(LoginStep.Login);
  }

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Card sx={{ width: "500px", margin: "5%" }}>
        <Box padding="20px">
          <Box display="flex" flexDirection="column" alignItems="center">
            <img height={72} src="./assets/rebiz-logo-1.svg" alt="Icon" />

            <Box margin="33px 0 12px 0">
              <SubTitle>{titleByStep[step]}</SubTitle>
            </Box>
          </Box>

          {step === LoginStep.Login && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleLogin();
              }}
            >
              <Grid container margin="28px 0" spacing={1}>
                <Grid size={12}>
                  <TextFieldLabel>USERNAME:</TextFieldLabel>
                  <TextFieldStyled
                    id="username"
                    variant="outlined"
                    type="text"
                    onChange={(event: any) => {
                      setUsername(event.target.value);
                      setError("");
                    }}
                    value={username}
                    autoComplete="username"
                  />
                </Grid>

                <Grid size={12}>
                  <TextFieldLabel>PASSWORD:</TextFieldLabel>
                  <TextFieldStyled
                    id="password"
                    variant="outlined"
                    type="password"
                    onChange={(event: any) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    value={password}
                    autoComplete="current-password"
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
                {loading ? "Logging in..." : "Log In"}
              </Button>

              <Box display="flex" justifyContent="center" margin="14px 0 0 0">
                <LinkLabel
                  type="button"
                  onClick={() => setStep(LoginStep.ForgotPassword)}
                >
                  Forgot Password?
                </LinkLabel>
              </Box>
            </form>
          )}

          {step === LoginStep.ForgotPassword && (
            <ForgotPassword
              onCancel={backToLogin}
              onEmailSent={() => setStep(LoginStep.ResetPassword)}
            />
          )}

          {step === LoginStep.ResetPassword && (
            <ResetPassword
              onCancel={backToLogin}
              onPasswordReset={() => setStep(LoginStep.PasswordResetSuccess)}
            />
          )}

          {step === LoginStep.PasswordResetSuccess && (
            <PasswordResetSuccess onBackToLogin={backToLogin} />
          )}

          <Box
            display="flex"
            margin="20px 0 0 0"
            justifyContent="center"
            alignItems="center"
          >
            <FooterLabel style={{ margin: "0 6px 0 0", fontSize: "14px" }}>
              Powered by
            </FooterLabel>
            <img height={11} src="./assets/rebiz-logo-1.svg" alt="rebiz" />
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;
