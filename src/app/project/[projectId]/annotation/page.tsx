'use client';

import { AnnotationWorkbench } from '@/components/project-components/annotation-workbench';

export default function AnnotationPage() {
  // Mock project data - replace with actual data from your project
  const metadataFields = [
    {
      id: '1',
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: ['News', 'Sports', 'Technology', 'Entertainment'],
      defaultValue: '',
    },
    {
      id: '2',
      name: 'language',
      label: 'Language',
      type: 'select',
      required: true,
      options: ['English', 'Spanish', 'French', 'German'],
      defaultValue: '',
    },
    {
      id: '3',
      name: 'difficulty',
      label: 'Difficulty Level',
      type: 'select',
      required: false,
      options: ['Easy', 'Medium', 'Hard'],
      defaultValue: '',
    },
    {
      id: '4',
      name: 'notes',
      label: 'Notes',
      type: 'text',
      required: false,
      defaultValue: '',
    },
  ];

  const annotationLabels = [
    {
      id: '1',
      name: 'sentiment',
      label: 'Sentiment',
      type: 'select',
      options: ['Positive', 'Negative', 'Neutral'],
      required: true,
    },
    {
      id: '2',
      name: 'topic',
      label: 'Topic',
      type: 'select',
      options: ['Politics', 'Business', 'Health', 'Education'],
      required: true,
    },
  ];

  return (
    <div className="h-full">
      <AnnotationWorkbench
        projectId="mock-project-id"
        metadataFields={metadataFields}
        annotationLabels={annotationLabels}
      />
    </div>
  );
}
