import { ModeToggle } from '@/components/mode-toggle';
import { PageHeader } from '@/components/page-header';

export default function Settings() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <PageHeader description="Configure your application" title="Settings" />
      <div className="min-h-0 flex-1">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <h2 className="font-medium text-base">Appearance</h2>
              <p className="text-muted-foreground text-sm">
                Customize the look and feel of the application.
              </p>
            </div>
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
