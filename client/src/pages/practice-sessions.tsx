import { useState } from 'react';
import { PracticeSessionList } from './practice-sessions/list';

export default function PracticeSessions() {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">
          Practice Sessions
        </h1>
        <p className="text-muted-foreground">
          Browse and edit practice session templates
        </p>
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
