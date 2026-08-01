import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    window.history.replaceState(null, '', '#planning');
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

  it('should open the duty plan management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const schedulesButton = compiled.querySelector('.nav button:nth-child(4)') as HTMLButtonElement;

    schedulesButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Dienstpläne');
    expect(compiled.querySelectorAll('.duty-row')).toHaveLength(6);
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Standard RH 91');
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Linienverlauf');
  });

  it('should filter duty plans by route search', async () => {
    window.history.replaceState(null, '', '#schedules');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('.duty-search input') as HTMLInputElement;

    searchInput.value = 'Cochem';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.duty-row')).toHaveLength(1);
    expect(compiled.querySelector('.duty-row')?.textContent).toContain('Standard RH 515');
  });

  it('should open the driver management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const driversButton = compiled.querySelector('.nav button:nth-child(5)') as HTMLButtonElement;

    driversButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Fahrer');
    expect(compiled.querySelectorAll('.driver-row')).toHaveLength(7);
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('Olanovski');
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('Nachweise & Prüfungen');
  });

  it('should filter drivers by vehicle search', async () => {
    window.history.replaceState(null, '', '#drivers');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('.driver-search input') as HTMLInputElement;

    searchInput.value = 'DAU-RH 102';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.driver-row')).toHaveLength(1);
    expect(compiled.querySelector('.driver-row')?.textContent).toContain('Koch');
  });

  it('should open the absence management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const absenceButton = compiled.querySelector('.nav button:nth-child(6)') as HTMLButtonElement;

    absenceButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Abwesenheiten');
    expect(compiled.querySelectorAll('.absence-row')).toHaveLength(6);
    expect(compiled.querySelector('.absence-detail-card')?.textContent).toContain('Blum/Böhnke');
    expect(compiled.querySelector('.absence-detail-card')?.textContent).toContain('Auswirkung auf die Planung');
  });

  it('should filter absences by type', async () => {
    window.history.replaceState(null, '', '#absence');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const typeFilter = compiled.querySelector('.absence-toolbar select') as HTMLSelectElement;

    typeFilter.value = 'Urlaub';
    typeFilter.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.absence-row')).toHaveLength(2);
    expect(compiled.querySelector('.absence-list')?.textContent).toContain('Blum/Böhnke');
    expect(compiled.querySelector('.absence-list')?.textContent).toContain('Zeyen B.');
  });

  it('should open the special trip management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const tripsButton = compiled.querySelector('.nav button:nth-child(7)') as HTMLButtonElement;

    tripsButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Sonderfahrten');
    expect(compiled.querySelectorAll('.special-trip-row')).toHaveLength(6);
    expect(compiled.querySelector('.special-trip-detail-card')?.textContent).toContain('Ausflug Rheinbach');
    expect(compiled.querySelector('.special-trip-detail-card')?.textContent).toContain('Jugendfreizeit Hönningen');
  });

  it('should filter special trips by status', async () => {
    window.history.replaceState(null, '', '#trips');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const statusFilter = compiled.querySelector('.special-trip-toolbar select') as HTMLSelectElement;

    statusFilter.value = 'Offen';
    statusFilter.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.special-trip-row')).toHaveLength(2);
    expect(compiled.querySelector('.special-trip-list')?.textContent).toContain('Schulausflug Cochem');
    expect(compiled.querySelector('.special-trip-list')?.textContent).toContain('Messe-Transfer Koblenz');
  });

  it('should open messages and mark a thread as read', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const messagesButton = compiled.querySelector('.nav button:nth-child(8)') as HTMLButtonElement;

    messagesButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Nachrichten');
    expect(compiled.querySelectorAll('.message-thread-row')).toHaveLength(7);
    expect(compiled.querySelectorAll('.message-thread-row--unread')).toHaveLength(3);
    expect(compiled.querySelector('.message-detail-card')?.textContent).toContain('Verspätung auf der B257');

    (compiled.querySelector('.message-thread-row') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.message-thread-row--unread')).toHaveLength(2);
  });

  it('should filter customer messages', async () => {
    window.history.replaceState(null, '', '#messages');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const messageFilter = compiled.querySelector('.message-toolbar select') as HTMLSelectElement;

    messageFilter.value = 'Kunde';
    messageFilter.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.message-thread-row')).toHaveLength(2);
    expect(compiled.querySelector('.message-thread-list')?.textContent).toContain('Anna Schmitz');
    expect(compiled.querySelector('.message-thread-list')?.textContent).toContain('Laura Klein');
  });

  it('should open the statistics view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const statisticsButton = compiled.querySelector('.nav button:nth-child(9)') as HTMLButtonElement;

    statisticsButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Statistiken');
    expect(compiled.querySelectorAll('.stat-metric-card')).toHaveLength(4);
    expect(compiled.querySelector('.trip-trend-card')).toBeTruthy();
    expect(compiled.querySelectorAll('.vehicle-stat-row')).toHaveLength(6);
    expect(compiled.querySelectorAll('.driver-stat-row')).toHaveLength(6);
  });

  it('should update statistics for the selected period', async () => {
    window.history.replaceState(null, '', '#stats');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const periodFilter = compiled.querySelector('.statistics-actions select') as HTMLSelectElement;

    expect(compiled.querySelector('.stat-metric-card:nth-child(2) strong')?.textContent).toContain('28');

    periodFilter.value = 'Dieser Monat';
    periodFilter.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelector('.statistics-range')?.textContent).toContain('Juli 2026');
    expect(compiled.querySelector('.stat-metric-card:nth-child(2) strong')?.textContent).toContain('124');
    expect(compiled.querySelectorAll('.trip-trend-column')).toHaveLength(4);
  });

  it('should open the driver portal from driver details', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.nav button:nth-child(5)') as HTMLButtonElement).click();
    fixture.detectChanges();
    (compiled.querySelector('.driver-portal-preview') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.driver-portal')).toBeTruthy();
    expect(compiled.querySelector('.driver-portal')?.textContent).toContain('Guten Morgen, Olanovski');
    expect(window.location.hash).toBe('#driver-portal');
  });

  it('should complete the driver shift workflow', async () => {
    window.history.replaceState(null, '', '#driver-portal');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const checklist = compiled.querySelectorAll('.driver-checklist input[type="checkbox"]');

    (checklist[0] as HTMLInputElement).click();
    (checklist[1] as HTMLInputElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const startButton = compiled.querySelector('.driver-start-card .driver-primary-action') as HTMLButtonElement;
    expect(startButton.disabled).toBe(false);
    startButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.driver-active-banner')?.textContent).toContain('Ihre Schicht läuft');

    const endMileage = compiled.querySelector('.driver-finish-card input[type="number"]') as HTMLInputElement;
    endMileage.value = '221620';
    endMileage.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const finishButton = compiled.querySelector('.driver-finish-card .driver-primary-action') as HTMLButtonElement;
    expect(finishButton.disabled).toBe(false);
    finishButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.driver-complete-card')?.textContent).toContain('Schicht erfolgreich abgeschlossen');
    expect(compiled.querySelector('.driver-complete-card')?.textContent).toContain('170 km');
  });
});
