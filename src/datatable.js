;
(function($, window, document, undefined) {
	var initMethod = "initTable";
	var refreshMethod = "refreshTable";
	var searchMethod = "searchTable";
	var getSelectedData = "getSelectedData";
	var getRowData = "getRowData";
	var getSelectedRow = "getIndex";
	var putOptions = "putOptions";
	var smashOption = "smashOption";

	var default_module = {
		url: "",
		pageSize: 10,
		isPaging: true,
		column: [],
		maxPage: '',
		currentPage: 1,
		isResponse: true,
		ajaxRequest: "",
		bindEvent: null,
		data: {},
		count: "",
		conditions: {},
		eleSelector: "",
		isSelected: true,
		isOrder: true,
		pagingPattern: 'b',
		paginationGrids: 3
	};

	var defaults = [];

	//var fd;
	//var sd;

	function DataTable(element, options) {
		if(!element && !options){
			return;
		}
		this.element = element;
		this.eleSelector = element.selector;
		for(var i = 0;i < defaults.length;i++){
			if(defaults[i]['eleSelector'] == this.eleSelector){
				this.settings = defaults[i];
				this.settings = $.extend({}, this.settings, options);
				defaults[i] = this.settings;
				this.defaultsId = i;
				break;
			}
		}
		if(typeof this.settings == 'undefined'){
			this.settings = $.extend({}, default_module, options);
			this.settings['eleSelector'] = this.eleSelector;
			var i = defaults.push(this.settings);
			this.defaultsId = i-1;
		}
		this.columnNum = this.settings.column.length+1;
	}

	DataTable.prototype = {
		init: function(){
			if(this.settings.isPaging){
				this.initTable();
				this.getData();
				this.initPagination();
				this.bindPagingEvent();
				this.bindTableOperateEvent();
			}else{
				this.getData();
			}
		},

		initTable: function(){
			var td = '';
			var	tr = '';
			var th = '';
			for(var i=0;i<this.columnNum;i++){
				td += "<td></td>";
				if(i==(this.columnNum-1)){
					break;
				}
				th += "<th>"+this.settings.column[i]['title']+"</th>";
			}
			th = '<thead><tr><th><span class="first-th">#</span><span class="select-all" hidden="hidden"><input type="checkbox"/></span></th>'+th+'</tr></thead>';
			for(var i=0;i<this.settings.pageSize;i++){
				tr += "<tr>"+td+"</tr>";
			}

			this.element.append(th);
			this.element.append(tr);
		},

		getData: function(){
			var that = this;
			if(!this.settings.isResponse){
				this.settings.ajaxRequest.abort();
			}
			this.settings.isResponse = false;
			if(this.settings.conditions!=""){
				var formData = $.extend({pageSize:this.settings.pageSize, currentPage:this.settings.currentPage},this.settings.conditions);
			}else{
				var formData = {pageSize:this.settings.pageSize, currentPage:this.settings.currentPage};
			}
			this.settings.ajaxRequest = $.ajax({
				url:this.settings.url,
				data: formData,
				dataType:'json',
				type:'post',
				success:function(data){
					that.settings.data = data.data.data;
					defaults[that.defaultsId]['data'] = data.data.data;
					if(that.settings.isPaging){
						that.settings.count = data.data.count;
						that.putMaxPage();
						that.settings.isResponse = true;
						that.putData();
						that.initNewPagination();
					}else{
						that.settings.pageSize = data.data.data.length;
						that.initTable();
						that.putData();
					}
				}
			});
		},

		putMaxPage: function(){
			this.settings.maxPage = Math.ceil(this.settings.count/this.settings.pageSize);
			this.element.next().find('.max-page').html("一共有"+this.settings.maxPage+"页");
		},

		putLoadingPanel: function(){
			var posX = this.element.find('tbody').offset().top;
			var posY = this.element.find('tbody').offset().left;
			var width = this.element.find('tbody').width();
			var height = this.element.find('tbody').height();
			var $div = $("<div></div>");
			$div
		},

		putData: function(){
			//fd = new Date().getTime();
			//console.log("fd:"+fd);
			var formatMoney = this.formatMoney;
			var data = this.settings.data;
			var order = (this.settings.currentPage-1)*this.settings.pageSize;
			for(var j=0;j<this.settings.pageSize;j++){
				if(j == (data.length)){
					break;
				}
				$(".data-table tr:eq("+(j+1)+")").attr("rel",data[j].id);
				for(var i=0;i<this.columnNum;i++){
					if(i==0){
						order++;
						if(this.settings.isOrder == false && this.settings.isSelected == true){
							this.element.find("tr:eq("+(j+1)+") td:eq(0)").html('<span class="row-select"><input type="checkbox"/></span>');
						}else{
							this.element.find("tr:eq("+(j+1)+") td:eq(0)").html('<span class="sequence-number">'+order+'</span><span class="row-select" hidden="hidden"><input type="checkbox"/></span>');
						}
						continue;
					}
					if(this.settings.column[(i-1)].hasOwnProperty('nullReplacement') && !data[j][this.settings.column[(i-1)].field]){
//						this.element.find("tr:eq("+(j+1)+") td:eq("+i+")").html(this.settings.column[(i-1)].nullReplacement);
						var html = this.settings.column[(i-1)].nullReplacement;
						this.element.find("tr:eq("+(j+1)+") td:eq("+i+")").html(html);
						continue;
					}
					if(this.settings.column[(i-1)].hasOwnProperty('formatter')){
						if(typeof(this.settings.column[(i-1)].field)!='undefined'){
							if(typeof(this.settings.column[(i-1)].field) == "object"){
								var fields = this.getColField(j,i-1);
								var html = this.formatRow(i-1,fields);
								this.element.find("tr:eq("+(j+1)+") td:eq("+i+")").html(html);
								continue;
							}
							field = this.settings.column[(i-1)].field;
							val = data[j][field];
							html = this.formatRow((i-1),val);
							this.element.find("tr:eq("+(j+1)+") td:eq("+i+")").html(html);
							continue;
						}else{
							var html = this.formatRow((i-1),val);
							this.element.find("tr:eq("+(j+1)+") td:eq("+i+")").html(html);
							continue;
						}
					}

					var field = this.settings.column[(i-1)].field;
					var val = data[j][field];
					if(this.settings.column[(i-1)].hasOwnProperty('formatMoney')){
						val = formatMoney(val,this.settings.column[(i-1)]['formatMoney']);
					}
					this.element.find("tr:eq("+(j+1)+") td:eq("+i+")").html(val);
					//sd = new Date().getTime();
					//console.log("sd="+sd);
					//console.log("sd-fd="+(sd-fd));
				}
			}
			if(this.settings.bindEvent != null){
				this.settings.bindEvent();
			}
			this.bindSelectEvent();
		},

		getColField: function(row,col){
			var sett = this.settings;
			var fields = {};
			for(var key in this.settings.column[col]['field']){
				var k = this.settings.column[col]['field'][key];
				var val = this.settings.data[row][k];
				if(sett.column[col].hasOwnProperty('formatMoney')){
//					places, symbol, thousand, decimal
					val = val.this.formatMoney(sett.column['col']['formatMoney']);
				}
				fields[k] = val;
			}
			return fields;
		},

		formatRow: function(j,val){
			if(val==""){
				return this.settings.column[j].formatter();
			}
			return this.settings.column[j].formatter(val);
		},

		initPagination: function(){
			var sett = this.settings;
			this.element.wrap("<div></div>");
			var pagination = '<div class="pagination">'+
				'<table>'+
				'<tr>'+
				'<td>'+
				'<div class="btn-pre"></div>'+
				'</td>'+
				'<td>'+
				'第<input type="text" class="current-page" value="1">页'+
				'</td>'+
				'<td>'+
				'<div class="btn-next"></div>'+
				'</td>'+
				'<td>'+
				'<div class="btn-refresh">'+
				'</div>'+
				'</td>'+
				'<td>'+
				'<span class="max-page">'+
				'</span>'+
				'</td>'+
				'</tr>'+
				'</table>'+
				'</div>';
			this.element.after(pagination);

		},

		initNewPagination: function(){
			var sett = this.settings;
			var $pagination = $(['<nav>',
				'  <ul class="pagination">',
				'  </ul>',
				'</nav>'].join(""));
			var $li = $();
			var hasPreDot = sett.paginationGrids+1;
			var hasAfterDot = "";
			var startPage = "";
			var endPage = "";
			var modiNode = 0;
			var halfNode = Math.ceil(sett.paginationGrids/2);
			if(sett.maxPage%2 == 0){
				startPage = sett.currentPage-(halfNode-1);
			}else{
				startPage = sett.currentPage-halfNode;
			}
			if(startPage <= 0){
				modiNode = Math.abs(startPage-1);
				startPage = 0;
			}
			endPage = startPage + sett.paginationGrids+modiNode;
			if(endPage > sett.maxPage){
				modiNode =  endPage-sett.maxPage;
				endPage = sett.maxPage;
			}
			startPage = startPage-modiNode;
			for(var i = startPage;i<=endPage-startPage;i++){
				$li.after('<li class="table-paging" data-page="'+i+'"><a href="#">'+i+'</a></li>');
			}
			$li.filter('[data-page="'+sett.currentpage+'"]').addClass('active');
			this.element.after($li);
		},

		bindPagingEvent: function(){
			var that = this;
			this.element.next().find('.current-page,.btn-next,.btn-pre,.btn-refresh').unbind();
			this.element.next().find('.current-page').on('keypress',function(event){
				if(event.keyCode=='13'){
					var targetPage = $(this).val();

					if(targetPage==that.settings.currentPage){
						return;
					}
					that.settings.currentPage = parseInt(targetPage);
					that.refresh();
				}
			});
			this.element.next().find('.btn-next').on('click',function(){
				that.settings.currentPage += 1;
				that.element.next().find('.current-page').val(that.settings.currentPage);
				//alert("asdad");
				that.clear();
				that.getData();
			});
			this.element.next().find('.btn-pre').on('click',function(){
				if(that.settings.currentPage==1){
					return;
				}
				that.settings.currentPage -= 1;
				that.element.next().find('.current-page').val(that.settings.currentPage);
				that.clear();
				that.getData();
			});
			this.element.next().find('.btn-refresh').on('click',function(){
				var targetPage = parseInt(that.element.next().find('.current-page').val());
				that.settings.currentPage = targetPage;
				that.clear();
				that.getData();
			});
		},

		bindSelectEvent: function(){
			var selectState = 0;
			if(this.settings.isSelected == false || this.settings.isOrder == false){
				return;
			}
			this.element.find('.row-select').click(function(){
				if(selectState == 0){
					$('.row-select,.select-all').removeAttr('hidden');
					$('.sequence-number,.first-th').attr('hidden','hidden');
					selectState = 1;
				}
			});
			this.element.find('.select-all input').on('click',function(){
				if($(this).prop('checked')){
					$(".row-select input").each(function(){
						$(this).prop("checked",true);
					});
				}else{
					$(".row-select input").each(function(){
						$(this).prop("checked",false);
					});
				}
			});
			this.element.find('tr').on('mouseover',function(){
				if(selectState==0){
					$(this).find(".row-select").removeAttr("hidden");
					$(this).find('.sequence-number').attr('hidden','hidden');
				}
			});
			this.element.find('tr').on('mouseout',function(){
				if(selectState==0){
					$(this).find(".sequence-number").removeAttr("hidden");
					$(this).find(".row-select").attr("hidden","hidden");
				}
			});

		},

		bindTableOperateEvent: function(){
			this.element.find('.batching').click(function(){
				if(this.element.find('.row-select').attr('hidden')=='hidden'){
					this.element.find(".sequence-number").attr("hidden","hidden");
					this.element.find(".row-select").removeAttr("hidden");
					this.element.find(".row-select input").each(function(){
						$(this).prop("checked",false);
					});
				}else{
					this.element.find(".sequence-number").removeAttr("hidden");
					this.element.find(".row-select").attr("hidden","hidden");
				}
			});

			this.element.find(".all-check").click(function(){
				this.element.find(".row-select input").prop("checked",true);
			});

			this.element.find(".reverse-check").click(function(){
				this.element.find(".row-select input").each(function(){
					if($(this).prop("checked")){
						$(this).prop("checked",false);
					}else{
						$(this).prop("checked",true);
					}
				});
			});
		},

		refresh: function(){

			this.clear();
			this.getData();
		},

		clear: function(){
			this.element.find("td").empty();
		},

		getSelectedData: function(field){
			var data = this.settings.data;
			var requiredData = [];
			var index = this.getSelectedIndex();

			if(typeof field == "undefined"){
				for(var i=0;i<index.length;i++){
					requiredData.push(data[index[i]]);
				}
			}else{
				for(var i=0;i<index.length;i++){
					requiredData.push(data[index[i]][field]);
				}
			}
			return requiredData;
		},

		getRowData: function(ele,field){
			var data = this.settings.data;
			var index = this.getSelectedIndex(ele);
			var requiredData = [];
			if(typeof field == "undefined"){
				for(var i=0;i<index.length;i++){
					requiredData.push(data[index[i]]);
				}
			}else{
				for(var i=0;i<index.length;i++){
					requiredData.push(data[index[i]][field]);
				}
			}
			return requiredData;
		},

		getSelectedIndex: function(ele){
			if(typeof ele == "undefined"){
				var selectedEle = this.element.find('.row-select input:checked');
				var len = selectedEle.length;
				var arr = [];
				for(var i=0;i<len;i++){
					arr.push(selectedEle.parent().parent().parent().eq(i).index());
				}
			}else{
				var selectedEle = this.element.find(ele);
				var len = selectedEle.length;
				var arr = [];
				for(var i=0;i<len;i++){
					arr.push(selectedEle.parent().parent().eq(i).index());
				}
			}
			return arr;
		},

		search: function(){
			var sett = this.settings;
			if(sett.isPaging){
				this.clear();
				sett.currentPage = 1;
				this.element.next().find('.current-page').val("1");
				this.getData();
			}else{
				sett.currentPage = 1;
				this.element.empty();
				this.init();
			}

		},

		formatMoney: function (val,arguments) {
//			places保留小数位数, symbol货币符号, thousand整数部分千位分隔符, decimal小数分隔符
			if(isNaN(val)){
				return val;
			}
			places = !isNaN(places = Math.abs(arguments[0])) ? places : 2;
			//  symbol = symbol !== undefined ? symbol : "$";
			symbol = arguments[1] !== undefined ? arguments[1] : "￥";
			thousand = arguments[2] || ",";
			decimal = arguments[3] || ".";
			var number = val,
				negative = number < 0 ? "-" : "",
				i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
				j = (j = i.length) > 3 ? j % 3 : 0;
			return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
		},

		smashOptions: function() {
			defaults = [];
			//this.settings.currentPage = 1;
		}

//		putOptions: function(){
//			if(this.settings.isPaging){
//				this.initTable();
//				this.getData();
//				this.initPagination();
//				this.bindPagingEvent();
//				this.bindTableOperateEvent();
//			}else{
//				this.getData();
//			}
//		}



//		formatMoney: function (places, symbol, thousand, decimal) {
////			places保留小数位数, symbol货币符号, thousand整数部分千位分隔符, decimal小数分隔符
//		    places = !isNaN(places = Math.abs(places)) ? places : 2;
////  symbol = symbol !== undefined ? symbol : "$";
//			symbol = symbol !== undefined ? symbol : "";
//		    thousand = thousand || ",";
//		    decimal = decimal || ".";
//		    var number = this,
//	        negative = number < 0 ? "-" : "",
//	        i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
//	        j = (j = i.length) > 3 ? j % 3 : 0;
//  		return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
//		}

	};

	$.fn[initMethod] = function(options) {
		var dataTable = new DataTable(this, options);
		dataTable.init();
		return this;
	};

	$.fn[refreshMethod] = function(options) {
		var dataTable = new DataTable(this, options);
		dataTable.refresh();
		return this;
	};

	$.fn[searchMethod] = function(options){
		var dataTable = new DataTable(this, options);
		dataTable.bindPagingEvent();
		dataTable.search();
		return this;
	}

	$.fn[getSelectedData] = function(field){
		var dataTable = new DataTable(this);
		var fields = dataTable.getSelectedData(field);
		return fields;
	}

	$.fn[getRowData] = function(ele){
		var dataTable = new DataTable(this);
		var fields = dataTable.getRowData(ele);
		return fields;
	}

	$.fn[getSelectedRow] = function(){
		var dataTable = new DataTable(this);
		var index = dataTable.getSelectedIndex();
		return index;
	}

	$.fn[putOptions] = function(options){
		var dataTable = new DataTable(this,options);
		return this;
	}

	$.extend({
		smashOption: function() {
			var dataTable = new DataTable();
			dataTable.smashOptions();
		}
	});



})(jQuery, window, document);