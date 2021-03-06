import { Component, Inject, InjectionToken, OnInit } from '@angular/core';


// @ts-ignore
import * as SkyID from 'skyid';
import { APP_NAME } from 'src/app/tokens/app-name.token';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-skyid-connect',
  templateUrl: './skyid-connect.component.html',
  styleUrls: ['./skyid-connect.component.scss']
})
export class SkyidConnectComponent implements OnInit {
  skyid: any;
  logged = false;
  legacyAppName = "Skybrain";

  constructor(@Inject(APP_NAME) private appName: string, private api: ApiService) { }

  ngOnInit(): void { }

  sessionStart(): void {
    if (!this.skyid) {
      this.initSkyID();
    }

    this.skyid.sessionStart();
  }

  connect(): void {
    if (!this.skyid) {
      this.initSkyID();
    }
    this.api.registerUser(this.skyid.seed);


  }

  getQueryStringValue(key: string) {
    const urlParams = new URLSearchParams(window.location.hash);
    return urlParams.get(key);
  }

  isLegacyAccount(): boolean {
    return this.getQueryStringValue("lid") == "legacy";
  }

  initSkyID() {
    let devMode = false;
    if (window.location.hostname === 'idtest.local' || window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
      devMode = true;
    }

    let skyIDAppName = this.appName;

    // To support old accounts with legacy appName
    if (this.isLegacyAccount()) {
      skyIDAppName = this.legacyAppName;
    }

    const opts = { devMode };
    this.skyid = new SkyID.SkyID(skyIDAppName, (message: string) => {
      switch (message) {
        case 'login_fail':
          console.log("Could not login with SkyID")

          break;
        case 'login_success':
          this.connect();
          break;
        case 'destroy':
          break;
        default:
          break;
      }
    }, opts);

    this.logged = this.skyid.seed !== '';
  }
}
