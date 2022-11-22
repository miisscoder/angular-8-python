import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { FutureService } from '../../../services/future.service';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'egg-box-strategy-component',
  templateUrl: './egg-box-strategy.component.html',
  styleUrls: ['./egg-box-strategy.component.scss']
})
export class EggBoxStrategyComponent implements OnInit, OnChanges {

  @Input() data: any;

  // data for this page
  contracts = [];
  dataList = [];
  errorMessage: any;
  dataStock = [];
  dataStockRoom = [];
  startRoomTime = null;
  endRoomTime = null;
  capitals = [];
  timeSeleted: any;

  // for chart
  margin = {
    top: 20,
    bottom: 20,
    left: 50,
    right: 50,
    middle: 20,
    room: 40
  };
  width = 500;
  height = 1000;
  xMain: any;
  xValueDistribution: any;
  yTimeProfit: any;
  yMaxBottom: any;
  yStock: any;
  yNetValue: any;
  yStackDeep: any;
  yProfit: any;
  yValueDistribution: any;
  yHeight = 0;
  svg: any;
  gMainCharts: any;

  // Room
  xRoom: any;
  xValueDistributionRoom: any;
  yTimeProfitRoom: any;
  yMaxBottomRoom: any;
  yStockRoom: any;
  yNetValueRoom: any;
  yStackDeepRoom: any;
  yProfitRoom: any;
  yValueDistributionRoom: any;

  positionLeftRoomBar: any;
  positionRightRoomBar: any;

  fontSizeDescription = 5;
  fontSizeAxis = 6.5;
  fontSizeRoomAxis = 5;
  fontSizeProportion = 5;

  capitalsLong = [];
  capitalsShort = [];
  capitalsUnion = [];
  capitalsLongRoom = [];
  capitalsShortRoom = [];
  capitalsUnionRoom = [];

  table = 0;
  tables = '';
  rateProfit = 2;
  rates = [1.001, 1.002, 1.003, 1.004, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1,
    1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.2];
  strategy = 0;
  strategies = ['box'];
  rateMaxLoss = 0;
  ratesMaxLoss = [1 / 10000, 0.99, 0.98, 0.97, 0.96, 0.95,
    0.94, 0.93, 0.92, 0.91, 0.9, 0.85, 0.8];

  rateOfprofit = 0;
  optionsRateOfProfit = ['1.01,1.01,1.01,1.01'];
  arrRateOfProfit = [];
  proportion = 0;
  optionsProportion = ['1:1:1:1'];
  arrProportion = [];
  arrRange = [];
  longOrShort = 0;
  optionsLongOrShort = ['1:1:1:0']; // 2 both; 1 做多 long; 0 做空 short 
  arrLongOrShort = [];

  totalProfit = 0;
  yearProfit = 0;
  notProfit = [];
  beProfit = [];
  valueDistribution = [];
  rateOfGettingProfit: any;



  constructor(public futureService: FutureService,
    public http: HttpClient) {
  }


  ngOnInit() {
    console.log('data');
    console.log(this.data);
    console.log('contracts');
    console.log(this.contracts);
    if (this.data) {
      this.unionData();
      this.chart();
    }
  }

  ngOnChanges() {
    if (this.data) {
      console.log('data');
      console.log(this.data);
      console.log('contracts');
      console.log(this.contracts);
      this.unionData();
      this.chart();
    }
  }

  chart() {
    this.futureService.dataStock = this.dataStock;
    console.log(this.futureService.dataStock);
    this.yHeight = (this.height - this.margin.middle * 3 - this.margin.top
      - this.margin.bottom - this.margin.room * 4) / 4;
    if (this.dataStock && this.dataStock.length > 0) {
      this.dataStockRoom = this.dataStock;
      this.getParameter();
      this.futureService.getNetValue(this.arrRateOfProfit,
        this.arrRange, this.arrLongOrShort);
      this.capitals = this.futureService.capitals;

      _.each(this.capitals, (o) => {
        this.capitalsLong = _.union(this.capitalsLong, o['long']);
        this.capitalsShort = _.union(this.capitalsShort, o['short']);
      });

      this.capitalsUnion = _.union(this.capitalsLong, this.capitalsShort);
      this.capitalsLongRoom = this.capitalsLong = _.sortBy(this.capitalsLong, ['inDate']);
      this.capitalsShortRoom = this.capitalsShort = _.sortBy(this.capitalsShort, ['inDate']);
      this.capitalsUnionRoom = this.capitalsUnion = _.sortBy(this.capitalsUnion, ['inDate']);

      // stock value distribution;
      var dataSortBValues = _.sortBy(this.dataStock, 'open');
      _.each(dataSortBValues, (o) => {
        var f = _.find(this.valueDistribution, (oo) => o['open'] === oo['value']);
        if (f) { f['frequency'] = f['frequency'] + 1; }
        else { this.valueDistribution.push({ 'value': o['open'], 'frequency': 1 }); }
      });
      d3.select('#chartBox svg').remove();
      this.svg = d3.select('#chartBox').append('svg').attr('viewBox', [0, 0, this.width, this.height])
      this.gMainCharts = this.svg.append('g').attr('id', 'gBoxMainCharts')
        .on('click', () => {
          const x = d3.mouse(d3.event.target)[0];
          if (x >= this.margin.left && x <= this.width - this.margin.right) {
            this.detailLine(x);
          }
        })
        .on('mouseover', () => {
          const x = d3.mouse(d3.event.target)[0];
          if (x >= this.margin.left && x <= this.width - this.margin.right) {
            this.detailLine(x);
          }
        });   
      this.xAxisMainChart();
      this.xAxisRoomchart();
      this.drawCharts(true);
      this.drawCharts(false);
      this.textDescription();
      this.RoomBar();
    }
  }
  
