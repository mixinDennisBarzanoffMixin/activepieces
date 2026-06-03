import { BuilderField } from '@/app/builder/builder-form';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';
import { JsonEditor } from '@/components/custom/json-editor';

type BuilderJsonEditorWrapperProps = {
  field: BuilderField;
  disabled?: boolean;
};

const BuilderJsonEditorWrapper = (props: BuilderJsonEditorWrapperProps) => {
  const [setInsertStateHandler] = useBuilderStateContext((state) => [
    state.setInsertMentionHandler,
  ]);

  return (
    <JsonEditor
      field={props.field}
      readonly={props.disabled ?? false}
      onFocus={(ref) => {
        setInsertStateHandler((propertyPath) => {
          if (!isEditorRef(ref)) {
            return;
          }
          ref.current.view.dispatch({
            changes: {
              from: ref.current.view.state.selection.main.head,
              insert: `{{${propertyPath}}}`,
            },
          });
        });
      }}
      class={textMentionUtils.inputWithMentionsCssClass}
    />
  );
};

export { BuilderJsonEditorWrapper };

function isEditorRef(ref: unknown): ref is EditorRef {
  if (typeof ref !== 'object' || ref === null || !('current' in ref)) {
    return false;
  }
  const current = ref.current;
  return typeof current === 'object' && current !== null && 'view' in current;
}

type EditorRef = {
  current: {
    view: {
      dispatch: (spec: { changes: { from: number; insert: string } }) => void;
      state: { selection: { main: { head: number } } };
    };
  };
};
