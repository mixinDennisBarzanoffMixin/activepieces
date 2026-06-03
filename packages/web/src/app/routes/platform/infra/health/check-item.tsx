import { t } from 'i18next';
import { CheckCircle, ExternalLink, XCircle } from 'lucide-solid';
import { Show, type JSXElement } from 'solid-js';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { LoadingSpinner } from '@/components/custom/spinner';

type CheckItemProps = {
  id: string;
  title: string;
  icon: JSXElement;
  isChecked: boolean;
  message: string | JSXElement;
  loading: boolean;
  link?: string;
};

const CheckItem = (props: CheckItemProps) => {
  return (
    <Item variant="outline" key={props.id}>
      <ItemMedia variant="icon">
        <Show when={props.loading} fallback={props.icon}>
          <LoadingSpinner />
        </Show>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {props.title}
          <Show when={props.link}>
            <a href={props.link} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
            </a>
          </Show>
        </ItemTitle>
        <ItemDescription class="text-xs text-muted-foreground">
          <Show when={props.loading} fallback={props.message}>
            '...'
          </Show>
        </ItemDescription>
      </ItemContent>
      <Show when={!props.loading}>
        <ItemActions>
          <Show
            when={props.isChecked}
            fallback={
              <div class="text-destructive-700 flex items-center gap-2">
                <XCircle size={18} />
                {t('Needs Attention')}
              </div>
            }
          >
            <div class="text-success-700 flex items-center gap-2">
              <CheckCircle size={18} />
              {t('Passed')}
            </div>
          </Show>
        </ItemActions>
      </Show>
    </Item>
  );
};

export { CheckItem };
