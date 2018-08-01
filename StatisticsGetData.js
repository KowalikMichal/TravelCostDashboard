var Group = ['MEACL', 'MPD', 'CQA', 'Press&Body', 'C&A', 'Paint', 'SKD'];
var userSettings ={};
var groupData ={};
var travelInfo = [];

$(function(){
	$('.collapse').collapse();
	$('#CostCategories').find("input").prop( 'checked', true);
	$('#GraphCategorie').find('input[value="Total"]').prop( 'checked', true);

	calendar();
	
	$('#UnselectAllCategories').on("click", function(){
		$('#CostCategories').find(":input").each(function(){
			this.checked = false;
		});
	});

	$('#SelectAllCategories').on("click", function(){
		$('#CostCategories').find(":input").each(function(){
			this.checked = true;
		});
	});

	$('#apply').on('click', function(){
		validate();
	});

	$('#cancel').on('click', function(){
		window.history.back();
	});
});

function calendar(){
	var start = moment().subtract(29, 'days');
	var end = moment();
	
	function cb(start, end){
		$('#dataUser span').html(start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'));
	}

	$('#dataUser').daterangepicker({
		minDate: moment('2015/01/01'),
 		maxDate: moment('2018/12/31'),
		startDate: start,
		endDate: end,
		ranges: {
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
		}
	}, cb);
	cb(start, end);
}


function validate(){
	var complete = false;

	if ($('input[name="Target"]').val() == '' || $('input[name="PlusTolerance"]').val() == '' || $('input[name="MinusTolerance"]').val() == '') complete=0;
	else if (!($('#GraphCategorie').find(':input:radio:checked').length > 0)) complete=0;
	else if (!($('#CostCategories').find(':input:checkbox:checked').length > 0)) complete=0;
	else complete=1;
	
	if (complete == 1){
		showDetails();
		$('#incorrect').closest('.alert').attr('hidden', 'hidden');
	}
	else{
		$('#incorrect').html('<strong>Please fill correct form!</strong>');
		$('#incorrect').closest('.alert').removeAttr('hidden');
	}
}

function showDetails(){
	var counterCatregoiresLable = 0;
	travelInfo =[];
	userSettings ={};
		userSettings.StartDate = moment(($('#dataUser span').text()).substring(0,10));
		userSettings.EndDate = moment(($('#dataUser span').text()).substring(13));	
		userSettings.Target = parseInt($('input[name="Target"]').val())
		userSettings.PlusTolerance = parseInt($('input[name="PlusTolerance"]').val());
		userSettings.MinusTolerance = parseInt($('input[name="MinusTolerance"]').val());
	
	groupData ={'MEACL' :[{}], 'MPD' :[{}], 'CQA' :[{}], 'Press&Body' :[{}], 'C&A' :[{}], 'Paint' :[{}], 'SKD' :[{}]};
			
	$.when(getDataAjax()).done(function(ajaxData){
		travelInfo = ajaxData.filter(function(n){
			if (moment(n.StartDate).isAfter(userSettings.StartDate) && moment(n.EndDate).isBefore(userSettings.EndDate)) return true;
		});

		graphTotalCost($('#GraphCategorie').find("input:checked").val());
		topCountry();
		
		$('#LinkCateogires').html('');
		$('#LinkCateogires').append('<li class="active"><a href="#Total">Total</a></li>');
		$('#CostCategories').find("input:checked").map(function(){
			counterCatregoiresLable +=1;
			calculateCost($(this).val()); 
			displayInterface($(this).val());
		});
		
		$('#CountCategories').text(counterCatregoiresLable);
	
		$('#LinkCateogires').find('li').bind('click', function(){
			var dataHref = $(this).children().prop('href');
			$(this).siblings().removeClass('active');
			$(this).addClass('active');
			displayInformation(dataHref.slice(dataHref.indexOf('#')+1))
		});
	});
}

function getDataAjax(){
	var oDataUrl = "https://raw.githubusercontent.com/KowalikMichal/TravelCostDashboard/master/generated.json";

	return $.ajax({
		async: false,
		url: oDataUrl,
		type: "GET",
		cache: true,
		dataType: "json",
		headers: {
			"accept": "application/json;odata=verbose"  
		},
		success: function(data){
			console.log('Ajax success!');
		},
		error: function(data, errMessage){
			alert("Error on get data from database: " + errMessage);
		}
	});
}

function displayInterface(userChoice){
	$('#tripsNumber').text(travelInfo.length);
	$('#tripsJoined').text(travelInfo.filter(function(n){if(n.Join !== null)return n}).length);
	$('#totalCost').text(($.map(Group, function(index){return groupData[index][0]['Total'];}).reduce(function(p, n){return p+n;})).toLocaleString());
	$('#basicInfo').removeAttr('hidden');
	$('#LinkCateogires').append('<li><a href="#'+userChoice+'">'+userChoice+'</a></li>');
	$('#divCalculatedCost').removeAttr('hidden');

}

function calculateCost(selectCategories){
	$.each(groupData, function(index){
		calculateGroupCost(index, selectCategories);
		calculateGroupCost(index, 'Total');
		calculateGroupCost(index, 'Join');
		calculateGroupCost(index, 'NumerOfTrips');
	});
	displayInformation('Total');
}


function calculateGroupCost(group, key){
	if (key == 'Join') groupData[group][0][key] = (travelInfo.filter(function(n){if(n['Group'] == group && n.Join !== null)return n}).length);
	else if (key == 'NumerOfTrips') groupData[group][0][key] = (travelInfo.filter(function(n){if(n['Group'] == group)return n}).length);
	else if (key == 'Total') groupData[group][0][key] = ~~groupData[group][0]['Avis'] + ~~groupData[group][0]['Booking'] + ~~groupData[group][0]['PerDiem'] + ~~groupData[group][0]['Hotel'] + ~~groupData[group][0]['Poolcar'] + ~~groupData[group][0]['Plane'] + ~~groupData[group][0]['Taxi'];
	else groupData[group][0][key] = $.map(travelInfo, function(n){if (n['Group']== group) return n[key];}).reduce(function(previous, current){return previous+current}, 0);
}

function displayInformation(display){
	$('#groupDetailsToal').html('');
	var detailsTabeleRow = null;
	var sumarycost = null;

	sumarycost  = $.map(Group, function(index){return groupData[index][0][display];}).reduce(function(p, n){return p+n;});
	$.each(Group, function(index){
		$.map(groupData[Group[index]], function(n){
			detailsTabeleRow += ('<tr><td data-title="Dept.">'+Group[index]+'</td><td data-title="Number of trips">'+n.NumerOfTrips+'</td><td data-title="Joined trips">'+n['Join']+'</td><td data-title="'+display+'">'+(isNaN(n[display]) ? 0 : n[display].toLocaleString())+'</td><td data-title="[%]">'+((isNaN(n[display]/sumarycost)) ? 0: (n[display]/sumarycost*100).toLocaleString())+'</td></tr>');
			});
	});

	$('#tableTextCategories').text(display+' in PLN');
	$('#GroupCost').find('tbody').html(detailsTabeleRow);
	$('#GroupCost').find('tfoot').html('<tr><td colspan="3"><b>Summary cost</b></td><td colspan="2">'+sumarycost.toLocaleString()+'</b></td>/tr>');
}

function graphTotalCost(categorie){
	var graphData = {};
	var TotalCost =0;
	
	var Tolerance = {'PlusTolerance' : [], 'MinusTolerance': [], };
	var helpData = {'Months': []};
	var ctx = null;
	var barChart = null;

	$('#graph').html('');
	$('#graph').append('<canvas id="graphTotalCost" class="shadow-depth-1"></canvas>');
	ctx = document.getElementById('graphTotalCost').getContext('2d');
		
	barChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: Group,
			},
		options: {
		title: {
			display: true,
			text: 'Summary cost of ' + categorie
			}
		}
	});

	for(var i=0; i < Group.length; i++){
		Tolerance.PlusTolerance.push((1+userSettings.PlusTolerance/100)*userSettings.Target); 
		Tolerance.MinusTolerance.push((1-userSettings.MinusTolerance/100)*userSettings.Target);
	}
	
	$.each(Group, function(index, group){
		graphData[group] = {};
		for(var year = ~~userSettings.StartDate.format('YYYY'); year <= ~~userSettings.EndDate.format('YYYY'); year++) {
			graphData[group][year] = {}
			for(var month = ~~userSettings.StartDate.format('M'); month <= ~~userSettings.EndDate.format('M'); month++){
				graphData[group][year][month] = {};
				var filterByDate =
				travelInfo.map(function(n){
					var firstDayMonth = moment(year+'-'+month +'-01').format('YYYY-MM-DD');
					var lastDayMoth = moment(year+'-'+month).endOf('month').format('YYYY-MM-DD');

					if (moment(n.StartDate).isAfter(firstDayMonth) && moment(n.EndDate).isBefore(lastDayMoth) && (n.Group == group)){								
						if(categorie == 'Total'){
							TotalCost = ~~n['Avis'] + ~~ n['Booking'] + ~~n['PerDiem'] + ~~ n['Hotel'] + ~~ n['Poolcar'] + ~~n['Plane'] + ~~n['Taxi'];
							return TotalCost;
						}
						else{
							return ~~ n[categorie];
						}
					}
				}).reduce(function(n, p){
					n = ~~n;
					p = ~~p;
					return n+p;
				});
				graphData[group][year][month] = filterByDate;
			}
		}
	});

	var years = Object.keys(graphData['MEACL']);
	var months;

	$.each(years, function(element, year){
		months = Object.keys(graphData['MEACL'][year]);
		$.each(months, function(object, month){
			var data = [];
			$.each(Group, function(index, group){
				data.push(graphData[group][year][month].toFixed(2));
			});
			addData(barChart, 'rgb(255, 99, 132)', data, (year+'/'+ month) , 'bar');
		});
	});
		
	addData(barChart, 'green', Tolerance.PlusTolerance, 'PlusTolerance', 'line');
	addData(barChart, 'red', Tolerance.MinusTolerance, 'MinusTolerance', 'line');
}

