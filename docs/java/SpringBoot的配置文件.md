# SpringBoot 的配置文件

SpringBoot 中有以下两种配置文件 bootstrap (.yml 或者 .properties)，application (.yml 或者 .properties)

## 加载顺序上的区别

bootstrap.yml（bootstrap.properties）先加载
application.yml（application.properties）后加载
bootstrap.yml 用于应用程序上下文的引导阶段，由父 Spring ApplicationContext 加载。父 ApplicationContext 被加载到使用 application.yml 的之前。
在 Spring Boot 中有两种上下文，一种是 bootstrap, 另外一种是 application, bootstrap 是应用程序的父上下文，也就是说 bootstrap 加载优先于 applicaton。bootstrap 主要用于从额外的资源来加载配置信息，还可以在本地外部配置文件中解密属性。这两个上下文共用一个环境，它是任何 Spring 应用程序的外部属性的来源。bootstrap 里面的属性会优先加载，它们默认也不能被本地相同配置覆盖。

## bootstrap/application 的应用场景。

bootstrap.yml 和 application.yml 都可以用来配置参数。
bootstrap.yml 可以理解成系统级别的一些参数配置，这些参数一般是不会变动的。
application 配置文件这个容易理解，pplication.yml 可以用来定义应用级别的，主要用于 Spring Boot 项目的自动化配置。

bootstrap 配置文件有以下几个应用场景。
使用 Spring Cloud Config 配置中心时，这时需要在 bootstrap 配置文件中添加连接到配置中心的配置属性来加载外部配置中心的配置信息；
一些固定的不能被覆盖的属性
一些加密/解密的场景；

## 多环境部署

增加`bootstrap-prod.yml`或`application-prod.yml`，设置`bootstrap.yml`或`application.yml`中的`spring.profiles.active=prod`，或者在启动时设置`java -jar funadmin-gateway.jar --spring.profiles.active=prod`。
