
export type IMiddlewareFunc = (x: any) => any;

export interface IMapDependency {
    [key: string]: any;
}

export type IDependencies = string[] | string | IMapDependency;

export interface IBaseOptions {
    depends?: IDependencies;
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
    depends: IDependencies;
    /**
     * Origin Factory
     */
    factory?: IInstanceConstructor | IInstanceCreatingFunction;
}

export interface IFactory extends IInstance, IRegisterable {
    instance?: any;
    depends: IDependencies;
}

export interface IFunctionalFactory extends IFactory, IRegisterable {
    factory: IInstanceCreatingFunction;
}

export interface IConstructorFactory extends IFactory, IRegisterable {
    factory: IInstanceConstructor;
}

export type IInstanceCreatingFunction = (...any) => IInstance;
export type IInstanceConstructor = new (...any) => IInstance;
