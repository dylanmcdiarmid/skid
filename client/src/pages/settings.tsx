export default function Settings() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your application</p>
      </div>
      <div className="min-h-0 flex-1">
        <p className="text-text-secondary">
          Application settings will be displayed here.
        </p>
      </div>
    </div>
  );
}

