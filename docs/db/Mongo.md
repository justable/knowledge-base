# MongoDB

> [官方文档](https://docs.mongodb.com/manual/crud/)

## 概述

MongoDB 是个文档型数据库，官网有个与关系型数据库的概念[对照](https://docs.mongodb.com/manual/reference/sql-comparison/)。

![](@images/sqlvsmongo.png)

## 常见操作

> `mongodb`包是官方驱动接口。[官网](https://docs.mongodb.com/manual/reference/method/js-collection/)

## mongoose

`mongoose`包是非官方的驱动接口，提供了 schema，更便于操作。

`mongoose.connection.db`可以获取原始 DB 驱动接口（即`mongodb`包）。

```js
const mongoose = require('mongoose');
mongoose.connect(`mongodb://localhost/test`, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', () => {
  console.error(`connection error`);
});
db.once('open', handleOpen);
function handleOpen() {
  // TODO
  const schema = new mongoose.Schema({
    name: String,
  });
  schema.create({ name: 'test' });
}
```

### save()

如果主键重复相当于 update，如果不重复或省略相当于 insert

### create()

可以同时创建多个 document，相当于为每个 document 执行 save 操作

### insertMany()

性能比 create 好，它只会向数据库发送一次操作，而 create 相当于发送了 document 个数的操作
