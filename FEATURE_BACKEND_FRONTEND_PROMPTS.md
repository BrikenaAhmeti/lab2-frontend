# Frontend and Backend Feature Handoff Prompts

Frontend root: `/Users/brikenaahmeti/lab2-frontend`

Backend root found locally: `/Users/brikenaahmeti/lab1-backend`

## How Frontend Communicates With Backend

- Main frontend API clients: `src/lib/api/axios.ts`
- Older/legacy API client: `src/libs/axios/client.ts`
- Base URLs are read from `src/config/env.ts` through:
  - `AUTH_API_URL`
  - `CORE_API_URL`
  - `CMS_API_URL`
  - `AI_API_URL`
  - `NOTIFICATION_API_URL`
  - `AI_SOCKET_URL`
  - `CMS_SOCKET_URL`
  - `NOTIFICATION_SOCKET_URL`
- Backend route mounting is in `/Users/brikenaahmeti/lab1-backend/src/app.ts`
- Backend Prisma models are in `/Users/brikenaahmeti/lab1-backend/prisma/schema.prisma`

Current backend modules mounted in `src/app.ts`:

- `/api/auth`
- `/api/departments`
- `/api/patients`
- `/api/doctors`
- `/api/nurses`
- `/api/appointments`
- `/api/medical-records`
- `/api/prescriptions`
- `/api/rooms`
- `/api/admissions`
- `/api/invoices`
- `/api/dashboard`

Status key:

- `OK`: backend exists and is close to frontend expectation.
- `PARTIAL`: backend exists, but endpoint names or data contracts do not fully match frontend.
- `MISSING`: frontend expects this feature, but the current backend does not have the module/endpoints.

## 1. Auth, Profile, Users, Sessions

Status: `PARTIAL`

Frontend files:

- `src/lib/api/auth-api.ts`
- `src/lib/api/axios.ts`
- `src/features/auth/pages/LoginPage.tsx`
- `src/features/auth/pages/PatientRegistrationPage.tsx`
- `src/features/auth/pages/ForgotPasswordPage.tsx`
- `src/features/auth/pages/ResetPasswordPage.tsx`
- `src/features/auth/pages/VerifyEmailPage.tsx`
- `src/features/auth/pages/ResendVerificationPage.tsx`
- `src/features/profile/pages/ProfilePage.tsx`
- `src/features/sessions/pages/SessionsPage.tsx`
- `src/features/users/pages/UsersPage.tsx`

Frontend expects:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET /api/auth/sessions`
- `GET /api/auth/session-logs`
- `DELETE /api/auth/sessions/:sessionId`
- `GET/PATCH /api/users/me`
- `GET /api/users`
- `POST /api/auth/admin/users`

Backend files:

- `src/modules/auth/presentation/auth.routes.ts`
- `src/modules/auth/presentation/auth.controller.ts`
- `src/modules/auth/services/auth.service.ts`
- `src/modules/auth/dto/auth.dto.ts`
- `src/modules/auth/infrastructure/auth.prisma.repository.ts`
- `src/shared/middleware/authenticate.ts`
- `src/shared/middleware/authorize-roles.ts`

Backend currently has:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/confirm-email`
- `POST /api/auth/resend-confirmation-email`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `POST /api/auth/logout-all`
- `GET/PATCH /api/auth/me`
- `GET/POST/PATCH/DELETE /api/auth/users`
- role and refresh-token admin endpoints

Models:

- Prisma: `User`, `Role`, `UserRole`, `UserClaim`, `UserToken`, `RefreshToken`, `Patient`
- Backend domain/service models: `AuthUserResponse`, `AuthResponse`, `RegisterInput`, `LoginInput`, `CreateUserInput`, `UpdateProfileInput`
- Frontend models: `AuthUserDto`, `AuthResponse`, `PatientRegisterRequest`, `SessionDto`, `SessionLogDto`, `ProfileDto`, `UserRecord`

Prompt:

```text
Please align the auth backend with the frontend in /Users/brikenaahmeti/lab2-frontend. Check src/lib/api/auth-api.ts and implement or alias the missing endpoints in /Users/brikenaahmeti/lab1-backend/src/modules/auth.

Needed changes:
- Add aliases POST /api/auth/verify-email -> confirmEmail and POST /api/auth/resend-verification -> resendConfirmationEmail, or confirm the frontend should be changed.
- Add forgot/reset password endpoints: POST /api/auth/forgot-password and POST /api/auth/reset-password.
- Add user session endpoints expected by the frontend: GET /api/auth/sessions, GET /api/auth/session-logs, DELETE /api/auth/sessions/:sessionId.
- Add GET/PATCH /api/users/me and GET /api/users, or provide a decision to update frontend to /api/auth/me and /api/auth/users.
- Align admin create user endpoint: frontend uses POST /api/auth/admin/users, backend currently uses POST /api/auth/users.
- Keep models in Prisma schema: User, Role, UserRole, UserClaim, UserToken, RefreshToken, Patient.
```

## 2. Dashboard

Status: `PARTIAL`

Frontend files:

- `src/lib/api/dashboard-api.ts`
- `src/features/dashboard/useDashboard.ts`
- `src/features/dashboard/dashboardTypes.ts`
- `src/pages/portals/AdminDashboardPage.tsx`
- `src/pages/portals/DoctorDashboardPage.tsx`
- `src/pages/portals/NurseDashboardPage.tsx`
- `src/pages/portals/LabDashboardPage.tsx`
- `src/pages/portals/PharmacyDashboardPage.tsx`
- `src/pages/portals/ReceptionistDashboardPage.tsx`
- `src/pages/portals/PatientDashboardPage.tsx`

Frontend expects:

- `GET /api/dashboard/stats`
- `GET /api/dashboard/activity`

Backend files:

- `src/modules/dashboard/presentation/dashboard.routes.ts`
- `src/modules/dashboard/presentation/dashboard.controller.ts`
- `src/modules/dashboard/services/dashboard.service.ts`
- `src/modules/dashboard/infrastructure/dashboard.prisma.repository.ts`
- `src/modules/dashboard/domain/dashboard.entity.ts`

