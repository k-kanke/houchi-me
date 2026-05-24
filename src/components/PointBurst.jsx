import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PointBurst({
  show,
  points,
  label,
  onDone,
  duration = 1600,
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      if (onDone) onDone();
    }, duration);
    return () => clearTimeout(t);
  }, [show, duration, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="point-burst"
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Ripple rings */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={`ring-${i}`}
              className="absolute w-40 h-40 rounded-full border-2 border-accent"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{
                duration: 1.2,
                delay: i * 0.18,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Core text */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.4, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -120 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            <span
              className="font-display text-accent text-[120px] leading-none tracking-wider"
              style={{
                textShadow:
                  '0 0 24px rgba(255,92,0,0.85), 0 0 60px rgba(255,92,0,0.55)',
              }}
            >
              +{points}pt
            </span>
            {label && (
              <span className="mt-2 text-sm text-text-primary font-bold tracking-wide">
                {label}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
