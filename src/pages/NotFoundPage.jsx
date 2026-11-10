import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="page-container container">
      <div className="state-panel">
        <BookOpen size={40} />
        <h1>الصفحة غير موجودة</h1>
        <p className="muted">يبدو أن الرابط الذي تحاول فتحه غير متاح.</p>
        <Link to="/" className="btn btn-primary btn-sm">
          <ArrowRight size={16} />
          <span>العودة إلى المكتبة الرئيسية</span>
        </Link>
      </div>
    </main>
  );
}
