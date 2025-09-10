# ESLint Improvement Plan

## Overview

This document outlines the plan to address all ESLint issues that were temporarily disabled to unblock the build process. The goal is to gradually re-enable these rules and fix the underlying code quality issues.

## Current Status

All problematic ESLint rules have been temporarily disabled in `.eslintrc.json` to allow the build to complete successfully. This plan provides a systematic approach to re-enable these rules and improve code quality.

## Rules to Address

### 1. TypeScript Rules

#### `@typescript-eslint/no-explicit-any`

**Current Status**: Disabled
**Impact**: High - Allows use of `any` type which defeats TypeScript's type safety
**Plan**:

- [ ] Audit all `any` usages in the codebase
- [ ] Replace with proper TypeScript interfaces/types
- [ ] Use `unknown` for truly unknown types
- [ ] Create generic types where appropriate
- [ ] Add proper type guards

**Files to check**:

- `src/app/components/daily-audit/upload-receipts-drawer.tsx` (line 32: `fileList: any[]`)
- `src/app/components/daily-audit/upload-receipts-drawer.tsx` (line 175: `onChange: ({ fileList }: any)`)
- All other files with `any` usage

#### `@typescript-eslint/no-unused-vars`

**Current Status**: Disabled
**Impact**: Medium - Unused variables indicate dead code
**Plan**:

- [ ] Run ESLint with this rule enabled
- [ ] Remove unused variables
- [ ] Prefix unused parameters with underscore (e.g., `_unused`)
- [ ] Use destructuring to ignore unused properties

#### `@typescript-eslint/no-empty-object-type`

**Current Status**: Disabled
**Impact**: Low - Empty object types are usually unintentional
**Plan**:

- [ ] Replace `{}` with `Record<string, never>` or proper interfaces
- [ ] Use `object` type when appropriate
- [ ] Create specific interfaces for expected object structures

#### `@typescript-eslint/no-wrapper-object-types`

**Current Status**: Disabled
**Impact**: Low - Using wrapper types instead of primitives
**Plan**:

- [ ] Replace `String` with `string`
- [ ] Replace `Number` with `number`
- [ ] Replace `Boolean` with `boolean`
- [ ] Replace `Object` with `object` or specific interfaces

**Files to fix**:

- `src/app/(protected)/transactions/easypay/page.tsx` (line 369: `String`)
- `src/app/models/hr/user.schema.ts` (line 54: `String`)

#### `@typescript-eslint/no-non-null-asserted-optional-chain`

**Current Status**: Disabled
**Impact**: High - Unsafe assertions that can cause runtime errors
**Plan**:

- [ ] Replace `?.!` with proper null checks
- [ ] Use optional chaining with fallback values
- [ ] Add proper type guards
- [ ] Use nullish coalescing operator (`??`)

**Files to fix**:

- `src/app/components/claims/claim-details-drawer.tsx` (line 120)

### 2. React Rules

#### `react/jsx-key`

**Current Status**: Disabled
**Impact**: Medium - Missing keys can cause rendering issues
**Plan**:

- [ ] Add unique `key` props to all array elements
- [ ] Use stable IDs when available
- [ ] Use array index as last resort (not recommended for dynamic lists)

**Files to fix**:

- `src/app/(protected)/daily-activity/page.tsx` (line 330)
- `src/app/(protected)/transactions/easypay/page.tsx` (line 587)
- `src/app/(protected)/transactions/eft/analyze/page.tsx` (line 13)
- `src/app/(protected)/transactions/eft/page.tsx` (line 311)
- `src/app/(protected)/users/page.tsx` (line 382)

#### `react/no-unescaped-entities`

**Current Status**: Disabled
**Impact**: Low - Unescaped quotes can cause JSX parsing issues
**Plan**:

- [ ] Replace `"` with `&quot;` or `&ldquo;`/`&rdquo;`
- [ ] Replace `'` with `&apos;` or `&lsquo;`/`&rsquo;`
- [ ] Use template literals for complex strings

**Files to fix**:

- `src/app/(protected)/policies/signup-requests/page.tsx` (line 661)
- `src/app/(protected)/reports/policies/page.tsx` (lines 587, 600)
- `src/app/auth/forgot-password/page.tsx` (line 91)

#### `react-hooks/exhaustive-deps`

**Current Status**: Disabled
**Impact**: High - Missing dependencies can cause stale closures
**Plan**:

- [ ] Add missing dependencies to dependency arrays
- [ ] Use `useCallback` for functions that are dependencies
- [ ] Use `useMemo` for expensive computations
- [ ] Consider if dependencies should be in the array or if the effect should be restructured

**Files to fix**:

- `src/app/(protected)/daily-activity/page.tsx` (line 190: `fetchReports`)
- `src/app/(protected)/daily-audit/page.tsx` (line 97: `fetchAudits`)
- `src/app/(protected)/transactions/eft-importer/page.tsx` (line 145: `loading`)
- `src/app/components/claims/claim-details-drawer.tsx` (line 63: `refreshClaim`)
- `src/app/components/policy-signup-action-modals.tsx` (line 72: `form`)
- `src/app/hooks/use-session-timeout.ts` (line 88: `handleTimeout`, `showWarning`, `warningThresholdMs`)
- `src/context/auth-context.tsx` (line 66: `fetchUserDetails`, `loading`)

