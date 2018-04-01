
export type IMiddlewareFunc = (x: any) => any;

export interface IMapDependency {
    [key: string]: any;
}

export type IDependency = string[] | string | IMapDependency;

export interface IBaseOptions {
    depends?: IDependency;
    function?: boolean;
}

export interface IEntityMiddleware {
    before: any[];
    after: any[];
}

export interface IGlobalMiddlewares {
    [key: string]: any[];
}

export interface IMiddlewares {
    [key: string]: IEntityMiddleware;
}

export interface IRegisterable {
    name: string;
    options: IBaseOptions;
}

export interface IInstance extends IRegisterable {
    name: string;
    instance?: any;
    depends: string[] | string | { [key: string]: any };
    /**
     * Origin Factory
     */
    factory?: new (...any) => IInstance;
}

export interface IFactory extends IInstance, IRegisterable {
    instance?: any;
    depends: string[] | { [key: string]: any };
    factory: new (...any) => IInstance;
}

export enum LifeCycle {
    BEFORE = 'before',
    AFTER = 'after'
}
