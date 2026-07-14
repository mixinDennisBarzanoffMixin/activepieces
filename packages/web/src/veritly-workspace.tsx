import { IframeChildBridge } from '@veritly/iframe';
import React, {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import VeritlyAutomationEditorRoot from './veritly-editor';
import { ActivepiecesWorkspaceDriver } from './veritly-workspace-driver';

type Props = {
  origin: string;
  frame: string;
};

export default function VeritlyAutomationWorkspace(props: Props) {
  const [driver] = useState(() => new ActivepiecesWorkspaceDriver());
  const current = useSyncExternalStore(driver.subscribe, driver.current);

  useEffect(() => {
    const bridge = new IframeChildBridge({
      frame: props.frame,
      origin: props.origin,
      driver,
      window,
    });
    bridge.start();
    return () => {
      bridge.dispose();
      driver.dispose();
    };
  }, [driver, props.frame, props.origin]);

  const register = useCallback(
    (run: (() => Promise<void>) | undefined) => {
      if (!current) return;
      driver.register(current, run);
    },
    [current, driver],
  );

  if (!current) {
    return (
      <div className="bg-background flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
        Waiting for an automation
      </div>
    );
  }

  return (
    <VeritlyAutomationEditorRoot {...current.payload} register={register} />
  );
}
