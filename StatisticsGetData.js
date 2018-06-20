var userSettings ={'StartDate': '', 'EndDate': '', 'Target': 0, 'PlusTolerance': '', 'MinusTolerance': 0};
var userPermission = {'Name': '', 'Level': ''};

var Group = ['MEACL', 'MPD', 'CQA', 'Press&Body', 'C&A', 'Paint', 'SKD'];
var groupData ={'MEACL' :[{}], 'MPD' :[{}], 'CQA' :[{}], 'Press&Body' :[{}], 'C&A' :[{}], 'Paint' :[{}], 'SKD' :[{}]};

var travelInfo = [];
var DepartmentCost; 
var groupData =[];

$(function(){
	$('.collapse').collapse();
	$('#CostCategories').find("input").prop( 'checked', true);
	$('#CostCategories').find('input[value="PerDiem"]').prop( 'checked', false);
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
});

function calendar(){
	var start = moment().subtract(29, 'days');
	var end = moment();
	
	function cb(start, end){
		$('#dataUser span').html(start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'));
	}

	$('#dataUser').daterangepicker({
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
	var listName;
	var countCategories = 0;
	travelInfo =[];
	userSettings ={'StartDate': '', 'EndDate': '', 'Target': 0, 'PlusTolerance': '', 'MinusTolerance': 0};
	userSettings.StartDate = ($('#dataUser span').text()).substring(0,10);
	userSettings.EndDate = ($('#dataUser span').text()).substring(13);
	
	userSettings.Target = parseInt($('input[name="Target"]').val())
	userSettings.PlusTolerance = parseInt($('input[name="PlusTolerance"]').val());
	userSettings.MinusTolerance = parseInt($('input[name="MinusTolerance"]').val());
	
	groupData ={'MEACL' :[{}], 'MPD' :[{}], 'CQA' :[{}], 'Press&Body' :[{}], 'C&A' :[{}], 'Paint' :[{}], 'SKD' :[{}]};
			
	$.when(getDataAjax()).done(function(){
		graphTotalCost($('#GraphCategorie').find("input:checked").val());
		topCountry();
		
		$('#LinkCateogires').html('');
		$('#LinkCateogires').append('<li class="active"><a href="#Total">Total</a></li>');
		$('#CostCategories').find("input:checked").map(function(){
			countCategories +=1;
			var temp = $(this).val();
			calculateCost($(this).val()); 
			displayInterface($(this).val());
		});
		
		$('#CountCategories').text(countCategories);
	
		$('#LinkCateogires').find('li').bind('click', function(){
			var dataHref = $(this).children().prop('href');
			$(this).siblings().removeClass('active');
			$(this).addClass('active');
			displayInformation(dataHref.slice(dataHref.indexOf('#')+1))
		});
	});
}

function getDataAjax(){
	var oDataUrl = "https://api.myjson.com/bins/1bthgi";

	$.ajax({
		async: false,
		url: oDataUrl,
		type: "GET",
		dataType: "json",
		headers: {
			"accept": "application/json;odata=verbose"  
		},
		success: function(data){
			console.log(data);
			travelInfo = data;
		},
		error: function(data, errMessage){
			alert("Error on get data from database: " + errMessage);
		}
	});
}

function displayInterface(userChoice){
	$('#tripsNumber').text(travelInfo.length);
	$('#tripsJoined').text(travelInfo.filter(function(n){if(n.JoinedTravelID !== null)return n}).length);
	$('#totalCost').text(($.map(Group, function(index){return groupData[index][0]['Total'];}).reduce(function(p, n){return p+n;})).toLocaleString());
	$('#basicInfo').removeAttr('hidden');
	$('#LinkCateogires').append('<li><a href="#'+userChoice+'">'+userChoice+'</a></li>');
	$('#divCalculatedCost').removeAttr('hidden');
}

function calculateCost(selectCategories){
	$.each(groupData, function(index){
		calculateGroupCost(index, selectCategories);
		calculateGroupCost(index, 'Total');
		calculateGroupCost(index, 'JoinedTravelID');
		calculateGroupCost(index, 'NumerOfTrips');
	});
	displayInformation('Total');
}


function calculateGroupCost(group, key){
	if (key == 'JoinedTravelID') groupData[group][0][key] = (travelInfo.filter(function(n){if(n['Group'] == group && n.JoinedTravelID !== null)return n}).length);
	else if (key == 'NumerOfTrips') groupData[group][0][key] = (travelInfo.filter(function(n){if(n['Group'] == group)return n}).length);
	else if (key == 'Total'){
		groupData[group][0][key] = 
			((groupData[group][0]['Avis'] === undefined) ? 0 : groupData[group][0]['Avis'] )+ 
			((groupData[group][0]['Booking'] === undefined) ? 0 : groupData[group][0]['Booking']) +
			((groupData[group][0]['PerDiem']=== undefined) ? 0 : groupData[group][0]['PerDiem']) +
			((groupData[group][0]['Hotel']=== undefined) ? 0 : groupData[group][0]['Hotel']) +
			((groupData[group][0]['Poolcar']=== undefined) ? 0 : groupData[group][0]['Poolcar'] )+
			((groupData[group][0]['Plane']=== undefined) ? 0 : groupData[group][0]['Plane']) +
			((groupData[group][0]['Taxi']=== undefined) ? 0 : groupData[group][0]['Taxi']);
	}
	else groupData[group][0][key] = $.map(travelInfo, function(n){if (n['Group']== group) return n[key];}).reduce(function(previous, current){return previous+current}, 0);
}

function displayInformation(dipslay){
	$('#groupDetailsToal').html('');
	var detailsTabeleRow = null;
	var sumarycost = null;

	sumarycost  = $.map(Group, function(index){
						return groupData[index][0][dipslay];
					}).reduce(function(p, n){
						return p+n;
					});
	
	$.each(Group, function(index){
		$.map(groupData[Group[index]], function(n){
			detailsTabeleRow += ('<tr><td>'+Group[index]+'</td><td>'+n.NumerOfTrips+'</td><td>'+n['JoinedTravelID']+'</td><td>'+(isNaN(n[dipslay]) ? 0 : n[dipslay].toLocaleString())+'</td><td>'+((isNaN(n[dipslay]/sumarycost)) ? 0: (n[dipslay]/sumarycost*100).toLocaleString())+'</td></tr>');
			});
	});
	
	detailsTabeleRow += ('<tr><td><b>Summary cost</b></td><td></td><td></td><td><b>'+sumarycost.toLocaleString()+'</b></td><<td></td>/tr>');
	
	$('#tableTextCategories').text(dipslay+' in PLN');
	$('#groupDetailsToal').html(detailsTabeleRow);
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
		for(var year = parseInt(moment(userSettings.StartDate).format('YYYY')); year <= parseInt(moment(userSettings.EndDate).format('YYYY')); year++) {
			graphData[group][year] = {}
			for(var month = parseInt(moment(userSettings.StartDate).format('M')); month <= parseInt(moment(userSettings.EndDate).format('M')); month++){
				graphData[group][year][month] = {};
				var filterByDate = travelInfo.map(function(n){
										var To = moment(n.To).format('YYYY-M-DD');
										var From = moment(n.From).format('YYYY-M-DD');
										var helpMonth = null;
										
										if (month>0 && month<10) helpMonth = '0' + month; //moment.js nie wykryje osttaniego dnia miesiąca jeżeli będzie miesiąc 4, musi być 04
										else helpMonth = month;
										if (moment(n.From).isAfter(moment(year+'-'+helpMonth +'-01')) && moment(n.To).isBefore(moment(year+'-'+helpMonth).endOf('month').format('YYYY-MM-DD')) && (n.Group == group)){
										//if ((To >= moment(year+'-'+helpMonth +'-01')) && (From <= moment(year+'-'+helpMonth).endOf('month').format('YYYY-MM-DD')) && (n.Group == group)){											
											if(categorie == 'Total'){
												TotalCost =
															((n['Avis'] === undefined || n['Avis'] === null) ? 0 : n['Avis'] )+ 
															((n['Booking'] === undefined || n['Booking'] === null) ? 0 : n['Booking']) +
															((n['PerDiem']=== undefined || n['PerDiem']=== null) ? 0 : n['PerDiem']) +
															((n['Hotel']=== undefined || n['Hotel']=== null) ? 0 : n['Hotel']) +
															((n['Poolcar']=== undefined || n['Poolcar']=== null) ? 0 : n['Poolcar'] )+
															((n['Plane']=== undefined || n['Plane']=== null) ? 0 : n['Plane']) +
															((n['Taxi']=== undefined || n['Taxi']=== null) ? 0 : n['Taxi']);
												return TotalCost;
											}
											else{
												return ((n[categorie] === undefined || n[categorie] === null) ? 0 : n[categorie] );
											}
										}
									}).reduce(function(n, p){
										if (n === undefined) n=0;
										if (p === undefined) p=0;
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