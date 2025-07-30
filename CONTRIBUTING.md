# Contributing to VoyageAI

## Development Guidelines

### Numeric vs. Token Dimensions

**Important**: Only React Native components explicitly documented to accept `"small"` / `"large"` may use those strings. For all others, pass a numeric literal or constant.

#### ✅ Allowed (documented components)
```tsx
<ActivityIndicator size="large" />  // ✅ RN docs allow this
<Avatar size="large" />             // ✅ Some UI kits allow this
```

#### ❌ Forbidden (use numeric instead)
```tsx
<Icon size="large" />               // ❌ Use size={32}
<View width="large" />              // ❌ Use width={100}
<Button height="large" />           // ❌ Use height={48}
```

#### ✅ Correct Usage
```tsx
<Icon size={32} />                  // ✅ Numeric literal
<View width={100} />                // ✅ Numeric literal
<Button height={48} />              // ✅ Numeric literal
```

### Pre-commit Checks

Before committing, run:
```bash
npm run lint
npm run check-large-props
npm run typecheck
```

### Debugging "large" String Issues

If you encounter the error `"Unable to convert string to floating point value: 'large'"`:

1. Run `npm run check-large-props` to find any "large" string usage
2. Check if any dependencies are passing "large" as a default prop
3. Use the Guard component in `app/tabs/_layout.tsx` to catch the offender
4. Replace string values with numeric literals

### Type Safety

We enforce strict TypeScript to prevent these issues:
- `"strict": true` in tsconfig.json
- `"noImplicitAny": true`
- `"strictNullChecks": true`

This ensures correct prop types at compile time. 