import { motion } from 'framer-motion';

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
}) {
  const variantClasses = {
    primary:
      'bg-accent text-black font-bold shadow-glow hover:brightness-110',
    secondary:
      'bg-transparent border border-line text-text-primary hover:border-accent',
    ghost: 'bg-bg-elevated text-text-primary hover:bg-bg-elevated/80',
  };

  const sizeClasses = {
    md: 'h-11 px-5 text-sm',
    lg: 'h-14 px-6 text-base',
  };

  const base =
    'rounded-full font-bold tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {children}
    </motion.button>
  );
}
