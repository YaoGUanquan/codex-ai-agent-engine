---
type: plan
status: completed
date: 2026-06-15
title: class-create-drawer-backend
origin: docs/ae/prds/2026-06-15-class-create-drawer-backend-prd.md
originFingerprint: 019ec8a4-23d0-7803-b59f-acc42a26ca79
completedDate: 2026-06-15
archive: docs/00-process/archive/2026-06/class-create-drawer-backend/
---

# Plan: class-create-drawer-backend

## Completion Summary

- Status: completed and archived on 2026-06-15.
- Archive: `docs/00-process/archive/2026-06/class-create-drawer-backend/`
- Final gate: `docs/ae/gates/20260615T015909Z-work-final.json`
- Validation:
  - `mvn -pl axon-common '-Dtest=ClassCreateOptionServiceImplTest,ClassCreateServiceImplTest,TeacherClassSubjectServiceImplTest' test`
  - `mvn -pl axon-chat -am -DskipTests compile`
- API contract: `docs/04-api/2026-06-15-class-create-drawer-api.md`
- Implementation note: the drawer flow uses dedicated `/api/v1/school/class/create-drawer/*` endpoints and keeps `/api/v1/school/teachers` plus `/api/v1/school/class/add` unchanged.
- Post-completion correction: `POST /api/v1/school/class/create-drawer/head-teachers/page` now pages all current-user-school teacher-and-above users by `users.create_time DESC`; `user_subject` is no longer a candidate precondition and is used only to enrich returned grade/subject display data when present.
- Correction validation: `mvn -pl axon-common -Dtest=ClassCreateOptionServiceImplTest test` passed with 8 tests, 0 failures.
- Subject-teacher response correction: `POST /api/v1/school/class/create-drawer/subject-teachers/page` returns only the requested `subjectId` in `subjects`, instead of expanding all subjects configured on the teacher.
- Subject-teacher TDD evidence: `subjectTeacherOptionsOnlyExposeRequestedSubject` failed before the fix with two returned subjects, then passed after filtering `subjects` by request `subjectId`.
- Verification note: one rerun hit Maven incremental test compilation noise; after deleting `axon-common/target`, the targeted and full `ClassCreateOptionServiceImplTest` commands passed.
- Subject options extension: `GET /api/v1/school/class/create-drawer/subject-options` returns PRIMARY/JUNIOR/SENIOR subject options using active `subject.subject_name` rows. The response keeps database names such as `体育活动` and `政治`; no display-name mapping is applied.
- Subject teacher save hardening: `subjectTeachers[].subjectId` must belong to the selected phase subject options, duplicate subject IDs are rejected within one save request, and `academicYear` must match the derived target academic year.
- Subject options validation:
  - `mvn -pl axon-common "-Dtest=ClassCreateOptionServiceImplTest,ClassCreateServiceImplTest" test` passed with 15 tests, 0 failures.
  - `mvn -pl axon-chat -am -DskipTests compile` passed.
  - `mvn -pl axon-chat -am test` compiled but failed on pre-existing unrelated controller tests outside the class creation drawer scope.
  - Final gate: `docs/ae/gates/20260615T094158Z-work-final.json`.

## Source

- PRD: `docs/ae/prds/2026-06-15-class-create-drawer-backend-prd.md`
- Current analysis: `docs/03-analysis/2026-06-15-班级班主任任课老师接口与逻辑梳理.md`
- User UI screenshot and requirements from 2026-06-15 conversation.

## Scope

Add backend support for the class creation drawer:

- Create new class-specific teacher+ selector APIs; do not modify `/api/v1/school/teachers`.
- Add new enrollment academic-year options and current grade derivation APIs; do not modify `/api/v1/school/class/add`.
- Add duplicate class name validation for the creation rule.
- Add an aggregate class creation endpoint that creates class + head teacher and optionally subject teachers.
- Add subject teacher candidate filtering by normalized phase category and subject permission.
- Preserve existing public API behavior; this plan adds new drawer-specific endpoints instead of expanding old endpoint contracts.

## Readiness

