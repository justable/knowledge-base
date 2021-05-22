## 概述

每一个 selection 对象都有一个或者多个 Range 对象，每一个 range 对象代表用户鼠标所选取范围内的一段连续区域，在 firefox 中，可以通过 ctrl 键可以选取多个连续的区域，因此在 firefox 中一个 selection 对象有多个 range 对象，在其他浏览器中，用户只能选取一段连续的区域，因此只有一个 range 对象，所以其他浏览器通常使用`window.getSelection().getRangeAt(0)`来获取 range 对象。

## Selection

- toString()

可以通过`window.getSelection().toString();`获得选中文字内容

- addRange()

新增一个选择范围，比如：

```html
<p id="p1"><span>span</span><b id="b1">Hello</b> World</p>
<script type="text/javascript">
  var selection = window.getSelection();
  var oP1 = document.getElementById('p1');
  var oB1 = document.getElementById('b1');
  var oRange = document.createRange();
  oRange.setStart(oB1.firstChild, 2);
  oRange.setEnd(oP1.lastChild, 3);
  selection.addRange(oRange);
  console.log(oRange.startOffset);
  console.log(oRange.startContainer);
  console.log(oRange.endContainer);
</script>
```

## Range

- startContainer

包含“起点”的节点。“包含”的意思是起点所属的节点。比如上例中为 textNode “Hello”。

- endContainer

包含“结束点”的节点。比如上例中为 textNode “ World”。

- startOffset

“起点”在 startContainer 中的偏移量。
如果 startContainer 是文本节点、注释节点或 CDATA 节点，则返回“起点”在 startContainer 中字符偏移量。
如果 startContainer 是元素节点，则返回“起点”在 startContainer.childNodes 中的次序。

- collapsed

起点和结束点在一起时为 true（即表示没有选中任何东西）；Range 对象为空（刚 createRange()时）也为 true。

- setStart(startContainer, offset)和 setEnd(endContainer, offset)

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>range3</title>
    <script>
      function deleteChar() {
        var div = document.getElementById('myDiv');
        var textNode = div.firstChild;
        var rangeObj = document.createRange();
        rangeObj.setStart(textNode, 1);
        rangeObj.setEnd(textNode, 4);
        rangeObj.deleteContents();
      }
    </script>
  </head>
  <body>
    <div id="myDiv" style="color:red">这段文字是用来删除的</div>
    <button onclick="deleteChar()">删除文字</button>
  </body>
</html>
```

- setStartBefore(referenceNode)、setStartAfter(referenceNode)、setEndBefore(referenceNode)、setEndAfter(referenceNode)

```html
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
    <script type="application/javascript">
      function delrow() {
        var table = document.getElementById('mytable');
        if (table.rows.length > 0) {
          var row = table.rows[0];
          var rangeObj = document.createRange();
          rangeObj.setStartBefore(row);
          rangeObj.setEndAfter(row);
          rangeObj.deleteContents();
        }
      }
    </script>
  </head>
  <body>
    <table id="mytable" border="1">
      <tr>
        <td>内容1</td>
        <td>内容2</td>
      </tr>
      <tr>
        <td>内容3</td>
        <td>内容4</td>
      </tr>
    </table>

    <button onclick="delrow()">删除第一行</button>
  </body>
</html>
```

- selectNode(referenceNode)和 selectNodeContents(referenceNode)

selectNode：设置 Range 的范围，包括 referenceNode 和它的所有后代(子孙)节点。
selectNodeContents：设置 Range 的范围，包括它的所有后代节点。

- cloneRange()

cloneRange()方法将返回一个当前 Range 的副本，它也是 Range 对象。
注意它和 cloneContents()的区别在于返回值不同，一个是 HTML 片段，一个是 Range 对象 。代码如下：

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>meter</title>
  </head>
  <body>
    <p id="p">这里是随便书写的内容</p>
    <button onclick="cloneRange()">克隆</button>
  </body>
  <script>
    function cloneRange() {
      var rangeObj = document.createRange();
      rangeObj.selectNodeContents(document.getElementById('p'));
      var rangeClone = rangeObj.cloneRange();
      alert(rangeClone.toString());
    }
  </script>
</html>
```

