import {
  ColorName,
  PROJECT_COLOR_PALETTE,
  ProjectType,
} from '@activepieces/shared';
import { Show } from 'solid-js';

import { Avatar } from '@/components/ui/avatar';

interface ProjectAvatarProps {
  displayName: string;
  projectType: ProjectType;
  iconColor: ColorName;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  showDetails?: boolean;
  createdDate?: Date;
}

export const ProjectAvatar = (_props: ProjectAvatarProps) => {
  const props = _props;
  const showDetails = () => props.showDetails ?? false;
  const showBackground = () => props.showBackground ?? true;
  const currentSize = () => {
    if (props.size === 'sm') {
      return {
        container: showDetails() ? 'min-h-[140px]' : 'h-[60px]',
        avatar: 'h-[30px] w-[30px]',
        text: 'text-sm',
      };
    }
    if (props.size === 'lg') {
      return {
        container: showDetails() ? 'min-h-[200px]' : 'h-[150px]',
        avatar: 'h-[70px] w-[70px]',
        text: 'text-3xl',
      };
    }
    return {
      container: showDetails() ? 'min-h-[160px]' : 'h-[114px]',
      avatar: 'h-[50px] w-[50px]',
      text: 'text-xl',
    };
  };

  if (props.projectType === ProjectType.PERSONAL) {
    return (
      <div
        class={`flex ${
          showDetails() ? 'flex-col items-center' : 'items-center'
        } justify-center w-full ${currentSize().container} ${
          showBackground() ? 'rounded-tr-md' : ''
        } ${showDetails() ? 'py-6' : ''}`}
        style={{
          'background-color': showBackground() ? '#f3f4f6' : 'transparent',
        }}
      >
        <Avatar
          class={`${
            currentSize().avatar
          } flex items-center justify-center rounded-full ${
            showDetails() ? 'mb-3' : ''
          }`}
          style={{
            'background-color': '#9ca3af',
            color: '#ffffff',
          }}
        >
          <span class={currentSize().text}>
            {props.displayName.charAt(0).toUpperCase()}
          </span>
        </Avatar>
        <Show when={showDetails()}>
          <div class="px-4 text-center">
            <div class="font-semibold text-sm text-black">
              {props.displayName}
            </div>
            <Show when={props.createdDate} keyed>
              {(date) => (
                <div class="text-xs text-muted-foreground mt-1">
                  Created on{' '}
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(date)}
                </div>
              )}
            </Show>
          </div>
        </Show>
      </div>
    );
  }

  return (
    <div
      class={`flex ${
        showDetails() ? 'flex-col items-center' : 'items-center'
      } justify-center w-full ${currentSize().container} ${
        showBackground() ? 'rounded-tr-md' : ''
      } ${showDetails() ? 'py-6' : ''}`}
      style={{
        'background-color': showBackground()
          ? PROJECT_COLOR_PALETTE[props.iconColor].color + '26'
          : 'transparent',
      }}
    >
      <Avatar
        class={`${
          currentSize().avatar
        } flex items-center justify-center rounded-sm ${
          showDetails() ? 'mb-3' : ''
        }`}
        style={{
          'background-color': PROJECT_COLOR_PALETTE[props.iconColor].color,
          color: PROJECT_COLOR_PALETTE[props.iconColor].textColor,
        }}
      >
        <span class={currentSize().text}>
          {props.displayName.charAt(0).toUpperCase()}
        </span>
      </Avatar>
      <Show when={showDetails()}>
        <div class="px-4 text-center">
          <div class="font-semibold text-sm text-black">
            {props.displayName}
          </div>
          <Show when={props.createdDate} keyed>
            {(date) => (
              <div class="text-xs text-muted-foreground mt-1">
                Created on{' '}
                {new Intl.DateTimeFormat('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                }).format(date)}
              </div>
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
};
