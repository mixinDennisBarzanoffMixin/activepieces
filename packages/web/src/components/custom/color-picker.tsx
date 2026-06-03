import { HexColorPicker } from 'solid-colorful';
import { createMemo, createSignal, splitProps } from 'solid-js';

import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const ColorPicker = (
  props: Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> &
    ColorPickerProps & { ref?: HTMLInputElement },
) => {
  const [local, rest] = splitProps(props, [
    'disabled',
    'value',
    'onChange',
    'onBlur',
    'name',
    'className',
  ]);
  const [open, setOpen] = createSignal(false);

  const parsedValue = createMemo(() => {
    return local.value || '#FFFFFF';
  });

  return (
    <Popover onOpenChange={setOpen} open={open()}>
      <PopoverTrigger asChild disabled={local.disabled} onBlur={local.onBlur}>
        <Button
          {...rest}
          class={cn('block rounded-full', local.className)}
          name={local.name}
          onClick={() => {
            setOpen(true);
          }}
          size="icon"
          style={{
            'background-color': parsedValue(),
          }}
          variant="outline"
        >
          <div />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-full">
        <HexColorPicker color={parsedValue()} onChange={local.onChange} />
        <Input
          maxLength={7}
          onChange={(e) => {
            local.onChange(e.currentTarget.value);
          }}
          value={parsedValue()}
        />
      </PopoverContent>
    </Popover>
  );
};

export { ColorPicker };
