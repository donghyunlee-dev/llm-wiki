import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type PromptComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  ariaLabel: string;
  ariaDescribedBy?: string;
  className?: string;
  textareaClassName?: string;
  buttonClassName?: string;
  buttonAriaLabel?: string;
  buttonTitle?: string;
  buttonIcon: ReactNode;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
  name?: string;
  autoFocus?: boolean;
};

export type PromptComposerHandle = {
  focus: () => void;
};

type ComposerKeyboardMeta = Pick<KeyboardEvent<HTMLTextAreaElement>, "key" | "shiftKey"> & {
  isComposing: boolean;
  keyCode?: number;
};

export function shouldSubmitComposerOnEnter(event: ComposerKeyboardMeta) {
  return (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing &&
    event.keyCode !== 229
  );
}

export const PromptComposer = forwardRef<PromptComposerHandle, PromptComposerProps>(
  function PromptComposer(
    {
      value,
      onValueChange,
      onSubmit,
      placeholder,
      ariaLabel,
      ariaDescribedBy,
      className,
      textareaClassName,
      buttonClassName,
      buttonAriaLabel,
      buttonTitle,
      buttonIcon,
      minRows = 2,
      maxRows = 8,
      disabled = false,
      name,
      autoFocus = false,
    },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const formClassName = ["prompt-composer", className].filter(Boolean).join(" ");
    const textareaMergedClassName = ["prompt-composer-textarea", textareaClassName].filter(Boolean).join(" ");
    const buttonMergedClassName = ["prompt-composer-button", buttonClassName].filter(Boolean).join(" ");

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight || "0") || 24;
      const paddingTop = Number.parseFloat(computedStyle.paddingTop || "0");
      const paddingBottom = Number.parseFloat(computedStyle.paddingBottom || "0");
      const borderTop = Number.parseFloat(computedStyle.borderTopWidth || "0");
      const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth || "0");
      const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom;

      textarea.style.height = "0px";
      const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${Math.max(nextHeight, lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom)}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [maxRows, minRows, value]);

    const submit = () => {
      if (disabled) {
        return;
      }

      onSubmit();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        shouldSubmitComposerOnEnter({
          key: event.key,
          shiftKey: event.shiftKey,
          isComposing: event.nativeEvent.isComposing,
          keyCode: event.nativeEvent.keyCode,
        })
      ) {
        event.preventDefault();
        submit();
      }
    };

    return (
      <form className={formClassName} onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={value}
          name={name}
          rows={minRows}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          className={textareaMergedClassName}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          className={buttonMergedClassName}
          aria-label={buttonAriaLabel ?? ariaLabel}
          title={buttonTitle ?? buttonAriaLabel ?? ariaLabel}
          disabled={disabled}
        >
          {buttonIcon}
        </button>
      </form>
    );
  },
);
