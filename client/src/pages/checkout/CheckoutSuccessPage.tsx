import { Link } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card text-center max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <img
            src="/asset/assets/images/icon-check-success-rounded.svg"
            alt="Success"
            className="w-16 h-16"
          />
        </div>
        <img
          src="/asset/assets/images/about/exciting.svg"
          alt=""
          className="w-16 h-16 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">Purchase Successful! 🎉</h1>
        <p className="text-gray-500 mb-8">Your payment has been processed. You can now access your purchase.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/library" className="btn-primary">Go to Library</Link>
          <Link to="/discover" className="btn-outline">Keep Browsing</Link>
        </div>
      </div>
    </div>
  );
}
