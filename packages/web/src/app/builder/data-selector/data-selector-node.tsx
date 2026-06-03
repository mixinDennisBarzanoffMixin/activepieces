import { For, Show, createEffect, createSignal } from 'solid-js';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible';

import { DataSelectorNodeContent } from './data-selector-node-content';
import { TestStepSection } from './test-step-section';
import { DataSelectorTreeNode } from './type';

type DataSelectorNodeProps = {
  node: DataSelectorTreeNode;
  depth: number;
  searchTerm: string;
};

const DataSelectorNode = (props: DataSelectorNodeProps) => {
  const [expanded, setExpanded] = createSignal(false);
  const test = () =>
    props.node.data.type === 'test' ? props.node.data : undefined;

  createEffect(() => {
    if (props.searchTerm) {
      setExpanded(true);
    } else {
      setExpanded(props.depth === 0);
    }
  });

  return (
    <Show
      when={test()}
      keyed
      fallback={
        <Collapsible class="w-full" open={expanded} onOpenChange={setExpanded}>
          <>
            <CollapsibleTrigger asChild={true} class="w-full relative">
              <DataSelectorNodeContent
                node={props.node}
                expanded={expanded}
                setExpanded={setExpanded}
                depth={props.depth}
              />
            </CollapsibleTrigger>
            <CollapsibleContent class="w-full">
              <Show
                when={props.node.children && props.node.children.length > 0}
              >
                <div class="flex flex-col ">
                  <For each={props.node.children}>
                    {(node) => (
                      <DataSelectorNode
                        depth={props.depth + 1}
                        node={node}
                        key={node.key}
                        searchTerm={props.searchTerm}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </CollapsibleContent>
          </>
        </Collapsible>
      }
    >
      {(node) => <TestStepSection stepName={node.stepName} />}
    </Show>
  );
};

export { DataSelectorNode };
