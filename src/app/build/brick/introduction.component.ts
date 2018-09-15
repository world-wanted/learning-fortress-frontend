import { Component } from '@angular/core';

import { ActivatedRoute, Router, ParamMap } from '@angular/router';

import { switchMap } from 'rxjs/operators';
import * as InlineEditor from '@ckeditor/ckeditor5-build-inline';

import { Brick, Pallet } from '../../schema';
import { BrickService } from './brick.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { TimerService, Timer } from './timer.service';
import { BrickTimePipe } from './brickTime.pipe';
import { DatabaseService } from '../../database/database.service';

@Component({
    selector: 'introduction',
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent {
    constructor(private bricks: BrickService, timer: TimerService, private brickTime: BrickTimePipe, private router: Router, private route: ActivatedRoute) {
        this.timer = timer.new();
        this.timer.timeResolution = 1000;
        this.aBrick = bricks.currentBrick;
        this.aBrick.subscribe(val => {
            if(val != null) {
                this.aPallet = bricks.currentPallet;
                this.showBrick(val);
            }
        });
    }

    aBrick: BehaviorSubject<Brick>;
    aPallet: Observable<Pallet>;
    timer: Timer;

    _brick: Brick;

    showBrick(brick: Brick) {
        this._brick = brick;
        let time = this.brickTime.transform(brick.type, "intro");
        this.timer.countDown(time);
        this.timer.timeRanOut.subscribe((t) => {
            this.startBrick();
        })
    }

    startBrick() {
        this.router.navigate(['../live'], { relativeTo: this.route })
    }
}
