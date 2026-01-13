import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import moment from "moment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router, private http: HttpClient) { }

  setLocalStorage(responseObj: any) {
    const expiresAt = moment().add(Number.parseInt(responseObj.token.expiresIn), 'days');
    localStorage.setItem('token', responseObj.token.token);
    localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()));
    localStorage.setItem('user_id', responseObj.user.id)

    if(responseObj.user.isAdmin) {
        localStorage.setItem('isAdmin', 'true')
    }
  }

  logout() {
    localStorage.clear()
    this.router.navigateByUrl("/user/login");
  }

  public isLoggedIn() {
    return moment().isBefore(this.getExpiration(), "second");
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  getExpiration() {
    const expiration = localStorage.getItem("expires_at");
    if (expiration) {
      const expiresAt = JSON.parse(expiration);
      return moment(expiresAt);
    } else {
      return moment();
    }
  }
}
