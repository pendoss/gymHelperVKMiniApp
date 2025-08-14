import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';

// Хук для загрузки данных
export const useApiData = <T>(
  apiCall: (...args: any[]) => Promise<{ data: T }>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = apiService.handleApiError(err);
      setError(errorMessage);
      console.error('API call failed:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    refresh,
    setData,
    setError,
  };
};

// Хук для отправки данных
export const useApiMutation = <TRequest, TResponse>(
  apiCall: (data: TRequest) => Promise<{ data: TResponse }>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: TRequest): Promise<TResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(data);
      return response.data;
    } catch (err) {
      const errorMessage = apiService.handleApiError(err);
      setError(errorMessage);
      console.error('API mutation failed:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return {
    mutate,
    loading,
    error,
    setError,
  };
};

// Хук для пагинации
export const usePagination = <T>(
  apiCall: (params: any) => Promise<{ data: T[]; total: number; page: number; limit: number }>,
  initialParams: any = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async (
    params: any = {},
    resetData: boolean = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      const currentPage = resetData ? 1 : page;
      const response = await apiCall({
        ...initialParams,
        ...params,
        page: currentPage,
      });

      if (resetData) {
        setData(response.data);
        setPage(1);
      } else {
        setData(prev => [...prev, ...response.data]);
      }

      setTotal(response.total);
      setHasMore(response.data.length === (params.limit || 20));

      if (!resetData) {
        setPage(prev => prev + 1);
      }

      return response;
    } catch (err) {
      const errorMessage = apiService.handleApiError(err);
      setError(errorMessage);
      console.error('Pagination API call failed:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiCall, initialParams, page]);

  const loadMore = useCallback((params: any = {}) => {
    if (!loading && hasMore) {
      return loadData(params, false);
    }
  }, [loadData, loading, hasMore]);

  const refresh = useCallback((params: any = {}) => {
    setPage(1);
    return loadData(params, true);
  }, [loadData]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setTotal(0);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    page,
    total,
    loadData,
    loadMore,
    refresh,
    reset,
    setError,
  };
};

// Хук для работы с VK аутентификацией
export const useVKAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.initializeVKAuth();
      if (result) {
        setUser(result.user);
        return result;
      } else {
        throw new Error('VK authentication failed');
      }
    } catch (err) {
      const errorMessage = apiService.handleApiError(err);
      setError(errorMessage);
      console.error('VK login failed:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiService.setAccessToken('');
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user && !!apiService.getAccessToken(),
  };
};

// Хук для debounce поиска
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  return debouncedValue;
};

export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Record<keyof T, (value: any) => string | null>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (validationRules && validationRules[name]) {
      const error = validationRules[name](value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validationRules]);

  const setTouched = useCallback((name: keyof T) => {
    setTouchedState(prev => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(key => {
      const fieldKey = key as keyof T;
      const error = validationRules[fieldKey](values[fieldKey]);
      if (error) {
        newErrors[fieldKey] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
};
