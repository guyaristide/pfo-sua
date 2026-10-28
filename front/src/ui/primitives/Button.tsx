import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'brand' | 'neutral' | 'outline' | 'destructive' | 'base';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  iconLeading?: IconName;
  children?: ReactNode;
}

/** Une seule action « brand » par zone (SLDS §7.3). Le libellé est un verbe. */
export function Button({ variant = 'neutral', iconLeading, className, children, type = 'button', ...rest }: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {iconLeading ? <Icon name={iconLeading} /> : null}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Nom accessible, obligatoire : un bouton composé d'une seule icône porte un aria-label (SLDS §9). */
  label: string;
  variant?: ButtonVariant;
}

export function IconButton({ icon, label, variant = 'neutral', className, type = 'button', ...rest }: IconButtonProps) {
  const classes = ['btn', 'btn--icon', `btn--${variant}`, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}
