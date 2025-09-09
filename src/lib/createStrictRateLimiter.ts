export const createStrictRateLimitedFetcher = (fn: (...args: any[]) => void, maxPerSecond = 2) => {
    let callCount = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
  
    return (...args: any[]) => {
      if (callCount < maxPerSecond) {
        fn(...args);
        callCount++;
        if (!resetTimer) {
          resetTimer = setTimeout(() => {
            callCount = 0;
            resetTimer = null;
          }, 1000);
        }
      }
      // else silently drop
    };
  };
  