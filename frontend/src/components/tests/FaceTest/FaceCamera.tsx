// frontend/src/components/tests/FaceTest/FaceCamera.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { faceService } from '@/services/faceService';
import toast from 'react-hot-toast';
import { FiCamera, FiCheckCircle, FiRefreshCw, FiAlertCircle, FiSquare } from 'react-icons/fi';

interface FaceResult {
  emotion: string;
  score: number;
  confidence: number;
  all_predictions?: Record<string, number>;
  facial_metrics: {
    smile_intensity: number;
    facial_symmetry: number;
    blink_rate: number;
    eye_movement: number;
    facial_muscle_activity: number;
    mouth_openness?: number;
    eyebrow_position?: number;
    head_tilt?: number;
    skin_tone?: number;
    wrinkle_intensity?: number;
  };
  assessment_id?: number;
}

interface FaceCameraProps {
  onComplete?: (result: FaceResult) => void;
  onError?: (error: string) => void;
}

const FaceCamera: React.FC<FaceCameraProps> = ({ onComplete, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FaceResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log('📷 Starting camera...');
      
      stopCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('📹 Setting video source...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded');
          setIsCameraReady(true);
          videoRef.current?.play().catch(err => {
            console.error('Play error:', err);
          });
        };
        
        await videoRef.current.play().catch(err => {
          console.error('Auto-play error:', err);
        });
        
        setIsCameraReady(true);
      }
      
      toast.success('📷 Camera started!');
      
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error);
      
      let errorMsg = 'Unable to access camera. ';
      if (error.name === 'NotAllowedError') {
        errorMsg += 'Please allow camera access in browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMsg += 'No camera found. Please connect a camera.';
      } else {
        errorMsg += 'Please check permissions and try again.';
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const stopCamera = () => {
    console.log('⏹️ Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎥 Track stopped');
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }

    console.log('📸 Capturing image...');
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast.error('Canvas context not available');
      return;
    }
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Failed to capture image');
        return;
      }
      
      console.log('📁 Image captured:', blob.size, 'bytes');
      await processImage(blob);
    }, 'image/jpeg', 0.95);
  };

  const processImage = async (imageBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('🔄 Sending to backend...');
      const response = await faceService.analyze(imageBlob);
      
      if (response.status === 'success') {
        const data = response.data;
        
        const resultData: FaceResult = {
          emotion: data.emotion || 'Unknown',
          score: data.score || 50,
          confidence: data.confidence || 50,
          all_predictions: data.all_predictions || {},
          facial_metrics: data.facial_metrics || {
            smile_intensity: 0,
            facial_symmetry: 0,
            blink_rate: 0,
            eye_movement: 0,
            facial_muscle_activity: 0,
            mouth_openness: 0,
            eyebrow_position: 0,
            head_tilt: 0,
            skin_tone: 0,
            wrinkle_intensity: 0
          },
          assessment_id: data.assessment_id
        };
        
        setResult(resultData);
        setIsComplete(true);
        
        stopCamera();
        
        toast.success('✅ Face analysis completed!');
        if (onComplete) onComplete(resultData);
      } else {
        throw new Error(response.message || 'Analysis failed');
      }
      
    } catch (error: any) {
      console.error('❌ Error processing face:', error);
      
      let errorMsg = error.response?.data?.detail || error.message || 'Failed to process face';
      
      if (errorMsg.includes('No face detected')) {
        errorMsg = 'No face detected. Please position your face clearly in front of camera.';
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
      
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAssessment = () => {
    setResult(null);
    setIsComplete(false);
    setError(null);
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  const getEmotionColor = (emotion: string) => {
    switch(emotion) {
      case 'happy': return 'text-emerald-600 dark:text-emerald-400';
      case 'neutral': return 'text-slate-600 dark:text-slate-400';
      case 'sad': return 'text-blue-600 dark:text-blue-400';
      case 'angry': return 'text-red-600 dark:text-red-400';
      case 'surprise': return 'text-yellow-600 dark:text-yellow-400';
      case 'fear': return 'text-purple-600 dark:text-purple-400';
      case 'disgust': return 'text-green-600 dark:text-green-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getEmotionBgColor = (emotion: string) => {
    switch(emotion) {
      case 'happy': return 'bg-emerald-500';
      case 'neutral': return 'bg-slate-500';
      case 'sad': return 'bg-blue-500';
      case 'angry': return 'bg-red-500';
      case 'surprise': return 'bg-yellow-500';
      case 'fear': return 'bg-purple-500';
      case 'disgust': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  // ===== RESULT VIEW =====
  if (isComplete && result) {
    const metrics = result.facial_metrics;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Main Score Card - Like TremorCamera */}
        <div className={`p-5 rounded-2xl border-2 ${
          result.score >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/30' :
          result.score >= 60 ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/30' :
          'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Detected Emotion
              </p>
              <p className={`text-4xl font-bold ${getEmotionColor(result.emotion)}`}>
                {result.emotion.charAt(0).toUpperCase() + result.emotion.slice(1)}
              </p>
              <p className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                {Math.round(result.score)}/100
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center">
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {Math.round(result.confidence)}%
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FIX: Emotion Distribution with visible bars ===== */}
        {result.all_predictions && Object.keys(result.all_predictions).length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              📊 Emotion Distribution
            </h4>
            <div className="space-y-2">
              {Object.entries(result.all_predictions).map(([emotion, prob]) => {
                const percentage = ((prob || 0) * 100);
                const isDominant = emotion === result.emotion;
                return (
                  <div key={emotion} className="flex items-center gap-3">
                    <span className={`text-xs w-16 font-medium capitalize ${getEmotionColor(emotion)} ${isDominant ? 'font-bold' : ''}`}>
                      {emotion}
                    </span>
                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getEmotionBgColor(emotion)} ${isDominant ? 'opacity-100' : 'opacity-60'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={`text-xs w-14 text-right font-medium ${isDominant ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== METRICS GRID - BLACK TEXT LIKE TREMORCAMERA ===== */}
        <div className="grid grid-cols-3 gap-2">
          <MetricCard 
            label="Smile" 
            value={(metrics.smile_intensity || 0) * 100} 
            unit="%" 
          />
          <MetricCard 
            label="Symmetry" 
            value={metrics.facial_symmetry || 0} 
            unit="%" 
          />
          <MetricCard 
            label="Blink Rate" 
            value={metrics.blink_rate || 0} 
            unit="/min" 
          />
          <MetricCard 
            label="Muscle" 
            value={metrics.facial_muscle_activity || 0} 
            unit="" 
          />
          <MetricCard 
            label="Mouth" 
            value={metrics.mouth_openness || 0} 
            unit="%" 
          />
          <MetricCard 
            label="Eyebrow" 
            value={metrics.eyebrow_position || 0} 
            unit="%" 
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetAssessment}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <FiRefreshCw className="w-4 h-4" />
            New Assessment
          </button>
        </div>
      </motion.div>
    );
  }

  // ===== CAMERA VIEW =====
  return (
    <div className="text-center space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30"
        >
          <div className="flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 text-left">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="relative max-w-md mx-auto bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
          style={{ display: isCameraReady ? 'block' : 'none' }}
        />
        
        {!isCameraReady && !error && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white mt-3 text-sm font-medium">Starting camera...</p>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white mt-3 text-sm font-medium">Analyzing facial expression...</p>
          </div>
        )}
        
        {isCameraReady && !isProcessing && !isComplete && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
            📸 Ready to capture
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {isCameraReady && !isComplete && (
          <>
            <button
              onClick={captureImage}
              disabled={isProcessing}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheckCircle className="w-5 h-5" />
              Capture & Analyze
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
            >
              Stop Camera
            </button>
          </>
        )}
        
        {!isCameraReady && !error && (
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <FiCamera className="w-5 h-5" />
            Start Camera
          </button>
        )}
      </div>

      {!isCameraReady && !error && !isComplete && (
        <div className="text-xs text-slate-400">
          <p>📸 Position your face clearly in the frame</p>
          <p>💡 Ensure good lighting</p>
          <p>😊 Smile naturally for better results</p>
        </div>
      )}
    </div>
  );
};

// ===== METRIC CARD - BLACK TEXT LIKE TREMORCAMERA =====
interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit }) => {
  return (
    <div className="p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-center">
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">
        {value.toFixed(1)}
        <span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>
      </p>
    </div>
  );
};

// ===== HELPER: Score Color (same as TremorCamera) =====
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export default FaceCamera;