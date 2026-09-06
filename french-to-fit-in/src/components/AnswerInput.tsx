import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from './Button';
import './AnswerInput.css';

const ACCENTS = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ù', 'û', 'ç', 'î', 'ï', 'ô', 'œ'];

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Accent buttons are a convenience, never a requirement -- omitting accents
 * in normal beginner input is never penalised (see engine/scoring.ts, which
 * strips accents before comparison).
 */
export function AnswerInput({ value, onChange, onSubmit, placeholder, disabled, autoFocus }: AnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function insertAccent(char: string) {
    const input = inputRef.current;
    if (!input) {
      onChange(value + char);
      return;
    }
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const next = value.slice(0, start) + char + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !disabled && value.trim().length > 0) {
      e.preventDefault();
      onSubmit(value);
    }
  }

  return (
    <div className="answer-input">
      <input
        ref={inputRef}
        type="text"
        className="answer-input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Type your answer, or "?" if you genuinely can\'t recall it'}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label="Your answer in French"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <div className="accent-row" role="group" aria-label="Insert accented character">
        {ACCENTS.map((char) => (
          <button
            key={char}
            type="button"
            className="accent-key"
            onClick={() => insertAccent(char)}
            disabled={disabled}
            tabIndex={-1}
          >
            {char}
          </button>
        ))}
      </div>
      <div className="answer-input-actions">
        <Button onClick={() => onSubmit(value)} disabled={disabled || value.trim().length === 0}>
          Answer
        </Button>
        <Button variant="ghost" onClick={() => onSubmit('?')} disabled={disabled}>
          I can't recall this ("?")
        </Button>
      </div>
    </div>
  );
}
