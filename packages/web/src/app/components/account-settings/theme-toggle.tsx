import { t } from 'i18next';
import { Monitor, Moon, Palette, Sun } from 'lucide-solid';

import { useTheme } from '@/components/providers/theme-provider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <Label class="text-sm font-medium flex items-center gap-2">
        <Palette class="w-4 h-4" />
        {t('Theme')}
      </Label>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light" class="text-sm py-2">
            <div className="flex items-center gap-2">
              <Sun class="w-4 h-4" />
              Light
            </div>
          </SelectItem>
          <SelectItem value="dark" class="text-sm py-2">
            <div className="flex items-center gap-2">
              <Moon class="w-4 h-4" />
              Dark
            </div>
          </SelectItem>
          <SelectItem value="system" class="text-sm py-2">
            <div className="flex items-center gap-2">
              <Monitor class="w-4 h-4" />
              System
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeToggle;