- Goal: Let the class creation drawer complete its backend flow without relying on incomplete generic teacher/class APIs.
- Acceptance criteria:
  - New teacher+ selector returns user ID, phone, configured grades, raw phases, normalized phase categories, and subjects.
  - Enrollment year options return 6 years for primary and 3 years for junior/senior high.
  - Current grade derivation works for 2026 target academic year and 2025 junior enrollment year -> eighth grade.
  - Aggregate save validates required fields, duplicate class names, head teacher validity, and subject teacher permissions.
  - Existing `/api/v1/school/teachers` and `/api/v1/school/class/add` consumers remain untouched.
- Non-goals:
  - No front-end changes in this plan.
  - No historical data migration unless tests reveal required defaults are absent.
  - No redesign of `teacher_class_subject` into a general role relation table.
  - No changes to `exam_class_teacher`.
  - No changes to existing `/api/v1/school/teachers`.
  - No changes to existing `/api/v1/school/class/add`.
- Affected areas:
  - `axon-chat` school class controller.
  - `axon-common` school class services, DTO/VO, mapper queries, tests.
- Validation surface:
  - Java unit tests for option generation and validation.
  - Service tests for aggregate save.
  - Controller/WebMvc-style tests if existing project pattern supports it.
  - Maven module test command.
- Open questions:
  - Confirm whether `class.academic_year` should store the target September academic year. This plan assumes yes.
  - Confirm whether teacher disabled state is solely `user_profile.status != 1`. This plan uses that as primary and treats missing profile as invalid for selector APIs.

## Assumptions

- The class creation UI targets the coming September school year. Therefore default `targetAcademicYear` is the current natural year, e.g. 2026 on 2026-06-15.
- `grade.grade_progression_order` has administrative grade sequence values: primary 1-6, junior high 7-9, senior high 10-12.
- If a teacher has multiple configured grades across raw phases or normalized phase categories, the selector returns all configured grade records and the front-end chooses one `selectedTeacherGradeId` through the selected teacher context.
- Raw `phaseId` is not sufficient to determine UI phase category because a raw phase may contain both primary and junior grades. Normalized phase category must be derived from `grade.grade_progression_order`: `PRIMARY=1-6`, `JUNIOR=7-9`, `SENIOR=10-12`.
- `user_subject` is the authoritative source for科任老师 grade and subject permissions; it is not a班主任候选准入条件.
- 班主任候选有效状态以 `users.deleted=0`、当前用户学校、有效教师及以上角色为准。`user_profile` 与 `user_subject` 只用于补充展示字段，缺失时不阻断候选返回。
- Existing `.gitignore` ignores `docs/`; document artifacts still live under `docs` according to project rules.

## Alternatives Considered

- Recommended: Add class-creation-specific APIs and service under existing school/class boundary.
  - Fit: Keeps UI-specific orchestration close to class management without breaking generic teacher list.
  - Trade-off: Adds several DTO/VO types and a focused service.
  - Risk: Some overlap with existing `/school/teachers`, but the explicit contract is safer.
- Alternative: Expand `/api/v1/school/teachers` to return grade/phase/subject permissions.
  - Fit: Reuses an existing endpoint.
  - Risk: Existing consumers may receive larger payloads or different filtering; the method already has teaching-group-specific sorting behavior unrelated to class creation.
  - Rejected because: The user explicitly requires新增老师列表接口, and the class creation selector has stricter filtering and richer contract than the generic school personnel list.
- Alternative: Only enhance `/api/v1/school/class/add` and let front-end compose other existing endpoints.
  - Fit: Minimal backend surface.
  - Risk: Front-end would duplicate grade derivation, duplicate-name checks, and teacher permission filtering.
  - Rejected because: The user explicitly requires新增学年/入学年份接口 and not changing old class creation behavior; the requirements also need back-end validation and shared rules.

## Decision Drivers

- Driver 1: Preserve existing API contracts while adding the UI-specific contract.
- Driver 2: Keep class grade derivation authoritative on the backend.
- Driver 3: Make validation deterministic and testable at Service level.

## Decisions

### ADR-1 - Add Class Creation Facade Service

