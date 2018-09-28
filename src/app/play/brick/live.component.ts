import { Component, ViewChildren, QueryList, ViewChild, AfterViewInit } from '@angular/core';

import { BrickService } from './brick.service';

import { Brick, Question, BrickAttempt, Student, Pallet } from '../../schema';
import { Observable } from 'rxjs';
import { TimerService, Timer} from './timer.service';
import { BrickTimePipe } from './brickTime.pipe';

import { CompComponent } from './comp/comp.component';
import { QuestionComponent } from './question.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { MatStepper } from '@angular/material';

import * as $ from 'jquery';

@Component({
    selector: 'live',
    templateUrl: './live.component.html',
    styleUrls: ['./live.component.scss'],
    providers: [ ]
})
export class LiveComponent {
    constructor(public bricks: BrickService, timer: TimerService, brickTime: BrickTimePipe, public router: Router, public route: ActivatedRoute, public auth: AuthService) {
        this.brick = bricks.currentBrick.asObservable();
        this.timer = timer.new();
        this.timer.timeResolution = 1000;
        this.brickTime = brickTime;
        bricks.currentBrick.subscribe((data) => {
            if(data != null) {
                this._brick = data;
                this.questionsData = data.questions;
                this.showBrick(this._brick);
            }
        });
    }

    brick: Observable<Brick>;
    timer : Timer;
    questionsData: any[] = [];

    private _brick: Brick;
    private brickTime: BrickTimePipe;

    @ViewChildren(QuestionComponent) questions : QueryList<QuestionComponent>;
    @ViewChild('stepper') stepper: MatStepper;

    showBrick(brick: Brick) {
        let time = this.brickTime.transform(brick.type, "live");
        this.timer.countDown(time);
        this.timer.timeRanOut.subscribe((t) => {
            this.finishBrick();
        })
    }

    goToPrevQuestion() {
        if (this.stepper.selectedIndex > 0) {
            this.stepper.selectedIndex = this.stepper.selectedIndex - 1;
            this.animateStepperHeaderScroller();
        }
    }

    goToNextQuestion() {
        if (this.stepper.selectedIndex < this.questions.length - 1) {
            console.log($('.mat-horizontal-stepper-header-container .mat-horizontal-stepper-header:nth-child(9)').offset().left - $('.mat-horizontal-stepper-header-container').offset().left);
            this.stepper.selectedIndex = this.stepper.selectedIndex + 1;
            this.animateStepperHeaderScroller();
        }
    }

    animateStepperHeaderScroller() {
        $('.mat-horizontal-stepper-header-container').animate({
            scrollLeft: $(window).width() / 100 * 80 * (this.stepper.selectedIndex)
        }, 'slow');        
    }

    moveToNextQuestion() {
        if (this.stepper.selectedIndex == this.questions.length - 1) {
            this.finishBrick();
        }
        else {
            this.stepper.selectedIndex = this.stepper.selectedIndex + 1;
               this.animateStepperHeaderScroller();
        }
    }

    finishBrick() {
        this.timer.stop();
        console.log("finished in " + this.timer.timeElapsed.getTime() / 1000);

        // Get brick data
        this.auth.user.subscribe((user) => {
            let answers = this.questions.map((question) => {
                return question.getAttempt();
            })
            let score = answers.reduce((acc, answer) => acc + answer.marks, 0);
            let maxScore = answers.reduce((acc, answer) => acc + answer.maxMarks, 0);
            var ba : BrickAttempt = {
                brick: this._brick._ref,
                score: score,
                maxScore: maxScore,
                student: this.bricks.database.afs.doc("students/"+user.uid).ref,
                answers: answers
            };
            console.log(`score is ${score} out of ${maxScore}, which is ${score * 100 / maxScore}%`);
            this.bricks.currentBrickAttempt = ba;
            this.router.navigate(["../summary"], { relativeTo: this.route });
        })
    }

}
