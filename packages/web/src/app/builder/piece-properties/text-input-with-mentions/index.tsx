import { flowStructureUtil, isNil } from '@activepieces/shared';
import { createMemo } from 'solid-js';

import { inputClass } from '@/components/ui/input';
import { stepsHooks } from '@/features/pieces';
import { variablesQueries } from '@/features/variables/hooks/variables-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';

import { textMentionUtils } from './text-input-utils';

type TextInputWithMentionsProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableMarkdown?: boolean;
};

function convertToText(value: unknown): string {
  if (isNil(value)) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return JSON.stringify(value);
}

export const TextInputWithMentions = ({
  className,
  initialValue,
  onChange,
  disabled,
  placeholder,
}: TextInputWithMentionsProps) => {
  const steps = useBuilderStateContext((state) =>
    flowStructureUtil.getAllSteps(state.flowVersion.trigger)
  );
  const stepsMetadata = stepsHooks
    .useStepsMetadata(steps)
    .map(({ data: metadata }, index) => {
      if (metadata) {
        return {
          ...metadata,
          stepDisplayName: steps[index].displayName,
        };
      }
      return undefined;
    });

  const projectId = authenticationSession.getProjectId();
  const { data: variablesPage } = variablesQueries.useVariables({
    request: {
      projectId: projectId ?? '',
      limit: 100,
    },
    extraKeys: ['mention-resolver-variables', projectId ?? ''],
    enabled: !!projectId,
  });
  const variableByName = createMemo(
    () => new Map((variablesPage?.data ?? []).map((v) => [v.name, v.name]))
  );

  const setInsertMentionHandler = useBuilderStateContext(
    (state) => state.setInsertMentionHandler
  );

  const insertMention = (propertyPath: string) => {
    onChange(`${convertToText(initialValue)}{{${propertyPath}}}`);
  }

  return (
    <div className="w-full">
      <textarea
        class={cn(
          className ?? cn(inputClass, 'py-2 h-[unset] block min-h-9'),
          textMentionUtils.inputWithMentionsCssClass,
          {
            'cursor-not-allowed opacity-50': disabled,
          }
        )}
        disabled={disabled}
        placeholder={placeholder}
        value={convertToText(initialValue)}
        onFocus={() => setInsertMentionHandler(insertMention)}
        onInput={(e) => onChange(e.currentTarget.value)}
      />
    </div>
  );
};
