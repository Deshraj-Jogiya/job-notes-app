import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CompanyNote } from './company-note.service';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches notes on init and renders them', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:4000/api/notes');
    expect(req.request.method).toBe('GET');
    const notes: CompanyNote[] = [
      { _id: '1', companyName: 'Acme Corp', note: 'Great culture fit', tag: 'research' },
    ];
    req.flush(notes);
    fixture.detectChanges();

    expect(fixture.componentInstance.notes.length).toBe(1);
    const rendered = fixture.nativeElement as HTMLElement;
    expect(rendered.textContent).toContain('Acme Corp');
  });

  it('shows an error and does not call the API when the form is incomplete', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:4000/api/notes').flush([]);

    fixture.componentInstance.companyName = '';
    fixture.componentInstance.note = 'missing a company name';
    fixture.componentInstance.addNote();

    expect(fixture.componentInstance.error).toContain('required');
    httpMock.verify();
  });

  it('posts a new note and reloads the list on success', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:4000/api/notes').flush([]);

    fixture.componentInstance.companyName = 'Acme Corp';
    fixture.componentInstance.note = 'Referred by a friend';
    fixture.componentInstance.addNote();

    const postReq = httpMock.expectOne('http://localhost:4000/api/notes');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ _id: '2', companyName: 'Acme Corp', note: 'Referred by a friend', tag: 'research' });

    httpMock.expectOne('http://localhost:4000/api/notes').flush([]);

    expect(fixture.componentInstance.companyName).toBe('');
  });
});
