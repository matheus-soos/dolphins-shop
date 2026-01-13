import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { InMemoryScrollingFeature, InMemoryScrollingOptions, provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { LOCALE_ID } from '@angular/core';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideEnvironmentNgxMask } from 'ngx-mask';

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: "enabled", scrollPositionRestoration: "top" }),
      withHashLocation()
    ),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideHttpClient(),
    provideNativeDateAdapter(MY_FORMATS),
    provideEnvironmentNgxMask()
  ]
};
