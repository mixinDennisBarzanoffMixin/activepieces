import { t } from 'i18next';
import { createEffect, createSignal, For } from 'solid-js';

import { ZapIcon, ZapIconHandle } from '@/components/icons/zap';
import { cn } from '@/lib/utils';

import { passwordRules } from '../utils/password-validation-utils';

// Color per step: 1/5 = red, 2/5 = orange, 3/5 = yellow, 4/5 = violet, 5/5 = purple
const STEP_COLORS = ['#ef4444', '#f97316', '#eab308', '#c084fc', '#a855f7'];

function getBoltColor(passedCount: number) {
  if (passedCount === 0) return undefined;
  return STEP_COLORS[passedCount - 1];
}

const PasswordStrengthBolt = (props: { password: string }) => {
  const results = () =>
    passwordRules.map((rule) => ({
      label: rule.label,
      passed: rule.condition(props.password),
    }));
  const passed = () => results().filter((rule) => rule.passed).length;
  const total = () => results().length;
  const percent = () => (total() === 0 ? 0 : (passed() / total()) * 100);
  const complete = () => passed() === total() && total() > 0;
  const color = () => getBoltColor(passed());

  let glowRef: HTMLDivElement | undefined;
  const iconRef: ZapIconHandle = {
    startAnimation: () => undefined,
    stopAnimation: () => undefined,
  };

  createEffect(() => {
    if (!glowRef) return;
    if (complete()) {
      glowRef.style.animation = 'none';
      void glowRef.offsetWidth;
      glowRef.style.animation = 'boltGlow 0.6s ease-in forwards';
      iconRef.startAnimation();
    } else {
      glowRef.style.animation = '';
    }
  });

  return (
    <div class="flex items-center justify-center">
      <div ref={(el) => (glowRef = el)}>
        <ZapIcon
          ref={iconRef}
          size={20}
          fillColor={color()}
          fillPercent={percent()}
        />
      </div>
    </div>
  );
};

const PasswordRequirementsList = (props: {
  password: string;
  isSubmitted: boolean;
}) => {
  const [hasReachedMin, setHasReachedMin] = createSignal(false);

  createEffect(() => {
    if (props.password.length >= 8) {
      setHasReachedMin(true);
    }
  });

  const results = () => {
    const over = props.password.length > 64;
    const under = hasReachedMin() && props.password.length < 8;
    return passwordRules.map((rule, index) => ({
      label: rule.label,
      passed: rule.condition(props.password),
      immediateError: index === 0 && (over || under),
    }));
  };

  return (
    <div class="flex flex-col gap-1.5 mt-1">
      <For each={results()}>
        {(rule) => {
          const isError =
            rule.immediateError || (props.isSubmitted && !rule.passed);
          return (
            <div class="flex items-center gap-1.5 text-xs">
              <div
                class={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  rule.passed
                    ? 'bg-green-500'
                    : isError
                    ? 'bg-red-500'
                    : 'bg-muted-foreground/40',
                )}
              />
              <span class="text-foreground">{t(rule.label)}</span>
            </div>
          );
        }}
      </For>
    </div>
  );
};

export { PasswordStrengthBolt, PasswordRequirementsList };
