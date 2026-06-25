import useTrackerGrouping from "../../../hooks/useTrackerGrouping";

const useTrackerOptions = () => {
  const { trackers, isLoading } = useTrackerGrouping();
  const trackerOptions = trackers.map((t) =>
    t.joinCamera && t.cameras.length > 0 
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
