import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { PracticeSessionList } from './practice-sessions/list';

export default function PracticeSessions() {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <PageHeader
          description="Browse and edit practice session templates"
          title="Practice Sessions"
        />
      </div>
      <div className="min-h-0 flex-1">
        <PracticeSessionList
          focusedId={focusedId}
          onFocusedIdChange={setFocusedId}
        />
      </div>
    </div>
  );
}
