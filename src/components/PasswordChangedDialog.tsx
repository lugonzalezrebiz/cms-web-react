import SuccessDialog from "./SuccessDialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PasswordChangedDialog = ({ open, onClose }: Props) => (
  <SuccessDialog
    open={open}
    onClose={onClose}
    message="Password changed successfully."
  />
);

export default PasswordChangedDialog;
