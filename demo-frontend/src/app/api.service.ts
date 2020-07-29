import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  apiUrl = environment.api;
  test: String = '';

  constructor(private _http: HttpClient) { }

  public getHello(): Observable<String> {
    let url = this.apiUrl + "/hello"
    return this._http.get(url, {responseType: 'text'});
  }
}
