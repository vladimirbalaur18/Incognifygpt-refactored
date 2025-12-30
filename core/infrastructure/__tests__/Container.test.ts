import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../Container';

describe('Container', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
    });

    describe('register and resolve', () => {
        it('should register and resolve a service', () => {
            container.register('test', () => ({ value: 'test' }));

            const service = container.resolve<{ value: string }>('test');
            expect(service.value).toBe('test');
        });

        it('should throw error when resolving unregistered service', () => {
            expect(() => {
                container.resolve('nonExistent');
            }).toThrow("Service 'nonExistent' is not registered in the container");
        });

        it('should return same instance for singleton services', () => {
            let callCount = 0;
            container.register('singleton', () => {
                callCount++;
                return { id: callCount };
            }, true);

            const instance1 = container.resolve<{ id: number }>('singleton');
            const instance2 = container.resolve<{ id: number }>('singleton');

            expect(instance1).toBe(instance2);
            expect(instance1.id).toBe(1);
            expect(callCount).toBe(1);
        });

        it('should create new instance for non-singleton services', () => {
            let callCount = 0;
            container.register('transient', () => {
                callCount++;
                return { id: callCount };
            }, false);

            const instance1 = container.resolve<{ id: number }>('transient');
            const instance2 = container.resolve<{ id: number }>('transient');

            expect(instance1).not.toBe(instance2);
            expect(instance1.id).toBe(1);
            expect(instance2.id).toBe(2);
            expect(callCount).toBe(2);
        });
    });

    describe('dependency resolution', () => {
        it('should resolve dependencies automatically', () => {
            container.register('dependency', () => ({ name: 'Dependency' }));
            container.register('service', () => ({
                dep: container.resolve<{ name: string }>('dependency'),
            }));

            const service = container.resolve<{ dep: { name: string } }>('service');
            expect(service.dep.name).toBe('Dependency');
        });

        it('should handle circular dependencies gracefully', () => {
            container.register('a', () => ({
                b: container.resolve('b'),
            }));
            container.register('b', () => ({
                a: container.resolve('a'),
            }));

            // This will cause infinite loop if not handled properly
            // In a real scenario, you'd want lazy resolution
            expect(() => {
                container.resolve('a');
            }).toThrow();
        });
    });

    describe('has', () => {
        it('should return true for registered services', () => {
            container.register('test', () => ({}));
            expect(container.has('test')).toBe(true);
        });

        it('should return false for unregistered services', () => {
            expect(container.has('nonExistent')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all registered services', () => {
            container.register('test1', () => ({}));
            container.register('test2', () => ({}));

            expect(container.has('test1')).toBe(true);
            expect(container.has('test2')).toBe(true);

            container.clear();

            expect(container.has('test1')).toBe(false);
            expect(container.has('test2')).toBe(false);
        });

        it('should clear singleton cache', () => {
            let callCount = 0;
            container.register('singleton', () => {
                callCount++;
                return { id: callCount };
            }, true);

            container.resolve('singleton');
            expect(callCount).toBe(1);

            container.clear();
            container.register('singleton', () => {
                callCount++;
                return { id: callCount };
            }, true);

            const instance = container.resolve<{ id: number }>('singleton');
            expect(instance.id).toBe(2);
            expect(callCount).toBe(2);
        });
    });
});

