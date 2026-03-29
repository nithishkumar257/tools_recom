import { useEffect, useRef } from 'react';
import './CursorBlob.css';

export default function CursorBlob() {
  const blobRef = useRef(null);
  const pos = useRef({ blobX: 0, blobY: 0, mouseX: 0, mouseY: 0 });

  useEffect(() => {
    const onMove = (e) => {
      pos.current.mouseX = e.clientX;
      pos.current.mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    let animId;
    const animate = () => {
      const p = pos.current;
      p.blobX += (p.mouseX - p.blobX) * 0.15;
      p.blobY += (p.mouseY - p.blobY) * 0.15;
      if (blobRef.current) {
        blobRef.current.style.left = `${p.blobX - 14}px`;
        blobRef.current.style.top = `${p.blobY - 14}px`;
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    // Scale on interactive elements
    const grow = () => {
      if (blobRef.current) {
        blobRef.current.style.transform = 'scale(2.2)';
        blobRef.current.style.background = 'var(--yellow)';
      }
    };
    const shrink = () => {
      if (blobRef.current) {
        blobRef.current.style.transform = 'scale(1)';
        blobRef.current.style.background = 'var(--purple)';
      }
    };

    const interactives = document.querySelectorAll('a, button, .card-hover');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', grow);
        el.removeEventListener('mouseleave', shrink);
      });
    };
  }, []);

  return <div className="cursor-blob" ref={blobRef} />;
}
