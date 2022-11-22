import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { DataListService } from '../../../services/data-list.service';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'egg-information-component',
  templateUrl: './egg-information.component.html',
  styleUrls: ['./egg-information.component.scss']
})
export class EggInformationComponent implements OnInit {
  data = {};
  @Output() change = new EventEmitter<any>();
  
  contracts = {};
  contractsByYear = {};
  contractsByMonth = {};
  years = [];
  months = [];
  time = '5m';
  errorMessage: any;

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
  height = 300;
  fontSizeDescription = 5;
  fontSizeAxis = 6.5;
  fontSizeRoomAxis = 5;
  fontSizeProportion = 5;
  svg: any;

  xScale: any;
  yScale: any;
  xRoomScale: any;
  yRoomScale: any;

  constructor(public dataListService: DataListService,
    public http: HttpClient) {


  }

  ngOnInit() {
    this.contracts = JSON.parse(sessionStorage.getItem('eggContracts'));
    this.contractsByYear =
      JSON.parse(sessionStorage.getItem('eggContractsByYear'));
    this.contractsByMonth =
      JSON.parse(sessionStorage.getItem('eggContractsByMonth'));

    this.years = _.keys(this.contractsByYear);
    this.months = _.keys(this.contractsByMonth);

    d3.select('#chartInformation svg').remove();
    this.svg = d3.select('#chartInformation').append('svg').attr('viewBox', [0, 0, this.width, this.height]);
    this.axis();

    const ___ = this;
    const keys = _.keys(this.contracts);
    _.each(keys, (o) => {
      if (this.contracts[o].checked) {
        ___.updateChartByContract(o);
      }
    });
  }

  axis() {
    // function Room axis
    this.xRoomScale = d3.scaleTime()
      .domain([new Date(2013, 10, 11, 10, 15, 0), new Date(Date.now())])
      .range([this.margin.left, this.width - this.margin.right]);

    var xRoomAxis = g => g
      .attr('id', 'xRoomAxis')
      .attr('transform', `translate(0,
      ${this.margin.top + this.margin.room})`)
      .call(d3.axisBottom(this.xRoomScale).tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('line').attr('stroke-width', 0.5);
        g.selectAll('text').attr('font-size', this.fontSizeRoomAxis);
      });

    this.xScale = d3.scaleTime()
      .domain([new Date(2013, 10, 11, 10, 15, 0), new Date(Date.now())])
      .range([this.margin.left, this.width - this.margin.right]);

    var xAxis = g => g
      .attr('id', 'xAxis')
      .attr('transform', `translate(0, ${this.height - this.margin.bottom})`)
      .call(d3.axisBottom(this.xScale).tickSizeInner(2).tickSizeOuter(0))
      .call(g => {
        g.selectAll('path').attr('stroke-width', 0.5);
        g.selectAll('line').attr('stroke-width', 0.5);
        g.selectAll('text').attr('font-size', this.fontSizeRoomAxis);
      });

    this.yRoomScale = d3.scaleLinear()
      .domain([2000, 5500]).nice()
      .range([this.margin.top + this.margin.room, this.margin.top]);

    var yRoomAxis = g => g
      .attr('id', 'yRoomAxis')
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yRoomScale))
      .call(g => {
        g.select('.domain').attr('stroke', '#E53A40');
        g.selectAll('.tick line').attr('stroke', '#E53A40')
          .attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#E53A40')
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    this.yScale = d3.scaleLinear()
      .domain([2000, 5500]).nice()
      .range([this.height - this.margin.bottom,
      this.margin.top + this.margin.room + this.margin.middle]);

    var yAxis = g => g
      .attr('id', 'yRoomAxis')
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yScale))
      .call(g => {
        g.select('.domain').attr('stroke', '#E53A40');
        g.selectAll('.tick line').attr('stroke', '#E53A40')
          .attr('stroke-width', 0.5);
        g.selectAll('.tick text').attr('fill', '#E53A40')
          .attr('font-size', this.fontSizeAxis);
        g.selectAll('path').attr('stroke-width', 0.5);
      });

    this.svg.select('#gXAxis').remove();
    var g = this.svg.append('g').attr('id', 'gXAxis');
    g.append('g').call(xRoomAxis);
    g.append('g').call(yRoomAxis);
    g.append('g').call(xAxis);
    g.append('g').call(yAxis);
  }

  drawCharts(contract, beRoomChart) {
    const __ = this;
    var g = null;
    if (beRoomChart) {
      this.svg.select('#gChartRoom' + contract).remove();
      g = this.svg.append('g').attr('id', 'gChartRoom' + contract);
    } else {
      this.svg.select('#gChart' + contract).remove();
      g = this.svg.append('g').attr('id', 'gChart' + contract);
    }
    if (this.contracts[contract]['checked']) {
      __.chartLine(this.data[contract], beRoomChart, g);
    }
  }

  chartLine(data, beRoomChart, g) {
    var xChart = null;
    var yChart = null;
    if (beRoomChart) {
      xChart = this.xRoomScale;
      yChart = this.yRoomScale;
    } else {
      xChart = this.xScale;
      yChart = this.yScale;
    }
    // stock line , mean
    var lineStock = d3.line()
      .defined(d => !isNaN(d.open))
      .x(d => xChart(d.date))
      .y(d => yChart(d.open));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#E53A40')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', lineStock);
  }

  checkYear(year) {
    this.contractsByYear[year].checked = !this.contractsByYear[year].checked;
    const ___ = this;
    _.each(this.contractsByYear[year].contracts, o => {
      ___.contracts[o].checked = ___.contractsByYear[year].checked;
      this.updateChartByContract(o);
    });

    sessionStorage.setItem('eggContracts', JSON.stringify(this.contracts));
    sessionStorage.setItem('eggContractsByYear', JSON.stringify(this.contractsByYear));
  }

  checkMonth(month) {
    this.contractsByMonth[month].checked = !this.contractsByMonth[month].checked;
    const ___ = this;
    _.each(this.contractsByMonth[month].contracts, o => {
      ___.contracts[o].checked = ___.contractsByMonth[month].checked;
      this.updateChartByContract(o);
    });

    sessionStorage.setItem('eggData', JSON.stringify(this.contracts));
    sessionStorage.setItem('eggContractsByMonth', JSON.stringify(this.contractsByMonth));
  }
   
  checkContract(contract) {
    this.contracts[contract].checked = !this.contracts[contract].checked;
    sessionStorage.setItem('eggContracts', JSON.stringify(this.contracts));
    this.updateChartByContract(contract);
  }

  updateChartByContract(contract) {
    if (!this.data || !this.data[contract]) {
      this.dataListService.get('getEggDataByContract/' + contract + '/' + this.time)
        .subscribe(
          data => {
            const d = JSON.parse(data.replace(/'/gi, '"'));
            this.dataListService.dateTransfer(d);
            _.set(this.data, contract, d);
            this.change.emit(this.data);
            this.drawCharts(contract, true);
            this.drawCharts(contract, false);
          },
          error => this.errorMessage = <any>error);
    } else {
      this.drawCharts(contract, true);
      this.drawCharts(contract, false);
    }
  }
  

}
