import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../styles/trilhas.css';

export default function ConteudistaLayout() {
  return (
    <div className="conteudista-shell">
      <Sidebar />
      <div className="conteudista-main">
        <Topbar />
        <main className="conteudista-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
