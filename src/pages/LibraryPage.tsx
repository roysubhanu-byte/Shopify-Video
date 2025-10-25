import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Play, Loader2, Download, Share2, Filter } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { useUserCredits } from '../hooks/useUserCredits';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  shop_url: string;
  title: string | null;
  vertical: string | null;
  status: string;
  created_at: string;
  variants: Array<{
    id: string;
    concept_tag: string;
    hook: string;
    status: string;
    video_url: string | null;
  }>;
}

export function LibraryPage() {
  useUserCredits();

  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verticalFilter, setVerticalFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        if (projectsData && projectsData.length > 0) {
          const projectIds = projectsData.map(p => p.id);
          const { data: variantsData, error: variantsError } = await supabase
            .from('variants')
            .select('*')
            .in('project_id', projectIds);

          if (variantsError) throw variantsError;

          const projectsWithVariants = projectsData.map(project => ({
            ...project,
            variants: variantsData?.filter(v => v.project_id === project.id) || [],
          }));

          setProjects(projectsWithVariants);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold text-white mb-8">Video Library</h1>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Video size={32} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-lg mb-4">No videos yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Create your first video to see it here
            </p>
            <Link
              to="/create"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Video
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredProjects = projects.filter(project => {
    if (statusFilter !== 'all' && project.status !== statusFilter) return false;
    if (verticalFilter !== 'all' && project.vertical !== verticalFilter) return false;
    return true;
  });

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleShare = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Video Library</h1>
          <Link
            to="/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Create New
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="done">Done</option>
            <option value="rendering">Rendering</option>
            <option value="draft">Draft</option>
            <option value="error">Error</option>
          </select>
          <select
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Verticals</option>
            <option value="beauty">Beauty</option>
            <option value="fashion">Fashion</option>
            <option value="electronics">Electronics</option>
            <option value="home">Home</option>
            <option value="health">Health</option>
          </select>
        </div>

        <div className="space-y-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">
                  {project.title || 'Untitled Project'}
                </h2>
                <p className="text-sm text-slate-400">{project.shop_url}</p>
                <div className="flex items-center gap-4 mt-2">
                  {project.vertical && (
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                      {project.vertical}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    project.status === 'done' ? 'bg-green-500/10 text-green-400' :
                    project.status === 'rendering' ? 'bg-blue-500/10 text-blue-400' :
                    project.status === 'error' ? 'bg-red-500/10 text-red-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>

              {project.variants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {project.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-white">
                          Concept {variant.concept_tag}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          variant.status === 'done' ? 'bg-green-500/10 text-green-400' :
                          variant.status === 'finalizing' || variant.status === 'previewing' ? 'bg-blue-500/10 text-blue-400' :
                          variant.status === 'error' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {variant.status}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                        {variant.hook}
                      </p>

                      {variant.video_url ? (
                        <div className="space-y-2">
                          <a
                            href={variant.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                          >
                            <Play size={16} />
                            Watch Video
                          </a>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(variant.video_url!, `${project.title}-${variant.concept_tag}.mp4`)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
                            >
                              <Download size={14} />
                              MP4
                            </button>
                            {variant.srt_url && (
                              <button
                                onClick={() => handleDownload(variant.srt_url!, `${project.title}-${variant.concept_tag}.srt`)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
                              >
                                <Download size={14} />
                                SRT
                              </button>
                            )}
                            <button
                              onClick={() => handleShare(variant.video_url!)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
                            >
                              <Share2 size={14} />
                              Share
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full py-2 bg-slate-700 text-slate-400 rounded-lg text-sm cursor-not-allowed">
                          No video yet
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No variants generated yet</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
