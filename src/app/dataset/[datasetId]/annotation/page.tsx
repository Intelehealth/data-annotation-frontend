'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { AnnotationWorkbench } from '@/components/annotation-components/annotation-workbench';
import { DatasetAnnotationWorkbench } from '@/components/annotation-components/dataset-annotation-workbench';

export default function AnnotationPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const csvImportId = searchParams.get('csvImportId');
  const datasetId = params.datasetId as string;

  // Debug logging
  console.log('AnnotationPage - csvImportId:', csvImportId);
  console.log('AnnotationPage - datasetId:', datasetId);
  console.log('AnnotationPage - params:', params);
  console.log('AnnotationPage - searchParams:', searchParams.toString());

  // Determine annotation mode
  const isDatasetLevel = !csvImportId; // If no csvImportId, it's dataset-level annotation

  if (isDatasetLevel) {
    // Dataset-level annotation
    return (
      <div className="h-screen">
        <DatasetAnnotationWorkbench datasetId={datasetId} />
      </div>
    );
  } else {
    // CSV-level annotation (legacy support)
    return (
      <div className="h-screen">
        <AnnotationWorkbench csvImportId={csvImportId} datasetId={datasetId} />
      </div>
    );
  }
}
