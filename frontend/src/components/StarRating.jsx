import { useState } from 'react';
import { motion } from 'framer-motion';

export default function StarRating({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
}) {
  const [hoverIndex, setHoverIndex] = useState(-1);

  const sizeClasses = {
    md: 'w-8 h-8 text-3xl',
    lg: 'w-10 h-10 text-4xl',
  };

  const stars = Array.from({ length: max });

  const handleClick = (index) => {
    if (readOnly) return;
    if (onChange) onChange(index + 1);
  };

  const handleEnter = (index) => {
    if (readOnly) return;
    setHoverIndex(index);
  };

  const handleLeave = () => {
    if (readOnly) return;
    setHoverIndex(-1);
  };

  return (
    <div className="inline-flex items-center gap-1">
      {stars.map((_, i) => {
        const activeIndex = hoverIndex >= 0 ? hoverIndex : value - 1;
        const filled = i <= activeIndex;

        return (
          <motion.span
            key={i}
            role={readOnly ? undefined : 'button'}
            onClick={() => handleClick(i)}
            onMouseEnter={() => handleEnter(i)}
            onMouseLeave={handleLeave}
            whileTap={readOnly ? undefined : { scale: [1, 1.4, 1] }}
            transition={{ duration: 0.35 }}
            className={`${sizeClasses[size]} inline-flex items-center justify-center leading-none select-none ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            } ${filled ? 'text-accent' : 'text-text-muted'}`}
          >
            ★
          </motion.span>
        );
      })}
    </div>
  );
}
