# datatable
## 介绍
这是一个基于jQuery的表格插件，目的在快速实现一个前端表格数据的交互。
## 起步
插件功能依赖jQuery，所以在引入本插件前，请先引入jQuery。下方事例中jQuery来自百度cdn。
```
<script type="text/javascript" src="http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js">
<script type="js/datatable.js"> //修改为自己项目下的地址
```
如果您已经引入了bootstrap，请在css中引入分页
样式。
```
<link rel="stylesheet" href="/css/pagination.css">
```
如果您未引入了bootstrap，请在css中引入完全
样式。
## 使用
```
<body>
  <table class="table">
  </table>
</body>
```
```
<script type="text/javascript">
  $('.table').datatable({
      url: "xxx",
      column: [
          {title: '行1', filed: 'id', width: '50%'},
          {title: '行2', filed: 'name', width: '50%', formatter: function(field) {
              return "姓名是："+name;
          }},
      ]
  })
</script>
```
## 选项

名称 | 类型 | 默认值 | 描述
---|---|---|---|
url | string| '' | 请求的地址。
requestType | string| get | 请求的类型。
currentPage | int| 1 | 当前页码。
pageSize | int|10  | 每页显示的行数。
key | string| '' | 接口返回数据的key。
column | array| [] | 定义列表的数据。
events | function|  | 绑定列表元素的事件。
isSelect | boolean| false | 是否加入选择框。
isPaging | boolean| false | 是否分页，不分页则全部显示。
nullReplacement: | string| '' | 作为列表某一格为空的替换值。
paginationSize | int| 5| 分页显示可点页码的个数。
condition | json| {} | 请求所带的参数。

## 方法
方法的请求例子：
```
$('.table').datatable('methodName', parm)
```

名称 | 参数 | 描述
---|---|---
refresh|-| 刷新表格。
search|json|发起请求，并附带参数，用于表格搜索。
getRowData|string\|\|array| 获取当前页中返回的数据。如有参数，则返回参数指定数据。
getSelectedRowData|-| 获取表格中勾选的行中的数据。
pushRowData|json| 将数据写入插件中存入的接口返回数据中。
clearTable|-| 清空表格。
getOptions|string| 获取当前参数，如有参数，查找对应参数的选项。
