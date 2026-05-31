import { t } from 'i18next';
import { CheckCircle, ExternalLink, XCircle } from 'lucide-solid';
import { Show } from 'solid-js';

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
  icon: JSX.Element;
  isChecked: boolean;
  message: string | JSX.Element;
  loading: boolean;
  link?: string;
};

const CheckItem = ({
  id,
  title,
  icon,
  isChecked,
  message,
  loading,
  link,
}: CheckItemProps) => {
  return (
    <Item variant="outline" key={id}>
      <ItemMedia variant="icon">
        <Show when={loading} fallback={icon}>
          <LoadingSpinner />
        </Show>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {title}
          <Show when={link}>
            <a href={link} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
            </a>
          </Show>
        </ItemTitle>
        <ItemDescription class="text-xs text-muted-foreground">
          <Show when={loading} fallback={message}>
            '...'
          </Show>
        </ItemDescription>
      </ItemContent>
      <Show when={!loading}>
        <ItemActions>
          <Show
            when={isChecked}
            fallback={
              <div className="text-destructive-700 flex items-center gap-2">
                <XCircle size={18} />
                {t('Needs Attention')}
              </div>
            }
          >
            <div className="text-success-700 flex items-center gap-2">
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
