import { Comp, ComponentAttempt } from "../../../schema";
import { Component, Input } from "@angular/core";

import {MatButtonToggleChange} from "@angular/material/button-toggle";
import { MAT_CHECKBOX_CLICK_ACTION } from "@angular/material/checkbox";

import { register } from './comp_index';
import { CompComponent } from "./comp.component";

export class CompMultipleChoice extends Comp {
    name = "Multiple Choice";
    data: { choices:string[], reveals:string[], correctAnswers: number }

    constructor(data: { choices:string[], reveals:string[], correctAnswers: number }) {
        super();
        this.data = data;
    }
}

@register("MultipleChoice")
@Component({
    selector: "multiple-choice",
    template: `
    <mat-button-toggle-group name="choice" class="choice" fxLayout="column" fxLayoutGap="0px" fxLayoutAlign="center center" multiple>
        <mat-button-toggle ngDefaultControl [checked]="answers[getChoice(choice)]" (change)="changeAnswer($event, i)" name="choice-{{i}}" class="flex-choice" fxLayout="column" fxLayoutAlign="stretch stretch" *ngFor="let choice of data.data.choices | shuffle; let i = index" [value]="choice">
            <div fxLayout="row" fxLayoutAlign="space-around center">
                <mat-checkbox *ngIf="attempt" [checked]="getState(choice) == 1" [indeterminate]="getState(choice) == -1" disabled></mat-checkbox>
                <div fxLayout="column">
                    <div fittext [minFontSize]="15">{{ choice }}</div>
                    <div *ngIf="attempt" class="reveal" fittext [minFontSize]="15">{{ data.data.reveals[getChoice(choice)] }}</div>
                </div>
            </div>
        </mat-button-toggle>
    </mat-button-toggle-group>
    `,
    styleUrls: ["../live.component.scss"],
    providers: [
        {provide: MAT_CHECKBOX_CLICK_ACTION, useValue: 'noop'}
    ]
})
export class MultipleChoiceComponent extends CompComponent {
    constructor() { super() }

    ngOnInit() {
        // Set all the choices as false initially
        this.answers = this.data.data.choices.map(() => false);
        if(this.attempt) {
            this.attempt.answer
                // Filter to see if more choices have been made than correctAnswers
                .filter(val => val < this.data.data.correctAnswers)
                .forEach(val => { this.answers[val] = true });
        }
    }

    @Input() data: CompMultipleChoice;
    answers: boolean[];

    changeAnswer(event: MatButtonToggleChange, index: number) : void {
        this.answers[this.getChoice(event.value)] = event.source.checked ? true : false;
    }

    getAnswer() : number[] {
        let a = [];
        // For each choice if true push to a (correct answer array)
        this.answers.forEach((answer, index) => {
            if(answer) a.push(index);
        })
        return a;
    }

    getChoice(choice) : number {
        return this.data.data.choices.indexOf(choice);
    }

    getState(choice) : number {
        if(this.attempt.answer.indexOf(this.getChoice(choice)) != -1) {
            if(this.getChoice(choice) < this.data.data.correctAnswers) {
                return 1;
            } else {
                return -1;
            }
        } else {
            return 0;
        }
    }

    mark(attempt: ComponentAttempt, prev: ComponentAttempt) : ComponentAttempt {
        // If the question is answered in review phase, add 2 to the mark and not 5.
        let markIncrement = prev ? 2 : 5;
        attempt.correct = true;
        attempt.marks = 0;
        // The maximum number of marks is the number of answers * 5.
        attempt.maxMarks = this.data.data.correctAnswers * 5;
        // For every option...
        this.data.data.choices.forEach((ans, i) => {
            // if the option is within the set of correct answers...
            if(i <= this.data.data.correctAnswers) {
                // and the option doesn't correspond to one answer given...
                if(attempt.answer.indexOf(i) == -1) {
                    // the answer is not correct.
                    attempt.correct = false;
                } else {
                    // if not, and the program is in the live phase...
                    if(!prev) {
                        // increase the marks by 5.
                        attempt.marks += markIncrement;
                    }
                    // or the answer has changed between live and review...
                    else if(prev.answer.indexOf(ans) == -1) {
                        // increase the marks by 2.
                        attempt.marks += markIncrement;
                    }
                }
            }
            // if not...
            else {
                // and the option corresponds to one answer given...
                if(attempt.answer.indexOf(i) != -1) {
                    // the answer is not correct.
                    attempt.correct = false;
                }
            }
        })
        // Then, if the attempt scored no marks and the program is in live phase, then give the student a mark.
        if(attempt.marks == 0 && attempt.answer != [] && !prev) attempt.marks = 1;
        return attempt;
    }

    public trackByIndex(index: number, item) {
        return index;
    }
}
