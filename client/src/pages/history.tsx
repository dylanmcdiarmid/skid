export default function History() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">History</h1>
        <p className="text-muted-foreground">
          Review past practice sessions and completed days
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <p className="text-text-secondary">
          Past day instances will be listed here.
        </p>
      </div>
    </div>
  );
}

