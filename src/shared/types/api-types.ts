export type ApiListMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type ApiListResponse<T> = {
  data: T[];
  meta: ApiListMeta;
};
