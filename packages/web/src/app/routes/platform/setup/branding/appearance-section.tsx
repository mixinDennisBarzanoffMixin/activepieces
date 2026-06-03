import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { ColorPicker } from '@/components/custom/color-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { platformHooks } from '@/hooks/platform-hooks';

const FromSchema = z.object({
  name: z.string(),
  logoUrl: z.string(),
  iconUrl: z.string(),
  faviconUrl: z.string(),
  color: z.string(),
});

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [values, setValues] = createSignal<FromSchema>({
    name: platform.name,
    logoUrl: platform.fullLogoUrl,
    iconUrl: platform.logoIconUrl,
    faviconUrl: platform.favIconUrl,
    color: platform.primaryColor,
  });
  const valid = createMemo(() => FromSchema.safeParse(values()).success);
  let logoRef: HTMLInputElement | undefined;
  let iconRef: HTMLInputElement | undefined;
  let faviconRef: HTMLInputElement | undefined;

  const { mutate: updatePlatform, isPending } = createMutation(() => ({
    mutationFn: async () => {
      const logo = logoRef?.files?.[0];
      const icon = iconRef?.files?.[0];
      const favicon = faviconRef?.files?.[0];
      const data = FromSchema.parse(values());

      const formdata = new FormData();
      formdata.append('name', data.name);
      formdata.append('primaryColor', data.color);
      if (logo) formdata.append('fullLogo', logo);
      if (icon) formdata.append('logoIcon', icon);
      if (favicon) formdata.append('favIcon', favicon);

      await platformApi.updateWithFormData(formdata, platform.id);
      window.location.reload();
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), {
        duration: 3000,
      });
    },
  }));

  return (
    <div class="grid gap-4">
      <form
        class="grid space-y-4 mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          updatePlatform();
        }}
      >
        <div class="max-w-[600px] grid space-y-4">
          <div class="grid space-y-2">
            <Label for="name">{t('Platform Name')}</Label>
            <Input
              required
              id="name"
              value={values().name}
              onInput={(e) =>
                setValues((values) => ({
                  ...values,
                  name: e.currentTarget.value,
                }))
              }
              placeholder={t('Platform Name')}
              class="rounded-sm"
            />
          </div>

          <div class="grid space-y-2">
            <Label for="logoFile">{t('Logo')}</Label>
            <div class="flex flex-row gap-2 items-center">
              <Input
                type="file"
                ref={(el) => (logoRef = el)}
                defaultFileName={platform.fullLogoUrl}
                accept="image/*"
                id="logoFile"
                class="rounded-sm"
              />
            </div>
          </div>
          <div class="grid space-y-2">
            <Label for="iconFile">{t('Icon')}</Label>
            <div class="flex flex-row gap-2 items-center">
              <Input
                type="file"
                ref={(el) => (iconRef = el)}
                defaultFileName={platform.logoIconUrl}
                accept="image/*"
                id="iconFile"
                class="rounded-sm"
              />
            </div>
          </div>
          <div class="grid space-y-2">
            <Label for="faviconFile">{t('Favicon URL')}</Label>
            <div class="flex flex-row gap-2 items-center">
              <Input
                type="file"
                ref={(el) => (faviconRef = el)}
                defaultFileName={platform.favIconUrl}
                accept="image/*"
                id="faviconFile"
                class="rounded-sm"
              />
            </div>
          </div>

          <div class="grid space-y-2">
            <Label for="color">{t('Primary Color')}</Label>
            <div class="flex flex-row gap-2 items-center">
              <ColorPicker
                value={values().color}
                onChange={(color: string) =>
                  setValues((values) => ({ ...values, color }))
                }
                class="flex flex-row gap-2 items-center"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2 justify-end mt-4">
          <Button type="submit" loading={isPending} disabled={!valid()}>
            {t('Save')}
          </Button>
        </div>
      </form>
    </div>
  );
};

type FromSchema = z.infer<typeof FromSchema>;
