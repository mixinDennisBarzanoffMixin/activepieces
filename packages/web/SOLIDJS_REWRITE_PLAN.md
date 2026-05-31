# Activepieces Web → SolidJS 1:1 Rewrite Plan

## Goal
Translate every React/TSX file in `packages/web/src` to SolidJS **without dropping a single file**. Compilation is explicitly out of scope; the objective is 100 % file coverage.

## Inventory
- **TSX files in `packages/web/src`**: 684
- **TS files importing `react`**: 35
- **Total files requiring rewrite**: ~719

## Dependency Swap

### Remove
- `react`, `react-dom`, `@types/react`, `@types/react-dom`
- `react-router-dom` → `@solidjs/router`
- `@tanstack/react-query` → `@tanstack/solid-query`
- `@tanstack/react-table` → `@tanstack/solid-table`
- `@tanstack/react-virtual` → `@tanstack/solid-virtual`
- `@tanstack/react-db` → drop (no official Solid port yet; stub)
- `react-hook-form` → `@modular-forms/solid`
- `react-i18next` → `@solid-primitives/i18n` (or keep `i18next` direct usage)
- `react-error-boundary` → `solid-js` ErrorBoundary
- `react-use`, `use-debounce`, `use-deep-compare-effect`, `use-ripple-hook`, `use-stick-to-bottom` → replace with `@solid-primitives/*` or inline
- `@radix-ui/react-*` → `@kobalte/core` or `@corvu/*` where possible (mechanical swap later)
- `@vitejs/plugin-react` → `vite-plugin-solid`
- `@tiptap/react` → `@tiptap/solid` (community or custom wrapper)
- `@uiw/react-codemirror` → `@uiw/solid-codemirror` (or keep as thin wrapper)
- `@xyflow/react` → wrap in `solid-js` `createComponent` / custom wrapper
- `react-data-grid` → wrap or replace later
- `react-resizable-panels` → `@corvu/resizable`
- `react-textarea-autosize` → `@solid-primitives/resize-observer`
- `react-day-picker` → wrap or replace
- `react-json-view` → wrap or replace
- `react-markdown` → `solid-markdown`
- `react-lottie` → `lottie-solid` or wrapper
- `react-syntax-highlighter` → wrap
- `recharts` → wrap
- `embla-carousel-react` → `embla-carousel-solid` or wrap
- `lucide-react` → `lucide-solid`
- `framer-motion` / `motion` → `@motionone/solid` or `solid-motionone`
- `zustand` → keep, consume with `createStore` + `useStore` from `solid-zustand` or read directly in `createMemo`
- `sonner` → `solid-sonner`
- `next-themes` → inline (ThemeProvider already custom)
- `vaul` → `@corvu/drawer`
- `canvas-confetti` → keep (vanilla)
- `@dnd-kit/*` → `@thisbeyond/solid-dnd`

### Add
- `solid-js`
- `vite-plugin-solid`
- `@solidjs/router`
- `@tanstack/solid-query`
- `@tanstack/solid-table`
- `@tanstack/solid-virtual`
- `@modular-forms/solid`
- `@solid-primitives/i18n`
- `@solid-primitives/resize-observer`
- `@solid-primitives/storage`
- `@solid-primitives/scheduled`
- `@solid-primitives/memo`
- `@solid-primitives/refs`
- `@kobalte/core` (Radix alternative)
- `@corvu/drawer`, `@corvu/resizable`, `@corvu/tooltip`
- `solid-sonner`
- `solid-motionone`
- `lucide-solid`
- `@thisbeyond/solid-dnd`
- `solid-markdown`

## Mechanical Translation Rules

1. **Imports**
   - `import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react'`
   - → `import { createSignal, createEffect, createMemo, createResource, onMount, onCleanup, useContext } from 'solid-js'`
   - Remove `React.FC`, `React.ReactNode`, `React.ReactElement`, etc.
   - Replace `React.lazy(() => import(...))` with `lazy(() => import(...))` from `solid-js`
   - Replace `Suspense` from `react` with `Suspense` from `solid-js`

