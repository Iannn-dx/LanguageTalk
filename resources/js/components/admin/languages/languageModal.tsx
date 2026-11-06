import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';

interface LanguageModalProps {
  open: boolean;
  onOpenChange: (open:boolean) => void;

  title: string;
  children: React.ReactNode;
}

export default function LanguageModal({
  open, onOpenChange, title, children
}: LanguageModalProps){
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            {title}
          </DialogHeader>
          {children}
        </DialogContent>
    </Dialog>
  )
}