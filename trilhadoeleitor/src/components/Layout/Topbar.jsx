import { BellIcon } from '../Trilhas/TrilhaIcons';

export default function Topbar() {
  return (
    <header className="conteudista-topbar">
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <button type="button" className="topbar-bell" aria-label="Notificações">
          <BellIcon className="topbar-icon" />
        </button>

        <div className="topbar-avatar">IG</div>
      </div>
    </header>
  );
}
