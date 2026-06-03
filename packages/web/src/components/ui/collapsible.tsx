import * as CollapsiblePrimitive from '@kobalte/core/collapsible';
import { type ComponentProps } from 'solid-js';

function Collapsible(_props: ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {..._props} />;
}

function CollapsibleTrigger(
  _props: ComponentProps<typeof CollapsiblePrimitive.Trigger>,
) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {..._props} />
  );
}

function CollapsibleContent(
  _props: ComponentProps<typeof CollapsiblePrimitive.Content>,
) {
  return (
    <CollapsiblePrimitive.Content data-slot="collapsible-content" {..._props} />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
