## 什么是 RBAC

RBAC 是 Role-Based Access Control 的缩写，可以翻译为“基于角色的权限控制”，如下图右侧所示：
![authmodel.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1620653325412-347bf130-f0eb-46fa-bc74-426ae961a002.png#clientId=u277e1954-900f-4&from=drop&id=u1ffcf801&margin=%5Bobject%20Object%5D&name=authmodel.png&originHeight=346&originWidth=672&originalType=binary&size=50761&status=done&style=none&taskId=ub7e79ba0-7383-4d79-bcf3-ae96ac0abe1)
一个角色代表一个权限集合，有了角色这一中间属性，授权会变得更加灵活，尤其在权限粒度较细的场景。

## 实现过程

用户所见的菜单内容是和用户权限关联的，这里的菜单可以细化到页面的一个功能按钮，这在中后台管理系统尤为多见。

该场景中，菜单作为权限实体，将多个菜单组合成一个角色，最后与用户关联，因此可以设计如下几张表：

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
	PRIMARY KEY ( role_id )
)
INSERT INTO role VALUES (1,'超级管理员','admin');
INSERT INTO role VALUES (2,'销售','saler');

-- 角色与菜单关联表
CREATE TABLE role_menu (
	role_id BIGINT ( 20 ) NOT NULL COMMENT '角色ID',
	menu_id BIGINT ( 20 ) NOT NULL COMMENT '菜单ID',
	PRIMARY KEY ( role_id, menu_id )
)
INSERT INTO role_menu VALUES (1,1);
INSERT INTO role_menu VALUES (1,2);
INSERT INTO role_menu VALUES (1,3);
INSERT INTO role_menu VALUES (1,4);
INSERT INTO role_menu VALUES (2,2);
INSERT INTO role_menu VALUES (2,4);

-- 菜单表
CREATE TABLE menu (
	menu_id BIGINT ( 20 ) NOT NULL auto_increment COMMENT '菜单ID',
	menu_name VARCHAR ( 50 ) NOT NULL COMMENT '菜单名称',
	parent_id BIGINT ( 20 ) NOT NULL DEFAULT 0 COMMENT '父菜单ID',
	menu_type CHAR ( 1 ) NOT NULL DEFAULT '' COMMENT '菜单类型（M菜单 B按钮）',
	PRIMARY KEY ( menu_id )
)
INSERT INTO menu VALUES (1,'admin1',0,'M');
INSERT INTO menu VALUES (2,'saler1',0,'M');
INSERT INTO menu VALUES (3,'admin_btn1',1,'B');
INSERT INTO menu VALUES (4,'saler_btn1',2,'B');
```

我们要达到的效果是，admin 用户登录可以看到所有内容（admin1,saler1,admin_btn1,saler_btn1），saler 用户登录可以看到部分内容（saler1,saler_btn1）。

我们直接快进到 saler 用户登录并调用 getMenu 接口，此时后端获得了当前用户的 userId 并进行数据库查询，根据这几张表的关系，可以得到以下查询 sql：

```sql
SELECT DISTINCT
	m.menu_id,
	m.parent_id,
	m.menu_name,
	m.menu_type
FROM
	menu m
	LEFT JOIN role_menu rm ON m.menu_id = rm.menu_id
	LEFT JOIN user_role ur ON rm.role_id = ur.role_id
	LEFT JOIN role ro ON ur.role_id = ro.role_id
WHERE
	ur.user_id = 2
ORDER BY
	m.parent_id
```

结果当然就是（saler1,saler_btn1）啦，最后交由前端渲染成菜单就可以了~
