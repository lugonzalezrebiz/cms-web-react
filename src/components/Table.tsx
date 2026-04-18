import {
  Table as TableMui,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import ProgressBar from "./ProgressBar";
import LazyLoading from "./LazyLoading";
import TableSkeleton from "./TableSkeleton";

interface Props {
  clickableRows?: boolean; // Indicates if rows are clickable
  columns: Column[];
  rows: Record<string, any>[];
  onRowClick?: (rowIndex: number) => void; // Callback for row click events
  onClickSort?: (key: string, option: "asc" | "desc") => void; // Callback for sort click events
  loadMore?: () => void; // Callback for loading more data (infinite scroll)
  loading?: boolean; // Indicates if the table is loading data
  groups?: Group[]; // Groups of columns
  currentSort?: { key: string; direction: "asc" | "desc" } | null; // Current sort state
  TableCellWidth?: string; // Width of each table cell
  mainRowWidth?: string; // Width of the main row (first column)
  mainColumnWidth?: string; // Width of the main column (first column header)
  rowWidth?: string; // Width of the rows (used for non-main columns)
}

export interface Group {
  title?: string;
  columns: string[];
  backgroundColor?: string;
}

export interface Column {
  title: string;
  subtitle?: string;
  key: string;
  type?: "ProgressBar";
  sort?: "asc" | "desc";
  complement?: React.ReactNode;
  formatTooltip?: (value: any) => React.ReactNode;
  render?: (value: any) => React.ReactNode;
}

const MainColumn = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "mainColumnWidth",
})<{ mainColumnWidth?: string }>(({ mainColumnWidth }) => ({
    opacity: 0.7,
    fontFamily: Fonts.main,
    fontSize: "16px",
    fontWeight: 600,
    color: "#212529",
    height: "23px",
    padding: "8px 10px",
    border: "none",
    minWidth: mainColumnWidth ? mainColumnWidth : "200px",
    maxWidth: mainColumnWidth ? mainColumnWidth : "200px",
  }),
);

const TableCellStyled = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "TableCellWidth",
})<{ TableCellWidth?: string }>(({ TableCellWidth }) => ({
    opacity: 0.7,
    fontFamily: Fonts.main,
    fontSize: "16px",
    fontWeight: 600,
    color: "#212529",
    height: "23px",
    padding: "8px 10px",
    border: "none",
    minWidth: TableCellWidth ? TableCellWidth : "100px",
    maxWidth: TableCellWidth ? TableCellWidth : "100px",
  }),
);

const Rows = styled(TableCell)<{ rowWidth?: string }>(({ rowWidth }) => ({
  opacity: 0.7,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 600,
  color: Colors.dimGray,
  textAlign: "center",
  padding: "10px 8px",
  border: "none",
  userSelect: "none",
  minWidth: rowWidth ? rowWidth : "90px",
  maxWidth: rowWidth ? rowWidth : "90px",
}));

const ProgressBarRows = styled(TableCell)({
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 600,
  color: Colors.dimGray,
  textAlign: "center",
  padding: "10px 8px",
  border: "none",
  userSelect: "none",
  maxWidth: "180px",
  minWidth: "180px",
});

const MainRow = styled(TableCell)<{
  isClickable?: boolean;
  mainRowWidth?: string;
}>(({ isClickable, mainRowWidth }) => ({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: isClickable ? 500 : 700,
  color: isClickable ? Colors.main : Colors.lightBlack,
  padding: "10px 8px",
  border: "none",
  cursor: isClickable ? "pointer" : "default",
  userSelect: "none",
  minWidth: mainRowWidth ? mainRowWidth : "100px",
  maxWidth: mainRowWidth ? mainRowWidth : "100px",
}));

const TableCellSubTitle = styled("span")({
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: 400,
  color: "#212529",
  margin: 0,
});

const TableHeader = ({
  title,
  subtitle,
  alignLeft = false,
  onSortClick,
  sort,
  complement,
}: {
  title?: string;
  subtitle?: string;
  alignLeft?: boolean;
  onSortClick?: () => void;
  sort?: "asc" | "desc";
  complement?: React.ReactNode;
}) => (
  <>
    <Box
      display="flex"
      flexDirection={alignLeft ? "row" : "column"}
      alignItems={"center"}
      justifyContent={alignLeft ? "space-between" : "center"}
      width="100%"
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        justifyContent={"flex-start"}
        height={"30px"}
      >
        <p
          style={{
            margin: 0,
            //whiteSpace: "nowrap",
            textAlign: alignLeft ? "left" : "center",
          }}
        >
          {title}
        </p>
        {complement}
      </Box>
      <TableCellSubTitle>{subtitle}</TableCellSubTitle>
      {sort && (
        <img
          src="../assets/sorting-arrows-down.svg"
          alt="sort"
          onClick={onSortClick}
          style={{
            transform: sort === "asc" ? "rotate(180deg)" : "none",
            cursor: "pointer",
          }}
        />
      )}
    </Box>
  </>
);

