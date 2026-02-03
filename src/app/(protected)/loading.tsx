// app/(protected)/loading.tsx
export default function LoadingProtected() {
    return (
        <div className="flex min-h-[70vh] w-full items-center justify-center px-6">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                <p className="text-sm text-gray-600">Loading...</p>
            </div>
        </div>
    );
}
