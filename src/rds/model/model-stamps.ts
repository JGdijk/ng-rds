import {Model} from "./model";
import {ModelStamp} from "./model-stamp";

export class ModelStamps {

    public init(model: Model): Model {
        return this.set(model, null, 'init');
    }

    public added(model: Model, time: number): Model {
        return this.set(model, time, 'added');
    }

    public updated(model: Model, time: number): Model {
        return this.set(model, time, 'updated');
    }

    public relationUpdated(model: Model, time: number): Model {
        return this.set(model, time, 'relationUpdated');
    }

    /*************************** helpers ***************************
     ******************************************************************/

    private set(model: Model, time: number, action: string): Model {
        let stamp = this.checkStamp(model, time);
        stamp[action] = true;
        model.modelStamp = stamp;
        return model;
    }

    private checkStamp(model: Model, time: number): ModelStamp {
        if (!model.modelStamp || !model.modelStamp.timestamp) return this.newStamp(time);
        if (model.modelStamp.timestamp === time) return model.modelStamp;
        return this.newStamp(time);
    }

    private newStamp(time: number): ModelStamp {
        return {
            init: false,
            added: false,
            updated: false,
            relationUpdated: false,
            timestamp: time
        }
    }

}

export const modelStamps = new ModelStamps();