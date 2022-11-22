import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import * as _ from 'lodash';
import * as moment from 'moment';
/**
 * This class provides the DataListService service with methods to read names and add names.
 */
@Injectable()
export class FutureService {
  private apiUrl = environment.apiBase;  // URL to web api

  public dataStock = [];
  public dataStatistic = [];
  public capitals = [{ 'long': [], 'short': [] },
  { 'long': [], 'short': [] },
  { 'long': [], 'short': [] },
  { 'long': [], 'short': [] }];
  public errorMessage: any;
  constructor(public httpClient: HttpClient) { }

  getRangeIndex(value, arrRange) {
    if (value < arrRange[1]) {
      return 0;
    } else if (value < arrRange[2]) {
      return 1;
    } else if (value < arrRange[3]) {
      return 2;
    } else {
      return 3;
    }
  }

  getNetValue(arrRateOfProfit, arrRange, arrLongOrShort) {
    const __ = this;
    let profit = 0;
    let netValueSum = 0;
    let i = 0;
    while (i < this.dataStock.length) {
      const o = this.dataStock[i];
      const range = __.getRangeIndex(o['open'], arrRange);
      if (i < 4) {
        _.set(this.dataStock[i], 'profit', profit);
        _.set(this.dataStock[i], 'netValueSum', netValueSum);
        _.set(this.dataStock[i], 'stackDeepLong', 0);
        _.set(this.dataStock[i], 'stackDeepShort', 0);
        i++;
        continue;
      }
      const minBottomNear4 = _.min([
        this.dataStock[i - 1]['low'],
        this.dataStock[i - 2]['low'],
        this.dataStock[i - 3]['low'],
        this.dataStock[i - 4]['low']
      ]);
      const maxHighNear4 = _.max([
        this.dataStock[i - 1]['high'],
        this.dataStock[i - 2]['high'],
        this.dataStock[i - 3]['high'],
        this.dataStock[i - 4]['high']
      ]);
      const inPrice = (arrLongOrShort[range] === 1 ?
        this.dataStock[i - 1]['low'] : this.dataStock[i - 1]['high']);
      // out
      let iRange = 0;
      while (iRange < this.capitals.length) {
        // 做空
        if (arrLongOrShort[iRange] === 0 || arrLongOrShort[iRange] === 2) {
          let j = 0;
          while (j < this.capitals[iRange]['short'].length) {
            const aim = Math.floor(this.capitals[iRange]['short'][j].value /
              arrRateOfProfit[iRange] * 100) / 100;
            if (aim >= o['low'] && this.capitals[iRange]['short'][j]['beGetProfit'] === false) {
              netValueSum = netValueSum - aim;
              profit += (this.capitals[iRange]['short'][j].value - aim);
              this.capitals[iRange]['short'][j]['outDate'] = this.dataStock[i]['date'];
              this.capitals[iRange]['short'][j]['beGetProfit'] = true;
              const a = moment(this.capitals[iRange]['short'][j]['outDate']);
              const b = moment(this.capitals[iRange]['short'][j]['inDate']);
              this.capitals[iRange]['short'][j]['timeProfit'] = a.diff(b, 'days');
            }
            j++;
          }
          // 做多
        } else if (arrLongOrShort[iRange] === 1 || arrLongOrShort[iRange] === 2) {
          let j = 0;
          while (j < this.capitals[iRange]['long'].length) {
            const aim = Math.floor(this.capitals[iRange]['long'][j].value
              * arrRateOfProfit[iRange] * 100) / 100;
            if (aim <= o['high'] && this.capitals[iRange]['long'][j]['beGetProfit'] === false) {
              netValueSum = netValueSum + aim;
              profit += (aim - this.capitals[iRange]['long'][j].value);
              this.capitals[iRange]['long'][j]['outDate'] = this.dataStock[i]['date'];
              this.capitals[iRange]['long'][j]['beGetProfit'] = true;
              const a = moment(this.capitals[iRange]['long'][j]['outDate']);
              const b = moment(this.capitals[iRange]['long'][j]['inDate']);
              this.capitals[iRange]['long'][j]['timeProfit'] = a.diff(b, 'days');
              this.capitals[iRange]['long'][j]['beGetProfit'] = true;
            }
            j++;
          }
        }
        iRange++;
      }
      // in
      // 做空
      if ((arrLongOrShort[range] === 0 || arrLongOrShort[range] === 2) &&
        inPrice <= o['high'] &&
        inPrice === maxHighNear4) {

        netValueSum = netValueSum + inPrice;
        this.capitals[range]['short'].push({
          'index': i,
          'value': inPrice,
          'inDate': o['date'],
          'outDate': null,
          'beGetProfit': false,
          'timeProfit': -100,
          'maxBottomOrTop': inPrice
        });

        // 做多
      } else if ((arrLongOrShort[range] === 1 || arrLongOrShort[range] === 2) &&
        inPrice >= o['low'] &&
        inPrice === minBottomNear4) {

        netValueSum = netValueSum - inPrice;
        this.capitals[range]['long'].push({
          'index': i,
          'value': inPrice,
          'inDate': o['date'],
          'outDate': null,
          'beGetProfit': false,
          'timeProfit': -100,
          'maxBottomOrTop': inPrice
        });

      }

      _.set(this.dataStock[i], 'profit', profit);
      _.set(this.dataStock[i], 'netValueSum', netValueSum);

      var stackDeepLong = -1;
      var stackDeepShort = -1;

      _.each(this.capitals, (o, iRange) => {
        const __ = this;
        const fl = _.filter(o['long'], (o) => !o['beGetProfit']);
        stackDeepLong += fl.length;
        const fs = _.filter(o['short'], (o) => !o['beGetProfit']);
        stackDeepShort += fs.length;
        _.each(o['long'], (oo, ii) => {
          __.capitals[iRange]['long'][ii]['maxBottomOrTop'] =
            __.capitals[iRange]['long'][ii]['maxBottomOrTop'] < __.dataStock[i]['open'] ?
              __.capitals[iRange]['long'][ii]['maxBottomOrTop'] : __.dataStock[i]['open'];
        });
        _.each(o['short'], (oo, ii) => {
          __.capitals[iRange]['short'][ii]['maxBottomOrTop'] =
            __.capitals[iRange]['short'][ii]['maxBottomOrTop'] > __.dataStock[i]['open'] ?
              __.capitals[iRange]['short'][ii]['maxBottomOrTop'] : __.dataStock[i]['open'];
        });
      });
      _.set(this.dataStock[i], 'stackDeepLong', stackDeepLong);
      _.set(this.dataStock[i], 'stackDeepShort', stackDeepShort);
      // dataStatistic   
      i++;
    }

  }
}
