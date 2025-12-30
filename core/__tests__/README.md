# Test Suite

This directory contains comprehensive tests for the IncognifyGPT codebase.

## Setup

First, install the testing dependencies:

```bash
npm install
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized to mirror the source code structure:

```
core/
├── __tests__/
│   ├── Container.test.ts              # DI Container tests
│   └── ...
├── application/
│   ├── use-cases/
│   │   └── __tests__/
│   │       ├── ScanTextUseCase.test.ts
│   │       └── DismissIssueUseCase.test.ts
│   └── services/
│       └── __tests__/
│           └── IssueService.test.ts
├── repositories/
│   └── __tests__/
│       └── IssueRepository.test.ts
└── domain/
    ├── violation/
    │   └── __tests__/
    │       ├── ViolationStrategies.test.ts
    │       └── ViolationFactory.test.ts
    └── issue/
        └── __tests__/
            └── Issue.test.ts
```

## Test Coverage

The test suite covers:

- ✅ **DI Container**: Registration, resolution, singleton behavior
- ✅ **Use Cases**: Business workflow orchestration
- ✅ **Services**: Business logic and operations
- ✅ **Repositories**: Data access layer
- ✅ **Domain Models**: Business entities and factories
- ✅ **Violation Strategies**: Detection rules

## Writing New Tests

When adding new features, follow these patterns:

1. **Use Cases**: Test the complete workflow
2. **Services**: Test business logic in isolation with mocked repositories
3. **Repositories**: Test data access with mocked storage
4. **Domain Models**: Test pure business logic without mocks

Example test structure:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyService', () => {
    let service: MyService;
    let mockDependency: MockDependency;

    beforeEach(() => {
        mockDependency = createMockDependency();
        service = new MyService(mockDependency);
    });

    it('should do something', async () => {
        // Arrange
        vi.mocked(mockDependency.method).mockResolvedValue('value');

        // Act
        const result = await service.doSomething();

        // Assert
        expect(result).toBe('expected');
        expect(mockDependency.method).toHaveBeenCalledOnce();
    });
});
```

