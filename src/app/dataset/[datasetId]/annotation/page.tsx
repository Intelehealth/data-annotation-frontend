'use client';

import { useParams } from 'next/navigation';
import { DatasetAnnotationWorkbench } from '@/components/annotation-components/dataset-annotation-workbench';

export default function AnnotationPage() {
  const params = useParams();
  const datasetId = params.datasetId as string;

  // Only dataset-level annotation is supported
  return (
    <div className="h-screen">
      <DatasetAnnotationWorkbench datasetId={datasetId} />
    </div>
  );
}
