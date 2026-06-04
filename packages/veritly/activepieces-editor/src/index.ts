import type { ComponentType } from 'react';

export type VeritlyAutomationEditorProps = {
  flowId: string;
  path: string;
  name?: string;
  projectId: string;
};

const Editor: ComponentType<VeritlyAutomationEditorProps> = () => {
  throw new Error('@veritly/activepieces-editor must be resolved by the Activepieces editor Vite plugin');
};

export default Editor;
