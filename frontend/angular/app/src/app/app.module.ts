import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FileSaverModule } from 'ngx-filesaver';

import { DataListService } from '../services/data-list.service';
import { FutureService } from '../services/future.service';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';


import { EggBottomStrategyComponent } from './components/egg-bottom-strategy/egg-bottom-strategy.component';
import { EggBoxStrategyComponent } from './components/egg-box-strategy/egg-box-strategy.component';
import { EggInformationComponent } from './components/egg-information/egg-information.component';

import { HomePageComponent } from './home/home-page.component';
import { GSYHPageComponent } from './gsyh/gsyh-page.component';


@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    EggBottomStrategyComponent,
    EggInformationComponent,
    EggBoxStrategyComponent,
    GSYHPageComponent
  ],
  imports: [
    BrowserModule, 
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    FileSaverModule 
  ],
  providers: [DataListService, FutureService],
  bootstrap: [AppComponent]
})
export class AppModule { }
