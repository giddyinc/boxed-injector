
import { IDependencies } from './Injector/interfaces';

export const inject = (dependencies: IDependencies) => (target) => {
    if (Reflect.get(target, 'inject') != null) {
        throw new TypeError('Inject decorator should not overwrite existing properties.');
    }
    Reflect.defineProperty(target, 'inject', {
        value: dependencies,
        enumerable: false,
        configurable: false,
        writable: false
    });
    return target;
};
