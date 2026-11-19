import { toast } from 'sonner';
import {
  AlertTriangle, Check, Copy, Download, Info, LogIn, LogOut, Star, Trash2, Undo2, Upload, X,
} from 'lucide-react';

const icon = (Icon, tone) => (
  <span className={`toast-icon toast-icon-${tone}`}>
    <Icon size={15} strokeWidth={2.5} />
  </span>
);

export const notify = {
  success: (m) => toast.success(m, { icon: icon(Check, 'success') }),
  error: (m) => toast.error(m, { icon: icon(X, 'error') }),
  info: (m) => toast.info(m, { icon: icon(Info, 'info') }),
  warning: (m) => toast.warning(m, { icon: icon(AlertTriangle, 'warning') }),
  deleted: (m) => toast(m, { icon: icon(Trash2, 'error') }),
  reopened: (m) => toast.info(m, { icon: icon(Undo2, 'info') }),
  saved: (m) => toast.success(m, { icon: icon(Star, 'success') }),
  imported: (m) => toast.success(m, { icon: icon(Upload, 'success') }),
  exported: (m) => toast.success(m, { icon: icon(Download, 'success') }),
  copied: (m) => toast.success(m, { icon: icon(Copy, 'success') }),
  signedIn: (m) => toast.success(m, { icon: icon(LogIn, 'success') }),
  signedOut: (m) => toast.info(m, { icon: icon(LogOut, 'info') }),
};