Backend currently has:

- `GET /api/dashboard/stats`
- `GET /api/dashboard/rooms/available`
- `GET /api/dashboard/appointments/today`
- `GET /api/dashboard/admissions/active`

Models:

- Prisma: `Appointment`, `Admission`, `Room`, `Patient`, `Doctor`, `Invoice`
- Backend domain: `DashboardStatsEntity`, `DashboardTodayAppointmentEntity`, `DashboardActiveAdmissionEntity`
- Frontend models: `DashboardStats`, dashboard activity item types in `src/features/dashboard/dashboardTypes.ts`

Prompt:

```text
Please complete dashboard backend compatibility for the frontend. Frontend files are src/lib/api/dashboard-api.ts and src/features/dashboard/*. Current backend module is /Users/brikenaahmeti/lab1-backend/src/modules/dashboard.

Needed changes:
- Keep GET /api/dashboard/stats.
- Add GET /api/dashboard/activity returning recent appointments, admissions, invoices, medical records, prescriptions, lab/inventory events if available.
- Confirm whether frontend should also consume existing backend endpoints /api/dashboard/appointments/today and /api/dashboard/admissions/active.
- Use existing models Appointment, Admission, Room, Patient, Doctor, Invoice.
```

## 3. Departments

Status: `PARTIAL`

Frontend files:

- `src/lib/api/departments-api.ts`
- `src/features/departments/pages/DepartmentsPage.tsx`
- `src/features/departments/components/*`
- `src/features/public/hooks/usePublicCatalog.ts`
- `src/pages/public/PublicDepartmentsPage.tsx`

Frontend expects:

- `GET /api/departments`
- `GET /api/public/departments`
- `GET /api/departments/:id`
- `POST /api/departments`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

Backend files:

- `src/modules/departments/presentation/department.routes.ts`
- `src/modules/departments/presentation/department.controller.ts`
- `src/modules/departments/services/department.service.ts`
- `src/modules/departments/dto/department.dto.ts`
- `src/modules/departments/domain/department.entity.ts`
- `src/modules/departments/infrastructure/department.prisma.repository.ts`

Backend currently has:

- `GET /api/departments`
- `GET /api/departments/all`
- `POST /api/departments`
- `GET /api/departments/:id`
- `GET /api/departments/:id/doctors`
- `GET /api/departments/:id/rooms`
- `GET /api/departments/:id/nurses`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

Models:

- Prisma: `Department`, `Doctor`, `Nurse`, `Room`, `Admission`
- Backend domain: `DepartmentEntity`, `DepartmentDoctorEntity`, `DepartmentNurseEntity`, `DepartmentRoomEntity`
- Frontend models: `DepartmentRecord`, `DepartmentPayload`, `DepartmentListResponse`

Prompt:

```text
Please align the departments backend with the frontend. Frontend file: src/lib/api/departments-api.ts. Backend module: /Users/brikenaahmeti/lab1-backend/src/modules/departments.

Needed changes:
- Add unauthenticated/public GET /api/public/departments with the same list shape used by the frontend.
- Ensure GET /api/departments returns { items, meta } or another shape accepted by departments-api.ts.
- Keep CRUD for Department.
- Include department relations and counts for Doctor, Nurse, Room when useful.
- Models: Department, Doctor, Nurse, Room, Admission.
```

## 4. Staff, Doctors, Nurses, Schedules, Position Types

Status: `MISSING/PARTIAL`

Frontend files:

- `src/lib/api/staff-api.ts`
- `src/lib/api/staff-position-types-api.ts`
- `src/features/staff/pages/StaffDirectoryPage.tsx`
- `src/features/staff/pages/StaffProfilePage.tsx`
- `src/features/staff/pages/StaffScheduleOverviewPage.tsx`
- `src/features/staff/components/*`
- `src/features/staff-position-types/*`
- `src/pages/admin/organization/StaffPositionTypesPage.tsx`

Frontend expects:

- `GET/POST /api/staff`
- `GET /api/public/staff`
- `GET/DELETE /api/staff/:id`
- `POST/DELETE /api/staff/:staffId/departments`
- `GET/PUT /api/staff/:staffId/schedules`
- `GET/POST /api/staff/:staffId/schedule-exceptions`
- `DELETE /api/staff/:staffId/schedule-exceptions/:exceptionId`
- `GET/POST /api/staff-position-types`
- `GET/PUT/DELETE /api/staff-position-types/:id`
- `GET /api/staff/:staffProfileId/available-slots`
- `GET /api/public/staff/:staffProfileId/available-slots`

Backend files:

- Doctors: `src/modules/doctors/*`
- Nurses: `src/modules/nurses/*`
- Auth users: `src/modules/auth/*`
- Prisma schedule model: `DoctorSchedule`
- No current backend `staff` or `staff-position-types` module.

Models:

- Existing Prisma: `User`, `Role`, `Doctor`, `Nurse`, `Department`, `DoctorSchedule`
- Suggested new Prisma models: `StaffProfile`, `StaffPositionType`, `StaffDepartment`, `StaffSchedule`, `StaffScheduleException`
- Frontend models: `StaffRecord`, `StaffPayload`, `StaffSchedule`, `ScheduleException`, `StaffPositionTypeRecord`

Prompt:

```text
Please implement a unified staff backend to match the frontend. Frontend files are src/lib/api/staff-api.ts, src/lib/api/staff-position-types-api.ts, and src/features/staff.

Needed changes:
- Add /api/staff and /api/public/staff endpoints for listing public/private staff profiles.
- Add /api/staff/:id, create, deactivate/delete, department assignment, schedules, schedule exceptions.
- Add /api/staff-position-types CRUD.
- Add /api/staff/:staffProfileId/available-slots and /api/public/staff/:staffProfileId/available-slots for appointment booking.
- Decide whether to map existing Doctor/Nurse records into StaffProfile or add new Prisma models: StaffProfile, StaffPositionType, StaffDepartment, StaffSchedule, StaffScheduleException.
- Existing models to reuse: User, Role, Doctor, Nurse, Department, DoctorSchedule.
```

