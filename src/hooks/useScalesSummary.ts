export interface ScaleSummary {
  id: string;
  month: number;
  year: number;
  group_name: string;
  status: string;
  filled_slots: number;
  total_slots: number;
  coverage_percent: number;
}

export function useScalesSummary() {
  return {
    data: [] as ScaleSummary[],
    isLoading: false,
    refetch: () => {},
  };
}
