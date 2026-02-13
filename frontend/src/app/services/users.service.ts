import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(
    private http: HttpClient
  ) { }

  getUsers(): Observable<any> {
    return this.http.get(environment.API_URL + "/users/getUsers")
  }

  getUser(id: number): Observable<any> {
    return this.http.get(environment.API_URL + "/users/getUser/" + id)
  }

  register(reqObj: any) {
    return this.http.post(environment.API_URL + "/users/register", reqObj)
  }

  login(reqObj: any) {
    return this.http.post(environment.API_URL + "/users/login", reqObj)
  }

  cadastroCliente(reqObj: any) {
    return this.http.post(environment.API_URL + "/users/cadastroCliente", reqObj)
  }

  getCliente(user_id: string) {
    return this.http.get(environment.API_URL + "/users/getCliente/" + user_id)
  }

  isAdmin() {
    return localStorage.getItem("isAdmin")
  }
}
