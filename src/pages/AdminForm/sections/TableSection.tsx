import Table from "../../../components/Table";
import type { Column } from "../../../components/Table";

const columns: Column[] = [
  { title: "User", key: "user" },
  { title: "Location", key: "location" },
  { title: "Company", key: "company" },
  { title: "Date", key: "date" },
];

interface Props {
  rows: Record<string, string>[];
}

const TableSection = ({ rows }: Props) => (
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
