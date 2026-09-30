// Piezas de interfaz pequeñas y reutilizables.
import { useEffect, useState } from 'react';

export function Avatar({ user, size = 40, className = '' }) {
  if (!user) return null;
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span
      className={`avatar ${className}`}
      style={{ '--avatar-color': user.color, '--size': `${size}px` }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/** Barra de progreso. Anima el ancho con transform para no provocar reflow. */
export function ProgressBar({ value, label, size = 'md', tone }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div
      className={`progress-track size-${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      style={tone ? { '--bar-color': tone } : undefined}
    >
      <span className="progress-fill" style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action, compact = false }) {
  return (
    <div className={`empty-state ${compact ? 'is-compact' : ''}`}>
      {Icon && (
        <span className="empty-icon" aria-hidden="true">
          <Icon size={compact ? 22 : 28} strokeWidth={1.75} />
        </span>
      )}
      <h3 className="empty-title">{title}</h3>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

/** Control segmentado accesible (radiogroup). */
export function Segmented({ options, value, onChange, label, size = 'md', className = '' }) {
  return (
    <div className={`segmented size-${size} ${className}`} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const Icon = o.icon;
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className="segmented-item"
            data-active={active || undefined}
            onClick={() => onChange(o.value)}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            <span>{o.label}</span>
            {o.count != null && <span className="segmented-count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Número que resalta brevemente cuando cambia su valor. */
export function AnimatedNumber({ value, className = '' }) {
  const [prev, setPrev] = useState(value);
  const [bump, setBump] = useState(false);
  if (value !== prev) {
    setPrev(value);
    setBump(true);
  }
  useEffect(() => {
    if (!bump) return undefined;
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [bump]);
  return (
    <span className={`animated-number ${className}`} data-bump={bump || undefined}>
      {value}
    </span>
  );
}

export function Skeleton({ className = '', style }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}
