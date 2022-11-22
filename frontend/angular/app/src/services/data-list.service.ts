import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import * as _ from 'lodash';

/**
 * This class provides the DataListService service with methods to read names and add names.
 */
@Injectable()
export class DataListService {
  private apiUrl = environment.apiBase;  // URL to web api

  constructor(protected httpClient: HttpClient) { }

  get(urlAddress: string) {
    return this.httpClient.get(this.apiUrl + urlAddress,
      { responseType: 'text' });
  }

  dateTransfer(data) {
    _.each(data, (o) => {
      const date = o['date'].split(' ')[0];
      const time = o['date'].split(' ')[1];
      o['date'] = new Date(
        date.split('-')[0], date.split('-')[1] - 1, date.split('-')[2],
        time.split(':')[0], time.split(':')[1], time.split(':')[2]);
    });
  }
}
