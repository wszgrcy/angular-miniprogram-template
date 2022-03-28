import { NgModule } from '@angular/core';
import { FirstModule } from '../../lib/first/first.module';
import { FirstTestComponent } from './first-test.component';

@NgModule({
  declarations: [FirstTestComponent],
  imports: [FirstModule],
  exports: [],
  providers: [],
})
export class FirstTestModule {}
