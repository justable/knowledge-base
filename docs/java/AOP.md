# AOP

## 面向切面的原理

在一个类上添加@Aspect 注解，表示该类作为切面类，在切面类中定义 Pointcut，表示切入点，

```java
// 配置织入点
@Pointcut("@annotation(com.funadmin.common.datascope.annotation.DataScope)")
public void dataScopePointCut() {
}

@Before("dataScopePointCut()")
public void doBefore(JoinPoint point) throws Throwable {
    handleDataScope(point);
}

protected void handleDataScope(final JoinPoint joinPoint) {
    // 获得注解
    DataScope controllerDataScope = getAnnotationLog(joinPoint);
    if (controllerDataScope == null) {
        return;
    }
    // 获取当前的用户
    LoginUser loginUser = tokenService.getLoginUser();
    if (StringUtils.isNotNull(loginUser)) {
        SysUser currentUser = loginUser.getSysUser();
        // 如果是超级管理员，则不过滤数据
        if (StringUtils.isNotNull(currentUser) && !currentUser.isAdmin()) {
            dataScopeFilter(joinPoint, currentUser, controllerDataScope.deptAlias(),
                    controllerDataScope.userAlias());
        }
    }
}
```

如上代码表示@DataScope 注解下的方法作为切入点，

```java
@DataScope(deptAlias = "d", userAlias = "u")
public List<SysUser> selectUserList(SysUser user) {
    return userMapper.selectUserList(user);
}
```

当执行上述代码时就会进入切面，也就是切面类的 doBefore 方法。

除此之外，日志系统就很适合使用面向切面实现。

## 基本概念

- Advice(通知、切面)： 某个连接点所采用的处理逻辑，也就是向连接点注入的代码， AOP 在特定的切入点上执行的增强处理。

  - @Before： 标识一个前置增强方法，相当于 BeforeAdvice 的功能.
  - @After： final 增强，不管是抛出异常或者正常退出都会执行.
  - @AfterReturning： 后置增强，似于 AfterReturningAdvice, 方法正常退出时执行.
  - @AfterThrowing： 异常抛出增强，相当于 ThrowsAdvice.
  - @Around： 环绕增强，相当于 MethodInterceptor.

- JointPoint(连接点)：程序运行中的某个阶段点，比如方法的调用、异常的抛出等。

- Pointcut(切入点)： JoinPoint 的集合，是程序中需要注入 Advice 的位置的集合，指明 Advice 要在什么样的条件下才能被触发，在程序中主要体现为书写切入点表达式。

- Advisor（增强）： 是 PointCut 和 Advice 的综合体，完整描述了一个 advice 将会在 pointcut 所定义的位置被触发。

- @Aspect(切面): 通常是一个类的注解，里面可以定义切入点和通知

- AOP Proxy：AOP 框架创建的对象，代理就是目标对象的加强。Spring 中的 AOP 代理可以使 JDK 动态代理，也可以是 CGLIB 代理，前者基于接口，后者基于子类。

## Pointcut

表示式(expression)和签名(signature)

由下列方式来定义或者通过 &&、 ||、 !、 的方式进行组合：

- execution：用于匹配方法执行的连接点；
- within：用于匹配指定类型内的方法执行；
- this：用于匹配当前 AOP 代理对象类型的执行方法；注意是 AOP 代理对象的类型匹配，这样就可能包括引入接口也类型匹配；
- target：用于匹配当前目标对象类型的执行方法；注意是目标对象的类型匹配，这样就不包括引入接口也类型匹配；
- args：用于匹配当前执行的方法传入的参数为指定类型的执行方法；
- @within：用于匹配所以持有指定注解类型内的方法；
- @target：用于匹配当前目标对象类型的执行方法，其中目标对象持有指定的注解；
- @args：用于匹配当前执行的方法传入的参数持有指定注解的执行；
- @annotation：用于匹配当前执行方法持有指定注解的方法；
