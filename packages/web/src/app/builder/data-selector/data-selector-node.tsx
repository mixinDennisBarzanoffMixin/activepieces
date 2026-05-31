import { For, Show, createEffect, createSignal } from 'solid-js';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible';

import { DataSelectorNodeContent } from './data-selector-node-content';
import { TestStepSection } from './test-step-section';
import { DataSelectorTreeNode } from './type';
import { dataSelectorUtils } from './utils';

type DataSelectorNodeProps = {
  node: DataSelectorTreeNode;
  depth: number;
  searchTerm: string;
};

const DataSelectorNode = ({
  node,
  depth,
  searchTerm,
}: DataSelectorNodeProps) => {
  const [expanded, setExpanded] = createSignal(depth === 0);

  createEffect(() => {
    if (searchTerm) {
      setExpanded(true);
    } else {
      setExpanded(depth === 0);
    }
  });

  const isTestStepNode = dataSelectorUtils.isTestStepNode(node);
  if (isTestStepNode) {
    return <TestStepSection stepName={node.data.stepName}></TestStepSection>;
  }

  return (
    <Collapsible class="w-full" open={expanded} onOpenChange={setExpanded}>
      <>
        <CollapsibleTrigger asChild={true} class="w-full relative">
          <DataSelectorNodeContent
            node={node}
            expanded={expanded}
            setExpanded={setExpanded}
            depth={depth}
          ></DataSelectorNodeContent>
        </CollapsibleTrigger>
        <CollapsibleContent class="w-full">
          <Show when={node.children && node.children.length > 0()}>
            <div className="flex flex-col ">
              <For each={node.children}>
                {(node) => (
                  <DataSelectorNode
                    depth={depth + 1}
                    node={node}
                    key={node.key}
                    searchTerm={searchTerm}
                  ></DataSelectorNode>
                )}
              </For>
            </div>
          </Show>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};
DataSelectorNode.displayName = 'DataSelectorNode';
export { DataSelectorNode };
