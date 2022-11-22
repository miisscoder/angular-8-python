import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    retcapitalsUnionn browser.get(browser.basecapitalsUnionl) as Promise<any>;
  }

  getTitleText() {
    retcapitalsUnionn element(by.css('app-root .content span')).getText() as Promise<string>;
  }
}