- Decision: Add a focused `ClassCreateService` under `com.xinxi.axon.common.service.school`.
- Drivers: The workflow spans user roles, user subject permissions, grade/phase lookup, class duplication, class creation, head teacher binding, and subject teacher binding.
- Alternatives: Put all orchestration in `ClassServiceImpl`; put it in `SchoolServiceImpl`.
- Why chosen: `ClassServiceImpl` is already responsible for base class CRUD and dynamic grade assembly; adding UI orchestration there would increase cognitive complexity. `SchoolServiceImpl` is already large and generic.
- Consequences: A new service boundary owns class creation drawer behavior and can be tested independently.
- Follow-ups: If this grows into a broader class management workflow, split option generation and save orchestration into separate components.

### ADR-2 - Use Existing Grade Progression Sequence For Derivation

- Decision: Derive normalized phase category and start/current grade through `grade.grade_progression_order`.
- Drivers: Existing dynamic grade implementation already relies on this field; `display_order` is only UI sort. Raw `phaseId` can represent broad phase labels such as compulsory education and cannot always distinguish primary from junior.
- Alternatives: Hardcode grade IDs or names.
- Why chosen: Avoids school-specific ID assumptions and supports existing dynamic grade design.
- Consequences: DTOs and save APIs must carry `selectedTeacherGradeId` or `phaseCategory`; tests must provide grade records or mock grade mapper responses.
- Follow-ups: If five-four school system appears, add phase/system-specific progression configuration instead of changing this flow ad hoc.

### ADR-3 - Add Aggregate Create Endpoint Instead Of Mutating `/add`

- Decision: Add `POST /api/v1/school/class/create-drawer/save` under `ClassController`.
- Drivers: Existing `/add` has a small DTO and generic behavior; the new flow needs head teacher and optional subject teachers in one transaction.
- Alternatives: Change `/add` DTO to include all new fields.
- Why chosen: Avoids breaking existing callers and keeps old path stable.
- Consequences: Two create paths exist; docs must explain when to use the drawer path. Existing `/add` must not be modified by this work.
- Follow-ups: Later deprecate `/add` only if all callers migrate.

## Risks

- Teacher disabled state may not be consistently represented. Current entity has `user_profile.status`, but `users` has no status field.
- Existing `TeacherClassSubjectServiceImpl` does not apply `status/effective_end_date` consistently; aggregate create should set new records explicitly and new candidate APIs should use current-effective filters.
- Duplicate class-name rule depends on computed current grade; naive `class.grade_id` matching would be wrong.
- `SchoolServiceImpl.listSchoolTeachers` excludes current user; class creation may or may not want to exclude self. New selector should not inherit that behavior blindly.
- Phase labels in DB may be long names such as `义务教育（六三学制）`; UI needs normalized display `小学/初中/高中`.
- Existing `SchoolAcademicCalendarServiceImpl` switches academic year on August 15; class creation drawer year options must use current natural year by default for the coming September class creation flow.

## Pre-Mortem

- Failure scenario 1: Front-end selects a teacher with multiple configured phases and backend guesses the wrong phase.
  - Mitigation: Selector returns every grade option with `selectedTeacherGradeId`, raw `phaseId`, and normalized `phaseCategory`; save and year option APIs require `selectedTeacherGradeId` or `phaseCategory`.
- Failure scenario 2: Duplicate class validation misses an existing class because it compares start grade instead of current grade.
  - Mitigation: Add a dedicated duplicate check method that derives current grade for existing candidate classes or uses equivalent progression-order SQL.
- Failure scenario 3: Subject teacher save writes invalid `teacher_class_subject` rows for teachers without subject permission.
  - Mitigation: Validate each subject teacher against `user_subject + grade + phase + subject` before insert; wrap aggregate save in a transaction.

## Implementation Units

### U1 - DTO/VO Contracts For Class Creation Drawer

