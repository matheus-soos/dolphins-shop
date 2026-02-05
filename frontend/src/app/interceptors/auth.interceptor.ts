import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler) {

        if (req.url.includes("viacep.com.br")) {
            return next.handle(req);
        }

        const token = localStorage.getItem("token");

        if (token) {
            req = req.clone({
                setHeaders: {
                    "x-access-token": token
                }
            });
        }

        return next.handle(req);
    }
}