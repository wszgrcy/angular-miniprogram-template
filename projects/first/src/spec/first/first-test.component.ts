import { Component, OnInit, ViewChild } from '@angular/core';
import { FirstComponent } from '../../public-api';

@Component({
  selector: 'app-first-test',
  templateUrl: './first-test.component.html',
})
export class FirstTestComponent implements OnInit {
  @ViewChild('first', { static: true }) firstComponent!: FirstComponent;
  constructor() {}

  ngOnInit(): void {}
}
