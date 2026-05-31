import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { createSignal } from 'solid-js';

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/custom/multi-select';
import { CommandEmpty } from '@/components/ui/command';

type MultiSelectPiecePropertyProps = {
  placeholder: string;
  options: {
    value: unknown;
    label: string;
  }[];
  onChange: (value: unknown[] | null) => void;
  initialValues?: unknown;
  disabled?: boolean;
  showDeselect?: boolean;
  showRefresh?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
  refreshOnSearch?: (term: string) => void;
  /**Use to show the selected option when search doesn't return the selected option */
  cachedOptions?: {
    value: unknown;
    label: string;
  }[];
  itemExtraContent?: (index: number) => any;
};

const MultiSelectPieceProperty = ({
  placeholder,
  options,
  onChange,
  disabled,
  initialValues,
  showDeselect,
  showRefresh,
  onRefresh,
  loading,
  refreshOnSearch,
  cachedOptions = [],
  itemExtraContent,
}: MultiSelectPiecePropertyProps) => {
  const [searchTerm, setSearchTerm] = createSignal('');
  const filteredOptions = options
    .map((option, index) => ({
      ...option,
      originalIndex: index,
    }))
    .filter((option) => {
      if (refreshOnSearch) {
        return true;
      }
      return option.label?.toLowerCase()?.includes(searchTerm()?.toLowerCase());
    });

  const selectedIndicies =
    initialValues && Array.isArray(initialValues)
      ? initialValues
          .map((value) =>
            [...cachedOptions, ...options].findIndex((option) =>
              deepEqual(option.value, value),
            ),
          )
          .filter((index) => index > -1)
          .map((index) => String(index))
      : [];
  const sendChanges = (indicides: string[]) => {
    const newSelectedIndicies = indicides.filter(
      (index) => index !== undefined,
    );
    if (newSelectedIndicies.length === 0) {
      onChange([]);
    } else {
      onChange(
        newSelectedIndicies.map((index) => options[Number(index)].value),
      );
    }
  };

  return (
    <MultiSelect
      modal={true}
      value={selectedIndicies}
      onValueChange={sendChanges}
      disabled={disabled}
      items={options.map((opt, index) => ({
        value: String(index),
        label: opt.label,
      }))}
      onSearch={(searchTerm) => {
        setSearchTerm(searchTerm ?? '');
        if (refreshOnSearch) {
          refreshOnSearch(searchTerm ?? '');
        }
      }}
      onOpenChange={(open) => {
        if (!open) {
          setSearchTerm('');
          if (refreshOnSearch && searchTerm().length > 0) {
            refreshOnSearch('');
          }
        }
      }}
    >
      <MultiSelectTrigger
        showDeselect={showDeselect && !disabled}
        onDeselect={() => onChange([])}
        showRefresh={showRefresh && !disabled}
        onRefresh={onRefresh}
        loading={loading}
      >
        <Show
          when={selectedIndicies.length < 10}
          fallback={t('{number} items selected', {
            number: selectedIndicies.length,
          })}
        >
          <MultiSelectValue placeholder={placeholder} />
        </Show>
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch placeholder={placeholder} />
        <MultiSelectList>
          <Show
            when={!loading}
            fallback={
              <MultiSelectItem disabled>{t('Loading...')}</MultiSelectItem>
            }
          >
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(filteredOptions.map((opt) => opt.value));
                }}
              >
                <Show when={filteredOptions.length > 1}>
                  <MultiSelectItem>{t('Select All')}</MultiSelectItem>
                </Show>
              </div>

              <For each={filteredOptions}>
                {(opt) => (
                  <MultiSelectItem
                    key={opt.originalIndex}
                    value={String(opt.originalIndex)}
                  >
                    <div className="flex items-center justify-between  w-full min-w-0">
                      <span className="truncate min-w-0">{opt.label}</span>
                      <div className="mr-2">
                        {itemExtraContent?.(opt.originalIndex)}
                      </div>
                    </div>
                  </MultiSelectItem>
                )}
              </For>
              <Show when={filteredOptions.length === 0}>
                <CommandEmpty>{t('No results found.')}</CommandEmpty>
              </Show>
            </>
          </Show>
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};

MultiSelectPieceProperty.displayName = 'MultiSelectPieceProperty';
export { MultiSelectPieceProperty };
