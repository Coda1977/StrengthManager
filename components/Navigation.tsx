export default function Navigation({ simplified = false }: { simplified?: boolean }) {
  return (
    <nav className="app-nav">
      <div className="nav-container">
        <div className="logo">Strengths Manager</div>
      </div>
    </nav>
  );
}