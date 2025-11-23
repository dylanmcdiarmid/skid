import { SidebarTrigger } from "@/components/ui/sidebar";

type TopBarProps = {
  title?: string;
};

export const TopBar = ({ title }: TopBarProps) => {
  return (
    <div className="mx-4 flex items-center gap-4 border-border-default border-b bg-sidebar py-2">
      <SidebarTrigger className="hover:!bg-bg-surface" />
      {title && (
        <span className="font-bold text-md text-text-primary">{title}</span>
      )}
    </div>
  );
};
