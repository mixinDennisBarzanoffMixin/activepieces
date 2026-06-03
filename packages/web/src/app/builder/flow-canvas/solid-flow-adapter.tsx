import '@dschz/solid-flow/styles';

import {
  Background,
  BaseEdge,
  getNodesBounds,
  getViewportForBounds,
  Handle,
  MiniMap,
  NodeResizer,
  PanOnScrollMode,
  Position,
  SelectionMode,
  SolidFlow,
  SolidFlowProvider,
  useSolidFlow,
  ViewportPortal,
} from '@dschz/solid-flow';
import type {
  CoordinateExtent,
  Edge,
  EdgeProps,
  MiniMapProps,
  Node,
  NodeProps,
  OnSelectionChange,
  Viewport,
} from '@dschz/solid-flow';
import { useKeyDownList } from '@solid-primitives/keyboard';
import { createMemo } from 'solid-js';

function ReactFlow(props: Parameters<typeof SolidFlow>[0]) {
  return <SolidFlow {...props} />;
}

function ReactFlowProvider(props: Parameters<typeof SolidFlowProvider>[0]) {
  return <SolidFlowProvider {...props} />;
}

function NodeResizeControl(props: Parameters<typeof NodeResizer>[0]) {
  return <NodeResizer {...props} />;
}

function useReactFlow() {
  const flow = useSolidFlow();
  return {
    ...flow,
    project: flow.screenToFlowPosition,
  };
}

function useStoreApi() {
  const flow = useSolidFlow();
  const select = (ids: string[]) => {
    const selected = new Set(ids);
    flow.getNodes().forEach((node) => {
      flow.updateNode(node.id, { selected: selected.has(node.id) });
    });
  };
  return {
    getState: () => ({
      addSelectedNodes: select,
      unselectNodesAndEdges: () => select([]),
    }),
    setState: () => undefined,
    subscribe: () => () => undefined,
  };
}

function useKeyPress(key: string | string[]) {
  const list = useKeyDownList();
  return createMemo(() => {
    const keys = list();
    const match = (value: string) =>
      value.split('+').every((part) => keys.includes(part));
    return Array.isArray(key) ? key.some(match) : match(key);
  });
}

const BackgroundVariant = {
  Dots: 'dots',
  Lines: 'lines',
  Cross: 'cross',
} as const;

type ReactFlowInstance = ReturnType<typeof useReactFlow>;
type MiniMapNodeProps = Node & {
  x: number;
  y: number;
  width: number;
  height: number;
};
type OnSelectionChangeParams = Parameters<OnSelectionChange>[0];

export {
  Background,
  BackgroundVariant,
  BaseEdge,
  getNodesBounds,
  getViewportForBounds,
  Handle,
  MiniMap,
  NodeResizeControl,
  PanOnScrollMode,
  Position,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useKeyPress,
  useReactFlow,
  useStoreApi,
  ViewportPortal,
};

export type {
  CoordinateExtent,
  Edge,
  EdgeProps,
  MiniMapNodeProps,
  MiniMapProps,
  Node,
  NodeProps,
  OnSelectionChangeParams,
  ReactFlowInstance,
  Viewport,
};
