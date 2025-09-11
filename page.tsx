'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Download, Mic, Sparkles, Clock } from 'lucide-react';

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
  const [topic, setTopic] = useState('Artificial Intelligence in Healthcare');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null);
  const [status, setStatus] = useState<PodcastStatus | null>(null);
  const [result, setResult] = useState<PodcastResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // API Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
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
              AI Podcast Generator
            </h1>
            <div className="p-3 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Transform any topic into an engaging podcast conversation using AI
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          {!result ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl">
              {/* Topic Input */}
              <div className="mb-8">
                <label className="block text-white text-lg font-semibold mb-3">
                  Podcast Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your podcast topic..."
                  className="w-full px-6 py-4 bg-white/5 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-lg"
                  disabled={isGenerating}
                />
              </div>

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
                      Generating Podcast...
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
                    <h3 className="text-lg font-semibold text-white">Generation Progress</h3>
                    <span className="text-blue-200">{status.progress || 0}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${status.progress || 0}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-blue-200">{status.message}</p>
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
                  <h2 className="text-3xl font-bold text-white">Podcast Generated Successfully!</h2>
                </div>
                <p className="text-green-200 text-lg">Your AI-powered podcast is ready to listen and download.</p>
              </div>

              {/* Podcast Player */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{topic}</h3>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={togglePlayPause}
                    className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                  
                  <button
                    onClick={downloadPodcast}
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 transform hover:scale-110 border border-white/30"
                  >
                    <Download className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Script Preview */}
              {result.script && (
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    Script Preview
                  </h3>
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
                    <p className="text-blue-100 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {result.script}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="text-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/30"
                >
                  Generate Another Podcast
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-blue-200/60">
          <p>Powered by Gemini AI & gTTS</p>
        </div>
      </div>
    </div>
  );
}