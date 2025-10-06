'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Download, Mic, Sparkles, Clock, Users } from 'lucide-react';

interface PodcastResult {
  success: boolean;
  message: string;
  podcast_id?: string;
  audio_url?: string;
  script?: string;
}

interface PodcastStatus {
  status: string;
  message: string;
  progress?: number;
}

export default function PodcastGenerator() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null);
  const [status, setStatus] = useState<PodcastStatus | null>(null);
  const [result, setResult] = useState<PodcastResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // API Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Suggested topics
  const suggestedTopics = [
    "Harry Potter and the Philosopher's Stone",
    "Space Exploration and Mars Colonization",
    "The Future of Artificial Intelligence",
    "Ancient Egyptian Mysteries",
    "Electric Vehicles Revolution",
    "The Science of Dreams"
  ];

  // Poll for status updates
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (currentPodcastId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE}/status/${currentPodcastId}`);
          if (response.ok) {
            const statusData: PodcastStatus = await response.json();
            setStatus(statusData);

            if (statusData.status === 'completed' || statusData.status === 'failed') {
              // Get final result
              const resultResponse = await fetch(`${API_BASE}/result/${currentPodcastId}`);
              if (resultResponse.ok) {
                const resultData: PodcastResult = await resultResponse.json();
                setResult(resultData);
              }
              setIsGenerating(false);
              if (interval) clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPodcastId, isGenerating, API_BASE]);

  const generatePodcast = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic for your podcast');
      return;
    }

    setIsGenerating(true);
    setStatus(null);
    setResult(null);
    setCurrentPodcastId(null);

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim()
        }),
      });

      if (response.ok) {
        const data: PodcastResult = await response.json();
        if (data.success && data.podcast_id) {
          setCurrentPodcastId(data.podcast_id);
        } else {
          throw new Error(data.message);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start podcast generation');
      }
    } catch (error) {
      console.error('Error generating podcast:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  };

  const togglePlayPause = () => {
    if (!result?.audio_url) return;

    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    } else {
      // Create new audio element
      const newAudio = new Audio(`${API_BASE}${result.audio_url}`);
      newAudio.onended = () => setIsPlaying(false);
      newAudio.onpause = () => setIsPlaying(false);
      newAudio.onplay = () => setIsPlaying(true);
      
      setAudio(newAudio);
      newAudio.play();
    }
  };

  const downloadPodcast = () => {
    if (!result?.audio_url) return;
    
    const link = document.createElement('a');
    link.href = `${API_BASE}${result.audio_url}`;
    link.download = `${topic.replace(/[^a-z0-9]/gi, '_')}_podcast.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setResult(null);
    setStatus(null);
    setCurrentPodcastId(null);
    setIsGenerating(false);
    setTopic('');
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    setIsPlaying(false);
  };

  const selectSuggestedTopic = (suggested: string) => {
    setTopic(suggested);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              AI Podcast Studio
            </h1>
            <div className="p-3 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-4">
            Generate engaging podcast conversations with Sarah & Marcus
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-300">
            <Users className="w-5 h-5" />
            <span className="text-sm">Natural voices • Dynamic content • Real conversations</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          {!result ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl">
              {/* Topic Input */}
              <div className="mb-6">
                <label className="block text-white text-lg font-semibold mb-3">
                  What should we talk about?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter any topic you're curious about..."
                  className="w-full px-6 py-4 bg-white/5 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-lg"
                  disabled={isGenerating}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isGenerating && topic.trim()) {
                      generatePodcast();
                    }
                  }}
                />
              </div>

              {/* Suggested Topics */}
              {!isGenerating && (
                <div className="mb-8">
                  <p className="text-white/70 text-sm mb-3">💡 Try these topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTopics.map((suggested, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestedTopic(suggested)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-xl text-white/80 hover:text-white text-sm transition-all duration-200"
                      >
                        {suggested}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="text-center">
                <button
                  onClick={generatePodcast}
                  disabled={isGenerating || !topic.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Your Podcast...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      Generate Podcast
                    </div>
                  )}
                </button>
              </div>

              {/* Status Display */}
              {status && (
                <div className="mt-8 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 animate-pulse" />
                      {status.message}
                    </h3>
                    <span className="text-blue-200 font-bold">{status.progress || 0}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${status.progress || 0}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-500/20 backdrop-blur-lg rounded-3xl border border-green-400/30 p-8 text-center">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-500/20 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Your Podcast is Ready!</h2>
                </div>
                <p className="text-green-200 text-lg">Sarah & Marcus just had an amazing conversation about your topic!</p>
              </div>

              {/* Audio Player */}
              {result.audio_url && (
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 flex flex-col md:flex-row items-center gap-6">
                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </button>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-semibold text-white mb-2">{topic}</h3>
                    <p className="text-white/70">Duration: ~5 minutes</p>
                  </div>
                  <button
                    onClick={downloadPodcast}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download MP3
                  </button>
                </div>
              )}

              {/* Podcast Script */}
              {result.script && (
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 max-h-96 overflow-y-auto">
                  <h3 className="text-xl font-semibold text-white mb-4">Podcast Script</h3>
                  <pre className="whitespace-pre-wrap text-white/80 text-sm">{result.script}</pre>
                </div>
              )}

              {/* New Podcast Button */}
              <div className="text-center">
                <button
                  onClick={resetForm}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Create Another Podcast
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}