function addData(chart, color, data, lable, type) {
	if (type == 'bar'){
		chart.data.datasets.push({
			type: 'bar',
			label: lable,
			backgroundColor: color,
			data: data
		});
	}else if (type = 'line'){
			chart.data.datasets.push({
				type: 'line',
				label: lable,
				fill: false,
				fillColor: color,
				strokeColor: color,
				pointColor: color,
				pointStrokeColor: color,
				pointHighlightFill: color,
				pointHighlightStroke: color,
				fontSize: 40,
				data: data
		});
	}
	chart.update();
}

function topCountry(){
	var TopCountry = {};
	var htmltopCountry;
	var topCountry;

	TopCountry= $.map(travelInfo, function(n){return (n.Destiantion.toUpperCase().slice(0, n.Destiantion.indexOf(',')))}).reduce(function(obj, elem){
						obj[elem]=obj[elem] || 0;
						obj[elem]++;
						return obj;}, {});

	$.each(TopCountry, function(index, val){
		htmltopCountry += ('<tr><td>'+index+'</td><td>'+val+'</td></tr>');
	});

	$('#topCountry').find('tbody').html(' ');
	$('#topCountry').removeAttr('hidden');
	$('#topCountry').find('tbody').append(htmltopCountry);
}

function sort(tablica, key){
		tablica.sort(function(a, b) {
			var nameA = a[key].toUpperCase(); // ignore upper and lowercase
			var nameB = b[key].toUpperCase(); // ignore upper and lowercase
			(nameA < nameB) ? -1: 0;
			return 0;
		});
}