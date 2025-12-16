# API SPEC — Hệ thống tuyển dụng (Phạm vi Employer)

Ngôn ngữ: Tiếng Việt
Định dạng: Markdown
Phong cách: Backend Production
Kiến trúc: REST, NestJS, JWT, PostgreSQL, RBAC, Ownership ở query-level

---

## 1. Thông tin chung

- Base URL: https://api.topjob.vn/v1
- Authentication: JWT Bearer Token
  - Header: `Authorization: Bearer <JWT>`
  - JWT chứa `sub` (userId), `role`, `status` và các claim cần thiết
- Content-Type: `application/json; charset=utf-8`
- Timezone: UTC+7, trường thời gian trả về dạng ISO8601
- Pagination: `page` (>=1), `limit` (1..100), `total`, `hasNext`
- Sorting: `sortBy` (field), `sortOrder` (asc|desc)
- Idempotency: áp dụng cho các endpoint chuyển trạng thái ứng tuyển; gửi lặp lại với cùng tác động vẫn trả kết quả cuối cùng.

### Quy ước HTTP Status Code

- 200 OK: Trả dữ liệu thành công
- 201 Created: Tạo mới thành công
- 202 Accepted: Yêu cầu đã nhận (xử lý async nếu có)
- 204 No Content: Thao tác thành công, không có body
- 400 Bad Request: Request không hợp lệ (không dùng cho validate field, dùng 422)
- 401 Unauthorized: Thiếu/Token sai/hết hạn
- 403 Forbidden: Đúng identity nhưng không đủ quyền (hạn chế dùng trong ownership; xem quy tắc an ninh)
- 404 Not Found: Không tìm thấy tài nguyên hoặc cố ý che giấu vì sai ownership
- 409 Conflict: Xung đột trạng thái nghiệp vụ
- 422 Unprocessable Entity: Dữ liệu không hợp lệ ở mức field/DTO

### Quy ước lỗi

- 401: Thiếu/Token sai/hết hạn
  - Body: `{ "error": "UNAUTHORIZED", "message": "Invalid or missing token" }`
- 403: Không đủ quyền (RBAC) — không dùng cho sai ownership
  - Body: `{ "error": "FORBIDDEN", "message": "Insufficient role" }`
- 404: Không tồn tại hoặc sai ownership (che giấu)
  - Body: `{ "error": "NOT_FOUND", "message": "Resource not found" }`
- 409: Xung đột trạng thái
  - Body: `{ "error": "CONFLICT", "message": "Status conflict" }`
- 422: Vi phạm validate
  - Body: `{ "error": "UNPROCESSABLE_ENTITY", "message": "Validation failed", "details": [ { "field": "name", "rule": "isString|min:2|max:255" } ] }`

---

## 2. Định nghĩa Role & Status

### UserRole

- EMPLOYER: Tài khoản nhà tuyển dụng
- CANDIDATE: Ứng viên (không thuộc phạm vi tài liệu này)
- ADMIN: Quản trị (không thuộc phạm vi tài liệu này)

### UserStatus

- ACTIVE: Tài khoản hoạt động bình thường
- INACTIVE: Bị vô hiệu hóa (không truy cập được)
- BANNED: Cấm vĩnh viễn

### EmployerProfileStatus

- DRAFT: Hồ sơ đang soạn thảo
- SUBMITTED: Đã gửi duyệt, chờ phê duyệt
- APPROVED: Đã được phê duyệt
- REJECTED: Bị từ chối (có lý do)

### JobStatus

- DRAFT: Bản nháp (chỉ employer tạo)
- PUBLISHED: Đang hiển thị (tuyển dụng)
- HIDDEN: Ẩn khỏi public (vẫn tồn tại)
- CLOSED: Đã đóng tuyển

### ApplicationStatus

- APPLIED: Ứng viên đã nộp
- SHORTLISTED: Đã vào danh sách xem xét
- REJECTED: Đã từ chối

---

## 3. Quy tắc an ninh bắt buộc

- Không bao giờ nhận `employerId` từ client. Hệ thống xác định employer theo `userId` trong JWT.
- Sai ownership phải trả 404, không trả 403.
- Employer chưa APPROVED không được tạo job hoặc publish job.
- Employer chỉ truy cập dữ liệu của chính mình.
- Các endpoint thay đổi trạng thái ứng tuyển phải idempotent.

---

## 4. API — EMPLOYER

### UC-EMP-01 — Hoàn thiện & gửi duyệt hồ sơ công ty

#### POST /employer/profile

- Mô tả: Tạo hoặc cập nhật hồ sơ công ty ở trạng thái DRAFT. Nếu đã tồn tại, cập nhật.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
  - Employer profile status: DRAFT hoặc REJECTED (cho phép chỉnh sửa), không cho SUBMITTED/APPROVED.
