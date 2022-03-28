import { pageStartup } from 'angular-miniprogram';
import { FirstTestComponent } from './first-test.component';
import { FirstTestModule } from './first-test.module';

pageStartup(FirstTestModule, FirstTestComponent);
