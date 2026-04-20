import Table from "../../../components/Table";
import type { Column } from "../../../components/Table";

interface Props {
  rows: Record<string, string>[];
  columns: Column[];
}

const TableSection = ({ rows, columns }: Props) => (
  <Table
    mainColumnWidth="20px"
    rowWidth="20px"
    mainRowWidth="20px"
    TableCellWidth="20px"
    columns={columns}
    rows={rows}
  />
);

export default TableSection;
