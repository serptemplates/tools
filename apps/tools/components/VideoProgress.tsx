"use client";

import { Progress } from "@serp-tools/ui/components/progress";
import { Card } from "@serp-tools/ui/components/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface VideoProgressProps {
  fileName: string;
  progress: number;
  status: 'loading' | 'processing' | 'completed' | 'error';
  message?: string;
  completedLabel?: string;
}

export function VideoProgress({
  fileName,
  progress,
  status,
  message,
  completedLabel,
}: VideoProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return message || `Processing ${Math.round(progress)}%`;
      case 'processing':
        return message || `Processing ${Math.round(progress)}%`;
      case 'completed':
        return completedLabel || 'Conversion complete!';
      case 'error':
        return message || 'Conversion failed';
    }
  };

  return (
    <Card className="p-4 mb-3" data-testid="video-progress">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {getStatusText()}
          </span>
        </div>

        <Progress
          value={progress}
          className="h-2"
        // indicatorClassName={getProgressColor()}
        />

        {status === 'processing' && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processing file...</span>
            <span>{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}

interface MultiFileProgressProps {
  files: Array<{
    id: string;
    name: string;
    progress: number;
    status: 'loading' | 'processing' | 'completed' | 'error';
    message?: string;
  }>;
}

export function MultiFileProgress({ files }: MultiFileProgressProps) {
  if (files.length === 0) return null;

  const totalProgress = files.reduce((acc, file) => acc + file.progress, 0) / files.length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const processingCount = files.filter(f => f.status === 'processing' || f.status === 'loading').length;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Overall Progress</h3>
            <div className="flex gap-4 text-xs">
              {completedCount > 0 && (
                <span className="text-green-600">✓ {completedCount} completed</span>
              )}
              {processingCount > 0 && (
                <span className="text-blue-600">⟳ {processingCount} processing</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">✗ {errorCount} failed</span>
              )}
            </div>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(totalProgress)}% complete
          </div>
        </div>
      </Card>

      {/* Individual File Progress */}
      <div className="space-y-2">
        {files.map((file) => (
          <VideoProgress
            key={file.id}
            fileName={file.name}
            progress={file.progress}
            status={file.status}
            message={file.message}
          />
        ))}
      </div>
    </div>
  );
}
