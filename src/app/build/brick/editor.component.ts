import { Component, ViewChild, Input } from "@angular/core";
import * as InlineEditor from '@ckeditor/ckeditor5-build-inline';
import { DatabaseService } from "../../database/database.service";

@Component({
    selector: "editor",
    template: `
    <ckeditor [editor]="editor" [(ngModel)]="brick[prop]" (blur)="save(brick.prep)"></ckeditor>
    `
})
export class EditorComponent {
    public editor = InlineEditor;
    @Input() brick;
    @Input() prop;

    constructor(private db: DatabaseService) {

    }

    save(data) {
        console.log(data);
        if(this.brick) {
            this.db.saveBrick(this.brick, data)
        }
    }

}
