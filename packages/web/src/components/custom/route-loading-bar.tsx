export function RouteLoadingBar() {
  return (
    <div className="h-full w-full">
      <div className="h-0.5 w-full overflow-hidden bg-primary/20">
        <div className="h-full w-1/4 bg-primary rounded-full animate-indeterminate-progress" />
      </div>
    </div>
  );
}
