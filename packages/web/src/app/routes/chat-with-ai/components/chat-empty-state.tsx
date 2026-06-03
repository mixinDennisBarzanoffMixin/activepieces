import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import {
  Database,
  Lightbulb,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-solid';
import { motion } from 'motion/react';
import { createMemo, For } from 'solid-js';

import { PromptSuggestion } from '@/components/prompt-kit/prompt-suggestion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function EmptyState(props: { incognito: boolean }) {
  const greeting = createMemo(() =>
    props.incognito ? t('Private Chat') : t('What would you like to work on?'),
  );

  return (
    <motion.div
      class="flex items-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Sparkles class="h-7 w-7 text-primary shrink-0" />
      <h2
        class="text-[28px] font-bold leading-tight bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
        style={{ 'text-wrap': 'balance' }}
      >
        {greeting()}
      </h2>
    </motion.div>
  );
}

export function SuggestionCards(props: {
  onSend: (text: string, files?: File[]) => void;
}) {
  const suggestions = [
    { icon: Zap, text: t('Automate a task') },
    { icon: ShieldCheck, text: t('Handle approvals') },
    { icon: Database, text: t('Check my data') },
    { icon: Lightbulb, text: t('Brainstorm ideas') },
  ];

  return (
    <div class="flex flex-wrap justify-center gap-2 mt-3">
      <For each={suggestions}>
        {(s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i() * 0.08 }}
          >
            <PromptSuggestion onClick={() => props.onSend(s.text)}>
              <s.icon class="h-3.5 w-3.5" />
              {s.text}
            </PromptSuggestion>
          </motion.div>
        )}
      </For>
    </div>
  );
}

export function SetupRequiredState() {
  const navigate = useNavigate();

  return (
    <div class="flex flex-col items-center justify-center h-full text-center gap-4 py-20 flex-1 min-w-0">
      <div class="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted">
        <Settings class="h-8 w-8 text-muted-foreground" />
      </div>
      <div class="space-y-2">
        <h2 class="text-xl font-semibold">
          {t('Set up an AI provider to get started')}
        </h2>
        <p class="text-muted-foreground text-sm max-w-md">
          {t(
            'AI Chat requires an AI provider. Add your provider in the AI settings to start chatting.',
          )}
        </p>
      </div>
      <Button onClick={() => navigate('/platform/setup/ai')} class="gap-2">
        <Settings class="h-4 w-4" />
        {t('Go to AI Settings')}
      </Button>
    </div>
  );
}

export function MessageSkeletons() {
  return (
    <div class="space-y-8 animate-in fade-in duration-300 py-4">
      <div class="flex justify-end">
        <Skeleton class="h-10 w-48 rounded-2xl" />
      </div>
      <div class="space-y-2">
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-1/2" />
      </div>
    </div>
  );
}
