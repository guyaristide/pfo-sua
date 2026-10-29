import { useRef } from 'react';
import { Button, type ButtonVariant } from './Button';
import { Icon } from './Icon';

interface FileButtonProps {
  label: string;
  accept: string;
  onFile: (file: File) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}

/** Un vrai bouton (focus, clavier) qui ouvre le choix de fichier ; jamais un label déguisé en bouton. */
export function FileButton({ label, accept, onFile, variant = 'neutral', disabled = false }: FileButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant={variant} iconLeading="upload" disabled={disabled} onClick={() => input.current?.click()}>
        {label}
      </Button>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </>
  );
}

interface FileDropProps {
  id: string;
  label: string;
  hint?: string | undefined;
  accept: string;
  fileName?: string | null | undefined;
  onFile: (file: File) => void;
}

/** Zone de dépôt : focusable au clavier, glisser-déposer, nom du fichier choisi. */
export function FileDrop({ id, label, hint, accept, fileName, onFile }: FileDropProps) {
  return (
    <label
      className="dropzone"
      htmlFor={id}
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
    >
      <Icon name="upload" size={24} />
      <span className="table__strong">{fileName ?? label}</span>
      {hint ? <span className="field__help">{hint}</span> : null}
      <input
        id={id}
        type="file"
        accept={accept}
        className="visually-hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </label>
  );
}
