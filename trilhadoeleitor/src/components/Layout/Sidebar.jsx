import { NavLink } from 'react-router-dom';
import {
  BookIcon,
  ChartIcon,
  ClipboardIcon,
  EditSquareIcon,
  GraduationCapIcon,
  GridIcon,
  HelpIcon,
  LogoMarkIcon,
  SettingsIcon
} from '../Trilhas/TrilhaIcons';

const sidebarItens = [
  { to: '/conteudista/trilhas', icon: GridIcon, ativo: true },
  { to: '#', icon: BookIcon },
  { to: '#', icon: GraduationCapIcon },
  { to: '#', icon: ClipboardIcon },
  { to: '#', icon: ChartIcon },
  { to: '#', icon: EditSquareIcon },
  { to: '#', icon: SettingsIcon },
  { to: '#', icon: HelpIcon }
];

export default function Sidebar() {
  return (
    <aside className="conteudista-sidebar">
      <div className="sidebar-logo-frame">
        <LogoMarkIcon className="sidebar-logo-mark" />
      </div>

      <nav className="sidebar-nav">
        {sidebarItens.map((item, index) => {
          const Icon = item.icon;

          if (item.ativo) {
            return (
              <NavLink
                key={index}
                to={item.to}
                className={({ isActive }) => `sidebar-icon-link ${isActive ? 'active' : ''}`}
                aria-label="Gerenciar Trilhas"
              >
                <Icon className="sidebar-icon" />
              </NavLink>
            );
          }

          return (
            <button type="button" key={index} className="sidebar-icon-link" aria-label="Atalho do menu">
              <Icon className="sidebar-icon" />
            </button>
          );
        })}
      </nav>

      <div className="sidebar-avatar">👩</div>
    </aside>
  );
}
