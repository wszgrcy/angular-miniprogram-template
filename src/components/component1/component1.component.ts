import { Component, Inject, OnInit } from '@angular/core';
import {
  APP_TOKEN,
  PAGE_TOKEN,
} from 'angular-miniprogram';

@Component({
  selector: 'app-component1',
  templateUrl: './component1.component.html',
  standalone: true,
})
export class Component1Component implements OnInit {
  constructor(
    @Inject(APP_TOKEN) appInstance: any,
    @Inject(PAGE_TOKEN) pageInstance: any
  ) {}

  ngOnInit() {}
}
