
import { Injector } from '../src';
import expect from 'expect';
// const n = 700;
const depsPerFactory = 3;
const numberOfFactories = 2000;
const injector = new Injector({
    // cyclicDependencyThreshhold: numberOfFactories + 1
});

// mocha --require ts-node/register test/perf.ts

const classFactory = (dep: number) => {
    class Thing {
        public static inject = [];
        constructor(...args) {
            args.forEach((a, i) => {
                this[i] = a;
            });
        }
    }

    const numDeps = Math.min(dep, depsPerFactory);

    for (let i = 1; i <= numDeps; i++) {
        Thing.inject.push((dep - i).toString());
    }

    // console.log(`Dep: ${dep} nested dependencies: `, Thing.inject);
    return Thing;
};

// register first one as heuristic
injector.register('0', 'FOO');

for (let i = 1; i < numberOfFactories; i++) {
    const factory = classFactory(i);
    injector.factory(i.toString(), factory);
}

const final = (numberOfFactories - 1).toString();

(() => {
    console.time('Huge Array');
    const all = new Array(numberOfFactories)
        .fill('')
        .map((x, i) => i.toString())
        .reverse()
    ;
    // console.log(all);
    const allPackages = injector.get(all);
    // console.log(pkg);
    // console.log(JSON.stringify(pkg, null, 2));
    // console.log(allPackages[numberOfFactories - 1]);

    console.timeEnd('Huge Array');
})();

describe('', () => {
    it('should work', function() {
        this.timeout(10000);
        const result = injector.get((numberOfFactories - 1).toString());
        // console.log(result);
        expect(result['0']['0']['0']['0']['0']['0']['0']['0']).toExist();
    });
});

// nodemon --require ts-node/register test/perf.ts