- cloneContents()

可以克隆选中 Range 的 fragment 并返回改 fragment。这个方法类似 extractContents()，但不是删除，而是克隆。代码如下：

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>meter</title>
  </head>
  <body>
    <p id="p">这里是随便书写的内容</p>
    <button onclick="cloneContents()">克隆</button>
  </body>
  <script>
    function cloneContents() {
      var rangeObj = document.createRange();
      rangeObj.selectNodeContents(document.getElementById('p'));
      var rangeClone = rangeObj.cloneContents();
      alert(rangeClone.toString());
    }
  </script>
</html>
```

- deleteContents()

从 Dom 中删除 Range 选中的 fragment。注意该函数没有返回值（实际上为 undefined）。
代码如下：

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>meter</title>
  </head>
  <body>
    <p id="p">这里是随便书写的内容</p>
    <button onclick="delRange()">删除</button>
  </body>
  <script>
    function delRange() {
      var rangeObj = document.createRange();
      rangeObj.selectNodeContents(document.getElementById('p'));
      var rangeClone = rangeObj.deleteContents();
    }
  </script>
</html>
```

- extractContents()

将选中的 Range 从 DOM 树中移到一个 fragment 中，并返回此 fragment。代码如下:

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>meter</title>
  </head>
  <body>
    <div
      id="srcDiv"
      style="background-color:aquamarine;width:300px;height:50px;"
    >
      你好吗？
    </div>
    <div
      id="distDiv"
      style="background-color:bisque;width:300px;height:50px"
    ></div>
    <button onclick="moveContent()">移动元素</button>
  </body>
  <script>
    function moveContent() {
      var srcDiv = document.getElementById('srcDiv');
      var distDiv = document.getElementById('distDiv');
      var rangeObj = document.createRange();
      rangeObj.selectNodeContents(srcDiv);
      var docFrangMent = rangeObj.extractContents();
      distDiv.appendChild(docFrangMent);
    }
  </script>
</html>
```

- insertNode()

insertNode 方法可以插入一个节点到 Range 中，注意会插入到 Range 的“起点”。代码如下：

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>meter</title>
  </head>
  <body>
    <p id="p1"><b>Hello</b> World</p>
  </body>
  <script>
    var oP1 = document.getElementById('p1');
    var oHello = oP1.firstChild.firstChild;
    var oWorld = oP1.lastChild;
    var oRange = document.createRange();
    var oSpan = document.createElement('span');
    oSpan.appendChild(document.createTextNode('Inserted text'));
    oRange.setStart(oHello, 2);
    oRange.setEnd(oWorld, 3);
    window.getSelection().addRange(oRange);
    oRange.insertNode(oSpan);
  </script>
</html>
```

- compareBoundaryPoints()

compare：返回 1, 0, -1.（0 为相等，1 为时，comparerange 在 sourceRange 之后，-1 为 comparerange 在 sourceRange 之前）。
how：比较哪些边界点，为常数。
Range.START_TO_START - 比较两个 Range 节点的开始点
Range.END_TO_END - 比较两个 Range 节点的结束点
Range.START_TO_END - 用 sourceRange 的开始点与当前范围的结束点比较
Range.END_TO_START - 用 sourceRange 的结束点与当前范围的开始点比较
sourceRange：个 Range 对象的边界。

- detach()

虽然 GC（垃圾收集器）会将其收集，但用 detach()释放 range 对象是一个好习惯。语法为：oRange.detach();

- toString()

返回该范围表示的文档区域的纯文本内容，不包含任何标签;

https://www.cnblogs.com/tianma3798/p/8654125.html
