'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { datasetsAPI } from '@/lib/api/datasets';
import { createDatasetSchema, CreateDatasetFormData } from '@/schemas/dataset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Database, FileText, Image, AudioLines } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const datasetTypes = [
  { value: 'text', label: 'Text Dataset', icon: FileText },
  { value: 'image', label: 'Image Dataset', icon: Image },
  { value: 'audio', label: 'Audio Dataset', icon: AudioLines },
  { value: 'multimodal', label: 'Multi-modal Dataset', icon: Database },
];

export default function AddDatasetPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDatasetFormData>({
    resolver: zodResolver(createDatasetSchema),
    defaultValues: {
      name: '',
      description: '',
      datasetType: undefined,
    },
  });

  const selectedDatasetType = watch('datasetType');

  const onSubmit = async (data: CreateDatasetFormData) => {
    setIsSubmitting(true);

    try {
      const newDataset = await datasetsAPI.create({
        name: data.name,
        description: data.description || '',
        datasetType: data.datasetType,
      });

      showToast({
        title: 'Dataset Created Successfully!',
        description: `Dataset "${data.name}" has been created.`,
        type: 'success',
      });

      // Redirect to dataset page after a short delay to show the toast
      setTimeout(() => {
        router.push('/dataset');
      }, 1500);
    } catch (error) {
      showToast({
        title: 'Failed to Create Dataset',
        description: 'Please try again or check your connection.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dataset')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create New Dataset
            </h1>
            <p className="text-gray-600 text-sm">
              Set up your dataset for annotation
            </p>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Dataset Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Dataset Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter dataset name"
                {...register('name')}
                className={cn(
                  'h-10',
                  errors.name &&
                    'border-red-500 focus:border-red-500 focus:ring-red-500',
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of your dataset"
                {...register('description')}
                className={cn(
                  'min-h-[80px] resize-none',
                  errors.description &&
                    'border-red-500 focus:border-red-500 focus:ring-red-500',
                )}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Dataset Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Dataset Type *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {datasetTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedDatasetType === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setValue('datasetType', type.value as any)}
                      className={cn(
                        'flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-all hover:shadow-sm',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium text-center leading-tight">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.datasetType && (
                <p className="text-sm text-red-600">
                  {errors.datasetType.message}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dataset')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Create Dataset
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
