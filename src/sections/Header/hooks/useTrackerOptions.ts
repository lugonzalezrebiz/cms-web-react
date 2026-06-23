import useTrackerGrouping from "../../../hooks/useTrackerGrouping";

const useTrackerOptions = () => {
  const { trackers, isLoading } = useTrackerGrouping();
  const PAY_STATION_ID = 8;
  const trackerOptions = trackers.map((t) =>
    t.joinCamera && t.cameras.length > 0 && t.id === PAY_STATION_ID
      ? {
          value: String(t.id),
          title: t.name,
          selectOnClick: true,
          options: t.cameras.map((c) => ({ value: `cam_${c.id}`, title: c.name })),
        }
      : { value: String(t.id), title: t.name },
  );
  return { trackerOptions, isLoading };
};

export default useTrackerOptions;
