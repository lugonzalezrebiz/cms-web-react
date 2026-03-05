import { TextField } from "@mui/material";
import { Box, Grid } from "@mui/system";
import styled from "@emotion/styled";
import { useState } from "react";
import { Colors, Fonts } from "../../../theme";
import useNavigateWithQuery from "../../../hooks/useNavigate";
import Card from "../../../components/Card";
import Button from "../../../components/Button";

const SubTitle = styled("p")({
  color: Colors.main,
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "15px",
  margin: "0",
});

const TextFieldLabel = styled("p")({
  color: Colors.main,
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "14px",
  margin: "10px 0 10px 0",
});

const LinkLabel = styled("a")({
  color: Colors.main,
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "14px",
  margin: "0",
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
//context

const Login = () => {
  const navigate = useNavigateWithQuery();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (username === "admin" && password === "1234") {
      navigate(`/dashboard`);
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Card sx={{ width: "500px", margin: "5%" }}>
        <Box padding={"20px"}>
          <Box display={"flex"} flexDirection={"column"} alignItems={"center"}>
            <img height={72} src="../assets/rebiz-logo-1.svg" alt="Icon" />
            <Box margin={"33px 0 12px 0"}>
              <img src={""} alt={""} />
            </Box>
            <SubTitle>PLEASE LOG IN TO YOUR ACCOUNT</SubTitle>
          </Box>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <Grid container margin={"28px 0"} spacing={1}>
              <Grid size={12}>
                <TextFieldLabel>USERNAME:</TextFieldLabel>
                <TextFieldStyled
                  id="username"
                  label=""
                  variant="outlined"
                  type="text"
                  onChange={(e) => {
                    setUsername(e.target.value);
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
                  label=""
                  variant="outlined"
                  type="password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  value={password}
                  autoComplete="current-password"
                />
              </Grid>
              {error && (
                <Grid size={12}>
                  <p
                    style={{
                      color: "red",
                      fontFamily: Fonts.main,
                      fontSize: "13px",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {error}
                  </p>
                </Grid>
              )}
            </Grid>

            <Button
              fullWidth
              outfit
              square
              type="submit"
              style={{ marginTop: "16px" }}
            >
              Log In
            </Button>
          </form>
          <Box
            display={"flex"}
            margin={"20px 0 0 0"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <LinkLabel style={{ margin: "0 6px 0 0", fontSize: "14px" }}>
              Powered by
            </LinkLabel>
            <img height={11} src="../assets/rebiz-logo-1.svg" alt="rebiz" />
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;
