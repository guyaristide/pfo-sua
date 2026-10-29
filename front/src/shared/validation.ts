/** Règles de forme partagées par les formulaires : une seule expression par règle (règle 4). */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: string): boolean => EMAIL.test(value.trim());
export const isDigits = (value: string, length?: number): boolean => (length ? new RegExp(`^\\d{${length}}$`) : /^\d+$/).test(value.trim());
export const inRange = (value: string, min: number, max: number): boolean => /^\d+$/.test(value.trim()) && Number(value) >= min && Number(value) <= max;
