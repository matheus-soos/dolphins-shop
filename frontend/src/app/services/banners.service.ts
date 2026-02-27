import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BannersService {

    constructor(
        private http: HttpClient
        
    ) { }

    post(formData: FormData) {
        return this.http.post(environment.API_URL + '/banners', formData)
    }

    get() {
        return this.http.get(environment.API_URL + '/banners')
    }
}
