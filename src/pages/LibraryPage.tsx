import { Video } from 'lucide-react';

export function LibraryPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Video Library</h1>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Video size={32} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-lg">No videos yet</p>
          <p className="text-slate-500 text-sm mt-2">
            Create your first video to see it here
          </p>
        </div>
      </div>
    </div>
  );
}
