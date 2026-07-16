import { Box } from "@mui/system";
import Divider from "../../../../components/Divider";
import { Colors, Fonts } from "../../../../theme";

const EmployeeDrawerHeader = ({
  name,
  role,
  active,
  onResetPassword,
  onToggleActive,
  toggleActiveError,
}: {
  name?: string;
  role?: string;
  active?: boolean;
  onResetPassword?: () => void;
  onToggleActive?: () => void;
  toggleActiveError?: string | null;
}) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          p: "8px 0 8px 16px",
        }}
      >
        <Box p={"4px 8px 4px 0"}>
          <img
            src="./assets/user-03.svg"
            alt="user"
            style={{
              width: 34,
              height: 34,
              marginTop: "4px",
              marginLeft: "-4px",
            }}
          />
        </Box>
        <Box>
          <Box
            sx={{
              fontFamily: Fonts.main,
              fontSize: "16px",
              fontWeight: 600,
              color: Colors.lightBlack,
              lineHeight: 1.5,
            }}
          >
            {name}
          </Box>
          <Box
            sx={{
              fontFamily: Fonts.main,
              fontSize: "14px",
              fontWeight: 500,
              color: Colors.dimGray,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              lineHeight: 1.43,
            }}
          >
            {role && `${role} Agent -`}
            <Box
              component="span"
              onClick={onResetPassword}
              sx={{
                color: Colors.vividOrange,
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline",
                lineHeight: 1.43,
              }}
            >
              Reset Password
            </Box>
            <Box
              component="span"
              sx={{
                color: Colors.vividOrange,
                fontWeight: 500,
                lineHeight: 1.43,
              }}
            >
              /
            </Box>
            <Box
              component="span"
              onClick={onToggleActive}
              sx={{
                color: Colors.vividOrange,
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline",
                lineHeight: 1.43,
              }}
            >
              {active ? "Disable User" : "Enable User"}
            </Box>
          </Box>
          {toggleActiveError && (
            <Box
              sx={{
                fontFamily: Fonts.main,
                fontSize: "12px",
                color: Colors.red,
                lineHeight: 1.43,
              }}
            >
              {toggleActiveError}
            </Box>
          )}
        </Box>
      </Box>
      <Divider marginBottom="0px" />
    </Box>
  );
};

export default EmployeeDrawerHeader;
