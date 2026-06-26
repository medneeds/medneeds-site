import * as React from "react";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  footer,
  maxWidth,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          {(title || description) && (
            <DrawerHeader className="text-left">
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </DrawerHeader>
          )}
          <div className="px-4 overflow-y-auto">{children}</div>
          {footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={maxWidth ? { maxWidth } : undefined}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Context for building responsive dialogs with compound components
interface ResponsiveDialogContextValue {
  isMobile: boolean;
}

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextValue>({
    isMobile: false,
  });

export function useResponsiveDialog() {
  return React.useContext(ResponsiveDialogContext);
}

// Compound component version for more complex dialogs
export function ResponsiveDialogRoot({
  open,
  onOpenChange,
  children,
  maxWidth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value={{ isMobile: true }}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]">{children}</DrawerContent>
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(!maxWidth && "sm:max-w-[425px]")}
          style={maxWidth ? { maxWidth } : undefined}
        >
          {children}
        </DialogContent>
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogHeaderComp({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return (
      <DrawerHeader className="text-left">
        <DrawerTitle>{title}</DrawerTitle>
        {description && <DrawerDescription>{description}</DrawerDescription>}
      </DrawerHeader>
    );
  }

  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      {description && <DialogDescription>{description}</DialogDescription>}
    </DialogHeader>
  );
}

export function ResponsiveDialogBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <div className="px-4 py-4 overflow-y-auto">{children}</div>;
  }

  return <div className="py-4">{children}</div>;
}

export function ResponsiveDialogFooterComp({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useResponsiveDialog();

  if (isMobile) {
    return <DrawerFooter className="pt-2">{children}</DrawerFooter>;
  }

  return <DialogFooter>{children}</DialogFooter>;
}
