import { LucideIcon } from 'lucide-solid';
import { For, Show, type JSX } from 'solid-js';

import { cn } from '@/lib/utils';

export const StepShell = (props: {
  title: string;
  description: string;
  actions?: JSX.Element;
  children: JSX.Element;
}) => {
  return (
    <div class="flex flex-col gap-8">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="text-base font-medium">{props.title}</h2>
          <p class="text-sm text-muted-foreground">{props.description}</p>
        </div>
        <Show when={props.actions}>
          {(actions) => <div class="shrink-0">{actions()}</div>}
        </Show>
      </div>
      {props.children}
    </div>
  );
};

export const Stepper = (props: {
  steps: StepDef[];
  completion: boolean[];
  activeStepIndex: number;
  displayedIndex: number;
  onStepClick: (index: number) => void;
}) => {
  return (
    <ol class="flex flex-col">
      <For each={props.steps}>
        {(step, index) => {
          const isComplete = () => props.completion[index()] ?? false;
          const isActive = () => index() === props.displayedIndex;
          const isLocked = () => index() > props.activeStepIndex;
          const isLast = () => index() === props.steps.length - 1;
          const Icon = step.icon;
          return (
            <li class="flex gap-3">
              <div class="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => props.onStepClick(index())}
                  disabled={isLocked()}
                  aria-current={isActive() ? 'step' : undefined}
                  class={cn(
                    'flex size-8 items-center justify-center transition-colors',
                    isComplete() && 'text-success-600',
                    !isComplete() && isActive() && 'text-primary',
                    !isComplete() &&
                      !isActive() &&
                      !isLocked() &&
                      'text-muted-foreground hover:text-primary',
                    isLocked() &&
                      'text-muted-foreground cursor-not-allowed opacity-60',
                  )}
                >
                  <Icon class="size-5" />
                </button>
                <Show when={!isLast()}>
                  <div
                    class={cn(
                      'w-px flex-1 my-2',
                      isComplete() ? 'bg-success-600' : 'bg-border',
                    )}
                  />
                </Show>
              </div>
              <button
                type="button"
                onClick={() => props.onStepClick(index())}
                disabled={isLocked()}
                class={cn(
                  'flex-1 text-left pt-1.5 pb-12 text-sm transition-colors',
                  isActive() && 'font-medium text-foreground',
                  !isActive() &&
                    !isLocked() &&
                    'text-muted-foreground hover:text-foreground',
                  isLocked() &&
                    'text-muted-foreground cursor-not-allowed opacity-60',
                )}
              >
                <span class="mr-1">{index() + 1}.</span>
                {step.title}
              </button>
            </li>
          );
        }}
      </For>
    </ol>
  );
};

export type StepKind = 'hostname' | 'dns' | 'allowed-domains' | 'signing-keys';

export type StepDef = {
  kind: StepKind;
  title: string;
  icon: LucideIcon;
};