2. **Components**
   - `function MyComp({ a, b }: Props) { ... }` stays as-is (Solid uses functions too)
   - Remove `.displayName` assignments where not needed
   - Convert default props pattern if any to default parameters

3. **State**
   - `const [x, setX] = useState(initial)` → `const [x, setX] = createSignal(initial)`
   - `useState(() => expensive())` → `createSignal(expensive())` (Solid signals are lazy getters, but initializer still runs once)
   - For objects/arrays: prefer `createStore` from `solid-js/store` when deeply reactive updates are needed, otherwise keep `createSignal` and spread manually

4. **Effects**
   - `useEffect(() => { ... }, [a, b])` → `createEffect(() => { ... ; a(); b(); })` (explicit dependency tracking by calling signals)
   - `useEffect(() => { ... return () => cleanup }, [])` → `onMount(() => { ... onCleanup(() => cleanup) })`
   - `useLayoutEffect` → `createEffect` (runs synchronously in Solid) or `onMount`

5. **Memo**
   - `const val = useMemo(() => ..., [a, b])` → `const val = createMemo(() => { a(); b(); return ... })`

6. **Callbacks**
   - `useCallback((x) => ..., [a])` → just define the function inline; if it must be stable, wrap in `createMemo` or nothing (Solid doesn't re-render, so function identity rarely matters)

7. **Refs**
   - `const ref = useRef<HTMLDivElement>(null)` → `let ref: HTMLDivElement | undefined;` and bind `<div ref={el => ref = el}>`
   - Or use `createSignal<HTMLDivElement | null>(null)` for reactive refs

8. **Context**
   - `createContext<T>(default)` → `createContext<T>(default)` (Solid has same API)
   - `useContext(MyCtx)` stays the same
   - Provider: `<MyCtx.Provider value={...}>` → `<MyCtx.Provider value={...}>` (same in Solid)

9. **Router**
   - `createBrowserRouter(routes)` / `<RouterProvider router={...}>` → `<Router root={...}>` and `<Route path="..." component={...} />` from `@solidjs/router`
   - `useNavigate()` → `useNavigate()` from `@solidjs/router`
   - `useParams()` → `useParams()` from `@solidjs/router`
   - `Navigate` component → `<Navigate href={...} />`
   - `Outlet` concept exists in `@solidjs/router`
   - `React.lazy` in routes → `lazy(() => import(...))`

10. **TanStack Query**
    - `useQuery({ queryKey, queryFn })` → `createQuery(() => ({ queryKey, queryFn }))` (options must be a function in Solid version)
    - `useMutation({ mutationFn })` → `createMutation(() => ({ mutationFn }))`
    - `QueryClientProvider` stays conceptually similar but use Solid version
    - Keep `queryClient` instance as-is (it's framework-agnostic)

11. **Forms**
    - `useForm({ resolver: zodResolver(...) })` → `createForm({ validate: zodForm(...) })` from `@modular-forms/solid`
    - `register`, `handleSubmit`, `formState.errors` → Modular Forms equivalents
    - `<FormField name="..." render={({ field }) => ...}>` → `<Field name="...">{(field, props) => ...}</Field>`

12. **JSX Differences**
    - `className` → `class`
    - `htmlFor` → `for`
    - `onChange` on inputs → `onInput` for text inputs, `onChange` for checkboxes/selects
    - `style={{ color: 'red' }}` → `style={{ color: 'red' }}` (works in Solid too)
    - `key={...}` on lists → `<For each={items()}>{(item) => ...}</For>`
    - `{items.map(i => <div />)}` → `<For each={items()}>{(i) => <div />}</For>`
    - `{condition && <A />}` → `{condition() && <A />}` (call signals) or `<Show when={condition()}><A /></Show>`
    - `{condition ? <A /> : <B />}` → `<Show when={condition()} fallback={<B />}><A /></Show>`
    - `dangerouslySetInnerHTML={{ __html: ... }}` → `innerHTML={...}`
    - Spread props: `{...props}` stays same
    - `ref={ref}` stays same for callback refs; for signal refs use `ref={setRef}` where `setRef` is a signal setter

13. **Event Handling**
    - React synthetic events (`e: React.MouseEvent`) → native events (`e: MouseEvent`)
    - `e.preventDefault()` / `e.stopPropagation()` stays same

14. **Zustand**
    - `const store = useStore()` → read in `createMemo(() => store.getState())` or use `solid-zustand` hook
    - Since we don't care about compilation, simplest mechanical translation: keep `zustand` store creation, and in components replace `useMyStore()` with `const state = useStore(myStore)` or `createMemo(() => myStore.getState())`

15. **Children / Slots**
    - `children: React.ReactNode` → `children: JSX.Element`
    - `React.Children.map(children, ...)` → `children` is already an array in Solid; map directly or use `solid-js` `children` helper
    - `cloneElement(child, props)` → merge props manually or use `solid-js` `Dynamic`

16. **Portals**
    - `createPortal(children, domNode)` → `Portal` component from `solid-js/web`

17. **Error Boundaries**
    - `react-error-boundary` `ErrorBoundary` → `ErrorBoundary` from `solid-js`

18. **StrictMode**
    - Remove `<StrictMode>` wrappers (Solid doesn't have one)

19. **Forwarded Refs**
    - `React.forwardRef((props, ref) => ...)` → `(props: { ref?: ... }) => ...` or use `mergeProps`

20. **Custom Hooks**
    - Hooks that return state/effects work almost identically; rename internal `useX` to `createX` if desired, but keeping `useX` names is fine mechanically

## Execution Order

1. **Infrastructure** (do first)
   - `packages/web/package.json` swap deps
   - `packages/web/vite.config.mts` swap plugin
   - `packages/web/tsconfig.app.json` set `"jsx": "preserve"`, `"jsxImportSource": "solid-js"`

2. **Foundation** (do second)
   - `main.tsx`
   - `app/app.tsx`
   - `app/query-client.ts`
   - `app/guards/index.tsx` (router)
   - `app/routes/*` (route definitions)
   - `components/providers/*`
   - `hooks/*` (custom hooks)

3. **UI Primitives** (do third)
   - `components/ui/*` (Shadcn/Radix wrappers)
   - `components/custom/*`
   - `components/icons/*`

4. **Features** (do fourth, in parallel batches)
   - `features/authentication/*`
   - `features/flows/*`
   - `features/pieces/*`
   - `features/agents/*`
   - `features/chat/*`
   - `features/tables/*`
   - `features/billing/*`
   - `features/connections/*`
   - `features/members/*`
   - `features/platform-admin/*`
   - `features/projects/*`
   - `features/templates/*`
   - `features/flow-runs/*`
   - `features/variables/*`
   - `features/secret-managers/*`
   - `features/alerts/*`
   - `features/folders/*`
   - `features/forms/*`
   - `features/project-releases/*`
   - `features/automations/*`

5. **App-level components & routes**
   - `app/components/*`
   - `app/routes/*`
   - `app/builder/*`
   - `app/connections/*`
   - `app/variables/*`

6. **Lib & API**
   - `lib/*`
   - `api/*`

## Batch Size
Subagents should process **directories** (e.g., one subagent for `features/billing`, one for `features/chat`, etc.) rather than individual files. Each subagent receives:
- The mechanical translation rules above
- The list of files in its assigned directory
- Instructions to read each file, rewrite it, and write it back

## Verification Checklist
After all batches complete, run:
```bash
find packages/web/src -type f \( -name '*.tsx' -o -name '*.ts' \) | xargs grep -l "from 'react'" | wc -l
```
Expected result: `0`

Also verify no `.jsx` files were missed and no `React.` references remain:
```bash
grep -r "React\." packages/web/src --include="*.tsx" --include="*.ts" | wc -l
```
Expected: `0`

## Notes
- Keep `export` names identical so downstream imports don't break structurally.
- Keep file paths identical; only change file contents.
- When in doubt, keep the original logic verbatim and only swap React primitives for Solid primitives.
- Do NOT optimize or refactor during translation; this is a 1:1 mechanical rewrite.
