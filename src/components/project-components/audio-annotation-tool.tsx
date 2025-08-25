"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioAnnotation {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  color: string;
  transcript?: string;
  speaker?: string;
  confidence?: number;
  attributes?: Record<string, any>;
}

interface AudioAnnotationToolProps {
  taskId: string;
  filePath: string;
  labelSchema: any[];
  annotations: AudioAnnotation[];
  onAnnotationsChange: (annotations: AudioAnnotation[]) => void;
}

export function AudioAnnotationTool({ 
  taskId, 
  filePath, 
  labelSchema, 
  annotations, 
  onAnnotationsChange 
}: AudioAnnotationToolProps) {
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeLabel, setActiveLabel] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Mock audio URL - replace with actual file loading
  useEffect(() => {
    // For demo purposes, using a placeholder audio URL
    const mockAudioUrl = "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav";
    setAudioUrl(mockAudioUrl);
    
    // Mock waveform data
    const mockWaveform = Array.from({ length: 1000 }, (_, i) => 
      Math.sin(i * 0.01) * 0.5 + Math.random() * 0.3
    );
    setWaveformData(mockWaveform);
  }, [filePath]);

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Playback controls
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(time);
  }, [duration]);

  const skip = useCallback((seconds: number) => {
    seekTo(currentTime + seconds);
  }, [currentTime, seekTo]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changeVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    const vol = Math.max(0, Math.min(1, newVolume));
    audioRef.current.volume = vol;
    setVolume(vol);
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  // Timeline interaction
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    
    if (isSelecting) {
      if (selectionStart === null) {
        setSelectionStart(time);
      } else {
        const start = Math.min(selectionStart, time);
        const end = Math.max(selectionStart, time);
        setSelectionEnd(end);
        setSelectionStart(start);
      }
    } else {
      seekTo(time);
    }
  }, [duration, seekTo, isSelecting, selectionStart]);

  // Add annotation
  const addAnnotation = useCallback(() => {
    if (selectionStart === null || selectionEnd === null || !activeLabel) return;
    
    const label = labelSchema.find(l => l.id === activeLabel);
    if (!label) return;

    const newAnnotation: AudioAnnotation = {
      id: Date.now().toString(),
      startTime: selectionStart,
      endTime: selectionEnd,
      label: label.name,
      color: label.color || '#3b82f6'
    };

    onAnnotationsChange([...annotations, newAnnotation]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  }, [selectionStart, selectionEnd, activeLabel, labelSchema, annotations, onAnnotationsChange]);

  // Remove annotation
  const removeAnnotation = useCallback((annotationId: string) => {
    onAnnotationsChange(annotations.filter(a => a.id !== annotationId));
  }, [annotations, onAnnotationsChange]);

  // Format time
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const samplesPerPixel = waveformData.length / width;
    
    for (let x = 0; x < width; x++) {
      const sampleIndex = Math.floor(x * samplesPerPixel);
      const sample = waveformData[sampleIndex] || 0;
      const y = (height / 2) + (sample * height / 2);
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();

    // Draw annotations
    if (showLabels) {
      annotations.forEach(annotation => {
        const startX = (annotation.startTime / duration) * width;
        const endX = (annotation.endTime / duration) * width;
        
        // Fill annotation region
        ctx.fillStyle = annotation.color + '30';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        // Draw annotation borders
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = annotation.color;
        ctx.font = '12px sans-serif';
        ctx.fillText(annotation.label, startX + 2, 15);
      });
    }

    // Draw current selection
    if (selectionStart !== null && selectionEnd !== null) {
      const startX = (selectionStart / duration) * width;
      const endX = (selectionEnd / duration) * width;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw playhead
    const playheadX = (currentTime / duration) * width;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [waveformData, duration, currentTime, annotations, showLabels, selectionStart, selectionEnd]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          break;
        case 'Escape':
          setSelectionStart(null);
          setSelectionEnd(null);
          setIsSelecting(false);
          break;
      }
      
      // Number keys for label selection
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && num <= labelSchema.length) {
        setActiveLabel(labelSchema[num - 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skip, labelSchema]);

  return (
    <div className="flex h-full">
      {/* Main audio area */}
      <div className="flex-1 p-4">
        <div className="h-full flex flex-col">
          {/* Audio player */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="hidden"
          />

          {/* Controls */}
          <div className="flex items-center justify-between mb-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(-10)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={togglePlayPause}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(10)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              
              <span className="text-sm text-gray-600">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Waveform */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Waveform</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isSelecting ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setIsSelecting(!isSelecting);
                      setSelectionStart(null);
                      setSelectionEnd(null);
                    }}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {isSelecting ? 'Cancel' : 'Select'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div 
                ref={timelineRef}
                className="flex-1 relative cursor-pointer"
                onClick={handleTimelineClick}
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full h-full border border-gray-200 rounded"
                />
              </div>
            </div>
          </div>

          {/* Selection controls */}
          {(selectionStart !== null || selectionEnd !== null) && (
            <Card className="mt-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Selection: {selectionStart !== null && formatTime(selectionStart)} - {selectionEnd !== null && formatTime(selectionEnd)}
                    </p>
                    {activeLabel && selectionStart !== null && selectionEnd !== null && (
                      <Button
                        size="sm"
                        onClick={addAnnotation}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {labelSchema.find(l => l.id === activeLabel)?.name} Annotation
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectionStart(null);
                      setSelectionEnd(null);
                      setIsSelecting(false);
                    }}
                    className="text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right panel - Labels and annotations */}
      <div className="w-80 border-l border-gray-200 bg-gray-50">
        <div className="p-4 space-y-4">
          {/* Active label indicator */}
          {activeLabel && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: labelSchema.find(l => l.id === activeLabel)?.color }}
                  />
                  <span className="text-sm font-medium text-blue-900">
                    Active: {labelSchema.find(l => l.id === activeLabel)?.name}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {isSelecting ? 'Click on timeline to select audio segments' : 'Click "Select" to start annotating'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Label schema */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
            {labelSchema.map((label, index) => (
              <div
                key={label.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                  activeLabel === label.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                )}
                onClick={() => setActiveLabel(label.id)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: label.color }}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {label.name}
                    </span>
                    {label.hotkey && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1 rounded">
                        {label.hotkey}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {annotations.filter(a => a.label === label.name).length}
                </span>
              </div>
            ))}
          </div>

          {/* Current annotations */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Annotations ({annotations.length})
            </h4>
            
            {annotations.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No annotations yet. Select audio segments to start annotating.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="p-2 bg-white border border-gray-200 rounded text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: annotation.color }}
                        />
                        <span className="font-medium text-gray-900">
                          {annotation.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnnotation(annotation.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(annotation.startTime)} - {formatTime(annotation.endTime)}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => seekTo(annotation.startTime)}
                        className="h-5 px-2 text-xs"
                      >
                        Go to
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Quick Tips
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Use spacebar to play/pause</li>
                <li>• Arrow keys to skip ±5 seconds</li>
                <li>• Number keys 1-9 to select labels</li>
                <li>• Click "Select" then click on timeline</li>
                <li>• Click twice to define start and end times</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
