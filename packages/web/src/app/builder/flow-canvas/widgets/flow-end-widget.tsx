import { t } from 'i18next';

const FlowEndWidget = () => {
  return (
    <div
      class=" text-center w-[41px] bg-builder-background text-foreground/70 rounded-md animate-fade -ml-[20px]"
      id="flow-end-button"
    >
      <div class="w-full text-center text-sm h-full bg-border/80 p-1 rounded-md">
        {t('End')}
      </div>
    </div>
  );
};

export default FlowEndWidget;
