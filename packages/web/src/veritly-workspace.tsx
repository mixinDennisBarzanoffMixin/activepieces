import { tryCatch } from '@activepieces/shared';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import VeritlyAutomationEditorRoot, {
  type VeritlyAutomationEditorProps,
} from './veritly-editor';

type Open = {
  type: 'veritly.iframe.open';
  frame: string;
  request: number;
  path: string;
  payload: VeritlyAutomationEditorProps;
};

type Flush = {
  type: 'veritly.iframe.flush';
  frame: string;
  request: number;
  path: string;
};

type Props = {
  origin: string;
  frame: string;
};

type Save = {
  path: string;
  run: () => Promise<void>;
};

function validOpen(value: unknown): value is Open {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return (
    data.type === 'veritly.iframe.open' &&
    typeof data.frame === 'string' &&
    typeof data.request === 'number' &&
    typeof data.path === 'string' &&
    typeof data.payload === 'object' &&
    data.payload !== null &&
    typeof Reflect.get(data.payload, 'flowId') === 'string' &&
    typeof Reflect.get(data.payload, 'projectId') === 'string' &&
    typeof Reflect.get(data.payload, 'path') === 'string' &&
    (Reflect.get(data.payload, 'name') === undefined ||
      typeof Reflect.get(data.payload, 'name') === 'string')
  );
}

function flush(value: unknown): value is Flush {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (
    Reflect.get(value, 'type') === 'veritly.iframe.flush' &&
    typeof Reflect.get(value, 'frame') === 'string' &&
    typeof Reflect.get(value, 'request') === 'number' &&
    typeof Reflect.get(value, 'path') === 'string'
  );
}

export default function VeritlyAutomationWorkspace(props: Props) {
  const [current, setCurrent] = useState<Open>();
  const active = useRef<Open | undefined>(undefined);
  const save = useRef<Save | undefined>(undefined);
  const loaded = useRef<number | undefined>(undefined);

  const post = useCallback(
    (data: object) => window.parent.postMessage(data, props.origin),
    [props.origin],
  );

  useEffect(() => {
    const receive = async (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (event.origin !== props.origin) {
        console.error(
          new Error(`Rejected iframe parent origin ${event.origin}`),
        );
        return;
      }
      if (validOpen(event.data)) {
        if (event.data.frame !== props.frame) {
          console.error(new Error('Received an open for another iframe'));
          return;
        }
        save.current = undefined;
        active.current = event.data;
        setCurrent(event.data);
        return;
      }
      if (!flush(event.data)) {
        console.error(new Error('Received a malformed iframe request'));
        return;
      }
      const currentSave = save.current;
      const error =
        event.data.frame !== props.frame
          ? new Error('Received a flush for another iframe')
          : event.data.path !== active.current?.path
          ? new Error(`Cannot flush inactive file ${event.data.path}`)
          : !currentSave || currentSave.path !== event.data.path
          ? new Error('Activepieces editor has no flush handler')
          : (await tryCatch(currentSave.run)).error;
      if (error) {
        post({
          type: 'veritly.iframe.error',
          frame: props.frame,
          request: event.data.request,
          error: error.message,
        });
        return;
      }
      post({
        type: 'veritly.iframe.flushed',
        frame: props.frame,
        request: event.data.request,
        path: event.data.path,
      });
    };
    window.addEventListener('message', receive);
    post({
      type: 'veritly.iframe.ready',
      frame: props.frame,
      methods: ['open', 'flush'],
      events: ['loaded'],
    });
    return () => window.removeEventListener('message', receive);
  }, [post, props.frame, props.origin]);

  if (!current) {
    return (
      <div className="bg-background flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
        Waiting for an automation
      </div>
    );
  }

  return (
    <VeritlyAutomationEditorRoot
      {...current.payload}
      register={(run) => {
        if (!run) {
          if (save.current?.path === current.path) save.current = undefined;
          return;
        }
        save.current = { path: current.path, run };
        if (loaded.current === current.request) return;
        loaded.current = current.request;
        post({
          type: 'veritly.iframe.loaded',
          frame: props.frame,
          request: current.request,
          path: current.path,
        });
      }}
    />
  );
}
