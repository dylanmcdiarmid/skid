import { Root as SeparatorRoot } from "@radix-ui/react-separator";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorRoot>) => {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Custom separator element
    <SeparatorRoot
      aria-hidden={decorative ? true : undefined}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px",
        className
      )}
      data-slot="separator"
      data-testid="separator"
      decorative={decorative}
      orientation={orientation}
      role="separator"
      {...props}
    />
  );
};

export { Separator };
