import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CompanyNote {
  _id?: string;
  companyName: string;
  note: string;
  tag: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyNoteService {
  private readonly baseUrl = 'http://localhost:4000/api/notes';

  constructor(private http: HttpClient) {}

  list(): Observable<CompanyNote[]> {
    return this.http.get<CompanyNote[]>(this.baseUrl);
  }

  create(note: Omit<CompanyNote, '_id' | 'createdAt'>): Observable<CompanyNote> {
    return this.http.post<CompanyNote>(this.baseUrl, note);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
