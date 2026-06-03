import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type DataTableCheckboxProps = {
  label: string;
  checked: boolean;
  handleCheckedChange: (checked: boolean) => void;
};

export function DataTableInputCheckbox(props: DataTableCheckboxProps) {
  return (
    <Button
      type="button"
      variant="outline"
      class={cn(
        'flex items-center space-x-2 border-dashed rounded-md px-3 py-2 h-9',
        'hover:bg-accent/5',
        props.checked && 'bg-accent/10 border-accent text-accent-foreground',
      )}
      onClick={() => props.handleCheckedChange(!props.checked)}
    >
      <Checkbox checked={props.checked} class="pointer-events-none" />
      <Label class="text-sm font-normal leading-none select-none cursor-pointer">
        {props.label}
      </Label>
    </Button>
  );
}
