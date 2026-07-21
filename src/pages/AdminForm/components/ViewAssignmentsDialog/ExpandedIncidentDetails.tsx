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
    {
      label: "Occurrences In 1 Hour Window",
      value: String(incident.occurrenceCount),
    },
    {
      label: "Last Seen At",
      value: dayjs(incident.createdAt).format("MMM D, YYYY h:mm A"),
    },
  ];

  return <ExpandedDetailRow items={items} isExpanded={isExpanded} />;
};

export default ExpandedIncidentDetails;
