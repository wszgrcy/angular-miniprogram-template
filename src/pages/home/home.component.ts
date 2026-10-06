import {
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { AgentNode } from 'angular-miniprogram/platform';
import { TabbarState } from '../../services/tabbar.state';
import { FormsModule } from 'angular-miniprogram/forms';
import {
  ProjDefaultComponent,
  ProjNamedComponent,
  ProjNoneComponent,
} from './projection/projection.components';

/** 一次 boundingClientRect 的返回，够用就行 */
type Rect = { width: number; height: number; top: number; left: number };

/**
 * 基础演示页：@if / @for / @switch + signal。
 *
 * 本库始终 zoneless（不带 zone.js）：普通字段改了不会触发任何刷新。
 * 状态一律用 signal，模板里用 `xxx()` 取值，写入会自动标脏并调度变更检测。
 */
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    FormsModule,
    ProjNoneComponent,
    ProjDefaultComponent,
    ProjNamedComponent,
  ]
})
export class HomeComponent {
  private readonly tabbar = inject(TabbarState);

  /** 组件内部状态 */
  readonly title = signal('基础演示');
  readonly count = signal(0);
  readonly showPanel = signal(true);
  readonly keyword = signal('');
  readonly mode = signal<'list' | 'grid' | 'none'>('list');

  /**
   * 节点查询：模板上写了 `#名字` 的元素才会多发一个可查询 class（取自节点
   * 路径，形如 `__ar-4-1-0`），`nativeElement.find()` 拿它去
   * `createSelectorQuery()` 开一条原生查询。
   *
   * 没写 `#` 的节点压根没这个 class，`find()` 直接 null；class 随结构变更
   * 而变，所以每次都要现调，不要把 class 串存下来复用。
   */
  readonly box = viewChild<ElementRef<AgentNode>>('box');
  readonly rowRefs = viewChildren<ElementRef<AgentNode>>('row');
  readonly boxAlive = signal(true);
  readonly boxText = signal('我是 #box');
  readonly boxResult = signal('（还没量）');
  readonly rowResult = signal('（还没量）');
  readonly rowList = signal([
    { id: 1, name: '第一行' },
    { id: 2, name: '第二行' },
  ]);

  readonly list = signal([
    { id: 1, name: 'Angular', desc: '框架本体' },
    { id: 2, name: 'angular-miniprogram', desc: '编译到小程序' },
    { id: 3, name: 'signal', desc: 'zoneless 状态' },
  ]);

  /** 派生状态：computed 自动追踪依赖 */
  readonly doubled = computed(() => this.count() * 2);
  readonly filtered = computed(() => {
    const kw = this.keyword().trim().toLowerCase();
    const all = this.list();
    return kw ? all.filter((it) => it.name.toLowerCase().includes(kw)) : all;
  });

  constructor() {
    // 本页是第 0 个 tab，进页面就把自定义 tabBar 切过来
    this.tabbar.markActive(0);
  }

  inc() {
    this.count.update((n) => n + 1);
  }

  reset() {
    this.count.set(0);
  }

  togglePanel() {
    this.showPanel.update((v) => !v);
  }

  cycleMode() {
    this.mode.update((m) =>
      m === 'list' ? 'grid' : m === 'grid' ? 'none' : 'list',
    );
  }

  trackById(_index: number, item: { id: number }) {
    return item.id;
  }

  /** 量 `#box`。节点不存在 / 还没序列化时 find() 返回 null，这里如实报出来 */
  measureBox() {
    this.rectOf(this.box()?.nativeElement).then((rect) => {
      this.boxResult.set(
        rect
          ? `宽 ${Math.round(rect.width)} · 高 ${Math.round(rect.height)} · top ${Math.round(rect.top)}`
          : '查不到：#box 不存在（find() 返回 null）',
      );
    });
  }

  /** 销毁再重建 `#box`：结构变了必须重新拿 viewChild，旧句子的 class 已作废 */
  toggleBox() {
    this.boxAlive.update((v) => !v);
    this.boxResult.set('（结构变了，重新量）');
  }

  bumpHeight() {
    this.boxText.update((t) => `${t} +`);
  }

  /** 量 `@for` 里每一行，证明多实例各自独立 */
  measureRows() {
    const nodes = this.rowRefs().map((ref) => ref.nativeElement);
    if (!nodes.length) {
      this.rowResult.set('一个都没查到');
      return;
    }
    Promise.all(nodes.map((n) => this.rectOf(n))).then((rects) => {
      this.rowResult.set(
        rects
          .map((r, i) => `第 ${i + 1} 行高 ${r ? Math.round(r.height) : 'null'}`)
          .join(' · '),
      );
    });
  }

  addRow() {
    const next = this.rowList().length + 1;
    this.rowList.update((list) => [...list, { id: next, name: `第 ${next} 行` }]);
    this.rowResult.set('（加了行，重新量）');
  }

  /** find() → boundingClientRect → exec，全链路就这三步 */
  private rectOf(node: AgentNode | undefined): Promise<Rect | null> {
    const ref = node?.find();
    if (!ref) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      ref.boundingClientRect((rect) => resolve(rect as unknown as Rect)).exec();
    });
  }
  inputChange(event: any) {
    console.log(event)
  }
}
