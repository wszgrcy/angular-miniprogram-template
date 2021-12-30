import { NgModule } from '@angular/core';
import { CommonModule } from 'angular-miniprogram/common';
import { Page1Component } from './page1.component';
import { FirstModule } from 'first';
@NgModule({
  declarations: [Page1Component],
  imports: [CommonModule, FirstModule],
  providers: [],
  bootstrap: [],
  exports: [Page1Component],
})
export class Page1Module {}
