'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { AnnotationWorkbench } from '@/components/project-components/annotation-workbench';

export default function AnnotationPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const csvImportId = searchParams.get('csvImportId');
  const projectId = params.projectId as string;

  // Debug logging
  console.log('AnnotationPage - csvImportId:', csvImportId);
  console.log('AnnotationPage - projectId:', projectId);
  console.log('AnnotationPage - params:', params);
  console.log('AnnotationPage - searchParams:', searchParams.toString());

  if (!csvImportId || !projectId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-gray-400">⚠️</span>
          </div>
          <h3 className="text-xl font-medium mb-2">
            Missing Required Parameters
          </h3>
          <p className="text-sm">
            CSV Import ID and Project ID are required to start annotation
          </p>
          {!csvImportId && (
            <p className="text-xs text-red-500 mt-2">
              Missing: csvImportId parameter
            </p>
          )}
          {!projectId && (
            <p className="text-xs text-red-500 mt-2">
              Missing: projectId from URL
            </p>
          )}
          <div className="mt-4 text-xs text-gray-400">
            <p>Debug Info:</p>
            <p>csvImportId: {csvImportId || 'null'}</p>
            <p>projectId: {projectId || 'null'}</p>
            <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <AnnotationWorkbench
        csvImportId={csvImportId}
        projectId={projectId}
      />
    </div>
  );
}
