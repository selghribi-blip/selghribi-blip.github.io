import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import PdfUploader from '@/components/PdfUploader';

/**
 * Upload page — server component that guards the route.
 * Unauthenticated users are redirected to the sign-in page.
 */
export default async function UploadPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/api/auth/signin?callbackUrl=/upload');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-white">Upload a PDF</h1>
      <p className="mb-8 text-gray-400">
        Upload your document and we&apos;ll extract the text and generate an AI summary.
      </p>
      <PdfUploader />
    </div>
  );
}
