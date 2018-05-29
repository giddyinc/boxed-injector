import { IDependencies } from '../src/Injector/interfaces';

export const types = {
    Bose: 'Bose',
    COLOR_CONFIG: 'COLOR_CONFIG',
    VOLUME_CONFIG: 'VOLUME_CONFIG',
    Car: 'Car',
    Boat: 'Boat',
    Stereo: 'Stereo',
    Motorcycle: 'Motorcycle',
    Jetski: 'Jetski'
};

export const PREFERRED_COLOR = 'black';
export const PREFERRED_VOLUME = 'loud';

//#region array
export class Stereo {
    static get inject(): IDependencies {
        return [
            types.VOLUME_CONFIG,
            types.COLOR_CONFIG
        ];
    }
    constructor(
        private volume: string,
        private color: string
    ) {}
}

export class Bose {
    constructor(
        private volume: string,
        private color: string
    ) {}
}
//#endregion array

export class Car {
    static get inject(): IDependencies {
        return types.Bose;
    }
    constructor(private stereo: Stereo) {}
}
export class Motorcycle {
    constructor(private stereo: Stereo) {}
}

export class Boat {
    private stereo: Stereo;
    private color: string;
    constructor({ stereo, color }) {
        this.stereo = stereo;
        this.color = color;
    }
}
export class Jetski {
    static get inject(): IDependencies {
        return {
            stereo: types.Bose,
            color: types.COLOR_CONFIG
        };
    }
    private stereo: Stereo;
    private color: string;
    constructor({ stereo, color }) {
        this.stereo = stereo;
        this.color = color;
    }
}
