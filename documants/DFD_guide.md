# Data Flow Diagram Guide

## System

Eranga Driving School Management Platform

## Files

- `dfd_diagrams.puml`: PlantUML source containing Level 0, Level 1, Level 2, and a notation legend.
- `class_diagram.puml`: Domain class diagram for the same system.

## 1. DFD Purpose

The Data Flow Diagram shows how data enters the driving school platform, how business processes transform it, where it is stored, and which outputs are returned to users.

The DFD is based on the functional requirements in `Eranga_Driving_School_SRS.md`.

## 2. External Entities

| Entity | Data sent to the system | Data received from the system |
|---|---|---|
| Student | Registration, profile data, medical certificate, learner permit, package selection, booking request, installment payment | Approval status, package details, booking confirmation, invoice, balance, DMT progress, notifications |
| Instructor | Availability, session start/completion, attendance, skill evaluations, notes | Assigned schedule, student details, active session information, saved progress |
| Admin | User approvals, document verification, package and vehicle updates, instructor assignments, offline payments | Pending approvals, conflicts, payment audits, KPIs, reports, system alerts |
| Payment Sandbox | Payment result and transaction reference | Payment request |

The DMT/RMV is not shown as a direct external system because the current application records DMT progress and uploaded documents; it does not contain a live DMT API integration.

## 3. Data Stores

| ID | Data store | Main contents |
|---|---|---|
| D1 | Users | Student, instructor, admin profiles, roles, account statuses |
| D2 | Documents and DMT Progress | Medical certificates, learner permits, verification statuses, seven-step DMT progress |
| D3 | Packages and Enrollments | Training package definitions, selected packages, class counts, skills, enrollment status |
| D4 | Bookings and Sessions | Booking requests, assigned sessions, dates, time slots, attendance, session status |
| D5 | Instructor Availability | Weekly availability and instructor scheduling information |
| D6 | Vehicles | Registration number, vehicle type, transmission, maintenance and active status |
| D7 | Payments and Invoices | Online payments, offline cash payments, references, invoices and balances |
| D8 | Notifications | Booking alerts, payment reminders, document updates and system notifications |

In the current Firebase implementation, these stores are represented by Firestore collections or related records such as `users`, `students`, `instructors`, `bookings`, `sessions`, `payments`, `vehicles`, `student_packages`, and `notifications`.

## 4. Level 0: Context Diagram

The entire platform is represented as one process. It shows only the system boundary and external entities. It is used to explain the system at the highest level.

Main flows:

1. Students submit registration, documents, package choices, booking requests and payments.
2. Instructors submit availability, attendance and training progress.
3. Admins submit approvals, assignments, package, vehicle and payment updates.
4. The platform returns confirmations, schedules, invoices, progress information, reports and notifications.
5. The platform exchanges payment requests and results with the Payment Sandbox.

## 5. Level 1: Main Processes

### 1.0 Authenticate and Manage Users

Validates login details, maps users to Student, Instructor or Admin roles, and maintains account status. New registrations remain pending until approved by an administrator.

### 2.0 Manage DMT Progress and Documents

Receives medical certificate and learner permit uploads, stores verification results, and updates the seven DMT steps. The learner permit status is used by the booking process as an eligibility condition.

### 3.0 Manage Packages and Enrollment

Displays active packages, accepts student enrollment, and stores package pricing, included sessions, completed classes and enrollment status.

### 4.0 Manage Booking and Schedule

Receives the preferred date, time slot, instructor and vehicle. It checks learner permit eligibility, outstanding fees, instructor availability, vehicle availability and existing bookings before creating or updating a booking.

### 5.0 Manage Training Session and Progress

Allows instructors to start an active session, record attendance, evaluate driving skills, complete the lesson and update student progress and completed class counts.

### 6.0 Manage Payments and Invoices

Handles online sandbox payments and administrator-entered offline cash payments. It updates balances, stores payment references and generates invoice records.

### 7.0 Manage Notifications and Reports

Creates alerts for bookings, payments, documents and progress. It also aggregates revenue, lesson counts, student results and fleet availability for the admin dashboard.

## 6. Level 2: Booking and Session Decomposition

The Level 2 diagram expands processes 4.0 and 5.0:

1. `4.1 Receive Booking Request` receives the student selection.
2. `4.2 Validate Student Eligibility` checks learner permit status and outstanding balance.
3. `4.3 Check Instructor and Vehicle Conflicts` prevents double-booking.
4. `4.4 Create or Update Booking` stores a pending request.
5. `4.5 Approve and Assign Session` lets the admin approve the request and assign resources.
6. `5.1 Start Active Session` records the actual start of the lesson.
7. `5.2 Record Attendance and Skills` stores attendance, notes and competency results.
8. `5.3 Complete Session and Update Progress` closes the session and updates DMT and enrollment progress.

## 7. Important Business Rules

- A new account must be approved before role-restricted features are available.
- A student cannot book practical training before the learner permit is verified.
- A booking must not overlap with another booking for the selected instructor or vehicle.
- Vehicles marked Under Service or Inactive cannot be selected.
- Bookings may be blocked when outstanding fees exceed the configured limit.
- Only an instructor can record lesson attendance and driving-skill evaluation.
- Completed sessions update class counts and student progress.
- Payment records may come from the online sandbox or administrator-entered cash payments.

## 8. PlantUML Rendering

Open `dfd_diagrams.puml` in VS Code with a PlantUML extension and preview the required block:

- `DFD_Level_0_Context` for the context diagram.
- `DFD_Level_1_Main` for the complete system DFD.
- `DFD_Level_2_Booking_and_Session` for detailed booking and lesson flow.
- `DFD_Legend` for notation.

## 9. Report Description

The proposed Data Flow Diagram models the movement of information within the Eranga Driving School Management Platform. Students, instructors and administrators interact with the platform through role-specific workflows. The platform validates user access, manages DMT documents and progress, processes package enrollments, schedules lessons, records instructor activities, tracks payments and generates notifications and reports. Firestore-based data stores preserve the information required for reliable scheduling, progress tracking, financial auditing and administrative decision-making.
