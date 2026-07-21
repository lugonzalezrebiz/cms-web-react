import dayjs from "dayjs";
import ExpandedDetailRow from "./ExpandedDetailRow";
import StateBadge from "../../../../components/StateBadge";
import type { ApprovedLocation } from "../../hooks/useApprovedLocations";

const ExpandedLocationDetails = ({
  location,
  isExpanded,
}: {
  location: ApprovedLocation;
  isExpanded: boolean;
}) => {
  const items: { label: string; value: React.ReactNode }[] = [
    { label: "Phone", value: location.phone || "-" },
    { label: "Type", value: location.locationType },
    ...(location.locationType === "Temporary"
      ? [
          {
            label: "Due Date",
            value: location.dueDate
              ? dayjs(location.dueDate).format("MMM D, YYYY")
              : "-",
          },
          {
            label: "Expired",
            value: (
              <StateBadge
                state={location.isExpired ? "HIGH" : "LOW"}
                label={location.isExpired ? "Yes" : "No"}
                size="sm"
              />
            ),
          },
        ]
      : [
          {
            label: "Created At",
            value: dayjs(location.createdAt).format("MMM D, YYYY"),
          },
        ]),
  ];

  return <ExpandedDetailRow items={items} isExpanded={isExpanded} />;
};

export default ExpandedLocationDetails;