## 5. Services / Service Catalog

Status: `MISSING`

Frontend files:

- `src/lib/api/services-api.ts`
- `src/features/services/pages/ServicesPage.tsx`
- `src/features/services/components/*`
- `src/features/public/hooks/usePublicCatalog.ts`
- `src/pages/public/PublicServicesPage.tsx`

Frontend expects:

- `GET/POST /api/services`
- `GET /api/public/services`
- `GET/PUT/DELETE /api/services/:id`

Backend files:

- No current backend service catalog module.

Models:

- Suggested Prisma: `ServiceCatalog`, related to `Department`
- Frontend models: `ServiceRecord`, `ServicePayload`, `ServiceListResponse`

Prompt:

```text
Please add a service catalog backend module for the frontend. Frontend file: src/lib/api/services-api.ts.

Needed changes:
- Add Prisma model ServiceCatalog with fields id, departmentId, name, description, defaultDurationMinutes, defaultPrice, isActive, createdAt, updatedAt.
- Add authenticated CRUD under /api/services.
- Add public list endpoint /api/public/services.
- Responses should match ServiceRecord and ServiceListResponse from src/lib/api/services-api.ts.
- Link services to Department and appointment booking.
```

## 6. Patients and Patient Timeline

Status: `PARTIAL`

Frontend files:

- `src/lib/api/patients-api.ts`
- `src/features/patients/pages/PatientsPage.tsx`
- `src/features/patients/pages/PatientProfilePage.tsx`
- `src/features/patients/pages/PatientSelfProfilePage.tsx`
- `src/features/patients/components/*`
- `src/features/patient-portal/*`

Frontend expects:

- `GET /api/patients/me`
- `GET/POST /api/patients`
- `GET/PUT/DELETE /api/patients/:id`
- `GET /api/patients/:id/timeline`

Backend files:

- `src/modules/patients/patients.router.ts`
- `src/modules/patients/patients.controller.ts`
- `src/modules/patients/services/patient.service.ts`
- `src/modules/patients/dto/patient.dto.ts`
- `src/modules/patients/domain/patient.entity.ts`
- `src/modules/patients/infrastructure/patient.prisma.repository.ts`

Backend currently has:

- `GET /api/patients`
- `GET /api/patients/:id`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`

Models:

- Prisma: `Patient`, `User`, `Appointment`, `MedicalRecord`, `Admission`, `Invoice`
- Backend domain: `PatientEntity`, `PatientListResponse`
- Frontend models: `PatientRecord`, `PatientPayload`, `PatientTimelineItem`

Prompt:

```text
Please align patient backend with the frontend. Frontend file: src/lib/api/patients-api.ts. Backend module: /Users/brikenaahmeti/lab1-backend/src/modules/patients.

