import { createSignal } from 'solid-js';

import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { HexColorPicker } from 'solid-colorful';
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
  const { disabled, value, onChange, onBlur, name, className, ...rest } = props;
  let ref: HTMLInputElement | undefined;
  const [open, setOpen] = createSignal(false);

  const parsedValue = createMemo(() => {
    return value || '#FFFFFF';
  });

  return (
    <Popover onOpenChange={setOpen} open={open()}>
      <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
        <Button
          {...rest}
          class={cn('block rounded-full', className)}
          name={name}
          onClick={() => {
            setOpen(true);
          }}
          size="icon"
          style={{
            backgroundColor: parsedValue(),
          }}
          variant="outline"
        >
          <div />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-full">
        <HexColorPicker color={parsedValue()} onChange={onChange} />
        <Input
          maxLength={7}
          onChange={(e) => {
            onChange(e?.currentTarget?.value);
          }}
          ref={(el) => (ref = el)}
          value={parsedValue()}
        />
      </PopoverContent>
    </Popover>
  );
};
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
