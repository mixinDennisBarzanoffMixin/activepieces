export function RouteLoadingBar() {
  return (
    <div class="h-full w-full">
      <div class="h-0.5 w-full overflow-hidden bg-primary/20">
        <div class="h-full w-1/4 bg-primary rounded-full animate-indeterminate-progress" />
      </div>
    </div>
  );
}
