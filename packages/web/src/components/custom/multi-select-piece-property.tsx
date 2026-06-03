import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { createMemo, createSignal, Show, For, mergeProps } from 'solid-js';

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

const MultiSelectPieceProperty = (_props: MultiSelectPiecePropertyProps) => {
  const props = mergeProps({ cachedOptions: [] }, _props);
  const [searchTerm, setSearchTerm] = createSignal('');
  const filtered = createMemo(() =>
    props.options
      .map((option, index) => ({
        ...option,
        originalIndex: index,
      }))
      .filter((option) => {
        if (props.refreshOnSearch) {
          return true;
        }
        return option.label.toLowerCase().includes(searchTerm().toLowerCase());
      }),
  );

  const selected = createMemo(() =>
    props.initialValues && Array.isArray(props.initialValues)
      ? props.initialValues
          .map((value) =>
            [...props.cachedOptions, ...props.options].findIndex((option) =>
              deepEqual(option.value, value),
            ),
          )
          .filter((index) => index > -1)
          .map((index) => String(index))
      : [],
  );
  const items = createMemo(() =>
    props.options.map((opt, index) => ({
      value: String(index),
      label: opt.label,
    })),
  );
  const sendChanges = (indices: string[]) => {
    if (indices.length === 0) {
      props.onChange([]);
      return;
    }

    props.onChange(indices.map((index) => props.options[Number(index)].value));
  };

  return (
    <MultiSelect
      modal={true}
      value={selected()}
      onValueChange={sendChanges}
      disabled={props.disabled}
      items={items()}
      onSearch={(searchTerm: string | undefined) => {
        const term = searchTerm ? searchTerm : '';
        setSearchTerm(term);
        if (props.refreshOnSearch) {
          props.refreshOnSearch(term);
        }
      }}
      onOpenChange={(open) => {
        if (!open) {
          setSearchTerm('');
          if (props.refreshOnSearch && searchTerm().length > 0) {
            props.refreshOnSearch('');
          }
        }
      }}
    >
      <MultiSelectTrigger
        showDeselect={props.showDeselect && !props.disabled}
        onDeselect={() => props.onChange([])}
        showRefresh={props.showRefresh && !props.disabled}
        onRefresh={props.onRefresh}
        loading={props.loading}
      >
        <Show
          when={selected().length < 10}
          fallback={t('{number} items selected', {
            number: selected().length,
          })}
        >
          <MultiSelectValue placeholder={props.placeholder} />
        </Show>
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectSearch placeholder={props.placeholder} />
        <MultiSelectList>
          <Show
            when={!props.loading}
            fallback={
              <MultiSelectItem disabled>{t('Loading...')}</MultiSelectItem>
            }
          >
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  props.onChange(filtered().map((opt) => opt.value));
                }}
              >
                <Show when={filtered().length > 1}>
                  <MultiSelectItem>{t('Select All')}</MultiSelectItem>
                </Show>
              </div>

              <For each={filtered()}>
                {(opt) => (
                  <MultiSelectItem
                    key={opt.originalIndex}
                    value={String(opt.originalIndex)}
                  >
                    <div class="flex items-center justify-between  w-full min-w-0">
                      <span class="truncate min-w-0">{opt.label}</span>
                      <div class="mr-2">
                        {props.itemExtraContent?.(opt.originalIndex)}
                      </div>
                    </div>
                  </MultiSelectItem>
                )}
              </For>
              <Show when={filtered().length === 0}>
                <CommandEmpty>{t('No results found.')}</CommandEmpty>
              </Show>
            </>
          </Show>
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};

export { MultiSelectPieceProperty };
