import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/events`;

  getEvents(search: string = '', skip: number = 0, limit: number = 50) {
    let params = new HttpParams().set('skip', skip).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<any[]>(this.url, { params });
  }

  getEvent(id: number) {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  createEvent(event: any) {
    return this.http.post<any>(this.url, event);
  }

  updateEvent(id: number, event: any) {
    return this.http.put<any>(`${this.url}/${id}`, event);
  }

  deleteEvent(id: number) {
    return this.http.delete(`${this.url}/${id}`);
  }

  attendEvent(id: number, coords?: {latitude: number, longitude: number}) {
    return this.http.post(`${this.url}/${id}/attendances`, coords || {});
  }
}