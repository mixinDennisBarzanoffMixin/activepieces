import { isNil } from '@activepieces/shared';
import { t } from 'i18next';

import { projectCollectionUtils } from '@/features/projects/stores/project-collection';

import { MultiSelectPieceProperty } from '../../../components/custom/multi-select-piece-property';
import { FormItem, FormMessage } from '../../../components/ui/form';
import { Label } from '../../../components/ui/label';

export const ProjectSelector = ({
  value,
  onChange,
}: ProjectSelectorProps) => {
  const { data: projects } = projectCollectionUtils.useAll();
  return (
    <FormItem className="flex flex-col gap-2">
      <Label>{t('Available for Projects')}</Label>
      <MultiSelectPieceProperty
        placeholder={t('Select projects')}
        options={
          projects?.map((project) => ({
            value: project.id,
            label: project.displayName,
          })) ?? []
        }
        loading={!projects}
        onChange={(value) => {
          onChange(isNil(value) ? [] : value.filter(isString));
        }}
        initialValues={value}
        showDeselect={value.length > 0}
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
  onChange: (value: string[]) => void;
};
