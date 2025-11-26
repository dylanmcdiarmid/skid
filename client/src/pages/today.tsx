export default function Today() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Today</h1>
        <p className="text-muted-foreground">
          Your daily practice sessions and activities
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <p className="text-text-secondary">
          Day view will be displayed here based on whether a day instance has
          been started.
        </p>
      </div>
    </div>
  );
}
