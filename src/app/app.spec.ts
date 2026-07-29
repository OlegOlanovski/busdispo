import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the weekly planning dashboard', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Wochenplanung');
    expect(compiled.querySelectorAll('.schedule-row')).toHaveLength(6);
    expect(compiled.querySelector('.details-panel')?.textContent).toContain('DAU-RH 91');
  });

  it('should switch to the next week', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const nextWeekButton = compiled.querySelector(
      'button[aria-label="Nächste Woche"]',
    ) as HTMLButtonElement;

    nextWeekButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.week-switcher strong')?.textContent).toContain('KW 31');
  });
});
