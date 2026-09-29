import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CompanyNoteEnrichment {
  summary: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  fetchedAt: string | null;
}

export interface CompanyNote {
  _id?: string;
  companyName: string;
  note: string;
  tag: string;
  enrichment?: CompanyNoteEnrichment;
  createdAt?: string;
}

export interface NoteFilters {
  tag?: string;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyNoteService {
  private readonly baseUrl = 'http://localhost:4000/api/notes';

  constructor(private http: HttpClient) {}

  list(filters: NoteFilters = {}): Observable<CompanyNote[]> {
    let params = new HttpParams();
    if (filters.tag) {
      params = params.set('tag', filters.tag);
    }
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    return this.http.get<CompanyNote[]>(this.baseUrl, { params });
  }

  create(note: Omit<CompanyNote, '_id' | 'createdAt' | 'enrichment'>): Observable<CompanyNote> {
    return this.http.post<CompanyNote>(this.baseUrl, note);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
