export interface SearchFilter {
  title: string;
  ratingFrom: number | null;
  ratingTo: number | null;
  dateFrom: string;
  dateTo: string;
  tags: string[];
}
