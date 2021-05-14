# 基于 RBAC 权限控制数据可见范围

## 概述

接着上一篇[基于 RBAC 权限的动态菜单](https://www.yuque.com/tingyur/yldon0/lg80or)，RBAC 权限模型除了可以实现动态菜单外，还可以控制数据的可见范围（其实动态菜单就是控制了数据可见范围），举个例子：在 OA 系统中，有个展示部门和员工的树型菜单，要求实现 admin 权限能够查看所有部门及以下的员工，saler 权限只能查看本部门及以下的员工。这个例子中是拿部门作为可见范围数据，同理部门可以替换为任何实体。

## 实现过程

有了上一篇铺垫，很快可以设计出以下几张表：

```sql
-- 用户表
CREATE TABLE user (
	user_id BIGINT ( 20 ) NOT NULL COMMENT '用户ID',
	username VARCHAR ( 30 ) NOT NULL COMMENT '用户名',
	PRIMARY KEY ( user_id )
)
INSERT INTO user VALUES (1,'admin');
INSERT INTO user VALUES (2,'saler');

-- 用户与角色关联表
CREATE TABLE user_role (
	user_id BIGINT ( 20 ) NOT NULL COMMENT '用户ID',
	role_id BIGINT ( 20 ) NOT NULL COMMENT '角色ID',
	PRIMARY KEY ( user_id, role_id )
)
INSERT INTO user_role VALUES (1,1);
INSERT INTO user_role VALUES (2,2);

-- 角色实体表
CREATE TABLE role (
	role_id BIGINT ( 20 ) NOT NULL auto_increment COMMENT '角色ID',
	role_name VARCHAR ( 30 ) NOT NULL COMMENT '角色名称',
	role_key VARCHAR ( 100 ) NOT NULL COMMENT '角色权限字符串',
  data_scope CHAR ( 1 ) NOT NULL DEFAULT '1' COMMENT '数据范围（1：全部数据权限 2：本部门及以下数据权限）',
	PRIMARY KEY ( role_id )
)
INSERT INTO role VALUES (1,'超级管理员','admin','1');
INSERT INTO role VALUES (2,'销售','saler','2');

-- 角色与部门关联表
CREATE TABLE role_dept (
	role_id BIGINT ( 20 ) NOT NULL COMMENT '角色ID',
	dept_id BIGINT ( 20 ) NOT NULL COMMENT '部门ID',
	PRIMARY KEY ( role_id, dept_id )
)
INSERT INTO role_menu VALUES (2,1);
INSERT INTO role_menu VALUES (2,4);

-- 部门表
CREATE TABLE dept (
	dept_id BIGINT ( 20 ) NOT NULL auto_increment COMMENT '部门ID',
	parent_id BIGINT ( 20 ) NOT NULL DEFAULT 0 COMMENT '父部门ID',
	dept_name VARCHAR ( 30 ) NOT NULL DEFAULT '' COMMENT '部门名称',
	PRIMARY KEY ( dept_id )
)
INSERT INTO dept VALUES (1,0,'听鱼科技');
INSERT INTO dept VALUES (2,1,'研发部门');
INSERT INTO dept VALUES (3,1,'财务部门');
INSERT INTO dept VALUES (4,1,'销售部门');
```

其实表结构与上一篇对比起来，就是在 role 表中新增了 data_scope 字段，menu 表变为了 dept 表。

我们快进到 saler 用户登录并调用 getDeptAndUser 接口，后端得到当前用户的 role_id 后进行数据库查询：

```sql
SELECT
	d.dept_id,
	d.parent_id,
	d.dept_name
FROM
	dept d
WHERE
	-- 条件语句A
	d.dept_id IN ( SELECT dept_id FROM sys_role_dept WHERE role_id = 2 )
ORDER BY
	d.parent_id
```

查询结果就是（听鱼科技，销售部门）了。

但是有个问题，admin 用户登录时需要查询所有数据，也就是说不需要上述 sql 中的条件语句 A（当然也可以在 role_dept 表中把 admin 权限与所有部门的关系补上，我们这里考虑另一种方案），这就是 role 表中新增的 data_scope 字段发挥作用的时候了，在后端代码中可以根据 data_scope 动态决策条件语句的实现方式（策略模式），具体实现就不讲了。

接下来的根据部门查询员工就是个简单的单表查询，就不赘述了，最后将部门和员工数据返回前端，由前端渲染成树状菜单就可以了。
