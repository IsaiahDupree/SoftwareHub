import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePagination(
  req: NextRequest,
  defaults = { page: 1, limit: 20 }
): PaginationParams {
  const url = req.nextUrl;
  const page = Math.max(
    1,
    parseInt(url.searchParams.get("page") || String(defaults.page))
  );
  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(url.searchParams.get("limit") || String(defaults.limit))
    )
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export function parseCursorPagination(
  req: NextRequest,
  defaultLimit = 20
): CursorPaginationParams {
  const url = req.nextUrl;
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(url.searchParams.get("limit") || String(defaultLimit))
    )
  );
  return { cursor, limit };
}