- Goal: Define request and response contracts without changing existing DTOs.
- Requirements covered: FR-1, FR-2, FR-3, FR-5, FR-6, FR-7.
- Acceptance criteria covered: 1, 2, 3, 4, 7.
- Depends on: none.
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassCreateTeacherQueryDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassEnrollmentYearOptionsQueryDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassGradeDeriveQueryDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassCreateSaveDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassCreateSubjectTeacherDTO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateTeacherOptionVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateTeacherGradeVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateTeacherSubjectVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/enums/school/ClassCreatePhaseCategoryEnum.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassEnrollmentYearOptionVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassGradeDeriveVO.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/vo/school/ClassCreateSaveResultVO.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/school/SchoolTeacherQueryDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/SchoolTeacherVO.java`
- Approach:
  - Use `jakarta.validation` annotations for required fields.
  - Keep naming business-specific, e.g. `ClassCreateTeacherOptionVO`, not generic `ResultVO`.
  - Include `targetAcademicYear` in option/derive/save DTOs as optional.
  - Add `selectedTeacherGradeId` and `phaseCategory` to `ClassEnrollmentYearOptionsQueryDTO`, `ClassGradeDeriveQueryDTO`, and `ClassCreateSaveDTO`.
  - Keep `phaseId` optional for raw phase echo or consistency validation; do not make it the sole source for primary/junior/senior decisions.
  - `ClassEnrollmentYearOptionVO` uses `enrollmentYear` and `enrollmentMonth` as separate contract fields; frontend composes display text.
  - `ClassCreateTeacherGradeVO` returns `gradeId`, `gradeName`, `phaseId`, `phaseName`, `phaseCategory`, `phaseCategoryName`, and `gradeProgressionOrder`.
  - Use `List<ClassCreateSubjectTeacherDTO>` for optional subject teachers.
- Tests:
  - No behavior tests required for plain DTO/VO.
  - Compile validation catches import and annotation issues.
- Validation:
  - `mvn -pl axon-common -DskipTests compile`
- Rollback signals:
  - DTO names conflict with existing classes.
  - Swagger schema generation fails due to duplicate names.
- Deferred to implementation:
  - None for core field names: use `selectedTeacherGradeId`, `phaseCategory`, `enrollmentYear`, and `enrollmentMonth` as the stable contract.

### U2 - Grade/Phase Derivation Component

- Goal: Provide deterministic enrollment year options and grade derivation.
- Requirements covered: FR-2, FR-3.
- Acceptance criteria covered: 2, 3.
- Depends on: U1.
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassCreateOptionService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassCreateOptionServiceImpl.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassCreateOptionServiceImplTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassGradeProgressionServiceImpl.java`
- Approach:
  - Implement `resolveTargetAcademicYear()` as current natural year by default.
  - Implement phase category by grade progression range:
    - primary: 1-6, length 6, start order 1.
    - junior: 7-9, length 3, start order 7.
    - senior: 10-12, length 3, start order 10.
  - Resolve phase category in this order:
    1. if `phaseCategory` is present, validate it is one of `PRIMARY/JUNIOR/SENIOR`;
    2. if `selectedTeacherGradeId` is present, query `grade` and derive its category from `grade_progression_order`;
    3. if both are present, require both categories to match;
    4. reject requests where neither field is present.
  - Do not use raw `phaseId` as the only category source. Use it only to validate that the selected grade belongs to the raw phase when provided.
  - For year options, return `enrollmentYear = targetAcademicYear - i`, `enrollmentMonth = 9`, and derived grade if requested.
  - Do not make a backend-composed display label such as `YYYY年9月` the source-of-truth contract; frontend composes it from year and month.
  - For grade derivation, query start grade by progression order and current grade by `startOrder + targetAcademicYear - enrollmentYear`.
  - Throw `BusinessException(PARAM_ERROR, "...")` if no matching grade exists or offset is out of range.
- Tests:
  - Primary phase returns 6 options for target 2026: 2026..2020, and every option has `enrollmentMonth=9`.
  - Junior phase returns 3 options for target 2026: 2026..2024, and every option has `enrollmentMonth=9`.
  - Junior phase + enrollment 2025 + target 2026 returns current grade progression order 8.
  - Raw `phaseId` containing both primary and junior grades does not determine category by itself; missing `selectedTeacherGradeId` and `phaseCategory` fails.
  - Mismatched `phaseCategory=PRIMARY` and selected grade progression order 7 fails.
  - Out-of-range enrollment returns parameter error.
- Validation:
  - `mvn -pl axon-common -Dtest=ClassCreateOptionServiceImplTest test`
- Rollback signals:
  - Existing grade data lacks `grade_progression_order`.
  - No grade exists for the required start order or current order.
- Deferred to implementation:
  - Five-four school system support is out of scope; current logic is 6+3+3.

