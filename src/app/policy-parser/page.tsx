import PolicyDataViewer from "@/components/policy-data-viewer";

export default function PolicyParserPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Policy Data Parser
        </h1>
        <PolicyDataViewer />
      </div>
    </div>
  );
}
