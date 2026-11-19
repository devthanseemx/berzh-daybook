import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, ChevronRight, LogOut } from 'lucide-react';

const initials = (s = '') =>
  s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

function Avatar({ src, name, size }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        className="avatar"
        style={{ width: size, height: size }}
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="avatar fallback" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials(name)}
    </span>
  );
}

export default function ProfileMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email;
  const photo = meta.avatar_url || meta.picture || '';
  const provider = user.app_metadata?.provider;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="profile" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen(!open)} aria-label={`Open profile menu for ${name}`} aria-expanded={open}>
        <Avatar src={photo} name={name} size={36} />
      </button>

      {open && (
        <div className="profile-pop" role="menu" aria-label="Profile menu">
          <div className="profile-identity">
            <Avatar src={photo} name={name} size={48} />
            <div className="profile-identity-copy">
              <strong>{name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="profile-account">
            <span className="profile-account-icon"><BadgeCheck size={16} /></span>
            <div><small>ACCOUNT TYPE</small><span>{provider === 'google' ? 'Google account' : 'Email account'}</span></div>
          </div>
          <button
            className="signout"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut size={16} /><span>Sign out</span><ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}