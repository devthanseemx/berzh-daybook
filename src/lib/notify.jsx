import { toast } from 'sonner';
import { Trash2, LogOut, LogIn, Star, Download, Upload, Copy, Undo2 } from 'lucide-react';

const icon = (Icon) => <Icon size={18} />;

export const notify = {
  success: (m) => toast.success(m),            // ✔ green check
  error: (m) => toast.error(m),                // ✖ red
  info: (m) => toast.info(m),                  // ℹ blue
  warning: (m) => toast.warning(m),            // ⚠ amber
  deleted: (m) => toast(m, { icon: icon(Trash2) }),
  reopened: (m) => toast.info(m, { icon: icon(Undo2) }),
  saved: (m) => toast.success(m, { icon: icon(Star) }),
  imported: (m) => toast.success(m, { icon: icon(Upload) }),
  exported: (m) => toast.success(m, { icon: icon(Download) }),
  copied: (m) => toast.success(m, { icon: icon(Copy) }),
  signedIn: (m) => toast.success(m, { icon: icon(LogIn) }),
  signedOut: (m) => toast.info(m, { icon: icon(LogOut) }),
};