### U3 - Teacher+ Selector And Subject Teacher Candidate Service

- Goal: Return class-creation-ready teacher options with grade, phase, and subject permissions.
- Requirements covered: FR-1, FR-6.
- Acceptance criteria covered: 1, 7, 8.
- Depends on: U1, U2.
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassCreateOptionService.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassCreateOptionServiceImpl.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/dto/school/ClassCreateTeacherPermissionRow.java` or equivalent package-private mapper projection if project style allows.
  - Modify or add query methods: `axon-common/src/main/java/com/xinxi/axon/common/mapper/user/UserSubjectMapper.java`
  - Modify or add XML: `axon-common/src/main/resources/mapper/user/UserSubjectMapper.xml`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassCreateOptionServiceImplTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/SchoolServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/dto/school/SchoolTeacherQueryDTO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/vo/school/SchoolTeacherVO.java`
- Approach:
  - Add new service methods for drawer-specific lists:
    - `pageHeadTeacherOptions(ClassCreateTeacherQueryDTO dto, Long operatorUserId)`
    - `pageSubjectTeacherOptions(ClassCreateTeacherQueryDTO dto, Long operatorUserId)`
  - Resolve school ID from `operatorUserId`; if request carries `schoolId`, reject cross-school values.
  - Query candidates through a drawer-specific mapper query instead of modifying `/api/v1/school/teachers`.
  - Head teacher candidate base filter:
    - `users.school_id = effectiveSchoolId`
    - `users.deleted = 0`
    - active user role whose `role_code` satisfies `RoleCodeEnum.isTeacherAndAbove`
    - sort by `users.create_time DESC, u.id DESC`
    - `user_profile` and `user_subject` are left-joined only for display enrichment.
  - Subject teacher candidate base filter remains stricter:
    - `users.school_id = effectiveSchoolId`
    - `users.deleted = 0`
    - active user role whose `role_code` satisfies `RoleCodeEnum.isTeacherAndAbove`
    - `user_subject.deleted = 0`
    - `user_subject.status = 1`
    - `grade.deleted = 0`
  - Phone search must match `users.user_phone`; optional keyword can also match `users.nick_name`, `users.username`, and `user_profile.real_name`.
  - Return one teacher row per user in the final page, then include nested grade/phase/subject summaries from permission rows for those user IDs when present.
  - Normalize every returned grade into `phaseCategory` from `grade.grade_progression_order`, not from raw `phase.phase_name`.
  - Subject teacher candidate filter:
    - Must have at least one `user_subject` row whose subject matches requested `subjectId`.
    - Must have at least one configured grade in requested `phaseCategory`.
    - If `selectedTeacherGradeId` is provided, validate that the requested `phaseCategory` matches that grade's progression range.
    - Response `subjects` should include only the requested `subjectId`.
  - Avoid returning duplicate teachers due to multiple grade/subject rows.
- Tests:
  - Teacher without teacher+ role is excluded.
  - Deleted user is excluded.
  - `user_profile.status=0` teacher is excluded.
  - Missing `user_profile` teacher is excluded.
  - Phone keyword filters by `users.user_phone`.
  - Returned teacher contains configured grade, raw phase, normalized phase category, and subject summaries.
  - Subject teacher candidate excludes teacher without requested subject.
  - Existing `SchoolServiceImpl.listSchoolTeachers` behavior is not touched by this implementation.
- Validation:
  - `mvn -pl axon-common -Dtest=ClassCreateOptionServiceImplTest test`
- Rollback signals:
  - Candidate API becomes too slow because it filters all school users in memory.
  - Mapper query duplicates users and paginates permission rows rather than teachers.
- Deferred to implementation:
  - If MyBatis XML projection becomes unwieldy, split into two queries: teacher ID page first, permission detail second.

### U4 - Duplicate Class Validation And Aggregate Save Service

