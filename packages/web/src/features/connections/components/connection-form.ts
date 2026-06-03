import { z } from 'zod';

type ErrorMap = Record<string, string>;

type SolidConnectionForm<T> = {
  values: () => T;
  errors: () => ErrorMap;
  setValue: (path: string, value: unknown) => void;
  getValue: (path: string) => unknown;
  getValues: () => T;
  setError: (path: string, error: { message: string }) => void;
  clearError: (path: string) => void;
  validate: () => T | null;
};

function getPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, value);
}

function setPath<T>(value: T, path: string, next: unknown): T {
  const parts = path.split('.');
  const root = structuredClone(value) as Record<string, unknown>;
  const parent = parts
    .slice(0, -1)
    .reduce<Record<string, unknown>>((acc, part) => {
      const child = acc[part];
      if (!child || typeof child !== 'object') {
        acc[part] = {};
      }
      return acc[part] as Record<string, unknown>;
    }, root);
  parent[parts.at(-1) ?? ''] = next;
  return root as T;
}

function issues(error: z.ZodError): ErrorMap {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}

export { getPath, issues, setPath };
export type { ErrorMap, SolidConnectionForm };
