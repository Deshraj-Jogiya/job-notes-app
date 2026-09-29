import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompanyNote, CompanyNoteService } from './company-note.service';

const SEARCH_DEBOUNCE_MS = 250;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  notes: CompanyNote[] = [];
  companyName = '';
  note = '';
  tag = 'research';
  error = '';

  searchQuery = '';
  tagFilter = '';
  readonly filterTags = ['research', 'networking', 'interview', 'follow-up'];
  private searchDebounceHandle?: ReturnType<typeof setTimeout>;

  constructor(private noteService: CompanyNoteService) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.noteService
      .list({ tag: this.tagFilter || undefined, q: this.searchQuery.trim() || undefined })
      .subscribe({
        next: (notes) => (this.notes = notes),
        error: () => (this.error = 'Could not load notes from the server.'),
      });
  }

  onSearchInput(): void {
    clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => this.loadNotes(), SEARCH_DEBOUNCE_MS);
  }

  addNote(): void {
    if (!this.companyName.trim() || !this.note.trim()) {
      this.error = 'Company name and note are both required.';
      return;
    }
    this.error = '';
    this.noteService
      .create({ companyName: this.companyName, note: this.note, tag: this.tag })
      .subscribe({
        next: () => {
          this.companyName = '';
          this.note = '';
          this.loadNotes();
        },
        error: () => (this.error = 'Could not save that note.'),
      });
  }

  deleteNote(id: string | undefined): void {
    if (!id) return;
    this.noteService.remove(id).subscribe(() => this.loadNotes());
  }
}
