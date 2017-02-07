
var defaults = {
    selector: '',
    url: '',
    requestType: 'GET',
    currentPage: 1,
    pageSize: 10,
    key: '',
    column: [],
    events: '',
    isSelect: false,
    isPaging: true,
    isOrder: true,
    isTrigger: false,
    data: {},
    nullReplacement: '',
    formatMoney: false,
    paginationSize: 5,
    conditions: '',
    isAdjustCurrentPage: true
};

var localOptions = [];

var DataTable = function (el) {
    this.el = el;
};

DataTable.prototype = {

    init: function() {
        this.dealOptionsConflict();
        if( this.options.isPaging ) {
            this.renderTableFrame(this.options.pageSize);
        }
        if( this.options.isTrigger ) {
            return;
        }
        this.getData();
    },

    dealOptionsConflict: function() {
        var opt = this.options;
        if( opt.isSelect && opt.isOrder ) {
            opt.isOrder = false;
        }
    },

    renderTableFrame: function(columnLen) {
        var el  = this.el,
            opt = this.options,
            cln = opt.column;

        if( el.find('tbody').length !== 0 ) {
            el.empty();
        }

        var div = document.createElement('DIV');
        div.className = 'table-wrap';
        el.wrap(div);

        var thead = this.getTableHead(cln);
        var tbody = this.getTableBody(columnLen);

        el[0].appendChild(thead);
        el[0].appendChild(tbody);

        var loadingHtml = this.createLoading();
        this.el.after(loadingHtml);

    },

    getTableHead: function(cln) {
        var head   = document.createElement('THEAD'),
            tr     = document.createElement('TR'),
            th     = document.createElement('TH'),
            clnLen = cln.length;


        if(this.options.isOrder){
            var orderTh = th.cloneNode(true);
            orderTh.innerHTML = '#';
            tr.appendChild(orderTh);
        }

        if(this.options.isSelect){
            var checkBoxTh = th.cloneNode(true),
                checkBox   = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBoxTh.appendChild(checkBox);
            tr.appendChild(checkBoxTh);
        }


        for(var i = 0; i < clnLen; i++) {
            var title = cln[i]['title'];
            var clone = th.cloneNode(true);
            var width = cln[i]['width'];
            clone.innerHTML = title;

            if( width ) {
                clone.style.width = width;
            }

            tr.appendChild(clone);
        }
        head.appendChild(tr);
        return head;
    },

    getTableBody: function(len) {
        var tbody   = document.createElement('TBODY'),
            tr      = document.createElement('TR'),
            td      = document.createElement('TD'),
            options = this.options,
            clnLen  = options.column.length;

        if( options.isOrder || options.isSelect ) {
            clnLen++;
        }

        for(var i = 0; i < len; i++) {
            var clonalTr = tr.cloneNode(true);
                //len      = cln.length;
            for(var j = 0; j < clnLen; j++) {
                var clonalTd = td.cloneNode(true);
                clonalTr.appendChild(clonalTd);
            }
            tbody.appendChild(clonalTr);
        }

        return tbody;
    },

    getData: function() {
        var that     = this,
            postData = {};

        if(this.options.isPaging) {
            postData = {page: this.options.currentPage, perPage: this.options.pageSize}
        }

        if(this.options.conditions) {
            postData = $.extend({}, postData, this.options.conditions);
        }

        this.launchLoading();

        $.ajax({
            url: this.options.url,
            type: this.options.requestType,
            data: postData,
            dataType:'json',
            success: function(ret) {
                if(ret.status === 0) {
                    that.stopLoading();
                    if( that.checkPage(ret.data.total) ) {
                        return;
                    }
                    if( !that.options.isPaging ) {
                        that.renderTableFrame(ret.data.total);
                    }
                    that.options.allData = ret;
                    that.options.tableData = ret['data'][that.options.key];
                    that.renderData();
                    that.bindEvents();
                    if( that.options.isPaging ) {
                        that.renderPagination();
                    }
                }else {
                    that.stopLoading();
                    alert(ret.statusInfo.message);
                    throw new Error("status is not 0");
                }
            },
            error: function() {
                throw new Error("Please check return of api.");
            }

        })
    },

    //if return true, means setting's currentpage greater than real max page, need to replay XHR.
    checkPage: function(total) {
        if( !this.options.isPaging ) {
            return;
        }
        if( !this.options.isAdjustCurrentPage ) {
            return false;
        }
        var page = Math.ceil( total / this.options.pageSize );
        if( this.options.currentPage > page ) {
            this.options.currentPage = page;
            this.refresh();
            return true;
        }
        return false;
    },

    renderData: function() {
        var that   = this,
            el     = this.el,
            opt    = this.options,
            data   = this.options.allData['data'][this.options.key],
            xLen   = this.options.column.length,
            yLen   = data.length,
            value  = '',
            index  = '';

        this.order = (opt.currentPage - 1) * opt.pageSize + 1;

        //adjust wrong order
        if( this.order < 1 ) {
            this.order = 1;
        }

        if( opt.isSelect ) {
            var checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.className = "dt-checkbox";
        }

        for(var x = 0; x < xLen; x++) {
            for(var y = 0; y < yLen; y++) {
                value = this.getPositionalValue(x, y);
                index = x;
                if( x === 0 ) {
                    if( opt.isSelect ) {
                        var cloneCheckBox = checkBox.cloneNode(true);
                        el.find('tbody tr:eq('+y+') td:eq(0)').append(cloneCheckBox);
                        this.order++;
                    }
                    if( opt.isOrder ) {
                        el.find('tbody tr:eq('+y+') td:eq(0)').html(this.order);
                        this.order++;
                    }
                }
                if( opt.isOrder || opt.isSelect ) {
                    index += 1;
                }
                el.find('tbody tr:eq('+y+') td:eq('+index+')').html(value);
            }
        }

        this.selectEvents();

    },

    selectEvents: function() {
        var opt = this.options,
            el  = this.el;
        if( opt.isSelect ) {
            el.find("th:first :checkbox").click(function() {
                if( $(this).is(":checked") ) {
                    el.find("tbody tr td .dt-checkbox").prop('checked', true);
                }else {
                    el.find("tbody tr td .dt-checkbox").prop('checked', false);
                }
            })
        }
    },

    getPositionalValue: function(x, y) {
        var options   = this.options,
            column    = this.options.column,
            tableData = this.options.allData['data'][this.options.key],
            field     = column[x]['field'],
            money     = column[x]['formatterMoney'],   //whether if format value to money format
            formatter = column[x]['formatter'],   //whether if format value to custom format
            value     = '';  //unformatted value

        value = this.getUnformatValue(column, tableData, x, y);

        if( !value && options['nullReplacement'] ) {
            return options['nullReplacement'];
        }

        if( money && typeof value !== 'object') {
            return this.formatMoney(value);
        }

        if( typeof formatter === 'function') {
            return formatter(value);
        }

        return value;
    },

    //if the field in table's data is undefined, throw error, if value is null, return false, else return values.
    getUnformatValue: function(column, tableData, xAxis, yAxis) {
        var replacement = column[xAxis]['nullReplacement'],
            field       = column[xAxis]['field'],
            value       = '',
            objValue    = {},
            allNull     = true;

        if( !field ) {
            return null;
        }

        if( typeof field === 'string' ) {
            if( !tableData[yAxis].hasOwnProperty(field) ) {
                throw new Error(field + ' is undefined!');
            }
            value = tableData[yAxis][field];
            if(value === null) {
                return replacement;
            }
            return value;
        }

        if( $.isArray(field) ){
            for(var i = 0; i < field.length; i++) {
                if( !tableData[yAxis].hasOwnProperty(field[i]) ) {
                    throw new Error(field + ' is undefined!');
                }
                if(value !== null) {
                    allNull = false
                }
                objValue[field[i]] = tableData[yAxis][field[i]];
            }
            if(allNull) {
                return false;
            }
            return objValue;
        }

        throw new Error('field is undefined or wrong!');
    },


    getRowData: function(selector, key) {
        var index = selector.parents('tr').index();
        var data = '';
        if( key === undefined ) {
            data  = this.options.tableData[index];
        }else {
            if( $.isArray(key) ) {

                var data = {};
                for( var i = 0; i < key.length; i++ ) {
                    var k = key[i];
                    data[k] = this.options.tableData[index][k];
                }
            }else {
                data = this.options.tableData[index][key];
            }
        }
        return data;
    },

    pushRowData: function(selector,obj) {

        var index = selector.parents('tr').index();
        var localData = this.options.tableData[index];
        localData = $.extend(localData, obj);
    },

    bindEvents: function() {
        if( this.options.events ) {
            this.options.events();
        }
    },

    createLoading: function() {
        var h = ['<div class="spinner">',
            '  <div class="spinner-container container1">',
            '    <div class="circle1"></div>',
            '    <div class="circle2"></div>',
            '    <div class="circle3"></div>',
            '    <div class="circle4"></div>',
            '  </div>',
            '  <div class="spinner-container container2">',
            '    <div class="circle1"></div>',
            '    <div class="circle2"></div>',
            '    <div class="circle3"></div>',
            '    <div class="circle4"></div>',
            '  </div>',
            '  <div class="spinner-container container3">',
            '    <div class="circle1"></div>',
            '    <div class="circle2"></div>',
            '    <div class="circle3"></div>',
            '    <div class="circle4"></div>',
            '  </div>',
            '</div>'].join("");
        return h;
    },

    launchLoading: function() {
        var $wrap = this.el.parent().find('.spinner');
        $wrap.addClass('active');
    },

    stopLoading: function() {
        var $wrap = this.el.parent().find('.spinner');
        $wrap.removeClass('active');
    },

    renderPagination: function() {
        var options  = this.options,
            current  = options.currentPage,
            total    = parseInt(options.allData['data']['total']),
            pages    = Math.ceil(total / options.pageSize),
            size     = options.paginationSize,
            $ul      = $('<ul></ul>').addClass('pagination'),
            $li      = $('<li></li>'),
            start    = 0,
            end      = 0,
            odevity  = "",
            leftApo  = false,
            rightApo = false,
            midPoint = 0;

        if( !total ) {
            return;
        }

        if( size % 2 == 0 ) {
            midPoint = size / 2;
            odevity  = "even";
        }else {
            midPoint = (size + 1) / 2;
            odevity  = "odd";
        }

        if( pages <= size ) {
            start = 1;
            end   = pages;
        }else if( odevity === 'odd' ) {
            if( midPoint - current > 0) {
                start = 1;
                end   = size;
            }else if( pages - current < midPoint ) {
                start = pages - size + 1;
                end   = pages;
            }else {
                start = current - midPoint + 1;
                end   = current + midPoint - 1;
            }
        }else if( odevity === 'even' ) {
            if( midPoint - current > 1) {
                start = 1;
                end   = size;
            }else if( pages - current < midPoint ) {
                start = pages - size + 1;
                end   = pages;
            }else {
                start = current - midPoint + 1;
                end   = current + midPoint;
            }
        }

        if( start > 2 ) {
            leftApo = true;
        }

        if( end < pages - 1 ) {
            rightApo = true;
        }

        var index = start;
        for( var i = 0; i <= end - start; i++ ) {
            var $list = $li.clone(false);
            if( current === index ) {
                $list.addClass('active');
            }
            $list.html(index)
                .addClass('page')
                .data('page', index);
            $ul.append($list);
            index++;
        }

        this.addPaginationOperateButton($ul, pages, current, leftApo, rightApo, start, end);

        this.bindPaginationEvents($ul, pages);

        if( this.el.next('.pagination').length ) {
            this.el.next('.pagination').remove();
        }

        this.el.after($ul);

    },

    addPaginationOperateButton: function($pagination, pages, current, leftApo, rightApo, start, end) {
        var $li = $('<li></li>');

        if( leftApo ) {
            $pagination.prepend($li.clone()
                .addClass('apo')
                .html('...'));
        }
        if( rightApo ) {
            $pagination.append($li.clone()
                .addClass('apo')
                .html('...'));
        }
        if( start > 1 ) {
            $pagination.prepend($li.clone()
                .addClass('page')
                .data('page', "1")
                .html('1'));
        }
        if( end < pages ) {
            $pagination.append($li.clone()
                .addClass('page')
                .data('page', pages)
                .html(pages));
        }
        if( current !== 1 ) {
            $pagination.prepend($li.clone()
                .addClass('prev')
                .html('<i class="sd-font">&#xe651;</i>'));
        }
        if( current != pages ) {
            $pagination.append($li.clone()
                .addClass('next')
                .html('<i class="sd-font">&#xe602;</i>'));
        }

    },

    bindPaginationEvents: function($ul, pages) {
        var that    = this,
            options = this.options;

        $ul.find('.page').click(function() {
            var page = Number($(this).data('page'));
            options.currentPage = page;
            that.empty();
            that.getData();
        });

        $ul.find('.prev').click(function() {
            var page = options.currentPage;
            page -= 1;
            if( page < 1 ) {
                return;
            }
            options.currentPage = page;
            that.empty();
            that.getData();
        });

        $ul.find('.next').click(function() {
            var page = options.currentPage;
            page += 1;
            if( page > pages ) {
                return;
            }
            options.currentPage = page;
            that.empty();
            that.getData();
        });
    },

    empty: function() {
        this.el.find('td').empty();
        this.el.next('.pagination').remove();
    },

    refresh: function() {
        this.clearTable();
        this.getData();
    },

    clearTable: function() {
        this.el.find('td').html("");
    },

    search: function(postData) {
        this.options.conditions = postData;
        this.options.currentPage = 1;
        this.clearTable();
        this.getData();
    },

    getSelectedRowData: function(key) {
        var opt  = this.options,
            that = this;
        if( !opt.isSelect ) {
            console.log("Please set option that isSelect is true!");
        }
        var dataArr = [];
        this.el.find("tbody tr td .dt-checkbox:checked").each(function() {
            dataArr.push( that.getRowData($(this), key) );
        });
        return dataArr;
    },

    getOptions: function(key) {
        var opt = this.options;
        if( key ) {
            return opt[key];
        }else {
            return opt;
        }
    },

    formatMoney: function (val, args) {
//			places保留小数位数, symbol货币符号, thousand整数部分千位分隔符, decimal小数分隔符
        if(isNaN(val)){
            return val;
        }
        var places = !isNaN(places = Math.abs(args[0])) ? places : 2;
        //  symbol = symbol !== undefined ? symbol : "$";
        var symbol = args[1] !== undefined ? args[1] : "￥";
        var thousand = args[2] || ",";
        var decimal = args[3] || ".";
        var number = val,
            negative = number < 0 ? "-" : "",
            i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
    }

};


// PLUGIN DEFINITION
// ==================
var methods = [
    'refresh',                  //refresh table
    'search',                   //search table
    'getAllData',                  //get data of current page
    'getRowData',               //get data of current row
    'getSelectedRowData',           //get a array of selected row's id
    'getOptions',
    'pushRowData',
    'clearTable'
];

$.fn.dataTable = function(options) {
    var dataTable = this.data('dataTable');
    if(typeof options == 'object') {
        if( dataTable ) {
            dataTable.options = $.extend({}, dataTable.options, options);
        }else {
            dataTable = new DataTable(this);
            dataTable.options = $.extend({}, defaults, options);
            dataTable.init();
        }
        this.data('dataTable', dataTable);
    } else if (typeof options == "string") {
        if( !dataTable ) {
            return;
        }
        //if($.inArray(dataTable.options, options) === -1) {
        //    throw new Error("Have not this method!");
        //}
        if( arguments[2] ) {
            return dataTable[options].call(dataTable,arguments[1],arguments[2]);
        }else if( arguments[1] ) {
            return dataTable[options].call(dataTable,arguments[1]);
        }else {
            return dataTable[options].call(dataTable);
        }



    }
};
