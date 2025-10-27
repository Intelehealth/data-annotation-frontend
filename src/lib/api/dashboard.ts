import { jsonApi } from '../api';

// Dashboard API endpoints
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const datasets = await jsonApi.get('/datasets');

      return {
        totalDatasets: datasets.data.length,
        totalAnnotations: 0,
        completionRate: 0,
      };
    } catch (_error) {
      return {
        totalDatasets: 0,
        totalAnnotations: 0,
        completionRate: 0,
      };
    }
  },

  // Get recent datasets
  getRecentDatasets: async (limit = 5) => {
    const response = await jsonApi.get('/datasets');
    return response.data
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  },

  // Get activity feed
  getActivityFeed: async (limit = 20) => {
    try {
      const datasets = await jsonApi.get('/datasets');

      const activities: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        timestamp: string;
        datasetId?: string;
        csvImportId?: string;
      }> = [];

      // Add dataset creation activities
      datasets.data.forEach((dataset: any) => {
        activities.push({
          id: `dataset-${dataset._id}`,
          type: 'dataset_created',
          title: 'Dataset Created',
          description: `Created dataset "${dataset.name}"`,
          timestamp: dataset.createdAt,
          datasetId: dataset._id,
        });
      });

      return activities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  },
};