Needed changes:
- Add GET /api/patients/me using the authenticated user's linked Patient.
- Add GET /api/patients/:id/timeline combining appointments, medical records, prescriptions, admissions, invoices, lab orders if available.
- Align field names expected by frontend, especially phone vs phoneNumber, personalNumber if required, email/user relation, and bloodType/gender.
- Keep CRUD and soft-delete behavior.
- Models: Patient, User, Appointment, MedicalRecord, Admission, Invoice, Prescription.
```

## 7. Appointments and Booking

Status: `PARTIAL`

Frontend files:

- `src/lib/api/appointments-api.ts`
- `src/features/appointments/pages/AppointmentsPage.tsx`
- `src/features/appointments/pages/BookAppointmentPage.tsx`
- `src/features/appointments/components/*`
- `src/pages/public/PublicBookAppointmentPage.tsx`

Frontend expects:

- `GET/POST /api/appointments`
- `GET /api/appointments/today`
- `GET/PUT /api/appointments/:id`
- `PATCH /api/appointments/:id/status`
- `POST /api/public/appointments`
- `GET /api/staff/:staffProfileId/available-slots`
- `GET /api/public/staff/:staffProfileId/available-slots`

Backend files:

- `src/modules/appointments/presentation/appointment.routes.ts`
- `src/modules/appointments/presentation/appointment.controller.ts`
- `src/modules/appointments/services/appointment.service.ts`
- `src/modules/appointments/dto/appointment.dto.ts`
- `src/modules/appointments/domain/appointment.entity.ts`
- `src/modules/appointments/infrastructure/appointment.prisma.repository.ts`

Backend currently has:

- `GET /api/appointments`
- `GET /api/appointments/today`
- `GET /api/appointments/:id`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `DELETE /api/appointments/:id`

Models:

- Existing Prisma: `Appointment`, `Patient`, `Doctor`, `DoctorSchedule`
- Suggested additional Prisma if keeping frontend contract: `ServiceCatalog`, `StaffProfile`, `StaffScheduleException`
- Backend domain: `AppointmentEntity`
- Frontend models: `AppointmentView`, `BookAppointmentPayload`, `PublicBookAppointmentPayload`, `AvailableSlot`

Prompt:

```text
Please align appointments and booking with the frontend. Frontend file: src/lib/api/appointments-api.ts. Backend module: /Users/brikenaahmeti/lab1-backend/src/modules/appointments.

Needed changes:
- Add PATCH /api/appointments/:id/status supporting actions confirm, check-in, start, complete, cancel, no-show.
- Add public booking POST /api/public/appointments.
- Add available slot endpoints under /api/staff/:staffProfileId/available-slots and /api/public/staff/:staffProfileId/available-slots.
- Align model contract: frontend uses serviceCatalogId, staffProfileId, scheduledAt, endAt, durationMinutes, appointmentType, basePrice. Backend currently uses doctorId, appointmentDate, appointmentTime.
- Use or add models: Appointment, Patient, Doctor/StaffProfile, ServiceCatalog, DoctorSchedule/StaffSchedule.
```

## 8. Medical Records and Doctor Consultation

Status: `PARTIAL`

Frontend files:

- `src/lib/api/medical-records-api.ts`
- `src/features/consultation/pages/ConsultationPage.tsx`
- `src/features/consultation/components/*`
- `src/features/medical-records/pages/NurseMedicalRecordsPage.tsx`
- `src/features/patient-portal/pages/PatientMedicalRecordsPage.tsx`

Frontend expects:

- `GET/POST /api/medical-records`
- `GET/PUT /api/medical-records/:id`
- `PATCH /api/medical-records/:id/finalize`
- `POST /api/medical-records/:id/amendments`
- `GET /api/medical-records/:id/pdf`

Backend files:

- `src/modules/medical-records/presentation/medical-record.routes.ts`
- `src/modules/medical-records/presentation/medical-record.controller.ts`
- `src/modules/medical-records/services/medical-record.service.ts`
- `src/modules/medical-records/dto/medical-record.dto.ts`
- `src/modules/medical-records/domain/medical-record.entity.ts`
- `src/modules/medical-records/infrastructure/medical-record.prisma.repository.ts`

Backend currently has:

- `GET /api/medical-records`
- `GET /api/medical-records/:id`
- `GET /api/medical-records/:id/prescriptions`
- `POST /api/medical-records`
- `PUT /api/medical-records/:id`
- `DELETE /api/medical-records/:id`

Models:

- Prisma: `MedicalRecord`, `Patient`, `Doctor`, `Prescription`
- Suggested Prisma: `MedicalRecordAmendment`, optional `MedicalRecordAttachment`
- Backend domain: `MedicalRecordEntity`, `MedicalRecordPrescriptionEntity`
- Frontend models: `MedicalRecordView`, `MedicalRecordFieldsPayload`, `MedicalRecordPrescriptionSummary`

Prompt:

```text
Please align medical records with the consultation and patient portal frontend. Frontend file: src/lib/api/medical-records-api.ts and src/features/consultation.

Needed changes:
- Keep existing CRUD.
- Add finalize endpoint PATCH /api/medical-records/:id/finalize.
- Add amendments endpoint POST /api/medical-records/:id/amendments.
- Add PDF export endpoint GET /api/medical-records/:id/pdf.
- Ensure patient portal can list only the authenticated patient's records.
- Models: MedicalRecord, Patient, Doctor/StaffProfile, Prescription. Add MedicalRecordAmendment if needed.
```

## 9. Prescriptions and Patient Prescriptions

Status: `PARTIAL`

Frontend files:

- `src/lib/api/prescriptions-api.ts`
- `src/features/consultation/components/PrescriptionForm.tsx`
- `src/features/consultation/components/PrescriptionList.tsx`
- `src/features/patient-portal/pages/PatientPrescriptionsPage.tsx`

Frontend expects:

- `GET/POST /api/prescriptions`
- `GET /api/prescriptions/:id`
- `PATCH /api/prescriptions/:id/void`
- `GET /api/prescriptions/:id/pdf`

Backend files:

- `src/modules/prescriptions/presentation/prescription.routes.ts`
- `src/modules/prescriptions/presentation/prescription.controller.ts`
- `src/modules/prescriptions/services/prescription.service.ts`
- `src/modules/prescriptions/dto/prescription.dto.ts`
- `src/modules/prescriptions/domain/prescription.entity.ts`
- `src/modules/prescriptions/infrastructure/prescription.prisma.repository.ts`

Backend currently has:

- `GET /api/prescriptions`
- `GET /api/prescriptions/:id`
- `POST /api/prescriptions`
- `PUT /api/prescriptions/:id`
- `DELETE /api/prescriptions/:id`

Models:

- Existing Prisma: `Prescription`, `MedicalRecord`
- Suggested Prisma: `PrescriptionItem`, `Medication`, `PrescriptionDispensing`
- Backend domain: `PrescriptionEntity`
- Frontend models: `PrescriptionView`, `PrescriptionItemView`, `CreatePrescriptionPayload`

Prompt:

```text
Please align prescriptions with the frontend. Frontend file: src/lib/api/prescriptions-api.ts. Backend module: /Users/brikenaahmeti/lab1-backend/src/modules/prescriptions.

Needed changes:
- Add lifecycle/status fields so prescriptions can be active, voided, fulfilled/dispensed by pharmacy.
- Add PATCH /api/prescriptions/:id/void.
- Add GET /api/prescriptions/:id/pdf.
- Support prescription items if frontend sends multiple medicines.
- Models: Prescription, MedicalRecord, Patient, Doctor/StaffProfile. Add PrescriptionItem and PrescriptionDispensing if needed.
```

## 10. Billing / Invoices

Status: `PARTIAL`

Frontend files:

- `src/lib/api/billing-api.ts`
- `src/features/billing/pages/BillingPage.tsx`
- `src/features/billing/pages/PatientBillingPage.tsx`
- `src/features/billing/components/*`

Frontend expects:

- `GET/POST /api/billings`
- `GET/PUT /api/billings/:id`
- `PATCH /api/billings/:id/mark-paid`
- `GET /api/billings/stats`
- `GET /api/billings/:id/pdf`

Backend files:

- `src/modules/invoices/presentation/invoice.routes.ts`
- `src/modules/invoices/presentation/invoice.controller.ts`
- `src/modules/invoices/services/invoice.service.ts`
- `src/modules/invoices/dto/invoice.dto.ts`
- `src/modules/invoices/domain/invoice.entity.ts`
- `src/modules/invoices/infrastructure/invoice.prisma.repository.ts`

Backend currently has:

- `GET /api/invoices`
- `GET /api/invoices/stats`
- `GET /api/invoices/:id`
- `POST /api/invoices`
- `PUT /api/invoices/:id/pay`
- `PUT /api/invoices/:id`
- `DELETE /api/invoices/:id`

Models:

- Prisma: `Invoice`, `InvoiceItem`, `Patient`, `Appointment`, `Admission`
- Suggested Prisma: `Payment`
- Backend domain: `InvoiceEntity`, `InvoiceStatsEntity`
- Frontend models: `BillingView`, `BillingItemView`, `PaymentView`, `BillingStats`

Prompt:

```text
Please align billing frontend with the existing invoice backend. Frontend file: src/lib/api/billing-api.ts. Backend module: /Users/brikenaahmeti/lab1-backend/src/modules/invoices.

Needed changes:
- Either add /api/billings aliases for invoice endpoints or ask frontend to switch to /api/invoices.
- Add PATCH /api/billings/:id/mark-paid or map it to PUT /api/invoices/:id/pay.
- Add GET /api/billings/:id/pdf.
- Ensure response shape matches BillingView with items and payments.
- Models: Invoice, InvoiceItem, Patient, Appointment, Admission. Add Payment if paid history is needed.
```

## 11. Lab Orders, Results, and AI Interpretation

Status: `MISSING`

Frontend files:

- `src/lib/api/lab-api.ts`
- `src/features/lab/pages/LabReviewPage.tsx`
- `src/features/lab/components/*`
- `src/features/patient-portal/pages/PatientLabResultsPage.tsx`
- `src/features/patient-portal/components/PatientLabInterpretationPanel.tsx`

Frontend expects:

- `GET /api/lab-tests`
- `GET/POST /api/lab-orders`
- `GET /api/lab-orders/pending`
- `GET /api/lab-orders/:id`
- `PATCH /api/lab-orders/:id/status`
- `PUT /api/lab-orders/:id/results`
- `PATCH /api/lab-orders/:id/review`
- `POST /api/lab-orders/:id/trigger-ai`

Backend files:

- No current lab module.

Models:

- Suggested Prisma: `LabTest`, `LabOrder`, `LabOrderItem`, `LabResult`, `LabReview`, `AiLabInterpretation`
- Related existing models: `Patient`, `Doctor`, `MedicalRecord`, `Appointment`
- Frontend models: `LabTestView`, `LabOrderView`, `LabOrderItemView`, `CreateLabOrderPayload`, `EnterLabResultsPayload`

Prompt:

```text
Please implement lab backend endpoints for the frontend. Frontend file: src/lib/api/lab-api.ts and pages under src/features/lab.

Needed changes:
- Add LabTest CRUD/listing.
- Add LabOrder creation, queue listing, pending listing, details, status update, result entry, review, and trigger AI endpoint.
- Add patient portal filtering so patients see their own results.
- Add Prisma models LabTest, LabOrder, LabOrderItem, LabResult, LabReview, AiLabInterpretation.
- Connect LabOrder to Patient, ordering Doctor/StaffProfile, Appointment and MedicalRecord where relevant.
```

## 12. Pharmacy Queue and Dispensing

Status: `MISSING`

Frontend files:

- `src/lib/api/pharmacy-api.ts`
- `src/features/pharmacy/pages/*`
- `src/features/pharmacy/components/*`
- `src/pages/portals/PharmacyDashboardPage.tsx`

Frontend expects:

- `GET /api/pharmacy/queue`
- `GET /api/pharmacy/queue/:id`
- `PATCH /api/pharmacy/queue/:id/start`
- `PATCH /api/pharmacy/queue/:id/dispense`
- `PATCH /api/pharmacy/queue/:id/fulfill`

Backend files:

- No current pharmacy module.
- Existing prescription module can be reused.

Models:

- Existing Prisma: `Prescription`, `MedicalRecord`, `Patient`
- Suggested Prisma: `PharmacyQueue`, `PrescriptionDispensing`, `PrescriptionDispensingItem`, `InventoryItem`
- Frontend models: `PharmacyQueueView`, `PharmacyDispensingItemView`, `DispensePharmacyQueuePayload`

Prompt:

```text
Please implement pharmacy queue backend for the frontend. Frontend file: src/lib/api/pharmacy-api.ts.

Needed changes:
- Build queue from active prescriptions or add explicit PharmacyQueue model.
- Add endpoints /api/pharmacy/queue, /api/pharmacy/queue/:id, /start, /dispense, /fulfill.
- Connect dispensing to inventory item stock when inventory exists.
- Models: Prescription, Patient, MedicalRecord. Add PharmacyQueue, PrescriptionDispensing, PrescriptionDispensingItem, InventoryItem if needed.
```

## 13. Inventory

Status: `MISSING`

Frontend files:

- `src/lib/api/inventory-api.ts`
- `src/features/inventory/pages/InventoryPage.tsx`
- `src/features/inventory/components/*`
- `src/features/inventory/inventory.schemas.ts`

Frontend expects:

- `GET/POST /api/inventory/categories`
- `GET/PUT/DELETE /api/inventory/categories/:id`
- `GET/POST /api/inventory/items`
- `GET/PUT/DELETE /api/inventory/items/:id`
- `GET/POST /api/inventory/items/:id/transactions`
- `GET /api/inventory/alerts`

Backend files:

- No current inventory module.

Models:

- Suggested Prisma: `InventoryCategory`, `InventoryItem`, `InventoryTransaction`, `InventoryAlert`
- Related suggested models: `PrescriptionDispensingItem`
- Frontend models: `InventoryCategory`, `InventoryItem`, `InventoryTransaction`, `InventoryAlertItem`

Prompt:

```text
Please implement inventory backend for the frontend. Frontend file: src/lib/api/inventory-api.ts.

Needed changes:
- Add inventory category CRUD.
- Add inventory item CRUD.
- Add stock transaction history and transaction creation.
- Add low stock/expiry alerts endpoint.
- Add Prisma models InventoryCategory, InventoryItem, InventoryTransaction and optional InventoryAlert.
- Make pharmacy dispensing able to reduce stock when pharmacy backend is implemented.
```

## 14. Feedback

Status: `MISSING`

Frontend files:

- `src/lib/api/feedback-api.ts`
- `src/features/feedback/pages/PatientFeedbackPage.tsx`
- `src/features/feedback/pages/FeedbackInboxPage.tsx`
- `src/features/feedback/components/*`

Frontend expects:

- `POST /api/feedback`
- `GET /api/feedback/my`
- `GET /api/feedback`
- `PATCH /api/feedback/:id/status`

Backend files:

- No current feedback module.

Models:

- Suggested Prisma: `Feedback`
- Related existing models: `Patient`, `Appointment`, `Doctor`
- Frontend models: `FeedbackView`, `FeedbackPatientSummary`, `FeedbackAppointmentSummary`

Prompt:

```text
Please implement feedback backend for the frontend. Frontend file: src/lib/api/feedback-api.ts.

Needed changes:
- Add POST /api/feedback for patient feedback.
- Add GET /api/feedback/my for authenticated patient feedback history.
- Add admin/doctor inbox GET /api/feedback with filters.
- Add PATCH /api/feedback/:id/status.
- Add Prisma model Feedback linked to Patient and optionally Appointment/StaffProfile.
```

## 15. Contact Inbox

Status: `MISSING`

Frontend files:

- `src/lib/api/contact-api.ts`
- `src/features/contact/components/PublicContactForm.tsx`
- `src/features/contact/pages/ContactInboxPage.tsx`
- `src/pages/public/PublicContactPage.tsx`

Frontend expects:

- `POST /api/contact`
- `GET /api/contact`
- `PATCH /api/contact/:id/status`

Backend files:

- No current contact module.

Models:

- Suggested Prisma: `ContactMessage`
- Frontend models: `ContactMessageView`, `SubmitContactPayload`, `UpdateContactStatusPayload`

Prompt:

```text
Please implement contact message backend for the frontend. Frontend file: src/lib/api/contact-api.ts.

Needed changes:
- Add public POST /api/contact.
- Add protected/admin GET /api/contact with filters and pagination.
- Add PATCH /api/contact/:id/status.
- Add Prisma model ContactMessage with name, email, phone, subject, message, status, createdAt, updatedAt.
```

## 16. CMS and Public Website Content

Status: `MISSING`

Frontend files:

- `src/lib/api/cms-api.ts`
- `src/features/cms/pages/CmsPagesPage.tsx`
- `src/features/cms/pages/CmsPageEditorPage.tsx`
- `src/features/cms/pages/CmsBannersPage.tsx`
- `src/features/cms/components/*`
- `src/features/public/components/*`
- `src/pages/public/PublicCmsPage.tsx`

Frontend expects:

- `GET/POST /api/cms/pages`
- `GET/PUT/DELETE /api/cms/pages/:id`
- `GET/POST /api/cms/pages/:pageId/sections`
- `PUT/DELETE /api/cms/pages/:pageId/sections/:id`
- `PATCH /api/cms/pages/:pageId/sections/:id/visibility`
- `PUT /api/cms/pages/:pageId/sections/reorder`
- `GET/POST /api/cms/banners`
- `GET/PUT/DELETE /api/cms/banners/:id`
- `GET /api/public/cms/pages/:slug`
- `GET /api/public/cms/banners`
- Socket event: `cms:content-updated`

Backend files:

- No current CMS module.

Models:

- Suggested Prisma: `CmsPage`, `CmsSection`, `CmsBanner`
- Frontend models: `CmsPage`, `CmsSection`, `CmsBanner`

Prompt:

```text
Please implement CMS backend for the public website and admin CMS frontend. Frontend file: src/lib/api/cms-api.ts and src/features/cms.

Needed changes:
- Add protected CMS page, section and banner CRUD.
- Add public CMS endpoints /api/public/cms/pages/:slug and /api/public/cms/banners.
- Add section visibility and reorder endpoints.
- Emit Socket.IO event cms:content-updated when page or banner content changes.
- Add Prisma models CmsPage, CmsSection, CmsBanner.
```

## 17. Reports

Status: `MISSING`

Frontend files:

- `src/lib/api/reports-api.ts`
- `src/features/reports/pages/ReportBuilderPage.tsx`
- `src/features/reports/components/*`
- `src/features/reports/reportConfig.ts`

Frontend expects:

- `GET /api/reports/:type`
- `GET/POST /api/reports/templates`

Backend files:

- No current reports module.

Models:

- Suggested Prisma: `ReportTemplate`
- Aggregate existing models: `Patient`, `Appointment`, `Invoice`, `MedicalRecord`, `Prescription`, `Department`, `Doctor`, `Nurse`
- Frontend models: `ReportResult`, `ReportTemplate`, `ReportFilters`

Prompt:

```text
Please implement reports backend for the frontend report builder. Frontend file: src/lib/api/reports-api.ts.

Needed changes:
- Add GET /api/reports/:type with filtering, sorting and optional export.
- Add GET/POST /api/reports/templates.
- Add Prisma model ReportTemplate if templates are saved in database.
- Report data should aggregate existing hospital models such as Patient, Appointment, Invoice, MedicalRecord, Prescription, Department, Doctor and Nurse.
```

## 18. Advanced Search

Status: `MISSING`

Frontend files:

- `src/lib/api/search-api.ts`
- `src/features/search/pages/AdvancedSearchPage.tsx`
- `src/features/search/searchConfig.tsx`
- `src/features/search/components/SearchResultsTable.tsx`

Frontend expects:

- `GET /api/search/:resource`

Backend files:

- No current search module.

Models:

- Aggregate existing and suggested models: `Patient`, `Appointment`, `LabOrder`, `InventoryItem`, `StaffProfile`, `AuditLog`
- Frontend models: `PatientSearchItem`, `AppointmentSearchItem`, `LabOrderSearchItem`, `InventoryItemSearchItem`, `StaffSearchItem`, `AuditLogSearchItem`

Prompt:

```text
Please implement advanced search backend. Frontend file: src/lib/api/search-api.ts.

Needed changes:
- Add GET /api/search/:resource.
- Supported resources should match frontend searchConfig: patients, appointments, lab orders, inventory items, staff, audit logs if available.
- Return paginated items with meta.
- Use existing models Patient and Appointment now; add StaffProfile, LabOrder, InventoryItem and AuditLog support when those modules exist.
```

## 19. Settings

Status: `MISSING`

Frontend files:

- `src/lib/api/settings-api.ts`
- `src/features/settings/hooks/useSettings.ts`
- `src/pages/admin/organization/SettingsPage.tsx`
- `src/features/public/hooks/usePublicSiteSettings.ts`

Frontend expects:

- `GET /api/settings`
- `GET /api/public/settings`
- `PUT /api/settings/:key`
- `PUT /api/settings/bulk`

Backend files:

- No current settings module.

Models:

- Suggested Prisma: `Setting`
- Frontend models: `SettingRecord`, `SettingsGroup`, `SettingsResponse`

Prompt:

```text
Please implement settings backend for admin settings and public site settings. Frontend file: src/lib/api/settings-api.ts.

Needed changes:
- Add GET /api/settings for authenticated admin.
- Add GET /api/public/settings for public website display values.
- Add PUT /api/settings/:key and PUT /api/settings/bulk.
- Add Prisma model Setting with key, group, valueJson, isPublic, createdAt, updatedAt.
```

## 20. Data Exchange: Export and Import

Status: `MISSING`

Frontend files:

- `src/lib/api/data-exchange-api.ts`
- `src/features/data-exchange/hooks/useDataExchange.ts`

Frontend expects:

- `GET /api/export/:entity`
- `GET /api/import/template/:entity`
- `POST /api/import/:entity`
- `GET /api/import/jobs/:jobId`

Backend files:

- No current data exchange module.

Models:

- Suggested Prisma: `ImportJob`, optional `ImportRowError`
- Export/import existing models: `Patient`, `Appointment`, `Department`, `StaffProfile`, `InventoryItem`, `Invoice`
- Frontend models: `ImportJob`, `ImportResult`, `FileDownload`

Prompt:

```text
Please implement data exchange endpoints for import/export. Frontend file: src/lib/api/data-exchange-api.ts.

Needed changes:
- Add export endpoint GET /api/export/:entity for CSV/XLSX/PDF when requested.
- Add template download GET /api/import/template/:entity.
- Add import upload POST /api/import/:entity with validation and dry-run/apply modes if possible.
- Add GET /api/import/jobs/:jobId.
- Add Prisma model ImportJob if async import tracking is needed.
```

## 21. Notifications

Status: `MISSING`

Frontend files:

- `src/features/notifications/notificationsApi.ts`
- `src/features/notifications/NotificationSocketBridge.tsx`
- `src/features/notifications/notificationTypes.ts`
- `src/components/layout/NotificationBell.tsx`

Frontend expects:

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- Socket events: `notification:new`, `notification:read`, `notification:all-read`, `appointment-status`, `activity:new`, `chat:message`, `chat:read`

Backend files:

- No current notification module in `/Users/brikenaahmeti/lab1-backend`.
- Frontend uses `NOTIFICATION_API_URL` and `NOTIFICATION_SOCKET_URL`, so this can be a separate service.

Models:

- Suggested Prisma: `Notification`, `NotificationPreference`
- Related models: `User`, `Appointment`, `LabOrder`, `Invoice`, `Prescription`, `InventoryItem`, `Feedback`, `ContactMessage`
- Frontend models: `Notification`, `NotificationListParams`, `ReadAllNotificationsResponse`

Prompt:

```text
Please implement notification API/socket service for the frontend. Frontend files are src/features/notifications/notificationsApi.ts and NotificationSocketBridge.tsx.

Needed changes:
- Add GET /api/notifications with filters and pagination.
- Add PUT /api/notifications/:id/read, PUT /api/notifications/read-all, DELETE /api/notifications/:id.
- Add Socket.IO authentication by token and emit events notification:new, notification:read, notification:all-read, appointment-status, activity:new, chat:message, chat:read.
- Add Prisma models Notification and optional NotificationPreference.
```

## 22. Chat / Messages

Status: `MISSING`

Frontend files:

- `src/features/chat/chatApi.ts`
- `src/features/chat/useChat.ts`
- `src/features/chat/useChatSocket.ts`
- `src/features/chat/pages/ChatPage.tsx`
- `src/features/chat/components/*`

Frontend expects:

- `GET/POST /api/chat/rooms`
- `GET /api/chat/rooms/:roomId/messages`
- `POST /api/chat/rooms/:roomId/messages`
- `PATCH /api/chat/rooms/:roomId/read`
- `POST /api/chat/rooms/:roomId/upload`
- Socket events: `chat:join`, `chat:leave`, `chat:typing`, `chat:message`, `chat:read`

Backend files:

- No current chat module in `/Users/brikenaahmeti/lab1-backend`.
- Frontend uses `NOTIFICATION_API_URL` and `NOTIFICATION_SOCKET_URL`, so chat can live in the notification service.

Models:

- Suggested Prisma: `ChatRoom`, `ChatParticipant`, `ChatMessage`, `ChatAttachment`, `ChatReadReceipt`
- Related model: `User`
- Frontend models: `ChatRoom`, `ChatMessage`, `ChatAttachment`, `ChatMeta`

Prompt:

```text
Please implement chat API and Socket.IO service for the frontend. Frontend files are src/features/chat/chatApi.ts and src/features/chat/useChatSocket.ts.

Needed changes:
- Add room listing/creation endpoints.
- Add room message listing and send message endpoint.
- Add mark-read endpoint and attachment upload endpoint.
- Add socket events chat:join, chat:leave, chat:typing, chat:message, chat:read.
- Add Prisma models ChatRoom, ChatParticipant, ChatMessage, ChatAttachment, ChatReadReceipt.
```

## 23. AI, Consultation Transcription, Vapi

Status: `MISSING`

Frontend files:

- `src/lib/api/ai-api.ts`
- `src/features/consultation/components/ConsultationRecorder.tsx`
- `src/features/consultation/components/ConsultationAiReportPanel.tsx`
- `src/features/ai-agent/MedspereUbtAiAgentWidget.tsx`
- `src/features/vapi/pages/VapiCallLogsPage.tsx`

Frontend expects:

- `POST /api/ai/transcribe`
- `POST /api/ai/summarize`
- `GET /api/ai/consultations/:appointmentId`
- `PUT /api/ai/consultations/:appointmentId/summary`
- `GET /api/ai/lab-results/:labOrderId/interpretation`
- `POST /api/ai/agent/message`
- `GET /api/ai/vapi/calls`
- `GET /api/ai/vapi/calls/:callId`
- `GET /api/ai/vapi/calls/:callId/log`
- Socket events: `dashboard-helper:ready`, `dashboard-helper:typing`, `dashboard-helper:message`, `dashboard-helper:error`

Backend files:

- No current AI module in `/Users/brikenaahmeti/lab1-backend`.
- Frontend uses `AI_API_URL` and `AI_SOCKET_URL`, so this can be a separate service.

Models:

- Suggested Prisma/Mongo models: `AiConsultationConversation`, `AiAgentSession`, `AiAgentMessage`, `VapiCallLog`, `AiLabInterpretation`
- Related models: `Appointment`, `Patient`, `MedicalRecord`, `LabOrder`
- Frontend models: `AiConsultationConversation`, `TranscriptionView`, `ConsultationSummary`, `AiAgentMessageResponse`, `VapiCallLogView`

Prompt:

```text
Please implement AI service endpoints for the frontend. Frontend file: src/lib/api/ai-api.ts and widgets under src/features/ai-agent and src/features/consultation.

Needed changes:
- Add audio transcription endpoint POST /api/ai/transcribe accepting multipart audio.
- Add consultation summary endpoint POST /api/ai/summarize.
- Store/retrieve/update consultation conversations by appointmentId.
- Add lab interpretation endpoint for lab results.
- Add dashboard AI agent message endpoint and Socket.IO helper events.
- Add Vapi call log list/detail/log endpoints.
- Models: AiConsultationConversation, AiAgentSession, AiAgentMessage, VapiCallLog, AiLabInterpretation, linked to Appointment, Patient, MedicalRecord and LabOrder.
```

## 24. Admissions and Rooms

Status: `OK/PARTIAL`

Frontend files:

- `src/lib/api/dashboard-api.ts`
- `src/features/dashboard/*`
- Portal dashboard pages under `src/pages/portals/*`

Frontend currently uses admissions/rooms mostly through dashboard data. There are no full direct frontend CRUD pages for rooms/admissions in this repo.

Backend files:

- `src/modules/admissions/presentation/admission.routes.ts`
- `src/modules/admissions/presentation/admission.controller.ts`
- `src/modules/admissions/services/admission.service.ts`
- `src/modules/admissions/domain/admission.entity.ts`
- `src/modules/rooms/presentation/room.routes.ts`
- `src/modules/rooms/presentation/room.controller.ts`
- `src/modules/rooms/services/room.service.ts`
- `src/modules/rooms/domain/room.entity.ts`

Backend currently has:

- Admissions: `GET /api/admissions`, `GET /api/admissions/active`, `GET /api/admissions/:id`, `POST /api/admissions`, `PUT /api/admissions/:id/discharge`
- Rooms: `GET /api/rooms`, `GET /api/rooms/available`, `GET /api/rooms/:id`, `POST /api/rooms`, `PUT /api/rooms/:id`, `DELETE /api/rooms/:id`

Models:

- Prisma: `Admission`, `Room`, `Department`, `Patient`, `Invoice`
- Backend domain: `AdmissionEntity`, `RoomEntity`, `RoomDetailEntity`

Prompt:

```text
Please keep admissions and rooms available to dashboard/frontend. Current backend modules exist under /Users/brikenaahmeti/lab1-backend/src/modules/admissions and /Users/brikenaahmeti/lab1-backend/src/modules/rooms.

Needed changes:
- Confirm dashboard endpoints expose active admissions and available rooms in the shape expected by src/lib/api/dashboard-api.ts.
- If frontend adds full room/admission pages later, expose CRUD data using existing /api/rooms and /api/admissions endpoints.
- Models: Admission, Room, Department, Patient, Invoice.
```

## 25. Legacy Transactions Demo

Status: `MISSING/LEGACY`

Frontend files:

- `src/domain/transactions/transactions.service.ts`
- `src/domain/transactions/transactions.api.ts`
- `src/domain/transactions-direct/transactions.service.ts`
- `src/pages/Dashboard/transactions/*`

Frontend expects:

- `GET /transactions`
- `GET /transactions/:id`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`

Backend files:

- No current transaction module.

Models:

- Suggested only if keeping the feature: `Transaction`
- Otherwise remove/deprecate the frontend demo.

Prompt:

```text
Please decide whether the legacy transactions demo should stay. Frontend files are under src/domain/transactions and src/pages/Dashboard/transactions.

Option A:
- Remove or hide the legacy transactions UI because it does not belong to the hospital backend.

Option B:
- Add a simple /transactions CRUD backend with Transaction model and pagination.
```

## Quick Backend Gap Summary

Already present but needs alignment:

- Auth/profile/users/sessions
- Dashboard activity
- Departments public endpoints
- Patients self profile and timeline
- Appointments public booking, status actions, slots, service/staff contract
- Medical records finalize/amendments/pdf
- Prescriptions lifecycle/pdf/void
- Billing alias from invoices to billings
- Admissions/rooms are present but mostly unused by frontend screens

Missing backend modules expected by frontend:

- Unified staff and staff position types
- Service catalog
- Lab orders/results
- Pharmacy queue
- Inventory
- Feedback
- Contact inbox
- CMS/public content
- Reports
- Advanced search
- Settings
- Data exchange
- Notifications
- Chat
- AI/Vapi
- Legacy transactions, unless removed
