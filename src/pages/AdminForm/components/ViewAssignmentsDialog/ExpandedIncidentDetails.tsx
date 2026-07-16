import dayjs from "dayjs";
import ExpandedDetailRow from "./ExpandedDetailRow";
import type { Incident } from "../../hooks/useIncidents";

const ExpandedIncidentDetails = ({
  incident,
  isExpanded,
}: {
  incident: Incident;
  isExpanded: boolean;
}) => {
  const items: { label: string; value: string }[] = [
    { label: "Occurrences", value: String(incident.occurrenceCount) },
    {
      label: "Created At",
      value: dayjs(incident.createdAt).format("MMM D, YYYY"),
    },
    { label: "Origin", value: incident.metadata?.origin || "-" },
  ];

  return <ExpandedDetailRow items={items} isExpanded={isExpanded} />;
};

export default ExpandedIncidentDetails;
