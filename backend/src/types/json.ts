export interface JsonRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JsonPaginationResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface JsonSearchOptions<T> {
  term: string;
  fields: readonly (keyof T)[];
}

export interface JsonSortByField<T> {
  field: keyof T;
  direction?: "asc" | "desc";
}

export interface JsonQueryOptions<T> {
  filter?: (item: T) => boolean;
  search?: JsonSearchOptions<T>;
  sort?: JsonSortByField<T> | ((a: T, b: T) => number);
}
