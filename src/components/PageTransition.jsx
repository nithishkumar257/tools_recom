import { useState } from 'react';
import './PageTransition.css';

export default function PageTransition({ children }) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const shouldExit = children !== displayChildren;
  const transitionStage = shouldExit ? 'exit' : 'enter';

  const handleAnimationEnd = () => {
    if (shouldExit) {
      setDisplayChildren(children);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div
      className={`page-transition page-transition--${transitionStage}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {displayChildren}
    </div>
  );
}
