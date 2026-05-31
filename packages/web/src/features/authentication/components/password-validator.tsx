import { createEffect, createSignal } from 'solid-js';
import { t } from 'i18next';

import { ZapIcon, ZapIconHandle } from '@/components/icons/zap';
import { cn } from '@/lib/utils';

import { passwordRules } from '../utils/password-validation-utils';

// Color per step: 1/5 = red, 2/5 = orange, 3/5 = yellow, 4/5 = violet, 5/5 = purple
const STEP_COLORS = ['#ef4444', '#f97316', '#eab308', '#c084fc', '#a855f7'];

function getBoltColor(passedCount: number) {
  if (passedCount === 0) return undefined;
  return STEP_COLORS[passedCount - 1];
}

const PasswordStrengthBolt = ({ password }: { password: string }) => {
  const results = passwordRules.map((rule) => ({
    label: rule.label,
    passed: rule.condition(password),
  }));
  const passedCount = results.filter((r) => r.passed).length;
  const total = results.length;
  const fillPercent = total === 0 ? 0 : (passedCount / total) * 100;
  const isComplete = passedCount === total && total > 0;
  const boltColor = getBoltColor(passedCount);

  let glowRef: HTMLDivElement | undefined;
  let iconRef: ZapIconHandle | undefined;

  createEffect(() => {
    if (!glowRef) return;
    if (isComplete) {
      glowRef.style.animation = 'none';
      void glowRef.offsetWidth;
      glowRef.style.animation = 'boltGlow 0.6s ease-in forwards';
      iconRef?.startAnimation();
    } else {
      glowRef.style.animation = '';
    }
  });

  return (
    <div className="flex items-center justify-center">
      <div ref={(el) => (glowRef = el)}>
        <ZapIcon
          ref={(el) => (iconRef = el)}
          size={20}
          fillColor={boltColor}
          fillPercent={fillPercent}
        />
      </div>
    </div>
  );
};

const PasswordRequirementsList = ({
  password,
  isSubmitted,
}: {
  password: string;
  isSubmitted: boolean;
}) => {
  const [hasReachedMin, setHasReachedMin] = createSignal(false);

  createEffect(() => {
    if (password.length >= 8) {
      setHasReachedMin(true);
    }
  }, [password]);

  const isOverMaxLength = password.length > 64;
  const isUnderAfterReaching = hasReachedMin && password.length < 8;
  const results = passwordRules.map((rule, index) => ({
    label: rule.label,
    passed: rule.condition(password),
    immediateError: index === 0 && (isOverMaxLength || isUnderAfterReaching),
  }));

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      {results.map((rule) => {
        const isError = rule.immediateError || (isSubmitted && !rule.passed);
        return (
          <div key={rule.label} className="flex items-center gap-1.5 text-xs">
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                rule.passed
                  ? 'bg-green-500'
                  : isError
                  ? 'bg-red-500'
                  : 'bg-muted-foreground/40',
              )}
            />
            <span className="text-foreground">{t(rule.label)}</span>
          </div>
        );
      })}
    </div>
  );
};

export { PasswordStrengthBolt, PasswordRequirementsList };
