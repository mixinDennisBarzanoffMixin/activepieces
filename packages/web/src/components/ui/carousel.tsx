import { ArrowLeft, ArrowRight } from 'lucide-solid';
import {
  createContext,
  createSignal,
  mergeProps,
  splitProps,
  useContext,
  type ComponentProps,
  type JSX,
} from 'solid-js';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CarouselApi = {
  scrollPrev: () => void;
  scrollNext: () => void;
};
type CarouselOptions = {
  axis?: 'x' | 'y';
};
type CarouselPlugin = unknown;

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: (el: HTMLDivElement) => void;
  api: CarouselApi | undefined;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: () => boolean;
  canScrollNext: () => boolean;
  opts: () => CarouselOptions | undefined;
  orientation: () => 'horizontal' | 'vertical';
};

const CarouselContext = createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

function Carousel(
  _props: ClassName<JSX.IntrinsicElements['div']> & CarouselProps,
) {
  const props = mergeProps({ orientation: 'horizontal' }, _props);
  const [local, rest] = splitProps(props, [
    'orientation',
    'opts',
    'setApi',
    'plugins',
    'className',
    'children',
  ]);
  const carouselRef = (_el: HTMLDivElement) => undefined;
  const api: CarouselApi | undefined = undefined;
  const [canScrollPrev, setCanScrollPrev] = createSignal(false);
  const [canScrollNext, setCanScrollNext] = createSignal(false);

  const onSelect = () => {
    setCanScrollPrev(false);
    setCanScrollNext(false);
  };

  const scrollPrev = () => undefined;

  const scrollNext = () => undefined;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollPrev();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollNext();
    }
  };

  onSelect();

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts: () => local.opts,
        orientation: () =>
          local.orientation ||
          (local.opts?.axis === 'y' ? 'vertical' : 'horizontal'),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        class={cn('relative', local.className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...rest}
      >
        {local.children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(_props, ['className']);
  const state = useCarousel();

  return (
    <div
      ref={state.carouselRef}
      class="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        class={cn(
          'flex',
          state.orientation() === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          local.className,
        )}
        {...rest}
      />
    </div>
  );
}

function CarouselItem(_props: ClassName<JSX.IntrinsicElements['div']>) {
  const [local, rest] = splitProps(_props, ['className']);
  const state = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      class={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        state.orientation() === 'horizontal' ? 'pl-4' : 'pt-4',
        local.className,
      )}
      {...rest}
    />
  );
}

function CarouselPrevious(_props: ClassName<ComponentProps<typeof Button>>) {
  const props = mergeProps({ variant: 'outline', size: 'icon' }, _props);
  const [local, rest] = splitProps(props, [
    'className',
    'variant',
    'size',
    'children',
  ]);
  const state = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={local.variant}
      size={local.size}
      class={cn(
        'absolute h-8 w-8 rounded-full',
        state.orientation() === 'horizontal'
          ? 'top-1/2 -left-12 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        local.className,
      )}
      disabled={!state.canScrollPrev()}
      onClick={state.scrollPrev}
      {...rest}
    >
      {local.children || <ArrowLeft class="h-4 w-4" />}
      <span class="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext(_props: ClassName<ComponentProps<typeof Button>>) {
  const props = mergeProps({ variant: 'outline', size: 'icon' }, _props);
  const [local, rest] = splitProps(props, [
    'className',
    'variant',
    'size',
    'children',
  ]);
  const state = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={local.variant}
      size={local.size}
      class={cn(
        'absolute h-8 w-8 rounded-full',
        state.orientation() === 'horizontal'
          ? 'top-1/2 -right-12 -translate-y-1/2'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
        local.className,
      )}
      disabled={!state.canScrollNext()}
      onClick={state.scrollNext}
      {...rest}
    >
      {local.children || <ArrowRight class="h-4 w-4" />}
      <span class="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};

type ClassName<T> = Omit<T, 'className'> & {
  className?: string;
};