- Goal: Save class + head teacher + optional subject teachers in one transaction with full validation.
- Requirements covered: FR-4, FR-5, FR-7.
- Acceptance criteria covered: 4, 5, 6, 7.
- Depends on: U1, U2, U3.
- Files:
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/ClassCreateService.java`
  - Create: `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassCreateServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/user/impl/TeacherClassSubjectServiceImpl.java` only if extracting reusable current-effective helpers is necessary.
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/school/ClassCreateServiceImplTest.java`
- Forbidden files:
  - `axon-common/src/main/java/com/xinxi/axon/common/service/exam/impl/ExamInfoServiceImpl.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/entity/exam/ExamClassTeacherPO.java`
  - `axon-common/src/main/java/com/xinxi/axon/common/service/school/impl/ClassServiceImpl.java` unless a compile-only interface dependency requires import cleanup.
- Approach:
  - `createFromDrawer(ClassCreateSaveDTO dto, Long operatorUserId)` orchestrates save.
  - Resolve effective school ID from operator user, rejecting cross-school `schoolId`.
  - Validate required fields with clear `BusinessException(PARAM_ERROR, message)`:
    - `headTeacherId`
    - `selectedTeacherGradeId` or `phaseCategory`
    - `enrollmentYear`
    - `enrollmentMonth`
    - `className`
  - Validate `enrollmentMonth == 9`; reject other months until product supports non-September enrollment.
  - Call `ClassCreateOptionService.deriveGrade(...)` to get start/current grade.
  - Validate head teacher before class insert:
    - same school as operator school,
    - `users.deleted=0`,
    - `user_profile.deleted=0`,
    - `user_profile.status=1`,
    - active teacher+ role,
    - has at least one `user_subject` grade permission matching requested `phaseCategory`.
  - Duplicate check:
    - Query classes in same school and same `enrollment_year`, `deleted=0`.
    - For each candidate with same `className`, derive current grade using its start grade and enrollment year against target academic year.
    - Reject if current grade matches requested current grade.
  - Create `ClassPO` with:
    - `className`
    - `schoolId`
    - `gradeId = derived.startGradeId`
    - `enrollmentYear`
    - `academicYear = targetAcademicYear`
    - `semester = "秋季"`
    - `classStatus = provided or ACTIVE`
  - Call existing `ClassHeadTeacherService.bindOrChangeHeadTeacher` after class save, but do not rely on it as the only teacher validity check because it does not validate `user_profile.status`.
  - Validate subject teachers:
    - teacher required, subject required, academicYear required.
    - teacher is same school and effective teacher+.
    - teacher has requested subject and normalized phase category permission.
  - Insert subject teacher relations with `status=1`, `effectiveStartDate=LocalDate.of(targetAcademicYear, 9, 1)`, `effectiveEndDate=null`.
  - Return `ClassCreateSaveResultVO` with class ID, class name, raw phase, normalized phase category, enrollment year/month, start/current grade, head teacher summary, and subject teacher count.
- Tests:
  - Missing head teacher fails.
  - Missing `selectedTeacherGradeId`/`phaseCategory`, enrollmentYear, enrollmentMonth, or className fails.
  - `enrollmentMonth != 9` fails.
  - Disabled head teacher via `user_profile.status=0` fails before class insert.
  - Duplicate class same school/enrollment/currentGrade/className fails.
  - Duplicate name in different school succeeds.
  - Valid create saves class and head teacher.
  - Invalid subject teacher permission rolls back class save.
- Validation:
  - `mvn -pl axon-common -Dtest=ClassCreateServiceImplTest test`
- Rollback signals:
  - Existing class creation consumers expect `academic_year` to mean running academic year and break when target year is saved.
  - `TeacherClassSubjectPO` insert fails because DB defaults or nullable assumptions differ.
- Deferred to implementation:
  - If front-end confirms subject teachers are always configured after class creation, keep optional subject teacher list empty in the save request and add a follow-up endpoint later. The current service may still support optional list for backward-compatible expansion.

### U5 - Controller Endpoints

- Goal: Expose the new backend contract under existing class management route.
- Requirements covered: FR-1 through FR-7.
- Acceptance criteria covered: 1 through 8.
- Depends on: U1, U2, U3, U4.
- Files:
  - Modify: `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/ClassController.java`
  - Test: `axon-chat/src/test/java/com/xinxi/chatservice/controller/school/ClassControllerClassCreateDrawerTest.java`
- Forbidden files:
  - `axon-chat/src/main/java/com/xinxi/chatservice/controller/school/SchoolController.java`
