import { Box } from "@mui/system";
import styled from "@emotion/styled";
import Dialog from "../Dialog";
import Button from "../Button";
import { Colors, Fonts } from "../../theme";
import { assetUrl } from "../../utils";
import PunchPickerPanel, { LabeledValue } from "./PunchPickerPanel";

/** A customer group that can re-enter: its last attendant and punch-out. */
export type ReEnterCustomer = {
  /** "Customer N" number. */
  number: number;
  count: number;
  attendedBy: string;
  /** Formatted time of its last punch-out, e.g. "19:00". */
  punchedOut: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  customers: ReEnterCustomer[];
  selectedNumber: number | null;
  onSelectCustomer: (number: number) => void;
  cameraCount: number;
  selectedCamera: number;
  onSelectCamera: (index: number) => void;
  previewSrc: string;
  onConfirm: () => void;
}

const Title = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 600,
  color: Colors.charcoalNavy,
  lineHeight: 1.5,
});

const footerButtonStyle = { padding: "0 15px", height: "30px" };

const CustomerReEnterDialog = ({
  open,
  onClose,
  customers,
  selectedNumber,
  onSelectCustomer,
  cameraCount,
  selectedCamera,
  onSelectCamera,
  previewSrc,
  onConfirm,
}: Props) => (
  <Dialog
    open={open}
    onClose={onClose}
    bgColor={Colors.softWhite}
    footer={
      <Box sx={{ display: "flex", gap: "16px", pb: "16px" }}>
        <Button
          style={footerButtonStyle}
          outfit
          color="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          style={footerButtonStyle}
          outfit
          disabled={selectedNumber === null}
          onClick={onConfirm}
        >
          Select Re-entering Customer
        </Button>
      </Box>
    }
  >
    <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title>Select customer if Re-Enter</Title>
        <Box sx={{ cursor: "pointer", display: "flex" }} onClick={onClose}>
          <img src={assetUrl("x-close.svg")} alt="Close" />
        </Box>
      </Box>

      <PunchPickerPanel
        items={customers.map((customer) => ({
          id: customer.number,
          title: `Customer: ${customer.number}`,
          lines: [
            <LabeledValue label="Attended by" value={customer.attendedBy} />,
            <LabeledValue label="Punched Out" value={customer.punchedOut} />,
          ],
        }))}
        selectedId={selectedNumber}
        onSelect={onSelectCustomer}
        cameraCount={cameraCount}
        selectedCamera={selectedCamera}
        onSelectCamera={onSelectCamera}
        previewSrc={previewSrc}
      />
    </Box>
  </Dialog>
);

export default CustomerReEnterDialog;
