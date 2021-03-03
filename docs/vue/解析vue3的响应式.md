# 解析 vue3 的响应式

## 引言

我们知道 vue 的数据响应式是 mutable 的，只需改变 data 中变量的值，vue 就会更新相应的视图。在 2.x 版本，vue 是用`Object.defineProperty()`来实现的，相信已经有很多文章讲解过了，本文主要来解析 3.x 版本是怎么实现的，3.x 的源码[在这](https://github.com/vuejs/vue-next)。

## vue-next 概述

vue 3 的 github 仓库官方暂时取名为 vue-next，它开启了 yarn 的 workspaces 进行多包管理，这种项目组织形式可以称呼为 [monorepos](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)，并且使用 TypeScript 作为类型系统替换了原本的 Flow。

目录结构：

![vue_next_dir.png](@images/1598322520214-f65fd5ff-382e-45df-a763-d3922edcdf90.png)

响应式代码都在 reactivity 包中。

## 源码分析

> 会涉及到 WeakMap、WeakSet、Proxy、Reflect 等 ES6+的知识，请先行了解学习。

首先我们从一段单元测试入手，先对数据响应式有一个整体的认识：

```typescript
let dummy;
const counter = reactive({ num: 0 });

effect(() => (dummy = counter.num));
expect(dummy).toBe(0);

counter.num = 7;
expect(dummy).toBe(7);
```

上述代码中，通过 reactive 创建一个代理对象 counter，通过 effect 注册一个函数，就称其为副作用函数吧，副作用函数内部访问了 counter 的 num 属性，当改变 counter.num 时，这个副作用函数就自动被执行了。其实上述短短的一个单元测试，已经展现了 vue 数据响应机制的雏形，只需把 data 进行 reactive，再把渲染函数注册在 effect 中，我们对 data 的所有改变就能自动触发视图重绘了。

## reactive.ts

```typescript
export function reactive(target: object) {
  // 省略...
  return createReactiveObject(
    // 原始对象
    target,
    // 一个存储原始对象->响应式对象的WeakMap
    rawToReactive,
    // 一个存储响应式对象->原始对象的WeakMap
    reactiveToRaw,
    // 正常的handler
    mutableHandlers,
    // 处理集合的handler
    mutableCollectionHandlers,
  );
}
function createReactiveObject(
  target: unknown,
  toProxy: WeakMap<any, any>,
  toRaw: WeakMap<any, any>,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
) {
  // 省略...
  // 如果target是Map、Set、WeakMap、WeakSet的实例，使用不同的handler
  const handlers = collectionTypes.has(target.constructor)
    ? collectionHandlers
    : baseHandlers;
  // 创建Proxy
  observed = new Proxy(target, handlers);
  // 备份记录
  toProxy.set(target, observed);
  toRaw.set(observed, target);
  return observed;
}
```

上述代码虽然涉及到了很多变量，其实真正的主逻辑就一行`return observed = new Proxy(target, handlers)`，rawToReactive 和 reactiveToRaw 是用来做记录的，其中的 raw 有原始未加工过的意思。

我们注意到当 target 是集合（Map、Set、WeakMap、WeakSet）的实例时，代码做了特殊处理，目的是要代理这些集合的 api，但为什么要特殊处理呢？是因为调用集合 api 时会触发 Proxy 的 get 代理，get 代理中接收到的 key 就是对应 api 的名称，比如 new Map().set('foo', 'bar')，那么接收到的 key 就等于 set，但不会触发 Proxy 的 set 代理。有的同学可能会联想到 new Array().push('foo')，它同样会触发 get 代理且接收到的 key 等于 push，区别是会触发 set 代理，key 等于当前数组的下标，能够像这样原生的代理数组也是 Proxy 相对于`Object.defineProperty()`的一个优势之处了。

我们就忽略集合类型吧，看正常的 Proxy handler 是长什么样的：

```typescript
export const mutableHandlers: ProxyHandler<object> = {
  // 读取属性时触发
  get,
  // 赋值时触发
  set,
  // 删除属性时触发
  deleteProperty,
  // 在是否拥有某个属性时触发，比如"foo" in proxy
  has,
  // Object.getOwnPropertyNames()时触发
  ownKeys,
};
```

我们主要关注 get 和 set，vue 会在 get 中收集副作用函数，在 set 中触发并调用这些副作用函数。换句话说，当一个副作用函数中使用到了代理对象，自然就触发了 get 代理，此时就能把这个正在执行的副作用函数和对象关联并记录下来，下次代理对象的属性发生改变时自然触发了 set 代理，也就触发并调用了那些已关联的副作用函数。

### createGetter

```typescript
function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver);
    // 此时已经有activeEffect了，把对象属性与它关联起来
    track(target, TrackOpTypes.GET, key);
    return isObject(res) ? reactive(res) : res;
  };
}
```

上述代码就是 get 代理的实现，为了拎清主逻辑，我把代码中处理只读模式、浅响应模式的部分删除了。注意第 6 行代码，目的是把对象中的所有内嵌子对象都递归包装成代理对象。第 5 行的 track 方法是用来关联对象属性与副作用函数的关系的，后文会讲解 track 方法的实现。

```typescript
let dummy;
const counter = reactive({ num: 0 });
effect(() => (dummy = counter.num));
expect(dummy).toBe(0);
```

要注意的是当注册副作用函数时 ，effect 方法内部会立即执行这个副作用函数，并把这个副作用函数存储在全局变量 activeEffect 中作为当前正在运行的副作用函数，因为副作用函数调用到了 counter.num 也就触发了 get 代理，也就是 createGetter，track 方法就会把 activeEffect 和 counter.num 关联起来，对象属性与副作用函数的依赖关系会存储在一个全局变量 targetMap 中。

### createSetter

```typescript
function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    const oldValue = (target as any)[key];
    // 如果value已经是个代理对象，则还原成原始对象
    value = toRaw(value);

    const hadKey = hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);

    if (!hadKey) {
      // 新增
      trigger(target, TriggerOpTypes.ADD, key, value);
    } else if (hasChanged(value, oldValue)) {
      // 修改
      trigger(target, TriggerOpTypes.SET, key, value, oldValue);
    }
    return result;
  };
}
```

在 get 代理中已经收集了依赖关系并存储在了 targetMap 中，那在 set 代理中的逻辑就很好理解了，只要触发对象属性所依赖的副作用函数就可以了，trigger 方法会做这件事情。注意 vue 在触发前会先判断这个属性是新加的还是已有的，如果是已有的会再判断是否改变了。

## effect.ts

```typescript
export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = EMPTY_OBJ,
): ReactiveEffect<T> {
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    // 不是lazy模式则立即执行
    effect();
  }
  return effect;
}
function createReactiveEffect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions,
): ReactiveEffect<T> {
  const effect = function reactiveEffect(...args: unknown[]): unknown {
    return run(effect, fn, args);
  } as ReactiveEffect;
  // 把下面这些数据以静态属性的形式加在effect中，便于以后的访问
  effect._isEffect = true;
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  return effect;
}
function run(effect: ReactiveEffect, fn: Function, args: unknown[]): unknown {
  if (!effectStack.includes(effect)) {
    try {
      // 设置shouldTrack=true，vue使用shouldTrack来把track的有效范围控制在effct方法执行的前后，防止意外track
      enableTracking();
      effectStack.push(effect);
      activeEffect = effect;
      return fn(...args);
    } finally {
      effectStack.pop();
      // 设置shouldTrack=false
      resetTracking();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }
}
```

> 学到了，原来可以利用 try finally 在 return 之后执行代码。

再来看 effect 方法的实现，上述代码中的 effect 和 createReactiveEffect 都很好理解，就是创建了一个高阶函数，并把一些备用信息静态绑定在高阶函数中，不过 run 这个方法为啥那么复杂？按道理只需要执行一下 fn 函数就可以了呀！

其实是 vue 为了处理内嵌 effect 才这样的，比如：

```typescript
effect(() => {
  effect(() => {});
});
```

如果不考虑内嵌 effect 的话，只需要像下面这样就可以了：

```typescript
function run(effect: ReactiveEffect, fn: Function, args: unknown[]): unknown {
  try {
    activeEffect = effect;
    return fn(...args);
  } finally {
    activeEffect = undefined;
  }
}
```

### track

```typescript
type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;
const targetMap = new WeakMap<any, KeyToDepMap>();

export function track(target: object, type: TrackOpTypes, key: unknown) {
  // vue使用shouldTrack来把track的有效范围控制在effct方法执行的前后，防止意外track
  if (!shouldTrack || activeEffect === undefined) {
    // 如果当前执行effect为undefined，也就没必要track了
    return;
  }
  let depsMap = targetMap.get(target);
  if (depsMap === undefined) {
    // 第一次关联该对象则新建
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (dep === undefined) {
    // 第一次关联该对象的该属性则新建
    depsMap.set(key, (dep = new Set()));
  }
  // 如果已经track过了就不track了
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
```

track 方法做的事情就是把对象属性与副作用函数的依赖关系存储到全局变量 targetMap 中。

targetMap 的数据结构可以参考 ts 的类型定义，targetMap 用的是 WeakMap，vue 源码中的用来全局存储的数据结构大多选择 WeakMap 或 WeakSet，这是因为 WeakMap 和 WeakSet 内部是弱引用，不会增加垃圾回收的计数，防止内存泄漏。

### trigger

```typescript
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>,
) {
  const depsMap = targetMap.get(target);
  if (depsMap === undefined) {
    // 没有找到依赖直接返回
    return;
  }
  // 收集关联的effect
  const effects = new Set<ReactiveEffect>();
  // 收集关联的computed
  const computedRunners = new Set<ReactiveEffect>();
  if (type === TriggerOpTypes.CLEAR) {
    // 触发代理对象的所有effect
    depsMap.forEach(dep => {
      addRunners(effects, computedRunners, dep);
    });
  } else if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        addRunners(effects, computedRunners, dep);
      }
    });
  } else {
    // 当是SET、ADD、DELETE时，触发单个key对应的effect
    if (key !== undefined) {
      addRunners(effects, computedRunners, depsMap.get(key));
    }
    // 当是ADD、DELETE、Map.SET是，触发iteration key对应的effect
    if (
      type === TriggerOpTypes.ADD ||
      (type === TriggerOpTypes.DELETE && !isArray(target)) ||
      (type === TriggerOpTypes.SET && target instanceof Map)
    ) {
      const iterationKey = isArray(target) ? 'length' : ITERATE_KEY;
      addRunners(effects, computedRunners, depsMap.get(iterationKey));
    }
  }
  const run = (effect: ReactiveEffect) => {
    scheduleRun(effect, target, type, key);
  };
  // 这里要先运行computedRunners，因为effect函数中可能会用到computed，所以要保证computed的正确性
  computedRunners.forEach(run);
  effects.forEach(run);
}

function addRunners(
  effects: Set<ReactiveEffect>,
  computedRunners: Set<ReactiveEffect>,
  effectsToAdd: Set<ReactiveEffect> | undefined,
) {
  if (effectsToAdd !== undefined) {
    effectsToAdd.forEach(effect => {
      // 如果依赖的effect是当前运行的activeEffect，就会陷入死循环，所以要排除
      if (effect !== activeEffect || !shouldTrack) {
        if (effect.options.computed) {
          // computed内部用的就是effect，并由options.computed来标识这是computed，这里把对应的
          // runner加到computedRunners中运行
          computedRunners.add(effect);
        } else {
          effects.add(effect);
        }
      }
    });
  }
}

function scheduleRun(
  effect: ReactiveEffect,
  target: object,
  type: TriggerOpTypes,
  key: unknown,
  extraInfo?: DebuggerEventExtraInfo,
) {
  if (effect.options.scheduler !== undefined) {
    // 替代原本的副作用函数执行
    effect.options.scheduler(effect);
  } else {
    effect();
  }
}
```

trigger 方法相关代码那么多，其实做的事情很简单，就是从全局变量 targetMap 中分析找到当前要触发的副作用函数，加到队列并执行它。代码花了一点篇幅对不同的触发类型和不同的 target 类型做了不同的处理，以保证支持数组、集合类型。从代码 61 行我们可以发现 computed 其实就是打了 computed 标识的 effect。

至此 reactive 和 effect 两个模块都讲完了，再总结一下，reactive 方法负责创建代理对象，这个代理对象会代理 get、set、deleteProperty 等操作，effect 方法负责注册副作用函数。下图简单的描绘了响应式的过程：

![vue_reactivity.png](@images/1598322639481-ee1358f3-06b8-40d1-9773-6a3a1fd8e482.png)

## computed.ts

```typescript
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
) {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = __DEV__
      ? () => {
          console.warn('Write operation failed: computed value is readonly');
        }
      : NOOP;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  let dirty = true;
  let value: T;
  let computed: ComputedRef<T>;

  const runner = effect(getter, {
    lazy: true,
    // 用来标记这个effect是computed
    computed: true,
    // 在trigger时，scheduler会替代effect函数来执行
    scheduler: () => {
      if (!dirty) {
        dirty = true;
        trigger(computed, TriggerOpTypes.SET, 'value');
      }
    },
  });
  computed = {
    _isRef: true,
    effect: runner,
    get value() {
      if (dirty) {
        value = runner();
        dirty = false;
      }
      // 应对在effect函数中使用computed的场景
      track(computed, TrackOpTypes.GET, 'value');
      return value;
    },
    set value(newValue: T) {
      setter(newValue);
    },
  } as any;
  return computed;
}
```

我们可以借助单元测试来辅助理解：

```typescript
const n = reactive({ value: 1 });
const plusOne = computed(() => n.value + 1);
expect(plusOne.value).toBe(2);
n.value++;
expect(plusOne.value).toBe(3);
```

在 vue 3 中 computed 是一个包含 value 值的对象，从源码中得知 computed 方法参数支持一个方法或一个包含 get、set 的对象，前者对应后者的 get。computed 内部使用的 effect 是 lazy 模式（24 行），lazy 模式下在创建 effect 时不会自动执行，并且定义了 scheduler 方法（28 行），这个 scheduler 方法会在代理对象发生变化并触发副作用函数时取代后者而执行，效果就是当代理对象发生变化时，副作用函数不会执行，取而代之的是执行 scheduler 方法，为什么这么做呢？

- 一个目的是为了取消原本注册的副作用函数的执行，我们知道单独使用 effect 时，只要代理对象发生变化后会随即执行，但是作为 computed 对象，并不需要立即执行，而是应在访问 computed 对象时才需被执行，也就是在代码 40 行手动执行了副作用函数并把结果返回。最后我们发现，根据依赖对象变化自动执行的 effect 自从打上了 computed 标记后（26 行），就变成了按需执行。
- 另一个目的是为了处理在副作用函数中访问 computed 对象的场景，理想效果应该是 computed 对象所依赖的代理对象发生变化后，这个使用了 computed 对象的副作用函数会被自动执行。

接着上述的第二个目的，也许有人注意到在源码 44 行调用了 track，在 31 行调用了 trigger 方法，但是我们知道 track 是为了绑定代理对象与当前正在执行的副作用函数的关系的，而副作用函数在 40 行就已经执行完了，很显然此时 activeEffect 等于 undefined，我们再以上面这个单元测试为入口进行 debug 来验证下，发现确实这行 track 代码没有发挥作用，在做 activeEffect 非空判断时就 return 了。

这看似没有发挥作用的代码为什么会存在呢？其实只是因为上面的单元测试没有覆盖到能使其发挥作用的场景罢了。我们把单元测试改成如下：

```typescript
const n = reactive({ value: 1 });
const plusOne = computed(() => n.value + 1);
const plusTwo = computed(() => plusOne.value + 2);
expect(plusOne.value).toBe(2);
expect(plusTwo.value).toBe(4);
n.value++;
expect(plusOne.value).toBe(3);
expect(plusTwo.value).toBe(5);
```

上面这个单元测试在 effect 中访问了 computed 对象 plusOne，然后 debug 就发现 44 行的 track 把 plusOne.value 和`() => plusOne.value + 2`函数建立了依赖关系，从而实现了上述的第二个目的。

## ref.ts

```typescript
export function ref(value?: unknown) {
  return createRef(value);
}
function createRef(value: unknown, shallow = false) {
  if (isRef(value)) {
    return value;
  }
  if (!shallow) {
    value = convert(value);
  }
  const r = {
    _isRef: true,
    get value() {
      track(r, TrackOpTypes.GET, 'value');
      return value;
    },
    set value(newVal) {
      value = convert(newVal);
      trigger(r, TriggerOpTypes.SET, 'value');
    },
  };
  return r;
}
const convert = function(val) {
  // 如果是个对象，要先转成代理对象
  return isObject(val) ? reactive(val) : val;
};
```

ref 的源码就很简单了，其实就是一个只包含 value 属性且代理了这个 value 属性的对象，就不做过多赘述了。

## 阅读源码的心得

文章最后说下此次阅读源码的心得：

1. 在阅读源码前，要有明确的目标，并且这个目标不能定太大，比如本文我只需要理解 vue 响应式的实现原理，那我只看与此相关的代码，而不是整个项目从头开始阅读，企图一次性理解整个项目的运作机制。
1. 在明确了目标后，接着要知道 vue 响应式最终是怎么使用的，我们可以从阅读项目的单元测试开始，知晓这个响应式的整体需求，在脑中建立初步认知，此时我们还可以思考如果是自己，会如何实现数据响应式？之后再去阅读源码会有意外的收获。
1. 阅读过程中，可以借助单元测试进行 debug，vue 3 配置了在 VSCode 中很友好的 debug 方式，只需在源码中打上断点，再打开单元测试文件，点击 debug 按钮就可以了。
