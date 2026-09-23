# REST API Plan for Evolync

## 1. Resources

Based on the database schema and PRD, the following main resources are identified. Note that due to the **Offline-First** architecture using WatermelonDB and Supabase, standard REST CRUD endpoints are largely replaced by the **Synchronization Protocol**. However, specific Edge Functions (RPC) or REST endpoints are needed for logic that cannot be handled purely by client-side database replication (e.g., complex business logic, sensitive data handling, or specific triggers).

| Resource | Database Table | Description |
|---|---|---|
| **Auth** | `auth.users` | User registration, login. |
| **Roles** | `organization_roles` | Dynamic roles management per organization. |
| **Sync** | *All Tables* | The primary mechanism for data exchange (WatermelonDB <-> Supabase). |
| **Organization** | `organizations`, `schools` | Management of schools and organization settings. |
| **Membership** | `school_members`, `school_invites` | Managing student access, invites, and shadow users. |
| **3D Assets** | `techniques`, `sequences`, `steps`, `training_plans` | Core 3D data (mostly synced, but potentially shared). |
| **Commerce** | `products`, `orders` | Shop functionality. |
| **Finance** | `payments` | Payment recording. |
| **Communication** | `announcements` | Instructor-Student communication. |

---

## 2. Endpoints

### 2.1. Synchronization (Core)

Since the app is Offline-First using WatermelonDB, the most critical "endpoint" is the synchronization route.

#### **POST /sync/pull**

* **Description:** Retrieves changes from the server since the last synchronization.
* **Query Params:** `last_pulled_at` (timestamp), `schema_version` (int), `migration` (json - optional).
* **Response:**

    ```json
    {
      "changes": {
        "organization_roles": { "created": [], "updated": [], "deleted": [] },
        "schools": { "created": [], "updated": [], "deleted": [] },
        "techniques": { "created": [], "updated": [], "deleted": [] },
        // ... other tables
      },
      "timestamp": 1678900000
    }
    ```

#### **POST /sync/push**

* **Description:** Pushes local changes to the server.
* **Request Body:**

    ```json
    {
      "changes": {
        "attendance": { "created": [{...}], "updated": [], "deleted": [] },
        "orders": { "created": [{...}], "updated": [], "deleted": [] }
      },
      "last_pulled_at": 1678900000
    }
    ```

* **Response:** `200 OK` (Empty body or confirmation).

---

### 2.2. Authentication & Onboarding

*Standard Supabase Auth endpoints (`/auth/v1/...`) are used for Sign Up, Sign In, and OAuth (including Google Login). Students register via these standard endpoints (US-001). The endpoints below are custom RPCs for specific Evolync logic.*

#### **POST /rpc/register_instructor**

* **Description:** Registers a new user, automatically initializes their Organization, creates default roles (e.g. Instructor, Student), and creates the first School. (US-000)
* **Request Body:**

    ```json
    {
      "email": "coach@example.com",
      "password": "securePassword123",
      "full_name": "John Doe",
      "organization_name": "Cobra Kai Dojo",
      "school_name": "Cobra Kai Dojo NY"
    }
    ```

* **Response:**

    ```json
    {
      "user_id": "uuid",
      "organization_id": "uuid",
      "school_id": "uuid"
    }
    ```

#### **POST /rpc/join_school_by_code**

* **Description:** Allows an authenticated user to join a school using a generated invite code. Assigns the role defined in the invite. (US-001a)
* **Request Body:**

    ```json
    {
      "code": "ABC-123"
    }
    ```

* **Response:**

    ```json
    {
      "success": true,
      "school_id": "uuid",
      "member_status": "pending"
    }
    ```

---

### 2.3. School Management (Instructor)

#### **GET /rpc/get_organization_roles**

* **Description:** Retrieves available roles for the organization (useful for generating invites).
* **Query Params:** `organization_id`
* **Response:** List of roles.

#### **POST /rpc/generate_invite_code**

* **Description:** Generates a unique, time-limited invite code for a specific school.
* **Request Body:**

    ```json
    {
      "school_id": "uuid",
      "role_id": "uuid",
      "validity_days": 7
    }
    ```

