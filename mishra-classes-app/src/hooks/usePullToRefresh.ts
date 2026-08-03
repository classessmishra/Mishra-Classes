import { useState, useCallback } from 'react';

export function usePullToRefresh(refetchFunction: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchFunction();
    } finally {
      // Small timeout to let UI settle before dismissing spinner
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [refetchFunction]);

  return { refreshing, onRefresh };
}
