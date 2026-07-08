import { SignUp } from '@clerk/clerk-react';

export default function RegisterPage() {
  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative bg-grid"
      style={{
        backgroundImage: `url('/asset/assets/images/auth/background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gumroad-white/85 backdrop-blur-sm" />

      <div className="relative z-10 animate-fade-in-up">
        {/* Gumroad wordmark above the auth card */}
        <div className="flex justify-center mb-6">
          <img
            src="/asset/assets/images/logo.svg"
            alt="Gumroad"
            className="h-6"
          />
        </div>
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'border-2 border-[#242423] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white',
            },
          }}
        />
      </div>
    </div>
  );
}
