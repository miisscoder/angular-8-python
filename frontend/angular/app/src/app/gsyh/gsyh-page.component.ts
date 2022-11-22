import { Component, OnInit } from '@angular/core';
import { DataListService } from '../../services/data-list.service';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'gsyh-page',
  templateUrl: './gsyh-page.component.html',
  styleUrls: ['./gsyh-page.component.scss']
})
export class GSYHPageComponent implements OnInit {
  // data for this page
  dataList = [];
  errorMessage: any;
  dataStock = [];
  dataNetValue = [];
  // for chart
  margin = {
    top: 20,
    bottom: 20,
    left: 40,
    right: 40,
    middle: 40
  };
  width = 500;
  height = 1000;
  x: any;
  xValueDistribution: any;
  yUp: any;
  yDown: any;
  yStock: any;
  yNetValue: any;
  yStackDeep: any;
  yProfit: any;
  yValueDistribution: any;
  yHeight = 0;
  svg: any;

  table = 0;
  tables = ['GSYH', 'JD9999.XDCE'];
  rateProfit = 4;
  rates = [1.001, 1.002, 1.003, 1.004, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1,
    1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.2];
  strategy = 0;
  strategies = ['bottom', 'everyday', 'everymonday'];
  rateMaxLoss = 0;
  ratesMaxLoss = [1 / 10000, 0.99, 0.98, 0.97, 0.96, 0.95,
    0.94, 0.93, 0.92, 0.91, 0.9, 0.85, 0.8];

  totalProfit = 0;
  yearProfit = 0;
  notProfit = [];
  beProfit = [];
  valueDistribution = [];
  rateOfGettingProfit: any;
  constructor(public dataListService: DataListService,
    public http: HttpClient) {
  }


  ngOnInit() {
    this.yHeight = (this.height - this.margin.middle * 3 - this.margin.top
      - this.margin.bottom) / 4;
    this.getDataStock();
    this.getDataList();
    this.getNetValue();
  }

  getDataStock() {
    this.dataStock = [];
    this.dataListService.get('getDataStock/' +
      this.tables[this.table])
      .subscribe(
        data => {
          var json = data.replace(/'/gi, '"');
          this.dataStock = JSON.parse(json);
          this.profitStasticChart();
        },
        error => this.errorMessage = <any>error);
  }


  getDataList() {
    this.dataList = [];
    this.dataListService.get('statistic/' +
      this.tables[this.table] + '/' +
      this.strategies[this.strategy] + '/' +
      this.rates[this.rateProfit] + '/' +
      this.ratesMaxLoss[this.rateMaxLoss])
      .subscribe(
        data => {
          var json = data.replace(/'/gi, '"');
          json = json.replace(/True/gi, 'true');
          json = json.replace(/False/gi, 'false');
          this.dataList = JSON.parse(json);
          this.getTotalProfit();
          this.chartLine();
        },
        error => this.errorMessage = <any>error);
  }


  getNetValue() {
    this.dataNetValue = [];
    

    this.dataListService.get('netValue/' +
      this.tables[this.table] + '/' +
      this.strategies[this.strategy] + '/' +
      this.rates[this.rateProfit] + '/' +
      this.ratesMaxLoss[this.rateMaxLoss])
      .subscribe(
        data => {
          var json = data.replace(/'/gi, '"');
          this.dataNetValue = JSON.parse(json);
          this.chartNetValue();
        },
        error => this.errorMessage = <any>error);
  }

  chartNetValue() {
    this.yStackDeep = d3.scaleLinear()
      .domain(d3.extent(this.dataNetValue, d => d.stackDeep)).nice()
      .range([this.yHeight * 2 + this.margin.middle + this.margin.top,
      this.yHeight + this.margin.middle + this.margin.top]);

    this.yNetValue = d3.scaleLinear()
      .domain(d3.extent(this.dataNetValue, d => d.value)).nice()
      .range([this.yHeight * 3 + this.margin.middle * 2 + this.margin.top,
      this.yHeight * 2 + this.margin.middle * 2 + this.margin.top]);

    this.yProfit = d3.scaleLinear()
      .domain(d3.extent(this.dataNetValue, d => d.profit)).nice()
      .range([this.yHeight * 3 + this.margin.middle * 2 + this.margin.top,
      this.yHeight * 2 + this.margin.middle * 2 + this.margin.top]);

    var yStackDeepAxis = g => g
      .attr('transform',
        `translate(${this.width - this.margin.right}, 0)`)
      .call(d3.axisRight(this.yStackDeep))
      .call(g => {
        g.select('.domain').attr('stroke', '#A593E0');
        g.selectAll('.tick line').attr('stroke', '#A593E0');
        g.selectAll('.tick text').attr('fill', '#A593E0');
      });

    var yProfitAxis = g => g
      .attr('transform',
        `translate(${this.margin.left}, 0)`)
      .call(d3.axisLeft(this.yProfit))
      .call(g => {
        g.select('.domain').attr('stroke', '#F6B352');
        g.selectAll('.tick line').attr('stroke', '#F6B352');
        g.selectAll('.tick text').attr('fill', '#F6B352');
      });


    var yNetValueAxis = g => g
      .attr('transform',
        `translate(${this.width - this.margin.right}, 0)`)
      .call(d3.axisRight(this.yNetValue))
      .call(g => {
        g.select('.domain').attr('stroke', '#090707');
        g.selectAll('.tick line').attr('stroke', '#090707');
        g.selectAll('.tick text').attr('fill', '#090707');
      });

    this.svg.select('#gNetValue').remove();
    var g = this.svg.append('g')
      .attr('id', 'gNetValue');

    g.append('g')
      .call(yStackDeepAxis);
    g.append('g')
      .call(yNetValueAxis);
    g.append('g')
      .call(yProfitAxis);

    g.append('text')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yStackDeep(
        d3.max(this.dataNetValue, d => d.stackDeep)) - 15)
      .attr('font-size', 5)
      .attr('fill', '#A593E0')
      .text('stackDeep');

    g.append('text')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yNetValue(
        d3.max(this.dataNetValue, d => d.value)) - 15)
      .attr('font-size', 5)
      .attr('fill', '#090707')
      .text('netValue');

    g.append('text')
      .attr('x', 0)
      .attr('y', this.yProfit(
        d3.max(this.dataNetValue, d => d.profit)) - 15)
      .attr('font-size', 5)
      .attr('fill', '#F6B352')
      .text('profit');

    // net value line 
    var lineNetValue = d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => this.x(this.getDate(d.date)))
      .y(d => this.yNetValue(d.value));


    g.append('path')
      .datum(this.dataNetValue)
      .attr('fill', 'none')
      .attr('stroke', '#090707')
      .attr('stroke-width', 1)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineNetValue);


