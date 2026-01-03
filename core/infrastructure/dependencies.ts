import { Container } from './Container';

import { Scanner } from '@/core/domain/scanner/Scanner';
import { IssueService } from '@/core/application/services/issue/IssueService';
import { ScanService } from '@/core/application/services/scan/ScanService';
import { ScanTextUseCase } from '@/core/application/use-cases/scan/ScanTextUseCase';
import { DismissIssueUseCase } from '@/core/application/use-cases/issue/DismissIssueUseCase';
import { GetActiveIssuesUseCase } from '@/core/application/use-cases/issue/GetActiveIssuesUseCase';
import { IStorageService, StorageService } from '@/core/application/services/StorageService';
import { IStrategyRegistry } from '@/core/application/services/violation/StrategyRegistry';
import { ViolationStrategyRegistryFactory } from '@/core/application/services/violation/ViolationStrategyRegistryFactory';
import { IIssueRepository, IssueRepository } from '@/core/domain/repositories/IssueRepository';

/**
 * Application-wide dependency injection container
 * All dependencies should be resolved through this container
 */
export const container = new Container();

// Register core infrastructure services
container.register<IStorageService>('storage', () => new StorageService(), true);

// Register domain services
container.register<IStrategyRegistry>(
    'strategyRegistry',
    () => ViolationStrategyRegistryFactory.create(),
    true
);

container.register<Scanner>(
    'scanner',
    () => new Scanner(container.resolve<IStrategyRegistry>('strategyRegistry')),
    true
);

// Register repositories
container.register<IIssueRepository>(
    'issueRepository',
    () => new IssueRepository(container.resolve<IStorageService>('storage')),
    true
);

// Register application services
container.register<IssueService>(
    'issueService',
    () => new IssueService(container.resolve<IIssueRepository>('issueRepository')),
    true
);

container.register<ScanService>(
    'scanService',
    () => new ScanService(
        container.resolve<Scanner>('scanner'),
        container.resolve<IStrategyRegistry>('strategyRegistry')
    ),
    true
);

// Register use cases
container.register<ScanTextUseCase>(
    'scanTextUseCase',
    () => new ScanTextUseCase(
        container.resolve<ScanService>('scanService'),
        container.resolve<IssueService>('issueService')
    ),
    true
);

container.register<DismissIssueUseCase>(
    'dismissIssueUseCase',
    () => new DismissIssueUseCase(container.resolve<IssueService>('issueService')),
    true
);

container.register<GetActiveIssuesUseCase>(
    'getActiveIssuesUseCase',
    () => new GetActiveIssuesUseCase(container.resolve<IssueService>('issueService')),
    true
);

/**
 * Convenience functions for common dependencies
 */
export const getStorage = () => container.resolve<IStorageService>('storage');
export const getStrategyRegistry = () => container.resolve<IStrategyRegistry>('strategyRegistry');
export const getScanner = () => container.resolve<Scanner>('scanner');
export const getIssueRepository = () => container.resolve<IIssueRepository>('issueRepository');
export const getIssueService = () => container.resolve<IssueService>('issueService');
export const getScanService = () => container.resolve<ScanService>('scanService');
export const getScanTextUseCase = () => container.resolve<ScanTextUseCase>('scanTextUseCase');
export const getDismissIssueUseCase = () => container.resolve<DismissIssueUseCase>('dismissIssueUseCase');
export const getGetActiveIssuesUseCase = () => container.resolve<GetActiveIssuesUseCase>('getActiveIssuesUseCase');

