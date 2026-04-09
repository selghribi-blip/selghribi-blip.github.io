import "next-auth";

// Extend the built-in session types to include custom fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** "free" | "pro" */
      plan: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    /** "free" | "pro" */
    plan?: string;
  }
}
