import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <img
          src="/asset/assets/images/construction.gif"
          alt="404"
          className="w-20 h-20 mx-auto mb-6"
        />
        <h1 className="text-8xl font-bold text-pink mb-4">404</h1>
        <p className="text-xl font-bold mb-2">Page not found</p>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
