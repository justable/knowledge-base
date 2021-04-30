# Spring Cloud

## 注解

- @EnableDiscoveryClient

向注册中心注册微服务

- @SpringCloudApplication

包含@SpringBootApplication、@EnableDiscoveryClient、@EnableCircuitBreaker，分别是 SpringBoot 注解、注册服务中心 Eureka 注解、断路器注解。

可以通过`@ComponentScan(basePackages = { "com.tingyu.duba.common" })`配置扫描路径，这也是@SpringBootApplication 中负责配置扫描路径的注解模块。

## Q&A

- 为什么不需要 @EnableDiscoveryClient 也能自动注册

引入 Nacos 的注册中心就会自动注册的，在 Nacos 的源码中 通过监听 Spring 事件自动注册，有兴趣可以看下 NacosRegistryAutoConfiguration.java 这个类。