- Ownership rule: Chỉ thao tác hồ sơ thuộc employer đang đăng nhập. Không nhận `employerId`.
- Request:
  - Headers: `Authorization: Bearer <JWT>`
  - Body (JSON DTO, validate):
    ```json
    {
      "companyName": "string|min:2|max:255",
      "legalName": "string|optional|max:255",
      "taxCode": "string|optional|pattern:^\n?\w{8,13}$",
      "website": "string|optional|url|max:255",
      "address": "string|min:5|max:500",
      "industryCategoryId": "string|uuid",
      "description": "string|optional|max:2000",
      "contactEmail": "string|email|max:255",
      "contactPhone": "string|phone|max:30",
      "logo": "string|optional|url|max:500",
      "coverImage": "string|optional|url|max:500"
    }
    ```
- Response:
  - 200 OK
    ```json
    {
      "id": "uuid",
      "status": "DRAFT|REJECTED",
      "companyName": "...",
      "website": "...",
      "address": "...",
      "industryCategoryId": "uuid",
      "updatedAt": "ISO8601"
    }
    ```
- Error cases:
  - 401: Thiếu/Token sai
  - 404: Sai ownership (không trả về chi tiết)
  - 409: Hồ sơ đang SUBMITTED/APPROVED, không cho cập nhật
  - 422: DTO không hợp lệ

#### POST /employer/profile/submit

- Mô tả: Gửi hồ sơ công ty để duyệt. Chỉ cho phép khi đang DRAFT hoặc REJECTED.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
  - Employer profile status: DRAFT hoặc REJECTED
- Ownership rule: Chỉ gửi hồ sơ thuộc employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Body:
    ```json
    {
      "note": "string|optional|max:500"
    }
    ```
- Response:
  - 200 OK
    ```json
    {
      "id": "uuid",
      "status": "SUBMITTED",
      "submittedAt": "ISO8601"
    }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 404: Sai ownership hoặc chưa tạo hồ sơ
  - 409: Hồ sơ đã SUBMITTED/APPROVED

---

### UC-EMP-02 — Xem & chỉnh sửa hồ sơ công ty

#### GET /employer/profile/me

- Mô tả: Xem hồ sơ công ty của employer hiện tại.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Trả duy nhất hồ sơ thuộc employer hiện tại. Sai ownership -> 404.
- Request:
  - Headers: `Authorization`
- Response:
  - 200 OK
    ```json
    {
      "id": "uuid",
      "status": "DRAFT|SUBMITTED|APPROVED|REJECTED",
      "companyName": "...",
      "legalName": "...",
      "taxCode": "...",
      "website": "...",
      "address": "...",
      "industryCategoryId": "uuid",
      "description": "...",
      "contactEmail": "...",
      "contactPhone": "...",
      "logo": "...",
      "coverImage": "...",
      "updatedAt": "ISO8601"
    }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 404: Chưa có hồ sơ hoặc sai ownership

#### PUT /employer/profile

- Mô tả: Cập nhật các trường không nhạy cảm của hồ sơ. Không cho cập nhật khi SUBMITTED/APPROVED.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
  - Employer profile status: DRAFT hoặc REJECTED
- Ownership rule: Chỉ cập nhật hồ sơ của employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Body (JSON DTO):
    ```json
    {
      "companyName": "string|min:2|max:255",
      "website": "string|optional|url|max:255",
      "address": "string|min:5|max:500",
      "industryCategoryId": "string|uuid",
      "description": "string|optional|max:2000",
      "contactEmail": "string|email|max:255",
      "contactPhone": "string|phone|max:30",
      "logo": "string|optional|url|max:500",
      "coverImage": "string|optional|url|max:500"
    }
    ```
- Response:
  - 200 OK: Trả bản ghi sau cập nhật
- Error cases:
  - 401: Thiếu/Token
  - 404: Sai ownership hoặc không có hồ sơ
  - 409: SUBMITTED/APPROVED không cho cập nhật
  - 422: DTO không hợp lệ

#### PUT /employer/profile/sensitive

- Mô tả: Cập nhật trường nhạy cảm (legalName, taxCode). Khi cập nhật, trạng thái hồ sơ tự động trở về DRAFT nếu đang REJECTED; không cho khi SUBMITTED/APPROVED.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
  - Employer profile status: DRAFT hoặc REJECTED
- Ownership rule: Chỉ cập nhật hồ sơ của employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Body (JSON DTO):
    ```json
    {
      "legalName": "string|min:2|max:255",
      "taxCode": "string|pattern:^\n?\w{8,13}$"
    }
    ```
- Response:
  - 200 OK: Trả bản ghi sau cập nhật
