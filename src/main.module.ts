import { NgModule } from '@angular/core';
import { DoBootstrap } from '@angular/core';
import { WeixinMiniProgramModule } from 'angular-miniprogram';
@NgModule({
  declarations: [],
  imports: [WeixinMiniProgramModule],
  exports: [],
  providers: [],
})
export class MainModule implements DoBootstrap {
  constructor() {}
  ngDoBootstrap() {}
}
