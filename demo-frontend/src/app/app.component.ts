import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Production';
  message: String = '';

  constructor(private _api: ApiService) {}

  ngOnInit() {
    this.getMessageFromApi();
  }

  getMessageFromApi(): String {
    console.log("called API method")
    this._api.getHello().subscribe((data: String) => {
      console.log(data);
      this.message=data
    });
    return this.message;
  }
}
