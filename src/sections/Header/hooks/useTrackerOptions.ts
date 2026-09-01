import useTrackerGrouping from "../../../hooks/useTrackerGrouping";

const useTrackerOptions = (unreviewedTrackerIds: Set<number> = new Set()) => {
  const { trackers, isLoading } = useTrackerGrouping();
  const trackerOptions = trackers.map((t) =>
    t.joinCamera && t.cameras.length > 0
      ? {
          value: String(t.id),
          title: t.name,
          selectOnClick: true,
          options: t.cameras.map((c) => ({ value: `cam_${c.id}`, title: c.name })),
          hasAI: unreviewedTrackerIds.has(t.id),
        }
      : {
          value: String(t.id),
          title: t.name,
          hasAI: unreviewedTrackerIds.has(t.id),
        },
  );
  return { trackerOptions, isLoading };
};

export default useTrackerOptions;
