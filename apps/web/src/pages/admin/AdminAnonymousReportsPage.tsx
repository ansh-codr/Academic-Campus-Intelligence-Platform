import { Card } from '@/components/ui/Card';

export function AdminAnonymousReportsPage() {
  return (
    <Card className="p-6 space-y-3">
      <h1 className="text-xl font-bold">Anonymous concerns</h1>
      <p>Speak Freely submissions are closed pending an independent zero-knowledge privacy audit.</p>
    </Card>
  );
}