    // profit line 
    var lineProfit = d3.line()
      .defined(d => !isNaN(d.profit))
      .x(d => this.x(this.getDate(d.date)))
      .y(d => this.yProfit(d.profit));


    g.append('path')
      .datum(this.dataNetValue)
      .attr('fill', 'none')
      .attr('stroke', '#F6B352')
      .attr('stroke-width', 1)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineProfit);


    // stack deep line 
    var lineStackDeep = d3.line()
      .defined(d => !isNaN(d.stackDeep))
      .x(d => this.x(this.getDate(d.date)))
      .y(d => this.yStackDeep(d.stackDeep));


    g.append('path')
      .datum(this.dataNetValue)
      .attr('fill', 'none')
      .attr('stroke', '#A593E0')
      .attr('stroke-width', 1)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineStackDeep);
    
    this.totalProfit =
      this.dataNetValue[this.dataNetValue.length - 1].profit;

    var year = Number(this.dataNetValue[this.dataNetValue.length - 1]
      .date.split('-')[0]) -
      Number(this.dataNetValue[0].date.split('-')[0]);
    this.yearProfit = Math.pow(this.totalProfit, 1 / year);
    
  }
  getDate(str) {
    if (this.table === 0) {
      const time1 = new Date(str.split('-')[0],
        str.split('-')[1], str.split('-')[2]);
      return time1;

    } else {
      const date = str.split(' ')[0];
      const time = str.split(' ')[1];
      const time2 = new Date(date.split('-')[0],
        date.split('-')[1], date.split('-')[2],
        time.split(':')[0], time.split(':')[1], time.split(':')[2]
      );
      return time2;
    }
  }
  profitStasticChart() {
    // function axis
    this.x = d3.scaleUtc()
      .domain([this.getDate(this.dataStock[0].date),
        this.getDate(this.dataStock[this.dataStock.length - 1].date)])
      .range([this.margin.left, this.width - this.margin.right]);

    this.yStock = d3.scaleLinear()
      .domain(d3.extent(this.dataStock, d => d.value)).nice()
      .range([this.margin.top + this.yHeight, this.margin.top]);

    this.yUp = d3.scaleLinear()
      .domain([-1, 3000]).nice()
      .range([this.margin.top + this.yHeight, this.margin.top]);

    this.yDown = d3.scaleLinear()
      .domain([1, 0]).nice()
      .range([this.margin.top + this.yHeight + this.margin.middle,
      this.margin.top + this.yHeight * 2 + this.margin.middle]);

    var xAxis = g => g
      .attr('transform', `translate(0,
      ${this.yHeight + this.margin.top + this.margin.middle / 2})`)
      .call(d3.axisBottom(this.x).ticks(this.width / 80).tickSizeOuter(0));

    var xAxis2 = g => g
      .attr('transform', `translate(0,
        ${this.yHeight * 2 + this.margin.top + this.margin.middle * 3 / 2})`)
      .call(d3.axisBottom(this.x).ticks(this.width / 80).tickSizeOuter(0));

    var yStockAxis = g => g
      .attr('transform', `translate(${this.width - this.margin.right},0)`)
      .call(d3.axisRight(this.yStock))
      .call(g => {
        g.select('.domain').attr('stroke', '#E53A40');
        g.selectAll('.tick line').attr('stroke', '#E53A40');
        g.selectAll('.tick text').attr('fill', '#E53A40');
      });

    var yUpAxis = g => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yUp))
      .call(g => {
        g.select('.domain').attr('stroke', '#30A9DE');
        g.selectAll('.tick line').attr('stroke', '#30A9DE');
        g.selectAll('.tick text').attr('fill', '#30A9DE');
      });

    var yDownAxis = g => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yDown))
      .call(g => {
        g.select('.domain').attr('stroke', '#EFDC05');
        g.selectAll('.tick line').attr('stroke', '#EFDC05');
        g.selectAll('.tick text').attr('fill', '#EFDC05');
      });


    // svg
    d3.select('#chart svg').remove();
    this.svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height]);

    this.svg.append('g')
      .call(xAxis);

    this.svg.append('g')
      .call(xAxis2);

    this.svg.append('g')
      .call(yStockAxis);

    this.svg.append('text')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yStock(d3.min(this.dataStock, d => d.value)) + 20)
      .attr('font-size', 5)
      .attr('fill', '#E53A40')
      .text('stock value');

    this.svg.append('g')
      .call(yUpAxis);

    this.svg.append('text')
      .attr('x', 0)
      .attr('y', this.yUp(0) + 10)
      .attr('font-size', 5)
      .attr('fill', '#30A9DE')
      .text('timeGetProfit/(day)');

    this.svg.append('g')
      .call(yDownAxis);

    this.svg.append('text')
      .attr('x', 0)
      .attr('y', this.yDown(0) - 15)
      .attr('font-size', 5)
      .attr('fill', '#EFDC05')
      .text('maxBottom');

    // stock line , mean
    var lineStock = d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => this.x(this.getDate(d.date)))
      .y(d => this.yStock(d.value));

    this.svg.append('path')
      .datum(this.dataStock)
      .attr('fill', 'none')
      .attr('stroke', '#E53A40')
      .attr('stroke-width', 1)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineStock);
    

    // stock value distribution;
    var dataSortBValues = _.sortBy(this.dataStock, 'value');
    const __ = this;
    _.each(dataSortBValues, function (o, i) {
      var f = _.find(__.valueDistribution, function (oo) {
        return o['value'] === oo['value'];
      });
      if (f) {
        f['frequency'] = f['frequency'] + 1;
      } else {
        __.valueDistribution.push({
          'value': o['value'],
          'frequency': 1
        });
      }
    });


    // stock value distribution axis
    this.xValueDistribution = d3.scaleLinear()
      .domain([this.valueDistribution[0].value,
      this.valueDistribution[this.valueDistribution.length - 1].value])
      .range([this.margin.left, this.width - this.margin.right]);

    this.yValueDistribution = d3.scaleLinear()
      .domain(d3.extent(this.valueDistribution, d => d.frequency)).nice()
      .range([this.margin.top + this.yHeight * 4
        + this.margin.middle * 3, this.margin.top + this.yHeight * 3
      + this.margin.middle * 3]);

    var xValueDistributionAxis = g => g
      .attr('transform', `translate(0,
      ${this.yHeight * 4 + this.margin.top + this.margin.middle * 3})`)
      .call(d3.axisBottom(this.xValueDistribution).ticks(this.width / 80).tickSizeOuter(0));

    var yValueDistributionAxis = g => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yValueDistribution))
      .call(g => {
        g.select('.domain').attr('stroke', '#3F4B3B');
        g.selectAll('.tick line').attr('stroke', '#3F4B3B');
        g.selectAll('.tick text').attr('fill', '#3F4B3B');
      });

    this.svg.append('g')
      .call(xValueDistributionAxis);

    this.svg.append('g')
      .call(yValueDistributionAxis);

    this.svg.append('text')
      .attr('x', 0)
      .attr('y',
        this.yValueDistribution(d3.max(
          this.valueDistribution, d => d['frequency'])) - 25)
      .attr('font-size', 5)
      .attr('text-anchor', 'start')
      .attr('fill', '#3F4B3B')
      .text('valueDistribution');

    var lineValueDistribution = d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => this.xValueDistribution(d.value))
      .y(d => this.yValueDistribution(d.frequency));


    this.svg.append('path')
      .datum(this.valueDistribution)
      .attr('fill', 'none')
      .attr('stroke', '#3F4B3B')
      .attr('stroke-width', 1)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineValueDistribution);

    const meanFrequency = _.meanBy(this.valueDistribution,
      'frequency');
    this.svg.append('line')
      .attr('class', 'MeanValueDistribution')
      .attr('fill', 'none')
      .attr('stroke', '#3F4B3B')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2')
      .attr('x1', this.margin.left)
      .attr('y1', this.yValueDistribution(meanFrequency))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yValueDistribution(meanFrequency));
    this.svg.append('text')
      .attr('fill', '#3F4B3B')
      .attr('font-size', 5)
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yValueDistribution(meanFrequency))
      .text(meanFrequency);
  }


  chartLine() {
    var lineUp = d3.line()
      .defined(d => !isNaN(d.timeGetProfit))
      .x(d => this.x(this.getDate(d.date)))
      .y(d => this.yUp(d.timeGetProfit));

    var lineDown = d3.line()
      .defined(d => !isNaN(d.maxBottom))
      .x(d => this.x(this.getDate(d.date)))
      .y(d => this.yDown(d.maxBottom));

    this.svg.select('#gline').remove();
    var g = this.svg.append('g')
      .attr('id', 'gline');

    g.append('path')
      .datum(this.dataList)
      .attr('fill', 'none')
      .attr('stroke', '#30A9DE')
      .attr('stroke-width', 1)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineUp);


    g.selectAll('circle')
      .data(this.dataList)
      .enter()
      .append('circle')
      .attr('r', '1')
      .attr('cx', d => this.x(this.getDate(d.date)))
      .attr('cy', d => this.yUp(d.timeGetProfit))
      .attr('fill', '#000000');

    g.selectAll('circle')
      .data(this.notProfit)
      .enter()
      .append('circle')
      .attr('r', '2')
      .attr('cx', d => this.x(this.getDate(d.date)))
      .attr('cy', d => this.yUp(d.timeGetProfit))
      .attr('fill', '#cc0000');

    g.append('path')
      .datum(this.dataList)
      .attr('fill', 'none')
      .attr('stroke', '#EFDC05')
      .attr('stroke-width', 1)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineDown);

    g.selectAll('rect')
      .data(this.notProfit)
      .enter()
      .append('rect')
      .attr('width', '2')
      .attr('height', '2')
      .attr('x', d => this.x(this.getDate(d.date)) - 1)
      .attr('y', d => this.yDown(d.maxBottom) - 1)
      .attr('fill', '#cc0000');

    const meanTimeGetProfit =
      _.meanBy(this.dataList, 'timeGetProfit');
    const meanMaxBottom =
      _.meanBy(this.dataList, 'maxBottom');

    g.append('line')
      .attr('stroke-dasharray', '2 2')
      .attr('stroke', '#30A9DE')
      .attr('stroke-width', 1)
      .attr('x1', this.margin.left)
      .attr('y1', this.yUp(meanTimeGetProfit))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yUp(meanTimeGetProfit));
    g.append('text')
      .attr('fill', '#30A9DF')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yUp(meanTimeGetProfit) - 2)
      .attr('font-size', 8)
      .attr('text-anchor', 'end')
      .text(meanTimeGetProfit);
    g.append('line')
      .attr('stroke-dasharray', '2 2')
      .attr('stroke', '#EFDC05')
      .attr('stroke-width', 1)
      .attr('x1', this.margin.left)
      .attr('y1', this.yDown(meanMaxBottom))
      .attr('x2', this.width - this.margin.right)
      .attr('y2', this.yDown(meanMaxBottom));
    g.append('text')
      .attr('fill', '#EFDC06')
      .attr('x', this.width - this.margin.right)
      .attr('y', this.yDown(meanMaxBottom) + 12)
      .attr('font-size', 8)
      .attr('text-anchor', 'end')
      .text(meanMaxBottom);
  }

  getTotalProfit() {
    this.beProfit = _.filter(this.dataList, function (o, i) {
      return o['beGetProfit'];
    });
    const __ = this;
    this.notProfit = _.filter(this.dataList, function (o, i) {
      return !o['beGetProfit'];
    });
    this.rateOfGettingProfit =
      (this.beProfit.length / this.dataList.length * 100) + '%';
  }

  optionRateProfitChange(event) {
    this.rateProfit = event.target.value;
    this.getDataList();
    this.getNetValue();
  }

  optionStrategyChange(event) {
    this.strategy = event.target.value;
    this.getDataList();
    this.getNetValue();
  }

  optionRateMaxLossChange(event) {
    this.rateMaxLoss = event.target.value;
    this.getDataList();
    this.getNetValue();
  }


  optionTableChange(event) {
    this.table = event.target.value;
    this.getDataStock();
    this.getDataList();
    this.getNetValue();
  }
}


