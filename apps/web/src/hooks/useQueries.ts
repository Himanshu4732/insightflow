import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// 1. Fetch organisation datasets list
export function useDatasets() {
  return useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const response = await axios.get('/api/datasets');
      return response.data;
    }
  });
}

// 2. Fetch dashboard KPI values
export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/kpis');
      return response.data;
    }
  });
}

// 3. Fetch monthly revenue charts data
export function useRevenueChart() {
  return useQuery({
    queryKey: ['dashboard', 'revenue-chart'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/revenue-chart');
      return response.data;
    }
  });
}

// 4. Fetch top sales products
export function useTopProducts() {
  return useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/top-products');
      return response.data;
    }
  });
}

// 5. Fetch single dataset metadata and schema
export function useDatasetDetails(id: string | null) {
  return useQuery({
    queryKey: ['dataset', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`/api/datasets/${id}`);
      return response.data;
    },
    enabled: !!id
  });
}

// 6. Fetch paginated, sorted, and filtered rows for a dataset
interface RowsParams {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

export function useDatasetRows(id: string | null, params: RowsParams = {}) {
  return useQuery({
    queryKey: ['dataset-rows', id, params],
    queryFn: async () => {
      if (!id) return { rows: [], totalCount: 0 };
      const response = await axios.get(`/api/datasets/${id}/rows`, {
        params: {
          limit: params.limit,
          offset: params.offset,
          sort: params.sort,
          order: params.order,
          filters: params.filters ? JSON.stringify(params.filters) : undefined
        }
      });
      return response.data;
    },
    enabled: !!id
  });
}

// 7. Calculate column statistics
export function useDatasetStats() {
  return useMutation({
    mutationFn: async (columnData: number[]) => {
      const response = await axios.post('/api/ml/stats', { column: columnData });
      return response.data;
    }
  });
}

// 8. Upload dataset mutation
export function useUploadDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post('/api/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries to reload datasets lists
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    }
  });
}

// 9. Soft-delete dataset mutation
export function useDeleteDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/datasets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    }
  });
}
