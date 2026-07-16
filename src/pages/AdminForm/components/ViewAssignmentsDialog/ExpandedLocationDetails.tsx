import dayjs from "dayjs";
import ExpandedDetailRow from "./ExpandedDetailRow";
import type { ApprovedLocation } from "../../hooks/useApprovedLocations";

const ExpandedLocationDetails = ({
  location,
  isExpanded,
}: {
  location: ApprovedLocation;
  isExpanded: boolean;
}) => {
  const items: { label: string; value: string }[] = [
    { label: "Address Line 2", value: location.addressLine2 || "-" },
    { label: "Type", value: location.locationType },
    ...(location.locationType === "Temporary"
      ? [
          {
            label: "Due Date",
            value: location.dueDate
              ? dayjs(location.dueDate).format("MMM D, YYYY")
              : "-",
          },
        ]
      : []),
    {
      label: "Created At",
      value: dayjs(location.createdAt).format("MMM D, YYYY"),
    },
  ];

  return <ExpandedDetailRow items={items} isExpanded={isExpanded} />;
};

export default ExpandedLocationDetails;
