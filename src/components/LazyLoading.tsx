import { useEffect, useRef, Children } from "react";
import type { ReactNode, ReactElement, RefObject } from "react";

interface Props {
  children: ReactNode;
  skeleton?: ReactNode;
  loadMore?: () => void;
  loading?: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

const LazyLoading = ({
  children,
  skeleton,
  loading,
  loadMore,
  scrollContainerRef,
}: Props): ReactElement => {
  const allChildren = Children.toArray(children);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    const container = scrollContainerRef?.current ?? null;

    const handleScroll = () => {
      let isNearBottom: boolean;
      if (container) {
        isNearBottom =
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 300;
      } else {
        isNearBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 300;
      }

      if (isNearBottom && loadMore && !hasRequestedRef.current) {
        hasRequestedRef.current = true;
        loadMore();
      }
      if (!isNearBottom && hasRequestedRef.current) {
        hasRequestedRef.current = false;
      }
    };

    hasRequestedRef.current = false;
    const target: Window | HTMLDivElement = container ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);
    };
  }, [loadMore, scrollContainerRef]);

  return (
    <>
      {allChildren}
      {loading && skeleton}
    </>
  );
};

export default LazyLoading;
