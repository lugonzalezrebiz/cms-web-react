import { Box } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import Card from "../../../components/Card";
import { Colors, Fonts } from "../../../theme";

interface CardSkeletonProps {
  variant?: "header" | "assignment" | "none";
}

const HeaderSkeleton = () => (
  <Card>
    <Box padding="16px">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        height="24px"
        mb={1}
      >
        <Skeleton variant="text" width="55%" height={24} />
        <Skeleton
          variant="rectangular"
          width={63}
          height={53}
          sx={{ borderRadius: "4px", mt: "20px" }}
        />
      </Box>
      <Skeleton variant="text" width={80} height={44} />
    </Box>
  </Card>
);

const AssignmentSkeleton = () => (
  <Card
    position={"relative"}
    bgcolor="white"
    padding="16px"
    borderRadius="16px"
  >
    <img
      style={{
        position: "absolute",
        right: "16px",
        cursor: "pointer",
        padding: "1px 4px",
      }}
      src="./assets/dots-vertical.svg"
      alt="More options"
    />
    <Box display="flex" alignItems="center" mb="18px">
      <Skeleton
        variant="rounded"
        width={92}
        height={20}
        sx={{ borderRadius: "20px" }}
      />
    </Box>
    <Box sx={{ mb: "4px" }} display="flex" alignItems="center" gap={0.8}>
      <Skeleton variant="circular" width={15} height={15} />
      <Skeleton variant="text" width={35} height={20} />
      <Skeleton variant="circular" width={15} height={15} />
      <Skeleton variant="text" width={35} height={20} />
    </Box>
    <Skeleton variant="text" width="50%" height={30} sx={{ mb: "10px" }} />
    <Skeleton
      variant="rectangular"
      width="100%"
      height={1}
      sx={{ mb: "8px" }}
    />
    <Box sx={{ mb: "2px" }} display="flex" alignItems="center" gap={1}>
      <Skeleton variant="circular" width={20} height={20} />
      <Skeleton variant="text" width={75} height={20} />
    </Box>
  </Card>
);

const None = () => (
  <Card
    bgcolor={Colors.white}
    borderRadius="16px"
    sx={{
      display: "flex",
      flexDirection: "column",
      height: "164px",
      justifyContent: "center",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <Box
      component="img"
      src="./assets/message-text-square-01.svg"
      alt=""
      sx={{ opacity: 0.25, width: 28, height: 28 }}
    />
    <Box
      sx={{
        fontFamily: Fonts.main,
        fontSize: "13px",
        fontWeight: 500,
        color: Colors.dimGray,
        opacity: 0.5,
      }}
    >
      No assignments
    </Box>
  </Card>
);

const CardSkeleton = ({ variant = "header" }: CardSkeletonProps) => {
  switch (variant) {
    case "assignment":
      return <AssignmentSkeleton />;
    case "none":
      return <None />;
    default:
      return <HeaderSkeleton />;
  }
};

export default CardSkeleton;
