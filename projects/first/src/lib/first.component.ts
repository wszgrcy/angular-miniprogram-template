import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-first',
  template: `
    <p class="first">
      这是一个支持小程序的组件库组件
    </p>
  `,
  styleUrls:[]
})
export class FirstComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