- Error cases:
  - 401: Thiếu/Token
  - 404: Sai ownership hoặc không có hồ sơ
  - 409: SUBMITTED/APPROVED không cho cập nhật
  - 422: DTO không hợp lệ

---

### UC-EMP-03 — Đăng tin tuyển dụng

#### POST /employer/jobs

- Mô tả: Tạo job mới ở trạng thái DRAFT hoặc PUBLISHED (chỉ PUBLISHED khi employer APPROVED). Mặc định DRAFT.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
  - Employer profile status: APPROVED để PUBLISHED; DRAFT/REJECTED vẫn có thể tạo DRAFT.
- Ownership rule: Job thuộc employer hiện tại, không nhận `employerId` từ client.
- Request:
  - Headers: `Authorization`
  - Body (JSON DTO):
    ```json
    {
      "title": "string|min:5|max:255",
      "description": "string|min:20|max:5000",
      "requirements": "string|optional|max:5000",
      "location": "string|min:2|max:255",
      "salaryMin": "number|optional|min:0",
      "salaryMax": "number|optional|min:salaryMin",
      "currency": "string|optional|oneOf:[VND,USD]",
      "employmentType": "string|oneOf:[FULL_TIME,PART_TIME,CONTRACT,INTERN]",
      "categoryId": "string|uuid",
      "status": "string|optional|oneOf:[DRAFT,PUBLISHED]",
      "publishAt": "string|optional|ISO8601",
      "expireAt": "string|optional|ISO8601"
    }
    ```
- Response:
  - 201 Created
    ```json
    {
      "id": "uuid",
      "status": "DRAFT|PUBLISHED",
      "title": "...",
      "location": "...",
      "categoryId": "uuid",
      "createdAt": "ISO8601"
    }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 403: Cố publish khi employer chưa APPROVED
  - 422: DTO không hợp lệ

---

### UC-EMP-04 — Quản lý tin tuyển dụng

#### GET /employer/jobs

- Mô tả: Liệt kê danh sách job của employer hiện tại, có lọc và phân trang.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Chỉ trả job thuộc employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Query:
    - `page`: number >=1
    - `limit`: number 1..100
    - `status`: oneOf [DRAFT,PUBLISHED,HIDDEN,CLOSED]
    - `q`: string tìm kiếm theo `title`
    - `categoryId`: uuid
    - `sortBy`: oneOf [createdAt,updatedAt,title,status]
    - `sortOrder`: oneOf [asc,desc]
- Response:
  - 200 OK
    ```json
    {
      "items": [
        {
          "id": "uuid",
          "title": "...",
          "status": "DRAFT|PUBLISHED|HIDDEN|CLOSED",
          "updatedAt": "ISO8601"
        }
      ],
      "page": 1,
      "limit": 20,
      "total": 123,
      "hasNext": true
    }
    ```
- Error cases:
  - 401: Thiếu/Token

#### PUT /employer/jobs/{jobId}

- Mô tả: Cập nhật job. Không cho cập nhật nếu CLOSED. Cho phép chuyển trạng thái giữa DRAFT/PUBLISHED/HIDDEN (tuân theo APPROVED).
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Chỉ cập nhật job thuộc employer hiện tại. Sai ownership -> 404.
- Request:
  - Headers: `Authorization`
  - Params: `jobId: uuid`
  - Body (JSON DTO):
    ```json
    {
      "title": "string|min:5|max:255",
      "description": "string|min:20|max:5000",
      "requirements": "string|optional|max:5000",
      "location": "string|min:2|max:255",
      "salaryMin": "number|optional|min:0",
      "salaryMax": "number|optional|min:salaryMin",
      "currency": "string|optional|oneOf:[VND,USD]",
      "employmentType": "string|oneOf:[FULL_TIME,PART_TIME,CONTRACT,INTERN]",
      "categoryId": "string|uuid",
      "status": "string|oneOf:[DRAFT,PUBLISHED,HIDDEN]",
      "publishAt": "string|optional|ISO8601",
      "expireAt": "string|optional|ISO8601"
    }
    ```
- Response:
  - 200 OK: Trả bản ghi sau cập nhật
- Error cases:
  - 401: Thiếu/Token
  - 403: Đặt `status=PUBLISHED` khi employer chưa APPROVED
  - 404: Job không tồn tại hoặc sai ownership
  - 409: Job CLOSED không cho cập nhật
  - 422: DTO không hợp lệ

#### PATCH /employer/jobs/{jobId}/hide

- Mô tả: Ẩn job (set `status=HIDDEN`).
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Chỉ thao tác job của employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Params: `jobId: uuid`
- Response:
  - 200 OK
    ```json
    { "id": "uuid", "status": "HIDDEN" }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 404: Job không tồn tại hoặc sai ownership
  - 409: Job CLOSED không thể ẩn

---

