
export class Injector {
    constructor();

    create(name: any, otherArgs: any, ...args: any[]): any;

    factory(name: string, _factory: any): any;

    get(name: string): any;

    inject(Factory: any): any;

    middleware(name: string, method: any): any;

    register(name: string, instance: any): any;

}

export namespace Injector {
    namespace prototype {
        function create(name: string, otherArgs: any, ...args: any[]): any;

        function factory(name: string, _factory: any): any;

        function get(name: string): any;

        function inject(Factory: any): any;

        function middleware(name: string, method: any): any;

        function register(name: string, instance: any): any;

        namespace create {
            const prototype: {
            };

        }

        namespace factory {
            const prototype: {
            };

        }

        namespace get {
            const prototype: {
            };

        }

        namespace inject {
            const prototype: {
            };

        }

        namespace middleware {
            const prototype: {
            };

        }

        namespace register {
            const prototype: {
            };

        }

    }

}

export namespace Locator {
    function get(): Injector;

    function set(injector: Injector): void;

    namespace get {
        const prototype: {
        };

    }

    namespace set {
        const prototype: {
        };

    }

}

