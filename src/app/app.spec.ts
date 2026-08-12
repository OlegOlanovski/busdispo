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
    expect(compiled.querySelectorAll('.schedule-row')).toHaveLength(7);
    expect(compiled.querySelectorAll('.line-heading')).toHaveLength(21);
    expect(compiled.querySelector('.trip-grid--header .line-heading')?.textContent?.trim()).toBe('DEMO 13');
    expect(compiled.querySelector('.planning-week-corner')?.textContent).toContain('KW 25');
    expect(compiled.querySelector('.matrix-day')?.textContent).toContain('15.06');
    expect(compiled.querySelectorAll('.planning-trip-card').length).toBeGreaterThan(80);
    expect(compiled.querySelector('.trip-grid .matrix-corner')).toBeFalsy();
    expect(compiled.querySelector('.trip-side-label')).toBeFalsy();
    expect(compiled.querySelector('.trip-grid--body')?.textContent).toContain('Demo Ort 19 → Demo Ort 20');
    expect(compiled.querySelector('.trip-grid--body')?.textContent).toContain('Demo Ort 03 → Demo Ort 47');
    expect(compiled.querySelector('.schedule-drag-hint')).toBeFalsy();
    expect(compiled.querySelector('.planning-block-heading')).toBeFalsy();
    expect(compiled.querySelectorAll('.schedule-grid--header')).toHaveLength(0);
    expect(compiled.querySelector('.vehicle-heading')).toBeFalsy();
    expect(compiled.querySelector('.shift')?.textContent?.trim()).toBe('Fahrer 01');
    expect(compiled.querySelector('.shift')?.textContent).not.toContain('06:05');
    expect(compiled.querySelector('.shift')?.textContent).not.toContain('DEMO-13');
    expect(compiled.querySelector('.right-column')).toBeFalsy();
    expect(compiled.querySelector('.details-panel')).toBeFalsy();

    const rh91Heading = compiled.querySelector('.trip-grid--header [data-vehicle="DEMO-91"]') as HTMLElement;
    const rh91Cell = compiled.querySelector('.schedule-row [data-vehicle="DEMO-91"]') as HTMLElement;
    expect(rh91Heading).toBeTruthy();
    expect(rh91Cell.textContent).toContain('Fahrer 10');
  });

  it('should slide the main menu in and out', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector('.menu-button') as HTMLButtonElement;
    const sidebar = compiled.querySelector('.sidebar') as HTMLElement;

    expect(sidebar.classList).not.toContain('sidebar--open');
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');

    menuButton.click();
    fixture.detectChanges();

    expect(sidebar.classList).toContain('sidebar--open');
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(compiled.querySelector('.sidebar-scrim')).toBeTruthy();

    (compiled.querySelector('.sidebar-close') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(sidebar.classList).not.toContain('sidebar--open');
    expect(compiled.querySelector('.sidebar-scrim')).toBeFalsy();
  });

  it('should open line details from a trip card', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.planning-trip-card') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.details-panel')?.textContent).toContain('DEMO-13');
    expect(compiled.querySelector('.details-panel')?.textContent).toContain('Linie L 13');
    expect(compiled.querySelector('.route-table')).toBeFalsy();
  });

  it('should edit a bus number from the planning header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('.trip-grid--header [data-vehicle="DEMO-13"]') as HTMLElement;

    (heading.querySelector('.planning-vehicle-edit') as HTMLButtonElement).click();
    fixture.detectChanges();

    const input = heading.querySelector('.planning-vehicle-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'Bus 4711';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(heading.textContent).toContain('Bus 4711');
    expect(compiled.querySelector('.toast--planning')?.textContent).toContain('Busnummer geändert');
    expect(compiled.querySelector('.schedule-row [data-vehicle="DEMO-13"]')).toBeTruthy();
  });

  it('should move a trip card to another vehicle column by drag and drop', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const sourceColumn = compiled.querySelector('.trip-column[data-vehicle="DEMO-13"]') as HTMLElement;
    const targetColumn = compiled.querySelector('.trip-column[data-vehicle="DEMO-11"]') as HTMLElement;
    const source = sourceColumn.querySelector('.planning-trip-card') as HTMLButtonElement;
    const sourceCount = sourceColumn.querySelectorAll('.planning-trip-card').length;
    const targetCount = targetColumn.querySelectorAll('.planning-trip-card').length;

    source.dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }));
    targetColumn.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(source.classList).toContain('planning-trip-card--dragging');
    expect(targetColumn.classList).toContain('trip-column--drop-target');

    targetColumn.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(sourceColumn.querySelectorAll('.planning-trip-card')).toHaveLength(sourceCount - 1);
    expect(targetColumn.querySelectorAll('.planning-trip-card')).toHaveLength(targetCount + 1);
    expect(targetColumn.textContent).toContain('07:00 – 08:15');
    expect(compiled.querySelector('.toast--planning')?.textContent).toContain('Fahrt verschoben');
  });

  it('should edit a line directly on a planning card', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('.planning-trip-card') as HTMLElement;

    (card.querySelector('.planning-trip-route-edit') as HTMLButtonElement).click();
    fixture.detectChanges();

    const input = card.querySelector('.planning-trip-route-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'Linie 4711';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(card.textContent).toContain('Linie 4711');
    expect(compiled.querySelector('.toast--planning')?.textContent).toContain('Linie geändert');
  });

  it('should add a driver assignment from an empty planning cell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const shiftsBefore = compiled.querySelectorAll('.shift').length;

    (compiled.querySelector('.empty-cell') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.assignment-form')).toBeTruthy();
    expect(compiled.querySelector('.assignment-form')?.textContent).toContain('Neue Zuweisung');
    expect(compiled.querySelector('.assignment-form')?.textContent).toContain('Tagesplan L 102');

    (compiled.querySelector('.assignment-form .save-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.shift')).toHaveLength(shiftsBefore + 1);
    expect(compiled.querySelector('.assignment-form')).toBeFalsy();
    expect(compiled.querySelector('.details-panel')?.textContent).toContain('Fahrer 07');
  });

  it('should move an assignment to a free cell by drag and drop', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('.schedule-row');
    const sourceCell = rows[3].querySelectorAll('.schedule-cell')[0] as HTMLElement;
    const target = rows[5].querySelectorAll('.schedule-cell')[0] as HTMLElement;
    const source = sourceCell.querySelector('.shift') as HTMLButtonElement;

    source.dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }));
    target.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(target.classList).toContain('schedule-cell--drop-valid');

    target.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(target.querySelector('.shift')?.textContent).toContain('Fahrer 01');
    expect(sourceCell.querySelector('.shift')).toBeFalsy();
    expect(compiled.querySelector('.toast--planning')?.textContent).toContain('Einsatz verschoben');
  });

  it('should reject a drop on an occupied planning cell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('.schedule-row');
    const sourceCell = rows[3].querySelectorAll('.schedule-cell')[0] as HTMLElement;
    const targetCell = rows[3].querySelectorAll('.schedule-cell')[1] as HTMLElement;
    const source = sourceCell.querySelector('.shift') as HTMLButtonElement;

    source.dispatchEvent(new Event('dragstart', { bubbles: true, cancelable: true }));
    targetCell.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(targetCell.classList).toContain('schedule-cell--drop-invalid');

    targetCell.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(sourceCell.querySelector('.shift')?.textContent).toContain('Fahrer 01');
    expect(targetCell.querySelector('.shift')?.textContent).toContain('Fahrer 02');
    expect(compiled.querySelector('.toast--error')?.textContent).toContain('bereits belegt');
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

    expect(compiled.querySelector('.week-switcher strong')?.textContent).toContain('KW 26');
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
    expect(compiled.querySelector('.vehicle-detail-card')?.textContent).toContain('DEMO-91');
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
    expect(compiled.querySelector('.fleet-row')?.textContent).toContain('DEMO-11');
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
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Tagesplan L 91');
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Linienverlauf');
  });

  it('should edit a duty plan including its stops', async () => {
    window.history.replaceState(null, '', '#schedules');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.duty-detail-actions .button--primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.duty-edit-form')).toBeTruthy();
    expect(compiled.querySelectorAll('.duty-edit-stop')).toHaveLength(6);

    (compiled.querySelector('.duty-edit-add-stop') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.duty-edit-stop')).toHaveLength(7);

    const app = fixture.componentInstance as any;
    app.dutyPlanDraft = {
      name: 'Tagesdienstplan L 91 Neu',
      route: 'Demo Ort 04 ZOB → Demo Ort 02',
      start: '06:00',
      end: '14:30',
      breakTime: '45m',
      weekdays: 'Mo – Sa',
      status: 'Aktiv',
      stops: ['Demo Ort 04 ZOB', 'Demo Ort 13', 'Demo Ort 03', 'Demo Ort 02'],
    };
    (compiled.querySelector('.duty-edit-actions .button--primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.duty-edit-form')).toBeFalsy();
    expect(compiled.querySelector('.duty-row--selected')?.textContent).toContain('Tagesdienstplan L 91 Neu');
    expect(compiled.querySelector('.duty-row--selected')?.textContent).toContain('06:00 – 14:30');
    expect(compiled.querySelector('.duty-row--selected')?.textContent).toContain('8h 30m');
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Demo Ort 04 ZOB');
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Demo Ort 02');
  });

  it('should filter duty plans by route search', async () => {
    window.history.replaceState(null, '', '#schedules');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('.duty-search input') as HTMLInputElement;

    searchInput.value = 'Demo Ort 06';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.duty-row')).toHaveLength(1);
    expect(compiled.querySelector('.duty-row')?.textContent).toContain('Tagesplan L 515');
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
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('Fahrer 10');
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('Nachweise & Prüfungen');
    expect(compiled.querySelector('.driver-table-head')?.textContent).not.toContain('Wochenzeit');
    expect(compiled.querySelector('.driver-hours')).toBeFalsy();
  });

  it('should add a driver from the driver form', async () => {
    window.history.replaceState(null, '', '#drivers');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.drivers-intro > .button--primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    const form = compiled.querySelector('.driver-create-form') as HTMLFormElement;
    expect(form).toBeTruthy();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(compiled.querySelector('.driver-create-error')?.textContent).toContain('Pflichtfelder');

    const app = fixture.componentInstance as any;
    app.newDriver = {
      name: 'Demo Fahrer 20',
      phone: '0000 000 0120',
      email: 'fahrer20@example.com',
      status: 'Verfügbar',
      license: 'D, DE',
      licenseExpiry: '2029-08-10',
      medicalCheck: '2027-05-12',
    };
    app.createDriver();
    fixture.detectChanges();

    expect(compiled.querySelector('.driver-create-modal')).toBeFalsy();
    expect(compiled.querySelectorAll('.driver-row')).toHaveLength(8);
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('Demo Fahrer 20');
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('10.08.2029');
    expect(compiled.querySelector('.driver-metrics article b')?.textContent).toBe('8');
    expect(compiled.querySelector('.toast--driver')?.textContent).toContain('Fahrer hinzugefügt');
  });

  it('should filter drivers by vehicle search', async () => {
    window.history.replaceState(null, '', '#drivers');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('.driver-search input') as HTMLInputElement;

    searchInput.value = 'DEMO-102';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.driver-row')).toHaveLength(1);
    expect(compiled.querySelector('.driver-row')?.textContent).toContain('Fahrer 07');
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
    expect(compiled.querySelector('.absence-detail-card')?.textContent).toContain('Fahrer 04/05');
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
    expect(compiled.querySelector('.absence-list')?.textContent).toContain('Fahrer 04/05');
    expect(compiled.querySelector('.absence-list')?.textContent).toContain('Fahrer 02');
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
    expect(compiled.querySelector('.special-trip-detail-card')?.textContent).toContain('Ausflug Demo Ort 54');
    expect(compiled.querySelector('.special-trip-detail-card')?.textContent).toContain('Demo-Kunde 01');
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
    expect(compiled.querySelector('.special-trip-list')?.textContent).toContain('Schulausflug Demo Ort 06');
    expect(compiled.querySelector('.special-trip-list')?.textContent).toContain('Messe-Transfer Demo Ort 43');
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
    expect(compiled.querySelector('.message-detail-card')?.textContent).toContain('Verspätung auf der Demo-Straße');

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
    expect(compiled.querySelector('.message-thread-list')?.textContent).toContain('Kontakt 01');
    expect(compiled.querySelector('.message-thread-list')?.textContent).toContain('Kontakt 04');
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
    expect(compiled.querySelector('.driver-portal')?.textContent).toContain('Guten Morgen, Fahrer 10');
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
