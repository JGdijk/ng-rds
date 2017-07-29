import {AddCollector} from "./collectors/add-collector";
import {UpdateCollector} from "./collectors/update-collector";
import {RemoveCollector} from "./collectors/remove-collector";
import {AttachCollector} from "./collectors/attach-collector";
import {DetachCollector} from "./collectors/detach-collector";

export class Collector {

    private addCollector: AddCollector;
    private updateCollector: UpdateCollector;
    private removeCollector: RemoveCollector;
    private attachCollector: AttachCollector;
    private detachCollector: DetachCollector;

    private checked: boolean = false;

    public timeStamp: number;

    public constructor(addCollector?: AddCollector,
                       updateCollector?: UpdateCollector,
                       removeCollector?: RemoveCollector,
                       attachCollector?: AttachCollector,
                       detachCollector?: DetachCollector) {

        this.addCollector = (addCollector) ? addCollector : new AddCollector();
        this.updateCollector = (updateCollector) ? updateCollector : new UpdateCollector();
        this.removeCollector = (removeCollector) ? removeCollector : new RemoveCollector();
        this.attachCollector = (attachCollector) ? attachCollector : new AttachCollector();
        this.detachCollector = (detachCollector) ? detachCollector : new DetachCollector();

        this.timeStamp = Date.now();
    }

    public copy(): Collector {
        return new Collector(
            this.addCollector,
            this.updateCollector,
            this.removeCollector,
            this.attachCollector,
            this.detachCollector
        );
    }

    // public use(key: string): AddCollector | UpdateCollector | RemoveCollector | AttachCollector | DetachCollector { todo types
    public use(key: string): any {
        switch (key) {
            case 'add':
                return this.addCollector;
            case 'update':
                return this.updateCollector;
            case 'remove':
                return this.removeCollector;
            case 'attach':
                return this.attachCollector;
            case 'detach':
                return this.detachCollector;
        }
    }

    public add(key: string, obj: any): void {
        this.addCollector.add(key, obj);
    }

    public update(key: string, obj: any): void {
        this.updateCollector.add(key, obj);
    }

    public remove(key: string, id: number): void {
        this.removeCollector.add(key, id);
    }

    public attach(key: string, target: string, targetId: number, ids: number | number[]): void {
        this.attachCollector.add(key, target, targetId, ids);
    }

    public detach(key: string, target: string, targetId: number, ids: number | number[]): void {
        this.detachCollector.add(key, target, targetId, ids);
    }

    public setChecked(): void {
        this.checked = true;
    }

    public isChecked(): boolean {
        return this.checked;
    }
}