  unionData() {
    this.dataStock = [];
    this.tables = '';
    this.contracts = JSON.parse(sessionStorage.getItem('eggContracts'));
    let keys = _.keys(this.contracts);
    keys.sort();
    for (var i = keys.length - 1; i >= 0; i--) {
      if (this.contracts[keys[i]].checked === true) {
        this.tables = this.tables + keys[i] + ' ';
        if (this.dataStock && this.dataStock.length > 0) {
          const startDate = new Date(this.dataStock[0].date.getFullYear(),
            this.dataStock[0].date.getMonth(), this.dataStock[0].date.getDate());
          const endDate = new Date(this.dataStock[this.dataStock.length - 1].date.getFullYear(),
            this.dataStock[this.dataStock.length - 1].date.getMonth(),
            this.dataStock[this.dataStock.length - 1].date.getDate());
          const arr = _.filter(this.data[keys[i]],
            (o) =>  o['date'] > endDate || o['date'] < startDate );
            this.dataStock = _.union(this.dataStock, arr);
        } else {
          this.dataStock = this.data[keys[i]];
        }
        this.dataStock = _.sortBy(this.dataStock, ['date']);
      }
    }
  }

  detailLine(x) {
    this.svg.select('g#gBoxLineFocus').remove();
    const g = this.svg.append('g').attr('id', 'gBoxLineFocus');
    g.append('line').attr('x1', x).attr('y1', this.margin.top + this.margin.room)
      .attr('x2', x).attr('y2', this.margin.top + this.margin.room + this.yHeight)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.5);
    g.append('line').attr('x1', x).attr('y1', this.margin.top + this.margin.room * 2 + this.margin.middle + this.yHeight)
      .attr('x2', x).attr('y2', this.margin.top + this.margin.room * 2 + this.margin.middle + this.yHeight * 2)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.5);
    g.append('line').attr('x1', x).attr('y1', this.margin.top + this.margin.room * 3 + this.margin.middle * 2 + this.yHeight * 2)
      .attr('x2', x).attr('y2', this.margin.top + this.margin.room * 3 + this.margin.middle * 2 + this.yHeight * 3)
      .attr('stroke', '#000000')
      .attr('stroke-width', 0.5);
    const dt = this.xMain.invert(x);
    this.timeSeleted = dt;
    const bisect1 = d3.bisector(d => d.date);
    const iDataStockRoom = bisect1.right(this.dataStockRoom, dt);
    g.append('circle').attr('cx', x)
      .attr('cy', this.yStock(this.dataStockRoom[iDataStockRoom].open))
      .attr('r', 2).attr('fill', '#ffffff')
      .attr('stroke', '#E53A40').attr('stroke-width', 0.5);
    g.append('text').attr('x', x + 10)
      .attr('y', this.yStock(this.dataStockRoom[iDataStockRoom].open) - 10)
      .attr('fill', '#ffffff').attr('stroke', '#E53A40').attr('stroke-width', 0.8)
      .text(this.dataStockRoom[iDataStockRoom].open)
      .attr('font-size', this.fontSizeDescription * 1.5);
    //const bisect2 = d3.bisector(d => d.inDate);
    //const iCapitalsUnionRoom = bisect2.right(this.capitalsUnionRoom, dt);
    //g.append('circle').attr('cx', x)
    //  .attr('cy', this.yTimeProfit(this.capitalsUnionRoom[iCapitalsUnionRoom].timeProfit))
    //  .attr('r', 2).attr('fill', '#ffffff')
    //  .attr('stroke', '#30A9DE').attr('stroke-width', 0.5);
    //g.append('text').attr('x', x + 10)
    //  .attr('y', this.yTimeProfit(this.capitalsUnionRoom[iCapitalsUnionRoom].timeProfit) + 10)
    //  .attr('fill', '#ffffff').attr('stroke', '#30A9DE').attr('stroke-width', 0.8)
    //  .text(this.capitalsUnionRoom[iCapitalsUnionRoom].timeProfit)
    //  .attr('font-size', this.fontSizeDescription * 1.5);
    //g.append('circle').attr('cx', x)
    //  .attr('cy', this.yMaxBottom(this.capitalsUnionRoom[iCapitalsUnionRoom].maxBottomOrTop /
    //    this.capitalsUnionRoom[iCapitalsUnionRoom].value))
    //  .attr('r', 2).attr('fill', '#ffffff')
    //  .attr('stroke', '#EFDC05').attr('stroke-width', 0.5);
    //g.append('text').attr('x', x + 10)
    //  .attr('y', this.yMaxBottom(this.capitalsUnionRoom[iCapitalsUnionRoom].maxBottomOrTop /
    //    this.capitalsUnionRoom[iCapitalsUnionRoom].value) - 10)
    //  .attr('fill', '#ffffff').attr('stroke', '#EFDC05').attr('stroke-width', 0.8)
    //  .text(this.capitalsUnionRoom[iCapitalsUnionRoom].maxBottomOrTop /
    //    this.capitalsUnionRoom[iCapitalsUnionRoom].value)
    //  .attr('font-size', this.fontSizeDescription * 1.5);
    //if (this.dataStockRoom[iDataStockRoom].stackDeepLong > -1) {
    //  g.append('circle').attr('cx', x)
    //    .attr('cy', this.yStackDeep(this.dataStockRoom[iDataStockRoom].stackDeepLong))
    //    .attr('r', 2).attr('fill', '#ffffff')
    //    .attr('stroke', '#A593E0').attr('stroke-width', 0.5);
    //  g.append('text').attr('x', x + 10)
    //    .attr('y', this.yStackDeep(this.dataStockRoom[iDataStockRoom].stackDeepLong) + 10)
    //    .attr('fill', '#ffffff').attr('stroke', '#A593E0').attr('stroke-width', 0.8)
    //    .text(this.dataStockRoom[iDataStockRoom].stackDeepLong)
    //    .attr('font-size', this.fontSizeDescription * 1.5);
    //}
    //if (this.dataStockRoom[iDataStockRoom].stackDeepShort > -1) {
    //  g.append('circle').attr('cx', x)
    //    .attr('cy', this.yStackDeep(this.dataStockRoom[iDataStockRoom].stackDeepShort))
    //    .attr('r', 2).attr('fill', '#ffffff')
    //    .attr('stroke', '#A593E0').attr('stroke-width', 0.5);
    //  g.append('text').attr('x', x + 10)
    //    .attr('y', this.yStackDeep(this.dataStockRoom[iDataStockRoom].stackDeepShort) + 10)
    //    .attr('fill', '#ffffff').attr('stroke', '#A593E0').attr('stroke-width', 0.8)
    //    .text(this.dataStockRoom[iDataStockRoom].stackDeepShort)
    //    .attr('font-size', this.fontSizeDescription * 1.5);
    //}
    //g.append('circle').attr('cx', x)
    //  .attr('cy', this.yProfit(this.dataStockRoom[iDataStockRoom].profit))
    //  .attr('r', 2).attr('fill', '#ffffff')
    //  .attr('stroke', '#F6B352').attr('stroke-width', 0.5);
    //g.append('text').attr('x', x + 10)
    //  .attr('y', this.yProfit(this.dataStockRoom[iDataStockRoom].profit) - 10)
    //  .attr('fill', '#ffffff').attr('stroke', '#F6B352').attr('stroke-width', 0.8)
    //  .text(this.dataStockRoom[iDataStockRoom].profit)
    //  .attr('font-size', this.fontSizeDescription * 1.5);
    //g.append('circle').attr('cx', x)
    //  .attr('cy', this.yNetValue(this.dataStockRoom[iDataStockRoom].netValueSum))
    //  .attr('r', 2).attr('fill', '#ffffff')
    //  .attr('stroke', '#090707').attr('stroke-width', 0.5);
    //g.append('text').attr('x', x + 10)
    //  .attr('y', this.yNetValue(this.dataStockRoom[iDataStockRoom].netValueSum) + 10)
    //  .attr('fill', '#ffffff').attr('stroke', '#090707').attr('stroke-width', 0.8)
    //  .text(this.dataStockRoom[iDataStockRoom].netValueSum)
    //  .attr('font-size', this.fontSizeDescription * 1.5);

  }

  drawCharts(beRoomChart) {
    const height1 = (beRoomChart ? 0 : this.yHeight);
    const height2 = (beRoomChart ? 0 : this.margin.room);
    this.chartStockLine(this.margin.top + this.margin.room + height1, this.margin.top + height2, beRoomChart);
    //this.chartTimeProfit(this.margin.top + this.margin.room + height1, this.margin.top + height2, beRoomChart);
    //this.chartMaxBottom(this.margin.top + this.margin.room * 2 + this.yHeight + this.margin.middle + height1
    //  , this.margin.top + this.margin.room + this.yHeight + this.margin.middle + height2, beRoomChart);
    //this.chartStackDeep(this.margin.top + this.margin.room * 2 + this.yHeight + this.margin.middle + height1,
    //  this.margin.top + this.margin.room + this.yHeight + this.margin.middle + height2, beRoomChart);
    //this.chartProfit(this.margin.top + this.margin.room * 3 + this.yHeight * 2 + this.margin.middle * 2 + height1,
    //  this.margin.top + this.margin.room * 2 + this.yHeight * 2 + this.margin.middle * 2 + height2, beRoomChart);
    //this.chartNetValue(this.margin.top + this.margin.room * 3 + this.yHeight * 2 + this.margin.middle * 2 + height1,
    //  this.margin.top + this.margin.room * 2 + this.yHeight * 2 + this.margin.middle * 2 + height2, beRoomChart);
    if (!beRoomChart) {
      this.chartValueDistrabution(this.margin.top + this.margin.room * 4 +
        this.yHeight * 3 + this.margin.middle * 3 + height1,
        this.margin.top + this.margin.room * 3 + this.yHeight * 3 + this.margin.middle * 3 + height2, false);
    }
  }

  getParameter() {
    this.arrRateOfProfit =
      this.optionsRateOfProfit[this.rateOfprofit].split(',');
    _.each(this.arrRateOfProfit, (o, i) => { this.arrRateOfProfit[i] = Number(o); });
    this.arrProportion =
      this.optionsProportion[this.proportion].split(':');
    _.each(this.arrProportion, (o, i) => { this.arrProportion[i] = Number(o); });
    this.arrLongOrShort =
      this.optionsLongOrShort[this.longOrShort].split(':');
    _.each(this.arrLongOrShort, (o, i) => { this.arrLongOrShort[i] = Number(o); });
    const min = _.minBy(this.dataStock, 'open');
    const max = _.maxBy(this.dataStock, 'open');
    if (min && max) {
      const piece = Math.floor((max['open'] - min['open']) /
        _.sumBy(this.arrProportion, (o) => Number(o)));
      let before = min['open'];
      this.arrRange = [];
      _.each(this.arrProportion, (o) => {
        this.arrRange.push(before);
        before = before + o * piece;
      });
    }
  }

  textDescription() {
    this.svg.append('text')
      .attr('x', this.margin.left)
      .attr('y', this.margin.top + this.margin.room - 5)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'end')
      .attr('fill', '#30A9DE')
      .text('Time Profited/(day)');

    this.svg.append('text')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.margin.top + this.margin.room - 5)
      .attr('font-size', this.fontSizeDescription)
      .attr('fill', '#E53A40')
      .text('Stock Value');

    this.svg.append('text')
      .attr('x', this.margin.left)
      .attr('y', this.margin.top + this.margin.room * 2 +
        this.yHeight + this.margin.middle - 5)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'end')
      .attr('fill', '#EFDC05')
      .text('Max Bottom Or Top');

    this.svg.append('text')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.margin.top + this.margin.room * 2 +
        this.yHeight + this.margin.middle - 5)
      .attr('font-size', this.fontSizeDescription)
      .attr('fill', '#A593E0')
      .text('Stack Deep');

    this.svg.append('text')
      .attr('x', this.margin.left)
      .attr('y', this.margin.top + this.margin.room * 3 +
        this.yHeight * 2 + this.margin.middle * 2 - 5)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'end')
      .attr('fill', '#F6B352')
      .text('Profit');

    this.svg.append('text')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.margin.top + this.margin.room * 3 +
        this.yHeight * 2 + this.margin.middle * 2 - 5)
      .attr('font-size', this.fontSizeDescription)
      .attr('fill', '#090707')
      .text('Net Value');


    this.svg.append('text')
      .attr('x', this.margin.left)
      .attr('y', this.margin.top + this.margin.room * 4 +
        this.yHeight * 3 + this.margin.middle * 3 - 5)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'end')
      .attr('fill', '#3F4B3B')
      .text('Value Distribution');

  }

  xAxisRoomchart() {
    // function Room axis
    this.xRoom = d3.scaleTime()
      .domain([this.dataStock[0].date,
      this.dataStock[this.dataStock.length - 1].date])
      .range([this.margin.left, this.width - this.margin.right]);

    var xRoomAxis1 = g => g
      .attr('id', 'BoxRoomAxis1')
      .attr('transform', `translate(0,
      ${this.margin.top + this.margin.room})`)
      .call(d3.axisBottom(this.xRoom).tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('line').attr('stroke-width', 0.5);
        g.selectAll('text').attr('font-size', this.fontSizeRoomAxis);
      });

    var xRoomAxis2 = g => g
      .attr('transform', `translate(0,
      ${this.margin.top + this.margin.room * 2 + this.margin.middle + this.yHeight})`)
      .call(d3.axisBottom(this.xRoom)
        .tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('line').attr('stroke-width', 0.5);
        g.selectAll('text').attr('font-size', this.fontSizeRoomAxis);
      });

    var xRoomAxis3 = g => g
      .attr('transform', `translate(0,
      ${this.margin.top + this.margin.room * 3 +
        this.margin.middle * 2 + this.yHeight * 2})`)
      .call(d3.axisBottom(this.xRoom)
        .tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('line').attr('stroke-width', 0.5);
        g.selectAll('text').attr('font-size', this.fontSizeRoomAxis);
      });

    // stock value distribution axis
    this.xValueDistribution = d3.scaleLinear()
      .domain([this.valueDistribution[0].value,
      this.valueDistribution[this.valueDistribution.length - 1].value])
      .range([this.margin.left, this.width - this.margin.right]);

    var xValueDistributionAxis = g => g
      .attr('transform', `translate(0,
      ${this.yHeight * 4 + this.margin.top + this.margin.middle * 3 + this.margin.room * 4})`)
      .call(d3.axisBottom(this.xValueDistribution).ticks(this.width / 80).tickSizeOuter(0))
      .call(g => {
        g.select('.domain').attr('stroke', '#3F4B3B');
        g.selectAll('.tick line').attr('stroke', '#3F4B3B').attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#3F4B3B')
          .attr('font-size', this.fontSizeAxis).attr('stroke-width', 0.5);
      });

    //this.xValueDistributionRoom = d3.scaleLinear()
    //  .domain([this.valueDistribution[0].value,
    //  this.valueDistribution[this.valueDistribution.length - 1].value])
    //  .range([this.margin.left, this.width - this.margin.right]);

    //var xValueDistributionRoomAxis = g => g
    //  .attr('transform', `translate(0,
    //  ${this.yHeight * 3 + this.margin.top + this.margin.middle * 3 + this.margin.room * 4})`)
    //  .call(d3.axisBottom(this.xValueDistribution).ticks(this.width / 80).tickSizeOuter(0))
    //  .call(g => {
    //    g.select('.domain').attr('stroke', '#3F4B3B');
    //    g.selectAll('.tick line').attr('stroke', '#3F4B3B').attr('stroke-width', 0.5);
    //    g.selectAll('.tick text').attr('fill', '#3F4B3B')
    //      .attr('font-size', this.fontSizeAxis).attr('stroke-width', 0.5);
    //  });

    // svg
    this.svg.select('#gBobXAxis').remove();
    var g = this.svg.append('g').attr('id', 'gBoxXAxis');
    g.append('g').call(xValueDistributionAxis);
    g.append('g').call(xRoomAxis1);
    g.append('g').call(xRoomAxis2);
    g.append('g').call(xRoomAxis3);
    g.append('g').call(xRoomAxis3);
    //g.append('g').call(xValueDistributionRoomAxis);

  }

  xAxisMainChart() {
    // function axis
    this.xMain = d3.scaleTime()
      .domain([this.dataStockRoom[0].date,
      this.dataStockRoom[this.dataStockRoom.length - 1].date])
      .range([this.margin.left, this.width - this.margin.right]);

    var xAxis1 = g => g
      .attr('transform', `translate(0,
      ${this.yHeight + this.margin.top + this.margin.room})`)
      .call(d3.axisBottom(this.xMain).tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('font-size', this.fontSizeAxis);
        g.selectAll('line').attr('stroke-width', 0.5);
      });

    var xAxis2 = g => g
      .attr('transform', `translate(0,
        ${this.yHeight * 2 + this.margin.top + this.margin.middle +
        this.margin.room * 2})`)
      .call(d3.axisBottom(this.xMain).tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('font-size', this.fontSizeAxis);
        g.selectAll('line').attr('stroke-width', 0.5);
      });

    var xAxis3 = g => g
      .attr('transform', `translate(0,
        ${this.yHeight * 3 + this.margin.top + this.margin.middle * 2
        + this.margin.room * 3})`)
      .call(d3.axisBottom(this.xMain).tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('font-size', this.fontSizeAxis);
        g.selectAll('line').attr('stroke-width', 0.5);
      });
    // svg
    this.svg.select('#gBoxXDateChartAxis').remove();
    var g = this.svg.append('g').attr('id', 'gBoxXDateChartAxis');
    g.append('g').call(xAxis1);
    g.append('g').call(xAxis2);
    g.append('g').call(xAxis3);

  }

  rangeControl(x) {
    if (x < this.margin.left) {
      return this.margin.left;
    } else if (x > this.width - this.margin.right) {
      return this.width - this.margin.right;
    } else {
      return x;
    }
  }

  updateAfterRoom() {
    this.dataStockRoom = _.filter(this.dataStock, (o) =>
      o['date'].getTime() >= this.startRoomTime.getTime()
      && o['date'].getTime() <= this.endRoomTime.getTime());

    this.capitalsLongRoom = _.filter(this.capitalsLong, (o) =>
      o['inDate'].getTime() >= this.startRoomTime.getTime()
      && o['inDate'].getTime() <= this.endRoomTime.getTime());

    this.capitalsShortRoom = _.filter(this.capitalsShort, (o) =>
      o['inDate'].getTime() >= this.startRoomTime.getTime()
      && o['inDate'].getTime() <= this.endRoomTime.getTime());

    this.capitalsUnionRoom = _.filter(this.capitalsUnion, (o) =>
      o['inDate'].getTime() >= this.startRoomTime.getTime()
      && o['inDate'].getTime() <= this.endRoomTime.getTime());

    this.svg.select('g#gBoxLineFocus').remove();
    this.xAxisMainChart();
    this.drawCharts(false);
  }

  RoomBar() {
    this.startRoomTime = this.dataStock[0].date;
    this.endRoomTime = this.dataStock[this.dataStock.length - 1].date;
    const leftYearRoom = this.svg.append('g').attr('class', 'leftRoomGBox')
      .attr('transform', 'translate(' + this.margin.left + ',0)')
      .call(
        d3.drag().on('drag', () => {
          const { x } = d3.event;
          d3.select('g.leftRoomGBox').attr('transform', 'translate(' +
            this.rangeControl(x) + ',0)').style('cursor', 'pointer');
          const dt = this.xRoom.invert(x);
          d3.select('g.leftRoomGBox').selectAll('text').text(dt);
          this.startRoomTime = dt;
        }).on('end', () => {
          this.updateAfterRoom();
        })
      );
    this.startRoomTime = this.xMain.invert(this.margin.left);
    leftYearRoom.append('text')
      .text(this.startRoomTime.toLocaleString())
      .attr('x', 0)
      .attr('y', this.margin.top - 3)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'middle');
    leftYearRoom.append('path').attr('d',
      'M0,' + this.margin.top +
      'L0,' + (this.margin.top + this.margin.room) + 'Z')
      .attr('stroke', '#000000');
    leftYearRoom.append('path').attr('d', 'M0,' + (this.margin.top + this.margin.room / 2 - 3) +
      'L' + (- 3) + ',' + (this.margin.top + this.margin.room / 2) +
      'L0,' + (this.margin.top + this.margin.room / 2 + 3) + 'Z');

    leftYearRoom.append('text')
      .text(this.startRoomTime.toLocaleString())
      .attr('x', 0)
      .attr('y', this.margin.top + this.margin.room + this.margin.middle + this.yHeight - 3)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'middle');
    leftYearRoom.append('path').attr('d',
      'M0,' + (this.margin.top + this.margin.room + this.margin.middle + this.yHeight) +
      'L0,' + (this.margin.top + this.margin.room * 2 + this.margin.middle + this.yHeight) + 'Z')
      .attr('stroke', '#000000');
    leftYearRoom.append('path').attr('d', 'M0,' +
      (this.margin.top + this.margin.room * 3 / 2 + this.margin.middle + this.yHeight - 3) +
      'L' + (- 3) + ',' + (this.margin.top + this.margin.room * 3 / 2 + this.margin.middle + this.yHeight) +
      'L0,' + (this.margin.top + this.margin.room * 3 / 2 + this.margin.middle + this.yHeight + 3) + 'Z');

    leftYearRoom.append('text')
      .text(this.startRoomTime.toLocaleString())
      .attr('x', 0)
      .attr('y', this.margin.top + this.margin.room * 2 + this.margin.middle * 2 + this.yHeight * 2 - 3)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'middle');
    leftYearRoom.append('path').attr('d',
      'M0,' + (this.margin.top + this.margin.room * 2 + this.margin.middle * 2 + this.yHeight * 2) +
      'L0,' + (this.margin.top + this.margin.room * 3 + this.margin.middle * 2 + this.yHeight * 2) + 'Z')
      .attr('stroke', '#000000');
    leftYearRoom.append('path').attr('d', 'M0,' +
      (this.margin.top + this.margin.room * 5 / 2 + this.margin.middle * 2 + this.yHeight * 2 - 3) +
      'L' + (- 3) + ',' + (this.margin.top + this.margin.room * 5 / 2 + this.margin.middle * 2 + this.yHeight * 2) +
      'L0,' + (this.margin.top + this.margin.room * 5 / 2 + this.margin.middle * 2 + this.yHeight * 2 + 3) + 'Z');

    const rightYearRoom = this.svg.append('g').attr('class', 'rightRoomGBox')
      .attr('transform', 'translate(' + (this.width - this.margin.right) + ',0)')
      .call(
        d3.drag().on('drag', () => {
          const { x } = d3.event;
          d3.select('g.rightRoomGBox').attr('transform', 'translate(' +
            this.rangeControl(x) + ',0)')
            .style('cursor', 'pointer');
          const dt = this.xRoom.invert(x);
          d3.select('g.rightRoomGBox').selectAll('text').text(dt);
          this.endRoomTime = dt;
        }).on('end', () => {
          this.updateAfterRoom();
        })
      );
    this.endRoomTime = this.xRoom.invert(this.width - this.margin.right);
    rightYearRoom.append('text')
      .text(this.endRoomTime.toLocaleString())
      .attr('x', 0)
      .attr('y', this.margin.top - 3)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'middle');
    rightYearRoom.append('path').attr('d',
      'M0,' + this.margin.top +
      'L0,' + (this.margin.top + this.margin.room) + 'Z')
      .attr('stroke', '#000000');
    rightYearRoom.append('path').attr('d', 'M0,' + (this.margin.top + this.margin.room / 2 - 3) +
      'L' + 3 + ',' + (this.margin.top + this.margin.room / 2) +
      'L0,' + (this.margin.top + this.margin.room / 2 + 3) + 'Z');

    rightYearRoom.append('text')
      .text(this.endRoomTime.toLocaleString())
      .attr('x', 0)
      .attr('y', this.margin.top + this.margin.room + this.margin.middle + this.yHeight - 3)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'middle');
    rightYearRoom.append('path').attr('d',
      'M0,' + (this.margin.top + this.margin.room + this.margin.middle + this.yHeight) +
      'L0,' + (this.margin.top + this.margin.room * 2 + this.margin.middle + this.yHeight) + 'Z')
      .attr('stroke', '#000000');
    rightYearRoom.append('path').attr('d', 'M0,' +
      (this.margin.top + this.margin.room * 3 / 2 + this.margin.middle + this.yHeight - 3) +
      'L' + 3 + ',' + (this.margin.top + this.margin.room * 3 / 2 + this.margin.middle + this.yHeight) +
      'L0,' + (this.margin.top + this.margin.room * 3 / 2 + this.margin.middle + this.yHeight + 3) + 'Z');

    rightYearRoom.append('text')
      .text(this.endRoomTime.toLocaleString())
      .attr('x', 0)
      .attr('y', this.margin.top + this.margin.room * 2 + this.margin.middle * 2 + this.yHeight * 2 - 3)
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'middle');
    rightYearRoom.append('path').attr('d',
      'M0,' + (this.margin.top + this.margin.room * 2 + this.margin.middle * 2 + this.yHeight * 2) +
      'L0,' + (this.margin.top + this.margin.room * 3 + this.margin.middle * 2 + this.yHeight * 2) + 'Z')
      .attr('stroke', '#000000');
    rightYearRoom.append('path').attr('d', 'M0,' +
      (this.margin.top + this.margin.room * 5 / 2 + this.margin.middle * 2 + this.yHeight * 2 - 3) +
      'L' + 3 + ',' + (this.margin.top + this.margin.room * 5 / 2 + this.margin.middle * 2 + this.yHeight * 2) +
      'L0,' + (this.margin.top + this.margin.room * 5 / 2 + this.margin.middle * 2 + this.yHeight * 2 + 3) + 'Z');
  }

  chartTimeProfit(bottom, top, beRoomChart) {
    const dataCapitalsUnion = (beRoomChart ? this.capitalsUnion : this.capitalsUnionRoom);
    const dataCapitalsLong = (beRoomChart ? this.capitalsLong : this.capitalsLongRoom);
    const dataCapitalsShort = (beRoomChart ? this.capitalsShort : this.capitalsShortRoom);
    var xChart = (beRoomChart ? this.xRoom : this.xMain);

    this.yTimeProfit = d3.scaleLinear()
      .domain(d3.extent(this.capitalsUnion, d => d.timeProfit)).nice()
      .range([bottom, top]);

    var yTimeProfitAxis = g => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yTimeProfit))
      .call(g => {
        g.select('.domain').attr('stroke', '#30A9DE');
        g.selectAll('.tick line').attr('stroke', '#30A9DE')
          .attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#30A9DE')
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    var g = null;
    if (!beRoomChart) {
      this.gMainCharts.select('#gBoxTimeProfitChart').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxTimeProfitChart');
      g.append('g').call(yTimeProfitAxis);
    } else {
      this.svg.select('#gBoxTimeProfitChartRoom').remove();
      g = this.svg.append('g').attr('id', 'gBoxTimeProfitChartRoom');
    }

    var lineUp = d3.line()
      .defined(d => !isNaN(d.timeProfit))
      .x(d => this.xMain(d.inDate))
      .y(d => this.yTimeProfit(d.timeProfit));

    g.append('path')
      .datum(dataCapitalsLong)
      .attr('fill', 'none')
      .attr('stroke', '#30A9DE')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineUp);
    g.append('path')
      .datum(dataCapitalsShort)
      .attr('fill', 'none')
      .attr('stroke', '#30A9DE')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.8)
      .attr('d', lineUp);
    const fy = _.filter(dataCapitalsUnion, (o) => o['beGetProfit']);
    g.selectAll('circle')
      .data(fy)
      .enter()
      .append('circle')
      .attr('r', '0.5')
      .attr('cx', d => xChart(d.inDate))
      .attr('cy', d => this.yTimeProfit(d.timeProfit))
      .attr('fill', '#000000');


    const meanTimeProfit =
      _.meanBy(dataCapitalsUnion, 'timeProfit');

    g.append('line')
      .attr('stroke-dasharray', '2 2')
      .attr('stroke', '#30A9DE')
      .attr('stroke-width', 0.5)
      .attr('x1', this.margin.left)
      .attr('y1', this.yTimeProfit(meanTimeProfit))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yTimeProfit(meanTimeProfit));
    g.append('text')
      .attr('fill', '#30A9DF')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yTimeProfit(meanTimeProfit) - 2)
      .attr('font-size', this.fontSizeProportion)
      .attr('text-anchor', 'end')
      .text(meanTimeProfit);
  }

  chartStockLine(bottom, top, beRoomChart) {
    const data = (beRoomChart ? this.dataStock : this.dataStockRoom);
    var xChart = (beRoomChart ? this.xRoom : this.xMain);

    this.yStock = d3.scaleLinear()
      .domain(d3.extent(this.dataStock, d => d.open))
      .range([bottom, top]);

    var yStockAxis = g => g
      .attr('transform', `translate(${this.width - this.margin.right},0)`)
      .call(d3.axisRight(this.yStock))
      .call(g => {
        g.select('.domain').attr('stroke', '#E53A40');
        g.selectAll('.tick line').attr('stroke', '#E53A40')
          .attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#E53A40')
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    var g = null;
    if (!beRoomChart) {
      this.gMainCharts.select('#gBoxStockChart').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxStockChart');
      g.append('g').call(yStockAxis);
    } else {
      this.svg.select('#gBoxStockChartRoom').remove();
      g = this.svg.append('g').attr('id', 'gBoxStockChartRoom');
    }
    //// stock line , mean
    //var lineStock = d3.line()
    //  .defined(d => !isNaN(d.open))
    //  .x(d => xChart(d.date))
    //  .y(d => this.yStock(d.open));
    //g.append('path')
    //  .datum(data)
    //  .attr('fill', 'none')
    //  .attr('stroke', '#E53A40')
    //  .attr('stroke-width', 0.5)
    //  .attr('stroke-linejoin', 'round')
    //  .attr('stroke-linecap', 'round')
    //  .attr('d', lineStock);

    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('r', 0.5)
      .attr('cx', (d) => xChart(d.date))
      .attr('cy', (d) => this.yStock(d.open))
      .attr('stroke', '#E53A40')
      .attr('fill', '#E53A40')

    g.append('line')
      .attr('class', 'MeanValueDistribution')
      .attr('fill', 'none')
      .attr('stroke', '#E53A40')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2 2')
      .attr('x1', this.margin.left)
      .attr('y1', this.yStock((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 1 / 3
        + d3.min(data, d => d.open)))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yStock((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 1 / 3
        + d3.min(data, d => d.open)));
    g.append('text')
      .attr('fill', '#E53A40')
      .attr('text-anchor', 'end')
      .attr('font-size', this.fontSizeProportion)
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yStock((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 1 / 3
        + d3.min(data, d => d.open)))
      .text((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 1 / 3
        + d3.min(data, d => d.open));
    g.append('line')
      .attr('class', 'MeanValueDistribution')
      .attr('fill', 'none')
      .attr('stroke', '#E53A40')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2 2')
      .attr('x1', this.margin.left)
      .attr('y1', this.yStock((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 2 / 3
        + d3.min(data, d => d.open)))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yStock((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 2 / 3
        + d3.min(data, d => d.open)));
    g.append('text')
      .attr('fill', '#E53A40')
      .attr('font-size', this.fontSizeProportion)
      .attr('text-anchor', 'end')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yStock((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 2 / 3
        + d3.min(data, d => d.open)))
      .text((d3.max(data, d => d.open)
        - d3.min(data, d => d.open)) * 2 / 3
        + d3.min(data, d => d.open));

  }

  chartMaxBottom(bottom, top, beRoomChart) {
    const dataCapitalsUnion = (beRoomChart ? this.capitalsUnion : this.capitalsUnionRoom);
    var xChart = (beRoomChart ? this.xRoom : this.xMain);

    // function axis
    this.yMaxBottom = d3.scaleLinear()
      .domain([0, 2]).nice()
      .range([bottom, top]);

    var yMaxBottomAxis = g => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yMaxBottom))
      .call(g => {
        g.select('.domain').attr('stroke', '#EFDC05');
        g.selectAll('.tick line').attr('stroke', '#EFDC05').attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#EFDC05').attr('font-size', 8)
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    // svg
    var g = null;
    if (!beRoomChart) {
      this.gMainCharts.select('#gBoxMaxBottomChart').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxMaxBottomChart');
      g.append('g').call(yMaxBottomAxis);
    } else {
      this.svg.select('#gBoxMaxBottomChartRoom').remove();
      g = this.svg.append('g').attr('id', 'gBoxMaxBottomChartRoom');
    }

    var lineMaxBottom = d3.line()
      .defined(d => !isNaN(d.maxBottomOrTop))
      .x(d => xChart(d.inDate))
      .y(d => this.yMaxBottom(d.maxBottomOrTop / d.value));
    g.append('path')
      .datum(dataCapitalsUnion)
      .attr('fill', 'none')
      .attr('stroke', '#EFDC05')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineMaxBottom);
    g.append('line')
      .attr('fill', 'none')
      .attr('stroke', '#EFDC05')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2 2')
      .attr('x1', this.margin.left)
      .attr('y1', this.yMaxBottom(1))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yMaxBottom(1));
  }

  chartStackDeep(bottom, top, beRoomChart) {
    const data = (beRoomChart ? this.dataStock : this.dataStockRoom);
    var xChart = (beRoomChart ? this.xRoom : this.xMain);
    const maxStackDeep = _.max([d3.max(this.dataStock, d => d.stackDeepLong),
    d3.max(this.dataStock, d => d.stackDeepShort)]);
    this.yStackDeep = d3.scaleLinear()
      .domain([0, maxStackDeep]).nice()
      .range([bottom, top]);

    var yStackDeepAxis = g => g
      .attr('transform',
        `translate(${this.width - this.margin.right}, 0)`)
      .call(d3.axisRight(this.yStackDeep))
      .call(g => {
        g.select('.domain').attr('stroke', '#A593E0');
        g.selectAll('.tick line').attr('stroke', '#A593E0').attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#A593E0')
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    // svg
    var g = null;
    if (beRoomChart) {
      this.gMainCharts.select('#gBoxStackDeepChart').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxStackDeepChart');
    } else {
      this.svg.select('#gBoxStackDeepChartRoom').remove();
      g = this.svg.append('g').attr('id', 'gBoxStackDeepChartRoom');
      g.append('g').call(yStackDeepAxis);
    }

    // stack deep line 
    var lineStackDeepLong = d3.line()
      .defined(d => !isNaN(d.stackDeepLong) && d.stackDeepLong > -1)
      .x(d => xChart(d.date))
      .y(d => this.yStackDeep(d.stackDeepLong));
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#A593E0')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineStackDeepLong);
    if (!beRoomChart) {
      g.append('text')
        .attr('x', xChart(data[data.length - 10].date))
        .attr('y', this.yStackDeep(data[data.length - 10].stackDeepLong))
        .attr('text-anchor', 'end')
        .attr('font-size', 5)
        .attr('fill', '#A593E0')
        .text('stackDeepLong');
    }
    var lineStackDeepShort = d3.line()
      .defined(d => !isNaN(d.stackDeepShort) && d.stackDeepShort > -1)
      .x(d => xChart(d.date))
      .y(d => this.yStackDeep(d.stackDeepShort));
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#A593E0')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.5)
      .attr('d', lineStackDeepShort);
    if (!beRoomChart) {
      g.append('text')
        .attr('x', xChart(data[data.length - 100].date))
        .attr('y', this.yStackDeep(data[data.length - 100].stackDeepShort))
        .attr('text-anchor', 'end')
        .attr('font-size', 5)
        .attr('fill', '#A593E0')
        .attr('opacity', 0.5)
        .text('stackDeepShort');
    }
  }

  chartProfit(bottom, top, beRoomChart) {
    const data = (beRoomChart ? this.dataStock : this.dataStockRoom);
    var xChart = (beRoomChart ? this.xRoom : this.xMain);

    this.yProfit = d3.scaleLinear()
      .domain(d3.extent(this.dataStock, d => d.profit)).nice()
      .range([bottom, top]);

    var yProfitAxis = g => g
      .attr('transform',
        `translate(${this.margin.left}, 0)`)
      .call(d3.axisLeft(this.yProfit))
      .call(g => {
        g.select('.domain').attr('stroke', '#F6B352');
        g.selectAll('.tick line').attr('stroke', '#F6B352')
          .attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#F6B352')
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    // svg
    var g = null;
    if (!beRoomChart) {
      this.gMainCharts.select('#gBoxProfitChart').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxProfitChart');
      g.append('g').call(yProfitAxis);
    } else {
      this.svg.select('#gBoxProfitChartRoom').remove();
      g = this.svg.append('g').attr('id', 'gBoxProfitChartRoom');
    }

    // profit line 
    var lineProfit = d3.line()
      .defined(d => !isNaN(d.profit))
      .x(d => xChart(d.date))
      .y(d => this.yProfit(d.profit));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#F6B352')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineProfit);


    this.totalProfit = data[data.length - 1].profit;
    var year = Number(data[data.length - 1].date.getYear()) -
      Number(data[0].date.getYear());
    this.yearProfit = Math.pow(this.totalProfit, 1 / year);
  }

  chartNetValue(bottom, top, beRoomChart) {
    const data = (beRoomChart ? this.dataStock : this.dataStockRoom);
    var xChart = (beRoomChart ? this.xRoom : this.xMain);

    this.yNetValue = d3.scaleLinear()
      .domain(d3.extent(this.dataStock, d => d.netValueSum)).nice()
      .range([bottom, top]);

    var yNetValueAxis = g => g
      .attr('transform',
        `translate(${this.width - this.margin.right}, 0)`)
      .call(d3.axisRight(this.yNetValue))
      .call(g => {
        g.select('.domain').attr('stroke', '#090707');
        g.selectAll('.tick line').attr('stroke', '#090707')
          .attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#090707')
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    var g = null;
    if (!beRoomChart) {
      this.gMainCharts.select('#gBoxNetValueChart').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxNetValueChart');
      g.append('g').call(yNetValueAxis);
    } else {
      this.svg.select('#gBoxNetValueChartRoom').remove();
      g = this.svg.append('g').attr('id', 'gBoxNetValueChartRoom');
    }
    // net value line 
    var lineNetValue = d3.line()
      .defined(d => !isNaN(d.netValueSum))
      .x(d => xChart(d.date))
      .y(d => this.yNetValue(d.netValueSum));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#090707')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineNetValue);

  }

  chartValueDistrabution(bottom, top, beRoomChart) {
    this.yValueDistribution = d3.scaleLinear()
      .domain(d3.extent(this.valueDistribution, d => d.frequency)).nice()
      .range([bottom, top]);

    var yValueDistributionAxis = g => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yValueDistribution))
      .call(g => {
        g.select('.domain').attr('stroke', '#3F4B3B');
        g.selectAll('.tick line').attr('stroke', '#3F4B3B').attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#3F4B3B').attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    var g = null;
    if (!beRoomChart) {
      this.gMainCharts.select('#gBoxValueDistributionChart').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxValueDistributionChart');
      g.append('g').call(yValueDistributionAxis);
    } else {
      this.gMainCharts.select('#gBoxValueDistributionChartRoom').remove();
      g = this.gMainCharts.append('g').attr('id', 'gBoxValueDistributionChartRoom');
    }
       
    var lineValueDistribution = d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => this.xValueDistribution(d.value))
      .y(d => this.yValueDistribution(d.frequency));

    g.append('path')
      .datum(this.valueDistribution)
      .attr('fill', 'none')
      .attr('stroke', '#3F4B3B')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineValueDistribution);

    const meanFrequency = _.meanBy(this.valueDistribution, 'frequency');
    g.append('line')
      .attr('class', 'MeanValueDistribution')
      .attr('fill', 'none')
      .attr('stroke', '#3F4B3B')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2 2')
      .attr('x1', this.margin.left)
      .attr('y1', this.yValueDistribution(meanFrequency))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yValueDistribution(meanFrequency));
    g.append('text')
      .attr('fill', '#3F4B3B')
      .attr('font-size', this.fontSizeDescription)
      .attr('text-anchor', 'end')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yValueDistribution(meanFrequency) - 5)
      .text(meanFrequency);
  }

  getTotalProfit() {
    this.beProfit = _.filter(this.dataList, function (o, i) {
      return o['beGetProfit'];
    });
    this.notProfit = _.filter(this.dataList, function (o, i) {
      return !o['beGetProfit'];
    });
    this.rateOfGettingProfit =
      (this.beProfit.length / this.dataList.length * 100) + '%';
  }

  optionRateProfitChange(event) {
    this.rateProfit = event.target.value;
  }

  optionStrategyChange(event) {
    this.strategy = event.target.value;
  }

  optionRateMaxLossChange(event) {
    this.rateMaxLoss = event.target.value;
  }

  optionTableChange(event) {
    this.table = event.target.value;
  }
}


