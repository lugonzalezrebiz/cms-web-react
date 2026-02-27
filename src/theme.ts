//breakpoints

export const Breakpoints = {
  lg: "@media (max-width: 1200px)",
};

//Fonts

export const Fonts = {
  main: "Fira Sans",
  secondary: "Inter",
  buttonFont: "Outfit",
};

//Colors

export const Colors = {
  white: "#fff",
  green: "#00AF12",
  red: "#E80000",
  darkGrey: "#404040",
  lightGrey: "#E7E7E7",
  lightPeach: "#fceee8",
  coralPeach: "#f8b7a4",
  mutedPeach: "#DDBAB3",
  main: "#fb5103",
  orangeHover: "#fa5202",
  black: "#010101",
  mediumGrey: "#676767",
  secondary: "#f8dfd7",
  mutedSteelBlue: "rgba(102, 112, 133, 0.7)",
  softCoral: "#EFAB8C",
  burntOrange: "#E67946",
  semiTransparentBlack: "rgba(0, 0, 0, 0.7)",
  semiTransparentBlackTwo: "rgba(39, 39, 39, 0.70)",
  semiTransparentCharcoalGray: "rgba(33, 33, 33, 0.7)",
  blueGray: "#808899",
  lightSteelGray: "#B2B7C2",
  lightGrayishBlue: "#E0E2E7",
  lilacBlue: "#8A84FC",
  softSlate: "#98A2B3",
  lightGrayBlue: "#EEF0F2",
  softSteelBlue: "#AFBBC6",
  charcoalNavy: "#344054",
  lightBluishGray: "#EEF0F2",
  dimGray: "#777777",
  paleGray: "#E6E6E6",
  offWhite: "#F1F1F1",
  paleSilver: "#BABBBD",
  mediumGray: "#929292",
  ghostWhite: "#F8F9FA",
  lavenderMist: "#F7F1FE",
  paleSkyBlue: "#E6F7FF",
  pinkBlush: "#FFEBF4",
  peachPuff: "#FFEEE6",
  lightBlack: "#212529",
  blue: "#06A0F6",
  paleSteal: "#D0D5DD",
  paleSlateBlue: "#bcc6cf",
  paleIceBlue: "#d7dde2",
  softTangerine: "#FC9767",
  lightSkyBlue: "#b4e3fc",
  gunmetal: "#3a3a3a",
  mutedSlate: "#93989a",
  verylightgrayishblue: "#eef0f2",
  semiTransparentWhite: "rgba(255, 255, 255, 0.5)",
  transparentWhite: "rgba(255, 255, 255, 0.1)",
  coolGray: "#E9E9EA",
  lightOrange: "#fb966f",
  lightGray: "#eff1f4",
  palePeach: "#FDD5BE",
  softBluishGray: "#d0d5dd",
  bluishGray: "#98A2B3",
  vividOrange: "#fa5f02",
  ghostoffWhite: "#eff1f4",
  silverGrey: "#b3b3b3",
  blushWhite: "#fef7f6",
};

//Color Palette

export const BarChartPalette = [
  Colors.paleSlateBlue,
  Colors.paleIceBlue,
  Colors.softTangerine,
  Colors.blueGray,
];

const theme = {
  palette: {
    grey: {
      500: "#ebf0f7",
    },
    primary: {
      main: "#fb5103",
      contrastText: "#ffffff",
    },
    trend: {
      positive: "#00AF12",
      negative: "#E80000",
    },
  },
  shadows: [
    "3px 3px 10px 0 rgba(0, 0, 0, 0.1)",
    "1px 1px 10px 0 rgba(0, 0, 0, 0.26)",
  ],
  typography: {
    fontFamily: Fonts.main,
  },
};
export default theme;