- Approach:
  - Add endpoints:
    - `POST /api/v1/school/class/create-drawer/head-teachers/page`
    - `POST /api/v1/school/class/create-drawer/subject-teachers/page`
    - `POST /api/v1/school/class/create-drawer/enrollment-academic-years`
    - `POST /api/v1/school/class/create-drawer/derive-grade`
    - `GET /api/v1/school/class/create-drawer/class-name-options`
    - `POST /api/v1/school/class/create-drawer/save`
  - Keep `/api/v1/school/teachers`, `/api/v1/school/class/add`, `/api/v1/school/class/head-teacher/bind`, and `/api/v1/school/class/teacher/bind` unchanged.
  - Reuse `@RequirePermission`:
    - read endpoints use `class:read`.
    - save uses `class:create` or `class:update` depending existing permission model. Recommended `class:create`.
  - Use `getUserIdFromRequest(request)` and reject missing user with existing unauthorized code.
  - Let `BusinessException` bubble if global handler preserves clear messages; otherwise return `ApiResult.fail(e.getCode(), e.getMessage(), null)` consistently for these new endpoints.
  - Do not change existing `/add`, `/head-teacher/bind`, `/teacher/bind` behavior.

### ADR-2026-06-17 - Enrollment Years Blank Phase Fallback

- Scope: `POST /api/v1/school/class/create-drawer/enrollment-academic-years` only.
- Decision: when `phaseCategory` is `null`, empty string, or blank string, return all enrollment years from `2015` through the server current natural year in ascending order, with `enrollmentMonth=9`.
- Non-goal: do not change `derive-grade`, `save`, or `update`; those flows still require an explicit phase category or a selected teacher grade that can resolve one.
- Validation: add service-level tests for blank `phaseCategory` and raw `phaseId` without `phaseCategory`; run `mvn -pl axon-common -Dtest=ClassCreateOptionServiceImplTest test`.
- Tests:
  - Missing token returns unauthorized for save and selector.
  - Head teacher page delegates with current user ID.
  - Enrollment academic-year endpoint delegates `selectedTeacherGradeId`, `phaseCategory`, and `targetAcademicYear`.
  - Save endpoint delegates DTO and current user ID.
  - Validation errors return clear messages.
- Validation:
  - `mvn -pl axon-chat -Dtest=ClassControllerClassCreateDrawerTest test`
- Rollback signals:
  - Permission annotations block intended users in test environment.
  - Global exception handler converts `BusinessException` into generic 500 for new endpoints.
- Deferred to implementation:
  - If Controller tests are expensive due to security filters, cover Service fully and compile Controller.

### U6 - Existing Service Hardening Needed By The New Flow