### 3. Next.js Rules

#### `@next/next/no-img-element`

**Current Status**: Disabled
**Impact**: Medium - Using `<img>` instead of optimized `<Image>`
**Plan**:

- [ ] Replace `<img>` with Next.js `<Image>` component
- [ ] Add proper `width` and `height` props
- [ ] Configure image optimization settings
- [ ] Handle loading states appropriately

**Files to fix**:

- `src/app/(protected)/communication/page.tsx` (line 223)
- `src/app/(protected)/policies/view/page.tsx` (line 214)

### 4. General Code Style Rules

#### `prefer-arrow-callback`

**Current Status**: Disabled
**Impact**: Low - Consistency in function syntax
**Plan**:

- [ ] Convert function expressions to arrow functions where appropriate
- [ ] Maintain readability and consistency

#### `prefer-template`

**Current Status**: Disabled
**Impact**: Low - Modern string concatenation
**Plan**:

- [ ] Replace string concatenation with template literals
- [ ] Use template literals for complex strings

#### `semi`

**Current Status**: Disabled
**Impact**: Low - Consistent semicolon usage
**Plan**:

- [ ] Add semicolons where missing
- [ ] Configure Prettier to handle semicolons automatically

#### `quotes`

**Current Status**: Disabled
**Impact**: Low - Consistent quote usage
**Plan**:

- [ ] Standardize on single or double quotes
- [ ] Configure Prettier to handle quotes automatically

#### `prefer-const`

**Current Status**: Disabled
**Impact**: Low - Use `const` for immutable variables
**Plan**:

- [ ] Replace `let` with `const` where variables are not reassigned
- [ ] Use `let` only when variables need to be reassigned

#### `check-file/filename-naming-convention`

**Current Status**: Disabled
**Impact**: Low - Consistent file naming
**Plan**:

- [ ] Rename files to follow kebab-case convention
- [ ] Update imports accordingly
- [ ] Ensure consistency across the codebase

## Implementation Strategy

### Phase 1: High Impact Issues (Week 1-2)

1. Fix `@typescript-eslint/no-explicit-any` - Replace with proper types
2. Fix `@typescript-eslint/no-non-null-asserted-optional-chain` - Add proper null checks
3. Fix `react-hooks/exhaustive-deps` - Add missing dependencies

### Phase 2: Medium Impact Issues (Week 3-4)

1. Fix `react/jsx-key` - Add missing keys
2. Fix `@next/next/no-img-element` - Replace with Next.js Image component
3. Fix `@typescript-eslint/no-unused-vars` - Remove unused variables

### Phase 3: Low Impact Issues (Week 5-6)

1. Fix `react/no-unescaped-entities` - Escape quotes and apostrophes
2. Fix `@typescript-eslint/no-wrapper-object-types` - Use primitive types
3. Fix `@typescript-eslint/no-empty-object-type` - Use proper object types

### Phase 4: Code Style Issues (Week 7-8)

1. Fix `prefer-arrow-callback` - Use arrow functions
2. Fix `prefer-template` - Use template literals
3. Fix `semi` - Add semicolons
4. Fix `quotes` - Standardize quote usage
5. Fix `prefer-const` - Use const where appropriate
6. Fix `check-file/filename-naming-convention` - Rename files

## Testing Strategy

### Before Re-enabling Each Rule

1. Run the full test suite
2. Perform manual testing of affected components
3. Check for any runtime errors
4. Verify build process works correctly

### After Re-enabling Each Rule

1. Run ESLint to ensure no new violations
2. Update CI/CD pipeline to enforce the rule
3. Document any new patterns or conventions

## Tools and Resources

### ESLint Configuration

- Gradually re-enable rules in `.eslintrc.json`
- Use `--fix` flag where possible for automatic fixes
- Configure rule severity levels appropriately

### TypeScript

- Use `strict` mode for better type checking
- Leverage TypeScript's built-in type inference
- Create comprehensive type definitions

### React

- Use React DevTools for debugging
- Leverage React's built-in performance optimizations
- Follow React best practices and patterns

### Next.js

- Use Next.js Image component for optimization
- Leverage Next.js built-in performance features
- Follow Next.js conventions and patterns

## Success Metrics

### Code Quality

- Zero ESLint violations
- Improved TypeScript type coverage
- Reduced runtime errors
- Better code maintainability

### Performance

- Faster build times
- Reduced bundle size
- Better runtime performance
- Improved user experience

### Developer Experience

- Better IDE support
- Improved code completion
- Faster development cycles
- Reduced debugging time

## Maintenance

### Ongoing

- Regular ESLint audits
- Code review integration
- Automated testing
- Performance monitoring

### Documentation

- Update coding standards
- Create style guides
- Document patterns and conventions
- Maintain examples and templates

## Conclusion

This plan provides a systematic approach to improving code quality by addressing all ESLint issues. By following this phased approach, we can gradually improve the codebase while maintaining stability and functionality. The focus should be on high-impact issues first, followed by medium and low-impact issues.

Remember to:

- Test thoroughly before and after each change
- Document any new patterns or conventions
- Update team members on new standards
- Monitor for any regressions or issues

This plan should be reviewed and updated regularly as the codebase evolves and new patterns emerge.
