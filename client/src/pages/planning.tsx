import { PageHeader } from '@/components/page-header';

export default function Planning() {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <PageHeader
          description="Capture ideas and defer items for future practice"
          title="Planning"
        />
      </div>
      <div className="min-h-0 flex-1">
        <p className="text-text-secondary">
          Planning inbox will be displayed here.
        </p>
      </div>
    </div>
  );
}
