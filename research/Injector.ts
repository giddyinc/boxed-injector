import { isString } from 'util';
import _ from 'lodash';
export interface IVehicle {
    beep(): void;
}
export interface ICar extends IVehicle {
    drive(): void;
}

export interface ITruck extends IVehicle {
    horn(): void;
}

class Car implements ICar {
    public beep = () => { };
    public drive() {
        // tslint:disable-next-line:no-console
        console.log('woohoo');
    }
}

class Truck implements ITruck {
    public beep = () => { };
    public horn() {
        // tslint:disable-next-line:no-console
        console.log('sup');
    }
}

interface ITypes {
    [key: string]: any;
    Car: ICar;
    Truck: ITruck;
}

class Injector<T> {

    public instances;

    public _fromString<K extends keyof T>(key: K): T[K] {
        return this.instances[key].instance;
    }
    public get<K extends keyof T>(key: K): T[K];
    public get<K1 extends keyof T>(keys: [K1]): [T[K1]];
    public get<K1 extends keyof T, K2 extends keyof T>(keys: [K1, K2]): [T[K1], T[K2]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T>(keys: [K1, K2, K3]): [T[K1], T[K2], T[K3]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T>(keys: [K1, K2, K3, K4]): [T[K1], T[K2], T[K3], T[K4]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T>(keys: [K1, K2, K3, K4, K5]): [T[K1], T[K2], T[K3], T[K4], T[K5]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T, K20 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19, K20]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19], T[K20]];
    public get<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T, K7 extends keyof T, K8 extends keyof T, K9 extends keyof T, K10 extends keyof T, K11 extends keyof T, K12 extends keyof T, K13 extends keyof T, K14 extends keyof T, K15 extends keyof T, K16 extends keyof T, K17 extends keyof T, K18 extends keyof T, K19 extends keyof T, K20 extends keyof T, K21 extends keyof T>(keys: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19, K20, K21]): [T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9], T[K10], T[K11], T[K12], T[K13], T[K14], T[K15], T[K16], T[K17], T[K18], T[K19], T[K20], T[K21]];
    public get<K extends keyof T, U extends { [name: string]: K }>(key: U): { [V in keyof U]: T[U[V]]; };
    public get<K extends keyof T>(key: { [key: string]: K }) {
        const {
            instances
        } = this;

        function isK(object: any): object is K {
            return isString(object);
        }
        function isKArray(object: any): object is K[] {
            return Array.isArray(object);
        }

        if (isString(key)) {
            const instance = instances[key].instance;
            return instance;
            // return this._fromString(key);
        } else if (isKArray(key)) {
            return key.map((k) => this._fromString(k));
        } else {
            // return Object.entries(keys).reduce((result, [key, value]: [string, K]) => {
            //     result[key] = this.getProperty(value);
            //     return result;
            // }, def);

            const def: { [key: string]: T[K] } = {};
            const mapResult = Object.entries(key).reduce((result, [key, name]) => {
                const instance = instances[name].instance;
                result[key] = instance;
                return result;
            }, def);
            return mapResult;
        }
    }
}
const injector = new Injector<ITypes>();
// type ITypeOption = IType;
const m = new Map<string, any>();


(() => {
    const {
        foo,
        bar
    } = injector.get({
        foo: 'Car',
        bar: 'Truck',
    });
    foo.drive();
    bar.horn();


    const [t] = injector.get(['Truck']);
    t.beep();
    t.horn();

    const [car, truck, car2, donkey] = injector.get(['Car', 'Truck', 'Car', 'dn']);
    car.drive();
    truck.horn();
    car.beep();
    truck.beep();

})();
(() => {
    const car = injector.get('Car');
    car.drive();
})();

function pluck<T, K extends keyof T>(o: T, names: K[]): Array<T[K]> {
    return names.map((n) => o[n]);
}


interface IPerson {
    name: string;
    age: number;
}

const person: IPerson = {
    name: 'Jarid',
    age: 35
};

const [name, age] = pluck(person, ['name', 'age']); // ok, string[]



function getProperty<T, K extends keyof T>(o: T, name: K): T[K] {
    return o[name];
}

const a = getProperty(person, 'age');
// a: number
const n = getProperty(person, 'name');
// n: string

const getProperties = <T>(obj: T, keys: Array<keyof T>) => keys.map((arg) => getProperty(obj, arg));

const [a2, n2] = getProperties(person, ['name', 'age']);
// a2: string | number
// n2: string | number

// goal: 
// a2: string
// n2: number

