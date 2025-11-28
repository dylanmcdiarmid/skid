import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div>
      <h1 className={cn('font-semibold text-xl', className)}>{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
