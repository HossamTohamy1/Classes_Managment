import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getArabicPaginatorIntl } from './app';
import { Classes } from './pages/classes/classes';

export const appConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(BrowserAnimationsModule),
    provideHttpClient(),

    // ✅ Paginator بالعربي
    { provide: MatPaginatorIntl, useFactory: getArabicPaginatorIntl },

    // ✅ Services
    Classes,
  ],
};