* **Response:**

    ```json
    {
      "code": "XYZ-789",
      "expires_at": "2023-12-31T23:59:59Z"
    }
    ```

#### **POST /rpc/manage_student_request**

* **Description:** Approves or rejects a pending student request. (US-002)
* **Request Body:**

    ```json
    {
      "member_id": "uuid",
      "action": "approve" // or "reject"
    }
    ```

* **Response:** `200 OK`

#### **POST /rpc/link_shadow_user**

* **Description:** Sends an invitation to a real email address to claim a "Shadow User" profile (history, payments). (US-003b)
* **Request Body:**

    ```json
    {
      "shadow_member_id": "uuid",
      "email": "student@example.com"
    }
    ```

* **Response:** `200 OK`

---

### 2.4. Finance & Orders

#### **POST /rpc/record_manual_payment**

* **Description:** Records a cash/external payment and updates the student's payment status for a period. (US-004)
* **Request Body:**

    ```json
    {
      "school_member_id": "uuid",
      "amount": 150.00,
      "period_start": "2023-10-01",
      "period_end": "2023-10-31",
      "method": "cash"
    }
    ```

* **Response:** `200 OK`

#### **POST /rpc/update_order_status**

* **Description:** Updates order status (e.g., to "ready_for_pickup") and triggers a notification. (US-005)
* **Request Body:**

    ```json
    {
      "order_id": "uuid",
      "status": "ready_for_pickup"
    }
    ```

* **Response:** `200 OK`

---

### 2.5. 3D Assets (Metadata & Sharing)

*Most 3D operations (Create/Update/Delete Techniques) happen via WatermelonDB Sync. These endpoints are for specific actions.*

#### **GET /rpc/get_shared_library**

* **Description:** (Future proofing) If instructors want to share techniques within an organization, this RPC fetches assets where `user_id` is not the current user but belongs to the same Org.
* **Query Params:** `organization_id`
* **Response:** List of Techniques/Sequences.

---

## 3. Authentication and Authorization

### 3.1. Mechanism

* **Provider:** Supabase Auth (GoTrue).
* **Methods:** Email/Password, Google OAuth.
* **Session:** JWT (JSON Web Tokens) persisted securely on the device (AsyncStorage/SecureStore) to support the "Offline-First" requirement (US-000a).
* **RLS (Row Level Security):** All database access via the Sync Protocol is governed by PostgreSQL RLS policies defined in the `db-plan.md`.

### 3.2. Roles & Permissions

* **Owner:** Full access to Organization, Schools, Finance, and all data.
* **Instructor:** Access to assigned Schools, Student lists, Attendance, and their own 3D assets.
* **Student:** Read-only access to School Catalog, Announcements. Read/Write access to their own Orders and private 3D notes.

---

## 4. Validation and Business Logic

### 4.1. Data Validation Rules

* **Currency:** Mixed currency support enabled per product/transaction. Validation ensures the currency code (ISO 4217) matches the product's definition. Amounts must be `>= 0`.
* **Stock:** Quantity must be `>= 0`.
* **Enums:** Fields like `status`, `role`, `priority` must match defined Postgres ENUM types.
* **Foreign Keys:** All IDs must exist in their respective parent tables (enforced by DB constraints).

### 4.2. Business Logic Implementation

* **Offline-First Strategy:**
  * **School Creation:** Owners create schools locally. The UUID is generated on the client. Sync pushes the new school to the server.
  * Logic is primarily implemented on the **Client (React Native)** using WatermelonDB models.
  * *Example:* Calculating "Total Due" for a student happens locally based on `payments` records.
* **Conflict Resolution:**
  * **Strategy:** Last Write Wins (LWW).
  * **Implementation:** During `sync/pull`, if a record was modified locally and remotely, the server version usually takes precedence, or custom conflict handlers in WatermelonDB apply the LWW logic based on `updated_at`.
* **Shadow Users:**
  * Logic handles the transition of a `school_member` record from having `user_id = NULL` (Shadow) to `user_id = UUID` (Linked) without losing history.
