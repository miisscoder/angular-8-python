import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { HomePageComponent } from './home/home-page.component';
import { GSYHPageComponent } from './gsyh/gsyh-page.component';


const routes: Routes = [
  {
    path: 'home',
    component: HomePageComponent
  }, {
    path: 'gsyh',
    component: GSYHPageComponent
  }, {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
