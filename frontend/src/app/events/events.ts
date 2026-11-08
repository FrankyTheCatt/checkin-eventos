import { Injectable, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Attendance, EventPayload, EventRecord } from './event.models';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl + '/events';

  listResource(query: () => { search: string; skip: number; limit: number }) {
    return httpResource<EventRecord[]>(() => ({ url: this.url, params: query() }));
  }

  detailResource(id: () => number | undefined) {
    return httpResource<EventRecord>(() => (id() ? this.url + '/' + id() : undefined));
  }

  attendeesResource(id: () => number | undefined) {
    return httpResource<Attendance[]>(() =>
      id() ? this.url + '/' + id() + '/attendances' : undefined,
    );
  }

  myAttendancesResource() {
    return httpResource<Attendance[]>(() => environment.apiUrl + '/attendances/me');
  }

  createEvent(event: EventPayload) {
    return this.http.post<EventRecord>(this.url, event);
  }

  updateEvent(id: number, event: EventPayload) {
    return this.http.put<EventRecord>(this.url + '/' + id, event);
  }

  deleteEvent(id: number) {
    return this.http.delete<void>(this.url + '/' + id);
  }

  attendEvent(id: number) {
    return this.http.post<Attendance>(this.url + '/' + id + '/attendances', {});
  }
}
