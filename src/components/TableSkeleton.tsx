import { TableCell, TableRow } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import { Colors, Fonts } from "../theme";
import styled from "@emotion/styled";

interface Props {
  columnCount: number;
}
const Rows = styled(TableCell)({
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 600,
  color: Colors.dimGray,
  textAlign: "center",
  padding: "10px 8px",
  border: "none",
  cursor: "pointer",
  userSelect: "none",
});

const TableSkeleton = ({ columnCount }: Props) => {
  return (
    <TableRow>
      {Array.from({ length: columnCount }).map((_, i) => (
        <Rows key={i}>
          <Skeleton variant="rectangular" width="100%" height={"24px"} />
        </Rows>
      ))}
    </TableRow>
  );
};

export default TableSkeleton;
