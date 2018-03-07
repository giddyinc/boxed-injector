declare namespace Injector {
  export interface BaseOptions {
    depends: Array<string> | string | { [key: string]: any }
  }

  export interface FactoryOptions extends BaseOptions {}
  export interface RegisterOptions extends BaseOptions {}

  export interface Entity {
    factory: any,
    depends: Array<string>,
    options?: {
      function: boolean
    }
  }
}

declare class Injector {
  constructor();

  set(key: any, value: any): this;

  has(key: any): boolean;

  factory(name: string, factory: any, options?: Injector.FactoryOptions): this;

  register(name: string, factory: any, options?: Injector.RegisterOptions): this;

  inject(entity: Injector.Entity): any;

  create(name: string, otherArgs: any): any;

  graph(name: string, nested: boolean): Array<string>;

  get(name: string): any;

  middleware(name: string, method: Function): this;
  middleware(method: Function): this;
}

declare namespace Locator {
  function set(injector: Injector): any;

  function get(): Injector;
}

export {
  Injector,
  Locator
};
