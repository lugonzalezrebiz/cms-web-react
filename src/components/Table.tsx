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
import type { RefObject } from "react";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import ProgressBar from "./ProgressBar";
import LazyLoading from "./LazyLoading";
import TableSkeleton from "./TableSkeleton";

interface Props {
  clickableRows?: boolean; // Indicates if rows are clickable
  columns: Column[];
  rows: Record<string, unknown>[];
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
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  disableOverflow?: boolean;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatTooltip?: (value: any) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any) => React.ReactNode;
  width?: string;
  rowColor?: string;
  align?: "center" | "left" | "right";
}

const MainColumn = styled(TableCell, {
  shouldForwardProp: (prop) =>
    prop !== "mainColumnWidth" && prop !== "TableCellWidth",
})<{ mainColumnWidth?: string }>(({ mainColumnWidth }) => ({
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: 600,
  color: Colors.dimGray,
  height: "26px",
  padding: "0 0px",
  border: "none",
  borderBottom: `1px solid ${Colors.paleGray}`,
  minWidth: mainColumnWidth ? mainColumnWidth : "200px",
  maxWidth: mainColumnWidth ? mainColumnWidth : "200px",
}));

const TableCellStyled = styled(TableCell, {
  shouldForwardProp: (prop) =>
    prop !== "TableCellWidth" && prop !== "mainColumnWidth",
})<{ TableCellWidth?: string }>(({ TableCellWidth }) => ({
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: 600,
  color: Colors.dimGray,
  height: "26px",
  padding: "0 10px",
  border: "none",
  borderBottom: `1px solid ${Colors.paleGray}`,
  minWidth: TableCellWidth ? TableCellWidth : "100px",
  maxWidth: TableCellWidth ? TableCellWidth : "100px",
}));

const Rows = styled(TableCell, {
  shouldForwardProp: (prop) =>
    prop !== "rowWidth" && prop !== "rowColor" && prop !== "rowAlign",
})<{
  rowWidth?: string;
  rowColor?: string;
  rowAlign?: "center" | "left" | "right";
}>(({ rowWidth, rowColor, rowAlign }) => ({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: rowColor ?? Colors.dimGray,
  textAlign: rowAlign ?? "center",
  padding: "5px 8px",
  border: "none",
  borderBottom: `1px solid ${Colors.paleGray}`,
  userSelect: "none",
  minWidth: rowWidth ? rowWidth : "90px",
  maxWidth: rowWidth ? rowWidth : "90px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  "tr:last-child &": { borderBottom: "none" },
}));

const ProgressBarRows = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "rowColor" && prop !== "rowAlign",
})<{
  rowColor?: string;
  rowAlign?: "center" | "left" | "right";
}>(({ rowColor, rowAlign }) => ({
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 600,
  color: rowColor ?? Colors.dimGray,
  textAlign: rowAlign ?? "center",
  padding: "5px 8px",
  border: "none",
  borderBottom: `1px solid ${Colors.paleGray}`,
  userSelect: "none",
  maxWidth: "180px",
  minWidth: "180px",
  "tr:last-child &": { borderBottom: "none" },
}));

