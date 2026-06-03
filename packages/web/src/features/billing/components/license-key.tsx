import { isNil, PlatformWithoutSensitiveData } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Shield, AlertTriangle, Check, ExternalLink } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemFooter,
} from '@/components/custom/item';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { ArrowUpIcon } from '@/components/icons/arrow-up';
import { buttonVariants } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { ActivateLicenseDialog } from './activate-license-dialog';
import { FeatureStatus } from './features-status';

export const LicenseKey = (props: {
  platform: PlatformWithoutSensitiveData;
}) => {
  const [isActivateLicenseKeyDialogOpen, setIsActivateLicenseKeyDialogOpen] =
    createSignal(false);

  const expired =
    !isNil(props.platform.plan.licenseExpiresAt) &&
    dayjs(props.platform.plan.licenseExpiresAt).isBefore(dayjs());
  const expiresSoon =
    !expired &&
    !isNil(props.platform.plan.licenseExpiresAt) &&
    dayjs(props.platform.plan.licenseExpiresAt).isBefore(dayjs().add(7, 'day'));

  const description = props.platform.plan.licenseKey
    ? buildLicenseDescription(props.platform, expired)
    : t('Activate your license to unlock enterprise features');

  return (
    <>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Shield />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {t('License Key')}
            {props.platform.plan.licenseKey &&
              getStatusBadge(expired, expiresSoon)}
          </ItemTitle>
          <Show when={description}>
            <ItemDescription>{description}</ItemDescription>
          </Show>
        </ItemContent>
        <ItemActions class="gap-4">
          <a
            href="https://www.activepieces.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            {t('View Plans')}
            <ExternalLink class="size-3" />
          </a>
          <AnimatedIconButton
            icon={ArrowUpIcon}
            iconSize={16}
            variant="default"
            size="sm"
            onClick={() => setIsActivateLicenseKeyDialogOpen(true)}
          >
            {props.platform.plan.licenseKey
              ? t('Update License')
              : t('Activate License')}
          </AnimatedIconButton>
        </ItemActions>
        <ItemFooter>
          <div class="flex flex-col gap-2 w-full pt-2">
            <h4 class="text-sm font-medium text-muted-foreground">
              {t('Enabled Features')}
            </h4>
            <FeatureStatus platform={props.platform} />
          </div>
        </ItemFooter>
      </Item>

      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
      />
    </>
  );
};

function buildLicenseDescription(
  platform: PlatformWithoutSensitiveData,
  expired: boolean,
) {
  if (expired) {
    return t('License expired');
  }
  if (!isNil(platform.plan.licenseExpiresAt)) {
    return t('Valid until {date}', {
      date: formatUtils.formatDateOnly(
        dayjs(platform.plan.licenseExpiresAt).toDate(),
      ),
    });
  }
  return null;
}

function getStatusBadge(expired: boolean, expiresSoon: boolean) {
  if (expired) {
    return (
      <StatusIconWithText
        text={t('Expired')}
        icon={AlertTriangle}
        variant="error"
      />
    );
  }
  if (expiresSoon) {
    return (
      <StatusIconWithText
        text={t('Expires soon')}
        icon={AlertTriangle}
        variant="default"
      />
    );
  }
  return (
    <StatusIconWithText text={t('Active')} icon={Check} variant="success" />
  );
}
