import { useEffect, useRef, Children } from "react";
import type { ReactNode, ReactElement } from "react";

interface Props {
  children: ReactNode;
  skeleton?: ReactNode;
  loadMore?: () => void;
  loading?: boolean;
}

const LazyLoading = ({
  children,
  skeleton,
  loading,
  loadMore,
}: Props): ReactElement => {
  const allChildren = Children.toArray(children);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 300;
      if (isNearBottom && loadMore && !hasRequestedRef.current) {
        hasRequestedRef.current = true;
        loadMore();
      }

      if (!isNearBottom && hasRequestedRef.current) {
        hasRequestedRef.current = false;
      }
    };
    hasRequestedRef.current = false;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loadMore]);

  return (
    <>
      {allChildren}
      {loading && skeleton}
    </>
  );
};

export default LazyLoading;