### UC-EMP-05 — Quản lý ứng viên theo tin

#### GET /employer/jobs/{jobId}/applications

- Mô tả: Liệt kê ứng viên nộp cho một job.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Chỉ truy cập applications của job thuộc employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Params: `jobId: uuid`
  - Query:
    - `page`, `limit`
    - `status`: oneOf [APPLIED,SHORTLISTED,REJECTED]
    - `q`: string tìm theo candidate name/email
- Response:
  - 200 OK
    ```json
    {
      "items": [
        {
          "id": "uuid",
          "candidate": {
            "id": "uuid",
            "name": "...",
            "email": "..."
          },
          "status": "APPLIED|SHORTLISTED|REJECTED",
          "appliedAt": "ISO8601"
        }
      ],
      "page": 1,
      "limit": 20,
      "total": 50,
      "hasNext": false
    }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 404: Job không tồn tại hoặc sai ownership

---

### UC-EMP-06 — Xem & xử lý hồ sơ ứng tuyển

#### GET /employer/applications/{applicationId}

- Mô tả: Xem chi tiết một hồ sơ ứng tuyển.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Application phải thuộc job của employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Params: `applicationId: uuid`
- Response:
  - 200 OK
    ```json
    {
      "id": "uuid",
      "job": { "id": "uuid", "title": "..." },
      "candidate": {
        "id": "uuid",
        "name": "...",
        "email": "..."
      },
      "status": "APPLIED|SHORTLISTED|REJECTED",
      "cvUrl": "string|url",
      "coverLetter": "string|optional",
      "appliedAt": "ISO8601"
    }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 404: Application không tồn tại hoặc sai ownership

#### PATCH /employer/applications/{applicationId}/shortlist

- Mô tả: Đưa hồ sơ vào shortlist. Idempotent: gọi lại vẫn trả `SHORTLISTED`.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Application phải thuộc job của employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Params: `applicationId: uuid`
  - Body:
    ```json
    {
      "note": "string|optional|max:500"
    }
    ```
- Response:
  - 200 OK
    ```json
    { "id": "uuid", "status": "SHORTLISTED" }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 404: Application không tồn tại hoặc sai ownership
  - 409: Đã REJECTED không thể shortlist

#### PATCH /employer/applications/{applicationId}/reject

- Mô tả: Từ chối hồ sơ. Idempotent: gọi lại vẫn trả `REJECTED`.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Application phải thuộc job của employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Params: `applicationId: uuid`
  - Body:
    ```json
    {
      "reason": "string|min:2|max:500"
    }
    ```
- Response:
  - 200 OK
    ```json
    { "id": "uuid", "status": "REJECTED" }
    ```
- Error cases:
  - 401: Thiếu/Token
  - 404: Application không tồn tại hoặc sai ownership
  - 409: Đã SHORTLISTED không thể reject (tuỳ chính sách)

---

### UC-EMP-07 — Talent Pool (Ứng viên tổng hợp)

#### GET /employer/applications

- Mô tả: Liệt kê toàn bộ applications thuộc các job của employer hiện tại.
- Điều kiện truy cập:
  - Role: EMPLOYER
  - User status: ACTIVE
- Ownership rule: Chỉ trả applications thuộc employer hiện tại.
- Request:
  - Headers: `Authorization`
  - Query:
    - `page`, `limit`
    - `status`: oneOf [APPLIED,SHORTLISTED,REJECTED]
    - `jobId`: uuid|optional
    - `q`: string|optional (tìm tên/email ứng viên)
    - `sortBy`: oneOf [appliedAt,status]
    - `sortOrder`: oneOf [asc,desc]
- Response:
  - 200 OK
    ```json
    {
      "items": [
        {
          "id": "uuid",
          "job": { "id": "uuid", "title": "..." },
          "candidate": { "id": "uuid", "name": "..." },
          "status": "APPLIED|SHORTLISTED|REJECTED",
          "appliedAt": "ISO8601"
        }
      ],
      "page": 1,
      "limit": 20,
      "total": 230,
      "hasNext": true
    }
    ```
- Error cases:
  - 401: Thiếu/Token

---

## 5. Ghi chú triển khai (dùng làm Swagger base)

- Mỗi DTO cần annotate bằng class-validator tương ứng theo rule nêu trên.
- Guard thứ tự: JWT -> RolesGuard(EMPLOYER) -> EmployerStatus/Ownership (query-level).
- Ownership: Luôn filter theo `employerId` lấy từ `userId` (mapping 1-1) trong truy vấn DB, không nhận từ client.
- 404 cho sai ownership: Nếu `WHERE employer_id = currentEmployerId` không trả kết quả, trả 404.
- Trạng thái job và application cần kiểm tra chuyển trạng thái hợp lệ trước khi cập nhật.
