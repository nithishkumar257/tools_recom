import { useEffect, useState } from 'react';

export function useCountUp(target, isVisible, duration = 1400) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / (duration / 35);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 35);
    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return count;
}
