import { isNil, USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';
import { useParams, useSearchParams } from '@solidjs/router';
import { Show } from 'solid-js';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { ApForm, formsQueries } from '@/features/forms';

import NotFoundPage from '../404-page';

export const FormPage = () => {
  const { flowId } = useParams();
  const [searchParams] = useSearchParams();
  const useDraft = searchParams[USE_DRAFT_QUERY_PARAM_NAME] === 'true';

  const {
    data: form,
    isLoading,
    isError,
  } = formsQueries.useForm(flowId!, useDraft, !isNil(flowId));

  return (
    <>
      <Show when={isLoading}>
        <LoadingScreen />
      </Show>
      <Show when={isError}>
        <NotFoundPage
          title="Hmm... this form isn't here"
          description="The form you're looking for isn't here or maybe hasn't been published by the owner yet"
        />
      </Show>

      <Show when={form && !isLoading}>
        <ApForm form={form} useDraft={useDraft} />
      </Show>
    </>
  );
};
