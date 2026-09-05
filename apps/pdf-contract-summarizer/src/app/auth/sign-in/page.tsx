import { signIn } from "@/lib/auth";

export const metadata = { title: "Sign In · PDF & Contract Summarizer" };

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Use your Google or GitHub account to get started.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 px-4 font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
            <span>🔑</span> Continue with Google
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
        >
          <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900 py-2.5 px-4 font-semibold text-white hover:bg-gray-800 transition shadow-sm">
            <span>🐙</span> Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
