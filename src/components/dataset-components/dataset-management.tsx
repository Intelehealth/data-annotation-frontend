'use client';

import { useRouter } from 'next/navigation';
import { DatasetList } from './dataset-list';

export function DatasetManagement() {
  const router = useRouter();

  const handleAddDataset = () => {
    router.push('/dataset/add-dataset');
  };

  return (
    <DatasetList
      onAddDataset={handleAddDataset}
    />
  );
}
