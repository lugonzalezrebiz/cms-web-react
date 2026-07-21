import { Box } from "@mui/system";

const DeleteButton = ({
  companyID,
  locationID,
  pendingKey,
  onDelete,
}: {
  companyID: number;
  locationID: number;
  pendingKey: string | null;
  onDelete: (companyID: number, locationID: number) => void;
}) => {
  const isPending = pendingKey === `${companyID}-${locationID}`;
  return (
    <Box
      component="img"
      src="./assets/trash-03.svg"
      alt="delete"
      sx={{
        cursor: isPending ? "not-allowed" : "pointer",
        display: "block",
        opacity: isPending ? 0.4 : 1,
      }}
      onClick={() => !isPending && onDelete(companyID, locationID)}
    />
  );
};

export default DeleteButton;