- Goal: Fix or isolate known weak points that would affect the new class creation flow.
- Requirements covered: FR-5, FR-6.
- Acceptance criteria covered: 6, 7, 8.
- Depends on: U4.
- Files:
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/user/impl/TeacherClassSubjectServiceImpl.java`
  - Modify: `axon-common/src/main/java/com/xinxi/axon/common/service/user/TeacherClassSubjectService.java`
  - Test: `axon-common/src/test/java/com/xinxi/axon/common/service/user/TeacherClassSubjectServiceImplTest.java`
- Forbidden files:
  - Any exam package.
- Approach:
  - Add a new explicit method for current-effective class teacher lookup, e.g. `getCurrentTeacherIdsByClassAndSubject`.
  - Keep old `getTeacherIdsByClassAndSubject` unchanged unless tests prove safe to alter; the new flow should call the explicit current-effective method.
  - New method applies:
    - `classId`
    - optional `subjectId`
    - `deleted=0`
    - `status=1`
    - `effective_end_date IS NULL`
  - If `schoolId` is provided, validate via class lookup or join in a mapper query.
- Tests:
  - `subjectId=null` returns all current teachers for the class.
  - inactive status is excluded.
  - ended relation is excluded.
  - school mismatch is excluded or rejected.
- Validation:
  - `mvn -pl axon-common -Dtest=TeacherClassSubjectServiceImplTest test`
- Rollback signals:
  - Existing callers accidentally switch behavior and lose historical/legacy rows.
- Deferred to implementation:
  - Keep this hardening scoped to new explicit methods if old behavior is too risky.

### U7 - API Documentation And Developer Notes

- Goal: Document the new API contract for front-end integration.
- Requirements covered: all.
- Acceptance criteria covered: all.
- Depends on: U5.
- Files:
  - Create: `docs/04-api/2026-06-15-class-create-drawer-api.md`
  - Modify: `docs/03-analysis/2026-06-15-班级班主任任课老师接口与逻辑梳理.md` only if new stable conclusions need a small addendum.
- Forbidden files:
  - Root directory docs.
- Approach:
  - Include endpoint paths, request examples, response examples, validation messages, and field semantics.
  - Explicitly state `class.grade_id` stores start grade and current grade is derived.
  - Explicitly state the old endpoints are unchanged:
    - `/api/v1/school/teachers`
    - `/api/v1/school/class/add`
  - Enrollment academic-year examples must use separate `enrollmentYear` and `enrollmentMonth` fields.
  - Grade and year option examples must show `selectedTeacherGradeId`, raw `phaseId`, and normalized `phaseCategory`.
  - Include front-end flow order:
    1. query head teachers,
    2. choose one returned teacher grade context: `selectedTeacherGradeId + phaseCategory`,
    3. query enrollment academic years,
    4. derive grade,
    5. save,
    6. configure subject teachers if needed.
- Tests:
  - Document review only.
- Validation:
  - Manual review against PRD acceptance criteria.
- Rollback signals:
  - API doc contradicts implemented DTO field names.
- Deferred to implementation:
  - Add curl examples only after final endpoint names are fixed.

## Validation Plan

- Unit:
  - `ClassCreateOptionServiceImplTest`
  - `ClassCreateServiceImplTest`
  - `TeacherClassSubjectServiceImplTest`
- Integration:
  - Controller tests for `ClassController` new endpoints where practical.
  - Verify `ClassHeadTeacherServiceImpl` existing tests still pass.
- User flow:
  - Simulate: query head teacher -> choose `selectedTeacherGradeId/phaseCategory` -> get enrollment academic years -> derive grade -> save class -> verify class page shows created class.
- Data / operations:
  - SQL check for duplicate class before/after save.
  - SQL check that `class_head_teacher` has one current active row for class.
  - SQL check that subject teacher relations are `status=1` and `effective_end_date IS NULL`.
- Observability:
  - Add concise logs in aggregate save for schoolId, classId, headTeacherId, subjectTeacherCount, without logging sensitive payloads.

## Rollback / Recovery

- If selector APIs are wrong, front-end can continue using old `/api/v1/school/teachers` while backend fix is prepared.
- If aggregate save has an issue before release, disable front-end usage and keep old `/api/v1/school/class/add` path unaffected.
- If data is partially written despite transaction expectations, recovery SQL should:
  - find class by created ID,
  - close/delete related `class_head_teacher`,
  - logic-delete related `teacher_class_subject`,
  - logic-delete class row.
- No schema migration is planned. If implementation discovers missing DB defaults for `teacher_class_subject.status` or effective dates, stop and create a separate SQL migration plan.

## Plan Self-Review

- Placeholder scan: No placeholder sections; open questions are explicit.
- Consistency check: PRD FRs map to U1-U7; endpoint namespace is consistent under `/api/v1/school/class/create-drawer`.
- Scope check: Plan stays backend-only and does not alter front-end, exam flow, `/api/v1/school/teachers`, or `/api/v1/school/class/add`.
- Acceptance coverage:
  - AC1: U1, U3, U5.
  - AC2: U1, U2, U5.
  - AC3: U2.
  - AC4: U4, U5.
  - AC5: U4.
  - AC6: U4.
  - AC7: U3, U4, U6.
  - AC8: U5.
- Validation gaps: Final local smoke testing requires a running service and token; plan covers unit/controller tests first.
- Alternatives and ADR check: Three alternatives considered; three ADRs recorded.
- High-risk pre-mortem check: Auth/permissions, public API contract, raw phase ambiguity, and data consistency risks are covered.

## Handoff

Implementation completed serially through U1 -> U7. Related PRD, plan, API contract, analysis, progress record, and final gate are archived under `docs/00-process/archive/2026-06/class-create-drawer-backend/`.