const MainRow = styled(TableCell, {
  shouldForwardProp: (prop) =>
    prop !== "isClickable" &&
    prop !== "mainRowWidth" &&
    prop !== "rowColor" &&
    prop !== "rowAlign",
})<{
  isClickable?: boolean;
  mainRowWidth?: string;
  rowColor?: string;
  rowAlign?: "center" | "left" | "right";
}>(({ isClickable, mainRowWidth, rowColor, rowAlign }) => ({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: isClickable ? 500 : 400,
  color: rowColor ?? (isClickable ? Colors.main : Colors.lightBlack),
  textAlign: rowAlign ?? "left",
  //padding: "5px 8px",
  padding: "5px 0px",
  border: "none",
  borderBottom: `1px solid ${Colors.paleGray}`,
  cursor: isClickable ? "pointer" : "default",
  userSelect: "none",
  minWidth: mainRowWidth ? mainRowWidth : "100px",
  maxWidth: mainRowWidth ? mainRowWidth : "100px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  "tr:last-child &": { borderBottom: "none" },
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
  align = "center",
  onSortClick,
  sort,
  complement,
}: {
  title?: string;
  subtitle?: string;
  align?: "center" | "left" | "right";
  onSortClick?: () => void;
  sort?: "asc" | "desc";
  complement?: React.ReactNode;
}) => (
  <>
    <Box
      display="flex"
      flexDirection={align === "center" ? "column" : "row"}
      alignItems={"center"}
      justifyContent={
        align === "left"
          ? "flex-start"
          : align === "right"
            ? "flex-end"
            : "center"
      }
      width="100%"
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        justifyContent={align === "right" ? "flex-end" : "flex-start"}
        height={"26px"}
      >
        {title && (
          <p
            style={{
              margin: 0,
              textAlign: align,
            }}
          >
            {title}
          </p>
        )}
        {complement}
      </Box>
      <TableCellSubTitle>{subtitle}</TableCellSubTitle>
      {sort && (
        <img
          src="./assets/sorting-arrows-down.svg"
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
  scrollContainerRef,
  disableOverflow,
}: Props) => {
  return (
    <Box margin="0 0px 0 0px" width={"100%"} borderRadius="8px">
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          width: "100%",

          ...(disableOverflow && { overflow: "visible" }),
        }}
      >
        <TableMui stickyHeader sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <TableHead>
            {groups && (
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
            )}
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
                      ...(!groups && {
                        "&.MuiTableCell-stickyHeader": { paddingTop: "16px" },
                      }),
                      backgroundColor: group?.backgroundColor || Colors.white,
                      borderTopLeftRadius:
                        group && group.columns[0] === col.key ? "8px" : 0,
                      borderTopRightRadius:
                        group &&
                        group.columns[group.columns.length - 1] === col.key
                          ? "8px"
                          : 0,
                    }}
                    TableCellWidth={col.width || TableCellWidth}
                    mainColumnWidth={col.width || mainColumnWidth}
                  >
                    <TableHeader
                      title={col.title}
                      subtitle={col.subtitle}
                      align={
                        col.align ??
                        (index === 0 && !!col.title ? "left" : "center")
                      }
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
              scrollContainerRef={scrollContainerRef}
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
                        <ProgressBarRows
                          key={colIndex}
                          rowColor={col.rowColor}
                          rowAlign={col.align}
                        >
                          <ProgressBar
                            value={cellValue as number}
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
                          mainRowWidth={col.width || mainRowWidth}
                          rowColor={col.rowColor}
                          rowAlign={col.align}
                          onClick={() => {
                            if (clickableRows && onRowClick) {
                              onRowClick(
                                (row.id as number | undefined) ?? rowIndex,
                              );
                            }
                          }}
                        >
                          {!col.title ? (
                            <Box
                              display="flex"
                              justifyContent={
                                col.align === "left"
                                  ? "flex-start"
                                  : col.align === "right"
                                    ? "flex-end"
                                    : "center"
                              }
                              alignItems="center"
                            >
                              {col.render
                                ? col.render(cellValue)
                                : (cellValue as React.ReactNode)}
                            </Box>
                          ) : col.render ? (
                            col.render(cellValue)
                          ) : (
                            (cellValue as React.ReactNode)
                          )}
                        </MainRow>
                      );
                    }

                    return (
                      <Rows
                        rowWidth={col.width || rowWidth}
                        rowColor={col.rowColor}
                        rowAlign={col.align}
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
                        {!col.title ? (
                          <Box
                            display="flex"
                            justifyContent={
                              col.align === "left"
                                ? "flex-start"
                                : col.align === "right"
                                  ? "flex-end"
                                  : "center"
                            }
                            alignItems="center"
                          >
                            {col.render
                              ? col.render(cellValue)
                              : (cellValue as React.ReactNode)}
                          </Box>
                        ) : col.render ? (
                          col.render(cellValue)
                        ) : (
                          (cellValue as React.ReactNode)
                        )}
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
