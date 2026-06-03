import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { createMemo } from 'solid-js';

import { projectCollectionUtils } from '@/features/projects/stores/project-collection';

import { MultiSelectPieceProperty } from '../../../components/custom/multi-select-piece-property';
import { FormItem, FormMessage } from '../../../components/ui/form';
import { Label } from '../../../components/ui/label';

export const ProjectSelector = (props: ProjectSelectorProps) => {
  const { data: projects } = projectCollectionUtils.useAll();
  const options = createMemo(() =>
    projects.map((project) => ({
      value: project.id,
      label: project.displayName,
    })),
  );
  return (
    <FormItem class="flex flex-col gap-2">
      <Label>{t('Available for Projects')}</Label>
      <MultiSelectPieceProperty
        placeholder={t('Select projects')}
        options={options()}
        loading={!projects}
        onChange={(value) => {
          props.onInput(isNil(value) ? [] : value.filter(isString));
        }}
        initialValues={props.value}
        showDeselect={props.value.length > 0}
      />

      <FormMessage />
    </FormItem>
  );
};

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

type ProjectSelectorProps = {
  value: string[];
  onInput: (value: string[]) => void;
};
