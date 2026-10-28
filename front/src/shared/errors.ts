/**
 * L'erreur maison que l'interface reçoit (règles 11, 17, 19). La couche HTTP la fabrique à partir de la
 * réponse brute ; aucun écran ne lit jamais cette réponse.
 */
export type AppErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'route-missing'
  | 'resource-missing'
  | 'validation'
  | 'business'
  | 'unexpected';

export class AppError extends Error {
  readonly kind: AppErrorKind;
  /** Référence courte à dicter au support ; le détail technique est au journal. */
  readonly reference: string;
  /** Un refus que nous avons écrit, déjà adressé à la personne qui lit. */
  readonly userMessage: string | undefined;

  constructor(kind: AppErrorKind, options: { reference?: string; userMessage?: string; cause?: unknown } = {}) {
    super(options.userMessage ?? kind, { cause: options.cause });
    this.name = 'AppError';
    this.kind = kind;
    this.reference = options.reference ?? AppError.newReference();
    this.userMessage = options.userMessage;
  }

  static newReference(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) return error;
    return new AppError('unexpected', { cause: error });
  }
}
