import { For, Match, Show, Switch } from 'solid-js';

type Props = {
  data: unknown;
  fontSize?: string;
};

export function SolidJsonViewer(props: Props) {
  return (
    <span class="block font-mono text-sm" style={{ 'font-size': props.fontSize }}>
      <JsonNode data={props.data} />
    </span>
  );
}

function JsonNode(props: { data: unknown }) {
  return (
    <Switch>
      <Match when={props.data === null}>
        <span class="text-muted-foreground">null</span>
      </Match>
      <Match when={Array.isArray(props.data)}>
        <span class="text-muted-foreground">[</span>
        <div class="pl-4">
          <For each={props.data as unknown[]}>
            {(item, index) => (
              <div>
                <JsonNode data={item} />
                <Show when={index() < (props.data as unknown[]).length - 1}>,</Show>
              </div>
            )}
          </For>
        </div>
        <span class="text-muted-foreground">]</span>
      </Match>
      <Match when={typeof props.data === 'object'}>
        <span class="text-muted-foreground">{'{'}</span>
        <div class="pl-4">
          <For each={Object.entries(props.data as Record<string, unknown>)}>
            {([key, value], index) => (
              <div>
                <span class="text-purple-500">"{key}"</span>
                <span class="text-muted-foreground">: </span>
                <JsonNode data={value} />
                <Show when={index() < Object.keys(props.data as Record<string, unknown>).length - 1}>,</Show>
              </div>
            )}
          </For>
        </div>
        <span class="text-muted-foreground">{'}'}</span>
      </Match>
      <Match when={typeof props.data === 'string'}>
        <span class="string-value text-green-600">"{props.data as string}"</span>
      </Match>
      <Match when={typeof props.data === 'number'}>
        <span class="text-blue-500">{String(props.data)}</span>
      </Match>
      <Match when={typeof props.data === 'boolean'}>
        <span class="text-amber-600">{String(props.data)}</span>
      </Match>
      <Match when={true}>
        <span class="text-muted-foreground">{String(props.data)}</span>
      </Match>
    </Switch>
  );
}
