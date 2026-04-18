export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResult;
}

export class PaginationUtil {
  static parsePaginationParams(query: any): PaginationParams {
    const page =
      typeof query.page === "string" ? parseInt(query.page, 10) : query.page;
    const limit =
      typeof query.limit === "string" ? parseInt(query.limit, 10) : query.limit;

    const result: PaginationParams = {};

    if (page) {
      result.page = Math.max(1, page);
    }

    if (limit) {
      result.limit = Math.min(100, Math.max(1, limit));
    }

    return result;
  }

  static createPaginationResult(
    page: number,
    limit: number,
    total: number,
  ): PaginationResult {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  static async paginate<T>(
    model: any,
    query: any = {},
    paginationParams: PaginationParams = {},
    options: {
      select?: string;
      sort?: any;
      populate?: any;
    } = {},
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10 } = paginationParams;

    const { select, sort = { createdAt: -1 }, populate } = options;

    const skip = (page - 1) * limit;

    // Get total count
    const total = await model.countDocuments(query);

    // Get data
    let queryBuilder = model.find(query);

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    if (populate) {
      queryBuilder = queryBuilder.populate(populate);
    }

    const data = await queryBuilder.sort(sort).skip(skip).limit(limit);

    const pagination = this.createPaginationResult(page, limit, total);

    return {
      data,
      pagination,
    };
  }

  static buildSearchQuery(
    searchParams: Record<string, any>,
    searchableFields: string[],
  ): any {
    const query: any = {};

    for (const field of searchableFields) {
      if (searchParams[field]) {
        query[field] = { $regex: searchParams[field], $options: "i" };
      }
    }

    return query;
  }
}
