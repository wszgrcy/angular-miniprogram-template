import { NgModule } from '@angular/core';
import { CommonModule } from 'angular-miniprogram/common';
import { Page1Component } from './page1.component';
import { FirstModule } from 'first';
import { Component1Component } from '../../components/component1/component1.component';
@NgModule({
  declarations: [Page1Component],
  imports: [CommonModule, FirstModule, Component1Component],
  providers: [],
  bootstrap: [],
  exports: [Page1Component],
})
export class Page1Module {}
