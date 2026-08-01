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

  it('should switch between overview and weekly planning', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const overviewButton = compiled.querySelector('.nav button:first-child') as HTMLButtonElement;

    overviewButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Übersicht');
    expect(compiled.querySelector('.overview-page')).toBeTruthy();
    expect(compiled.querySelector('.schedule-card')).toBeFalsy();

    const planningButton = compiled.querySelector('.nav button:nth-child(2)') as HTMLButtonElement;
    planningButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Wochenplanung');
    expect(compiled.querySelector('.schedule-card')).toBeTruthy();
  });

  it('should open the vehicle management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const vehiclesButton = compiled.querySelector('.nav button:nth-child(3)') as HTMLButtonElement;

    vehiclesButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Fahrzeuge');
    expect(compiled.querySelectorAll('.fleet-row')).toHaveLength(6);
    expect(compiled.querySelector('.vehicle-detail-card')?.textContent).toContain('DAU-RH 91');
    expect(compiled.querySelector('.vehicle-detail-card')?.textContent).toContain('Nächste HU');
    expect(compiled.querySelector('.vehicle-detail-card')?.textContent).toContain('Nächste SP');
    expect(compiled.querySelector('.vehicle-detail-card')?.textContent).not.toContain('Tankfüllung');
  });

  it('should filter the fleet by search text', async () => {
    window.history.replaceState(null, '', '#vehicles');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('.fleet-search input') as HTMLInputElement;

    searchInput.value = 'Crossway';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.fleet-row')).toHaveLength(1);
    expect(compiled.querySelector('.fleet-row')?.textContent).toContain('DAU-RH 11');
  });
});