const Table = ({
  loading,
  loadMore,
  clickableRows = false,
  rows,
  onRowClick,
  columns,
  onClickSort,
  groups,
  currentSort,
  TableCellWidth,
  mainRowWidth,
  mainColumnWidth,
  rowWidth,
}: Props) => {
  return (
    <Box margin="0 14px 0 8px">
      <TableContainer component={Paper} elevation={0}>
        <TableMui stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => {
                const group = groups?.find(
                  (g) => g.columns.includes(col.key) && g.title,
                );
                if (group && group.columns[0] === col.key) {
                  return (
                    <TableCell
                      key={`group-${idx}`}
                      align="center"
                      colSpan={group.columns.length}
                      sx={{
                        border: "none",
                        padding: 0,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          top: "50%",
                          left: "15px",
                          right: "15px",
                          transform: "translateY(0)",
                          height: "30%",
                          borderTop: "1px solid #b7bfca",
                          borderRight: "1px solid #b7bfca",
                          borderLeft: "1px solid #b7bfca",
                          zIndex: -1,
                        },
                      }}
                    >
                      <span
                        style={{
                          padding: "0 10px",
                          backgroundColor: Colors.white,
                          color: "#66696c",
                          fontFamily: Fonts.main,
                          fontSize: "12px",
                          fontWeight: 400,
                        }}
                      >
                        {group.title}
                      </span>
                    </TableCell>
                  );
                }
                if (group && group.columns.includes(col.key)) {
                  return null;
                }
                return (
                  <TableCell
                    key={`nogroup-${idx}`}
                    sx={{
                      backgroundColor: Colors.white,
                      border: "none",
                    }}
                  />
                );
              })}
            </TableRow>
            <TableRow>
              {columns.map((col, index) => {
                const isSortedColumn = currentSort?.key === col.key;
                const direction = isSortedColumn
                  ? currentSort?.direction
                  : undefined;

                const group = groups?.find((group) =>
                  group.columns.includes(col.key),
                );

                const CellComponent =
                  index === 0 ? MainColumn : TableCellStyled;

                const handleSortClick = () => {
                  if (onClickSort) {
                    const nextSort =
                      isSortedColumn && direction === "asc" ? "desc" : "asc";
                    onClickSort(col.key, nextSort);
                  }
                };

                return (
                  <CellComponent
                    key={index}
                    sx={{
                      backgroundColor: group?.backgroundColor || Colors.white,
                      borderTopLeftRadius:
                        group && group.columns[0] === col.key ? "8px" : 0,
                      borderTopRightRadius:
                        group &&
                        group.columns[group.columns.length - 1] === col.key
                          ? "8px"
                          : 0,
                    }}
                    TableCellWidth={TableCellWidth}
                    mainColumnWidth={mainColumnWidth}
                  >
                    <TableHeader
                      title={col.title}
                      subtitle={col.subtitle}
                      alignLeft={index === 0}
                      sort={col.sort ? direction || col.sort : undefined}
                      onSortClick={col.sort ? handleSortClick : undefined}
                      complement={col.complement}
                    />
                  </CellComponent>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            <LazyLoading
              loadMore={loadMore}
              loading={loading}
              skeleton={<TableSkeleton columnCount={columns.length} />}
            >
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col, colIndex) => {
                    const group = groups?.find((group) =>
                      group.columns.includes(col.key),
                    );
                    const cellValue = row[col.key];
                    if (col.type === "ProgressBar") {
                      return (
                        <ProgressBarRows key={colIndex}>
                          <ProgressBar
                            value={cellValue}
                            tooltip={
                              col.formatTooltip
                                ? col.formatTooltip(row)
                                : undefined
                            }
                          />
                        </ProgressBarRows>
                      );
                    }

                    if (colIndex === 0) {
                      return (
                        <MainRow
                          key={colIndex}
                          isClickable={clickableRows}
                          mainRowWidth={mainRowWidth}
                          onClick={() => {
                            if (clickableRows && onRowClick) {
                              onRowClick(row.id || rowIndex);
                            }
                          }}
                        >
                          {cellValue}
                        </MainRow>
                      );
                    }

                    return (
                      <Rows
                        rowWidth={rowWidth}
                        key={colIndex}
                        sx={{
                          backgroundColor:
                            group?.backgroundColor || Colors.white,
                          borderBottomLeftRadius:
                            group && group.columns[0] === col.key ? "8px" : 0,
                          borderBottomRightRadius:
                            group &&
                            group.columns[group.columns.length - 1] === col.key
                              ? "8px"
                              : 0,
                        }}
                      >
                        {cellValue}
                      </Rows>
                    );
                  })}
                </TableRow>
              ))}
            </LazyLoading>
          </TableBody>
        </TableMui>
      </TableContainer>
    </Box>
  );
};

export default Table;
