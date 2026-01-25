# Bug Report - Insurance System Frontend/Backend Sync Issues

## Enum Mismatch Bugs

These bugs are caused by frontend/backend enum value mismatches. When the frontend sends a value that doesn't exist in the backend enum, or the backend returns a value the frontend can't handle, it causes `IllegalArgumentException` (400 Bad Request) or display issues.

---

### 1. CoverageType Enum Mismatch - FIXED

**Status:** FIXED

**Issue:** Frontend PolicyList.jsx had coverage type options `DENTAL` and `OPTICAL` that didn't exist in backend CoverageType enum.

**Files Affected:**
- `InsuranceSystem/src/main/java/com/insurancesystem/Model/Entity/Enums/CoverageType.java`
- `InsuranceSystemFrontEnd/src/Component/Manager/Policies/PolicyList.jsx` (lines 1122-1123)

**Fix Applied:** Added `DENTAL` and `OPTICAL` to backend CoverageType enum.

---

### 2. ClaimStatus Enum Mismatch - FIXED

**Status:** FIXED

**Issue:** Frontend has claim status values that don't exist in the backend ClaimStatus enum.

**Frontend-only values (not in backend):**
- `PENDING_COORDINATION`
- `APPROVED_MEDICAL`
- `REJECTED_MEDICAL`

**Fix Applied:** Added `PENDING_COORDINATION`, `APPROVED_MEDICAL`, and `REJECTED_MEDICAL` to backend ClaimStatus enum.

**Files Modified:**
- `InsuranceSystem/src/main/java/com/insurancesystem/Model/Entity/Enums/ClaimStatus.java`

---

### 3. FamilyRelation Enum Mismatch - FIXED

**Status:** FIXED

**Issue:** Frontend references `HUSBAND` as a family relation value, but backend FamilyRelation enum didn't have it.

**Fix Applied:**
- Added `HUSBAND` to backend FamilyRelation enum
- Added `HUSBAND` option to frontend AdminRegisterAccounts.jsx family member dropdown

**Files Modified:**
- `InsuranceSystem/src/main/java/com/insurancesystem/Model/Entity/Enums/FamilyRelation.java`
- `InsuranceSystemFrontEnd/src/Component/Manager/Accounts/AdminRegisterAccounts.jsx`

---

### 4. PolicyStatus Enum - Missing Frontend Option - FIXED

**Status:** FIXED

**Issue:** Backend PolicyStatus enum has `EXPIRED` value, but frontend PolicyList.jsx only offered `ACTIVE` and `INACTIVE` options.

**Fix Applied:** Added `EXPIRED` option to frontend PolicyList.jsx status dropdown.

**Files Modified:**
- `InsuranceSystemFrontEnd/src/Component/Manager/Policies/PolicyList.jsx`

---

### 5. EMERGENCY_MANAGER Role Reference - FIXED

**Status:** FIXED

**Issue:** Frontend referenced `EMERGENCY_MANAGER` role that was removed from backend RoleName enum.

**Fix Applied:** Removed dead code checking for EMERGENCY_MANAGER role and removed unused EmergencySidebar/EmergencyHeader imports from PendingEmergencyRequests.jsx. The component now always uses Manager components.

**Files Modified:**
- `InsuranceSystemFrontEnd/src/Component/Manager/Emergency Request/PendingEmergencyRequests.jsx`

---

## Previously Fixed Bugs

### API Response .data Access Bug - FIXED

See [bugfix.md](./bugfix.md) for details on the `.data` access bugs that were fixed across all profile, dashboard, chat, and form components.

---

## All Bugs Fixed!

All enum mismatch bugs have been resolved.

**To apply the fixes:**
1. Restart the Spring Boot backend server to load the new enum values
2. Restart the React frontend development server

**Testing Recommendations:**
1. Test policy creation/viewing in Manager account
2. Test claim workflow through all statuses
3. Test family member registration with all relation types (including HUSBAND)
4. Test emergency request handling
5. Test setting policy status to EXPIRED
