import { useState, useCallback } from 'react';
import { SupabaseScheduleBlock, useSupabaseSchedule } from './useSupabaseSchedule';

/**
 * Cache to prevent duplicate schedule requests
 */
const scheduleCache = new Map<string, SupabaseScheduleBlock[]>();
const pendingRequests = new Map<string, Promise<SupabaseScheduleBlock[]>>();

export function useScheduleCache() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getScheduleForDay } = useSupabaseSchedule();

  const getCachedScheduleForDay = useCallback(async (studentName: string, dayName: string): Promise<SupabaseScheduleBlock[]> => {
    const cacheKey = `${studentName}-${dayName}`;
    
    // Return cached result if available
    if (scheduleCache.has(cacheKey)) {
      return scheduleCache.get(cacheKey)!;
    }

    // Return pending request if already in progress
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    // Create new request
    setIsLoading(true);
    setError(null);

    const requestPromise = getScheduleForDay(studentName, dayName)
      .then(result => {
        scheduleCache.set(cacheKey, result);
        pendingRequests.delete(cacheKey);
        setIsLoading(false);
        return result;
      })
      .catch(err => {
        console.error(`Failed to fetch schedule for ${studentName} on ${dayName}:`, err);
        pendingRequests.delete(cacheKey);
        setError(`Failed to load schedule for ${dayName}`);
        setIsLoading(false);
        return []; // Return empty array on error
      });

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, [getScheduleForDay]);

  const clearCache = useCallback(() => {
    scheduleCache.clear();
    pendingRequests.clear();
  }, []);

  return {
    getCachedScheduleForDay,
    clearCache,
    isLoading,
    error
  };
}