export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>© {new Date().getFullYear()} HustleHub — Freelance marketplace</span>
        <span>Built for INSY7314 POE · Part 2</span>
      </div>
    </footer>
  );
}