import { t } from 'i18next';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
} from 'lucide-solid';
import { motion, AnimatePresence } from 'motion/react';
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Fragment,
  Show,
} from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { MultiQuestion } from '../lib/message-parsers';

export function MultiQuestionForm(props: {
  questions: MultiQuestion[];
  onSubmit: (text: string) => void;
  onDismiss?: () => void;
}) {
  const [currentStep, setCurrentStep] = createSignal(0);
  const [answers, setAnswers] = createSignal<Record<number, string>>({});
  const [submitted, setSubmitted] = createSignal(false);
  const [focusedRow, setFocusedRow] = createSignal<number | 'custom' | null>(
    null,
  );
  const [hoveredRow, setHoveredRow] = createSignal<number | 'custom' | null>(
    null,
  );
  const fieldId = createUniqueId();
  const q = createMemo(() => props.questions[currentStep()]);
  const isLastStep = createMemo(
    () => currentStep() === props.questions.length - 1,
  );
  const currentAnswer = createMemo(() => answers()[currentStep()].trim() ?? '');
  const options = createMemo(() => (q().type === 'choice' ? q().options : []));
  const isCustomTextActive = createMemo(() => {
    const opts = options();
    const answer = answers()[currentStep()];
    return !!opts && !!answer && !opts.includes(answer);
  });
  const selectedIndex = createMemo(
    () =>
      options()?.findIndex((option) => answers()[currentStep()] === option) ??
      -1,
  );
  const lastOptionIndex = createMemo(() => (options()?.length ?? 0) - 1);
  const isOptionActive = (i: number) =>
    focusedRow() === i || hoveredRow() === i || selectedIndex() === i;
  const isCustomActive = createMemo(
    () =>
      focusedRow() === 'custom' ||
      hoveredRow() === 'custom' ||
      isCustomTextActive(),
  );
  const isMidSepHidden = (i: number) =>
    isOptionActive(i) || isOptionActive(i - 1);
  const isBottomSepHidden = createMemo(
    () => isOptionActive(lastOptionIndex()) || isCustomActive(),
  );
  let firstOptionRef: HTMLButtonElement | undefined;
  let lastOptionRef: HTMLButtonElement | undefined;
  let customAnswerInputRef: HTMLInputElement | undefined;
  let textInputRef: HTMLInputElement | undefined;
  let lastFocusedElRef: HTMLButtonElement | HTMLInputElement | undefined;

  createEffect(() => {
    const target = firstOptionRef ?? textInputRef;
    if (target && lastFocusedElRef !== target) {
      target.focus({ preventScroll: true });
      lastFocusedElRef = target;
    }
  });

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep()]: value }));
  }

  function setFirstOptionEl(el: HTMLButtonElement | null) {
    firstOptionRef = el;
    if (el && lastFocusedElRef !== el) {
      el.focus({ preventScroll: true });
      lastFocusedElRef = el;
    }
  }

  function setTextInputEl(el: HTMLInputElement | null) {
    textInputRef = el;
    if (el && lastFocusedElRef !== el) {
      el.focus({ preventScroll: true });
      lastFocusedElRef = el;
    }
  }

  function handleNext(overrideValue?: string) {
    const value = (overrideValue ?? currentAnswer()).trim();
    if (!value) return;
    if (overrideValue !== undefined) {
      setAnswers((prev) => ({ ...prev, [currentStep()]: overrideValue }));
    }
    if (isLastStep()) {
      if (submitted()) return;
      const finalAnswers =
        overrideValue !== undefined
          ? { ...answers(), [currentStep()]: overrideValue }
          : answers();
      setSubmitted(true);
      const lines = props.questions
        .map((qq, i) => {
          const a = finalAnswers[i].trim();
          return a ? `- **${qq.question}** ${a}` : null;
        })
        .filter((l): l is string => l !== null);
      if (lines.length === 0) {
        props.onDismiss?.();
        return;
      }
      props.onSubmit(lines.join('\n'));
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleSkip() {
    if (isLastStep()) {
      if (submitted()) return;
      const lines = props.questions
        .map((qq, i) => {
          const a = answers()[i].trim();
          return a ? `- **${qq.question}** ${a}` : null;
        })
        .filter((l): l is string => l !== null);
      if (lines.length === 0) {
        props.onDismiss?.();
        return;
      }
      setSubmitted(true);
      props.onSubmit(lines.join('\n'));
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  return (
    <Show
      when={!submitted()}
      fallback={
        <motion.div
          class="my-3 flex items-center gap-2 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Check class="size-4 text-green-600 dark:text-green-400" />
          <span>{t('Answers submitted')}</span>
        </motion.div>
      }
    >
      <Show when={q()}>
        {(question) => (
          <motion.div
            class="rounded-2xl border border-border/60 bg-background p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:bg-neutral-900 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`q-${currentStep()}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label
                      for={fieldId}
                      class="block text-base font-semibold leading-snug text-foreground"
                    >
                      {question().question}
                    </Label>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div class="flex items-center gap-1 text-muted-foreground shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  disabled={currentStep() === 0}
                  aria-label={t('Back')}
                >
                  <ChevronLeft class="size-4" />
                </Button>
                <span class="text-xs tabular-nums px-1">
                  {t('{current} of {total}', {
                    current: currentStep() + 1,
                    total: props.questions.length,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7"
                  onClick={() => handleNext()}
                  disabled={!currentAnswer()}
                  aria-label={t('Next')}
                >
                  <ChevronRight class="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="ms-1 h-7 w-7"
                  onClick={props.onDismiss}
                  aria-label={t('Close')}
                >
                  <X class="size-4" />
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`opts-${currentStep()}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                class="mt-4"
              >
                <div>
                  <Show when={question().type === 'choice' && options()}>
                    <div>
                      <RadioGroup
                        value={
                          options()?.includes(answers()[currentStep()] ?? '')
                            ? answers()[currentStep()]
                            : ''
                        }
                        onValueChange={setAnswer}
                        class="gap-0"
                      >
                        <For each={options()}>
                          {(option, i) => {
                            const id = () => `${fieldId}-opt-${i()}`;
                            const selected = () =>
                              answers()[currentStep()] === option;
                            const isFirst = () => i() === 0;
                            const isLast = () => i() === lastOptionIndex();
                            return (
                              <Fragment key={option}>
                                <Show when={i() > 0}>
                                  <div class="px-3">
                                    <Separator
                                      class={cn(
                                        'bg-border/60 transition-opacity duration-150',
                                        isMidSepHidden(i()) && 'opacity-0',
                                      )}
                                    />
                                  </div>
                                </Show>
                                <div
                                  onClick={() => {
                                    handleNext(option);
                                  }}
                                  onMouseEnter={() => setHoveredRow(i())}
                                  onMouseLeave={() =>
                                    setHoveredRow((prev) =>
                                      prev === i() ? null : prev,
                                    )
                                  }
                                  onFocus={() => setFocusedRow(i())}
                                  onBlur={() =>
                                    setFocusedRow((prev) =>
                                      prev === i() ? null : prev,
                                    )
                                  }
                                  class={cn(
                                    'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-pointer transition-colors hover:bg-muted',
                                    focusedRow() === i() &&
                                      !selected() &&
                                      'bg-muted',
                                    selected() && 'bg-muted-foreground/15',
                                  )}
                                >
                                  <RadioGroupItem
                                    ref={(el: HTMLButtonElement) => {
                                      if (isFirst()) setFirstOptionEl(el);
                                      if (isLast()) lastOptionRef = el;
                                    }}
                                    id={id()}
                                    value={option}
                                    class="peer sr-only"
                                    onKeyDownCapture={(e: KeyboardEvent) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleNext(option);
                                        return;
                                      }
                                      if (
                                        e.key === 'ArrowLeft' ||
                                        e.key === 'ArrowRight'
                                      ) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                      }
                                      const wrapDown =
                                        e.key === 'ArrowDown' && isLast();
                                      const wrapUp =
                                        e.key === 'ArrowUp' && isFirst();
                                      if (wrapDown || wrapUp) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAnswer('');
                                        customAnswerInputRef?.focus();
                                      }
                                    }}
                                  />
                                  <span
                                    aria-hidden
                                    class={cn(
                                      'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-xs font-medium text-muted-foreground transition-colors peer-focus:bg-foreground peer-focus:text-background',
                                      selected() &&
                                        'bg-foreground text-background',
                                    )}
                                  >
                                    {i() + 1}
                                  </span>
                                  <span class="flex-1 leading-snug">
                                    {option}
                                  </span>
                                </div>
                              </Fragment>
                            );
                          }}
                        </For>
                      </RadioGroup>

                      <div class="px-3">
                        <Separator
                          class={cn(
                            'bg-border/60 transition-opacity duration-150',
                            isBottomSepHidden() && 'opacity-0',
                          )}
                        />
                      </div>

                      <label
                        for={fieldId}
                        onMouseEnter={() => setHoveredRow('custom')}
                        onMouseLeave={() =>
                          setHoveredRow((prev) =>
                            prev === 'custom' ? null : prev,
                          )
                        }
                        onFocus={() => setFocusedRow('custom')}
                        onBlur={() =>
                          setFocusedRow((prev) =>
                            prev === 'custom' ? null : prev,
                          )
                        }
                        class={cn(
                          'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-text transition-colors hover:bg-muted focus-within:bg-muted',
                          isCustomTextActive() && 'bg-muted',
                        )}
                      >
                        <span
                          aria-hidden
                          class={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-muted-foreground transition-colors group-focus-within:bg-foreground group-focus-within:text-background',
                            isCustomTextActive() &&
                              'bg-foreground text-background',
                          )}
                        >
                          <Pencil class="size-3.5" />
                        </span>
                        <Input
                          ref={(el: HTMLInputElement) =>
                            (customAnswerInputRef = el)
                          }
                          id={fieldId}
                          class="h-auto flex-1 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0 dark:bg-transparent"
                          placeholder={t('Type your answer...')}
                          value={
                            isCustomTextActive() ? answers()[currentStep()] : ''
                          }
                          onFocus={() => {
                            if (
                              options()?.includes(
                                answers()[currentStep()] ?? '',
                              )
                            ) {
                              setAnswer('');
                            }
                          }}
                          onChange={(e) => setAnswer(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const last = options()?.[lastOptionIndex()];
                              if (last) setAnswer(last);
                              lastOptionRef?.focus();
                              return;
                            }
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const first = options()?.[0];
                              if (first) setAnswer(first);
                              firstOptionRef?.focus();
                              return;
                            }
                            if (e.key === 'Enter' && currentAnswer()) {
                              e.preventDefault();
                              handleNext();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant={isCustomTextActive() ? 'default' : 'outline'}
                          size={isCustomTextActive() ? 'icon' : 'sm'}
                          class={cn(
                            'h-7 shrink-0',
                            isCustomTextActive() ? 'w-7' : 'px-2.5 text-sm',
                          )}
                          onClick={() =>
                            isCustomTextActive() ? handleNext() : handleSkip()
                          }
                          aria-label={
                            isCustomTextActive() ? t('Send') : t('Skip')
                          }
                        >
                          <Show
                            when={isCustomTextActive()}
                            fallback={t('Skip')}
                          >
                            <ArrowRight class="size-4" />
                          </Show>
                        </Button>
                      </label>
                    </div>
                  </Show>

                  <Show when={question().type === 'text'}>
                    <label
                      for={fieldId}
                      class={cn(
                        'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-text transition-colors hover:bg-muted focus-within:bg-muted',
                        currentAnswer() && 'bg-muted',
                      )}
                    >
                      <span
                        aria-hidden
                        class={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-muted-foreground transition-colors group-focus-within:bg-foreground group-focus-within:text-background',
                          currentAnswer() && 'bg-foreground text-background',
                        )}
                      >
                        <Pencil class="size-3.5" />
                      </span>
                      <Input
                        ref={setTextInputEl}
                        id={fieldId}
                        class="h-auto flex-1 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0 dark:bg-transparent"
                        placeholder={question().placeholder}
                        value={answers()[currentStep()] ?? ''}
                        onChange={(e) => setAnswer(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentAnswer()) {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant={currentAnswer() ? 'default' : 'outline'}
                        size={currentAnswer() ? 'icon' : 'sm'}
                        class={cn(
                          'h-7 shrink-0',
                          currentAnswer() ? 'w-7' : 'px-2.5 text-sm',
                        )}
                        onClick={() =>
                          currentAnswer() ? handleNext() : handleSkip()
                        }
                        aria-label={currentAnswer() ? t('Send') : t('Skip')}
                      >
                        <Show when={currentAnswer()} fallback={t('Skip')}>
                          <ArrowRight class="size-4" />
                        </Show>
                      </Button>
                    </label>
                  </Show>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </Show>
    </Show>
  );
}
