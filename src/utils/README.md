# Pagination Utility

Utility chung để xử lý phân trang trong ứng dụng, giúp tái sử dụng code và đồng bộ hóa cách xử lý phân trang.

## Các interface chính

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResult;
}
```

## Các method chính

### 1. parsePaginationParams(query: any): PaginationParams
Parse query parameters từ request thành PaginationParams.

```typescript
const paginationParams = PaginationUtil.parsePaginationParams(req.query);
// Output: { page: 1, limit: 10 } hoặc { page: 2, limit: 20 }
```

### 2. buildSearchQuery(searchParams, searchableFields): any
Xây dựng query tìm kiếm từ các search parameters.

```typescript
const query = PaginationUtil.buildSearchQuery(
  { email: 'test', name: 'user' },
  ['email', 'name', 'phone']
);
// Output: { email: { $regex: 'test', $options: 'i' }, name: { $regex: 'user', $options: 'i' } }
```

### 3. paginate(model, query, paginationParams, options): Promise<PaginatedResponse>
Thực hiện phân trang trên MongoDB model.

```typescript
const result = await PaginationUtil.paginate(
  User,
  { role: ROLE.TENANT },
  { page: 1, limit: 10 },
  { 
    select: '-password',
    sort: { createdAt: -1 },
    populate: 'roomId'
  }
);
```

## Cách sử dụng trong Service

```typescript
import { PaginationUtil, PaginationParams } from '../utils/pagination.util';

export const getAllItems = async (
  searchParams?: { name?: string; code?: string },
  paginationParams?: PaginationParams,
) => {
  const query = PaginationUtil.buildSearchQuery(searchParams || {}, ['name', 'code']);
  
  const result = await PaginationUtil.paginate(
    Item,
    query,
    paginationParams,
    { sort: { createdAt: -1 } }
  );

  return {
    items: result.data,
    pagination: result.pagination,
  };
};
```

## Cách sử dụng trong Controller

```typescript
import { PaginationUtil } from '../utils/pagination.util';

export const getAllItemsController = async (req: Request, res: Response) => {
  try {
    const { name, code } = req.query;
    
    const searchParams = {
      ...(name && { name: name as string }),
      ...(code && { code: code as string }),
    };
    
    const paginationParams = PaginationUtil.parsePaginationParams(req.query);
    
    const result = await getAllItems(searchParams, paginationParams);
    
    return res.status(200).json({
      message: 'Items retrieved successfully',
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
```

## Query parameters trong API

- `page`: Số trang (mặc định: 1)
- `limit`: Số item mỗi trang (mặc định: 10, tối đa: 100)
- Các search parameters tùy theo model

### Ví dụ request:
```
GET /api/users?page=2&limit=20&name=john&email=test
```

## Response format

```json
{
  "message": "Users retrieved successfully",
  "data": [
    { "id": "1", "name": "User 1" },
    { "id": "2", "name": "User 2" }
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Lợi ích

1. **Tái sử dụng**: Cùng logic phân trang cho tất cả các model
2. **Đồng bộ**: Cùng response format cho tất cả APIs
3. **Type safety**: Full TypeScript support
4. **Flexible**: Hỗ trợ search, sort, populate
5. **Validation**: Tự động validate và sanitize pagination params
