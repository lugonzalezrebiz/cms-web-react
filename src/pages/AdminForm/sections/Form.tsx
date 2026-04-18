import { Box, Grid } from "@mui/system";
import Card from "../../../components/Card";
import { useState } from "react";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import { TextField } from "@mui/material";
import CalendarComponent from "../../../components/CalendarComponent";
import Button from "../../../components/Button";

const TextFieldLabel = styled("p")({
  color: Colors.main,
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "14px",
  margin: "10px 0 10px 0",
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

interface FormState {
  user: string;
  location: string;
  company: string;
  date: Date | null;
}

const emptyForm: FormState = {
  user: "",
  location: "",
  company: "",
  date: null,
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

interface Props {
  onAddRow: (row: Record<string, string>) => void;
}

const Form = ({ onAddRow }: Props) => {
  const [form, setForm] = useState<FormState>(emptyForm);

  const handleChange =
    (field: keyof Omit<FormState, "date">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.user || !form.location || !form.company || !form.date) return;
    const row = {
      user: form.user,
      location: form.location,
      company: form.company,
      date: formatDate(form.date as Date),
    };
    console.log("Form record:", row);
    onAddRow(row);
    setForm(emptyForm);
  };

  const isDisabled =
    !form.user || !form.location || !form.company || !form.date;

  return (
    <Card
      sx={{
        maxWidth: "600px",
        margin: "0 auto",
        bgcolor: Colors.white,
        borderRadius: "8px",
        boxShadow: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
      }}
    >
      <Box padding="20px">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={1}>
            <Grid size={12}>
              <TextFieldLabel>USER:</TextFieldLabel>
              <TextFieldStyled
                label=""
                variant="outlined"
                value={form.user}
                onChange={handleChange("user")}
              />
            </Grid>
            <Grid size={12}>
              <TextFieldLabel>LOCATION:</TextFieldLabel>
              <TextFieldStyled
                label=""
                variant="outlined"
                value={form.location}
                onChange={handleChange("location")}
              />
            </Grid>
            <Grid size={12}>
              <TextFieldLabel>COMPANY:</TextFieldLabel>
              <TextFieldStyled
                label=""
                variant="outlined"
                value={form.company}
                onChange={handleChange("company")}
              />
            </Grid>
            <Grid size={12}>
              <TextFieldLabel>DATE:</TextFieldLabel>
              <CalendarComponent
                selectedDate={form.date}
                onChange={(date) => setForm((prev) => ({ ...prev, date }))}
                size="100%"
              />
            </Grid>
          </Grid>
          <Button
            fullWidth
            outfit
            square
            type="submit"
            style={{ marginTop: "20px" }}
            disabled={isDisabled}
          >
            Done
          </Button>
        </form>
      </Box>
    </Card>
  );
};

export default Form;
