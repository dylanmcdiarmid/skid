import { PageHeader } from '@/components/page-header';

export default function GeneratorHistory() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <PageHeader
        description="Track what was generated and when"
        title="Generator History"
      />
      <div className="min-h-0 flex-1">
        <p className="text-text-secondary">
          Generator history and analytics will be displayed here.
        </p>
      </div>
    </div>
  );
}
