import { motion } from 'framer-motion';

export default function Badge({
  tone = 'soft',
  size = 'md',
  icon,
  children,
}) {
  const toneClasses = {
    soft: 'bg-accent-soft text-accent',
    accent: 'bg-accent text-black',
    outline: 'border border-line text-text-secondary bg-transparent',
    success: 'bg-success/10 text-success',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  const base =
    'rounded-full font-bold inline-flex items-center gap-1 tracking-wider uppercase';

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`${base} ${toneClasses[tone]} ${sizeClasses[size]}`}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </motion.span>
  );
}
