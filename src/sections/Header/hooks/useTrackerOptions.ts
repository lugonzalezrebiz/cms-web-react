import useTrackers from "../../../hooks/useTrackers";

const useTrackerOptions = () => {
  const { trackers, isLoading } = useTrackers();
  const trackerOptions = trackers.map((t) => ({ value: String(t.id), title: t.name }));
  return { trackerOptions, isLoading };
};

export default useTrackerOptions;
