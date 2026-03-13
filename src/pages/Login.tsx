import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-warm-gray-lt flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-card-border p-8 w-full max-w-sm text-center">
        {/* Logo placeholder — will be replaced when logo file is provided */}
        <div className="mb-6">
          <img
            src="/logo.png"
            alt="Ella Riley Adler Foundation"
            className="w-[240px] mx-auto mb-4"
            onError={(e) => {
              // WHY: Fallback text if logo file isn't yet available
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 className="text-[24px] font-semibold text-purple-dark">Foundation OS</h1>
          <p className="text-[14px] text-warm-gray italic mt-2">
            Amplifying the joy, light, and love she brought into the world
          </p>
        </div>

        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-purple hover:bg-purple-dark text-white font-medium py-3 px-4 rounded-lg transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-[11px] text-warm-gray mt-6">
          Private family foundation administration
        </p>
      </div>
    </div>
  );
}
