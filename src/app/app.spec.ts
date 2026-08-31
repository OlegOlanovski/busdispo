import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    window.localStorage.clear();
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
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const expectedMonday = `${String(monday.getDate()).padStart(2, '0')}.${String(monday.getMonth() + 1).padStart(2, '0')}`;
    expect(compiled.querySelector('h1')?.textContent).toContain('Wochenplanung');
    expect(compiled.querySelectorAll('.schedule-row')).toHaveLength(7);
    expect(compiled.querySelectorAll('.line-heading')).toHaveLength(2);
    expect(compiled.querySelector('.trip-grid--header .line-heading')?.textContent).toContain('DEMO 91');
    expect(compiled.querySelector('.planning-week-corner')?.textContent).toContain(`KW ${(fixture.componentInstance as any).weekNumber()}`);
    expect(compiled.querySelector('.matrix-day')?.textContent).toContain(expectedMonday);
    expect(compiled.querySelector('.matrix-day--today')).toBeTruthy();
    expect(compiled.querySelectorAll('.planning-trip-card')).toHaveLength(4);
    expect(compiled.querySelector('.trip-grid .matrix-corner')).toBeFalsy();
    expect(compiled.querySelector('.trip-side-label')).toBeFalsy();
    expect(compiled.querySelector('.trip-grid--body')?.textContent).toContain('Demo Ort 01 → Demo Ort 03');
    expect(compiled.querySelector('.trip-grid--body')?.textContent).toContain('Demo Ort 13 → Demo Ort 04');
    expect(compiled.querySelector('.schedule-drag-hint')).toBeFalsy();
    expect(compiled.querySelector('.planning-block-heading')).toBeFalsy();
    expect(compiled.querySelectorAll('.schedule-grid--header')).toHaveLength(0);
    expect(compiled.querySelector('.vehicle-heading')).toBeFalsy();
    expect(compiled.querySelector('.shift')?.textContent?.trim()).toBe('Fahrer 10');
    expect(compiled.querySelector('.shift')?.textContent).not.toContain('06:05');
    expect(compiled.querySelector('.shift')?.textContent).not.toContain('DEMO-91');
    expect(compiled.querySelector('.right-column')).toBeFalsy();
    expect(compiled.querySelector('.details-panel')).toBeFalsy();

    const rh91Heading = compiled.querySelector('.trip-grid--header [data-vehicle="DEMO-91"]') as HTMLElement;
    const rh91Cell = compiled.querySelector('.schedule-row [data-vehicle="DEMO-91"]') as HTMLElement;
    expect(rh91Heading).toBeTruthy();
    expect(rh91Cell.textContent).toContain('Fahrer 10');
  });

  it('should add and persist a line from weekly planning', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.planning-line-add-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const form = compiled.querySelector('.planning-line-modal form') as HTMLFormElement;
    expect(form).toBeTruthy();
    const busInput = form.querySelector('input[name="planningLineDisplayLabel"]') as HTMLInputElement;
    expect(busInput.getAttribute('list')).toBeNull();
    (form.querySelector('.planning-vehicle-picker-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(form.querySelector('.planning-vehicle-menu')).toBeTruthy();
    expect(form.querySelectorAll('.planning-vehicle-option')).toHaveLength(2);
    expect(form.querySelector('.planning-vehicle-option')?.textContent).toContain('DEMO-91');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(compiled.querySelector('.planning-line-modal .driver-create-error')?.textContent).toContain('Pflichtfelder');

    const app = fixture.componentInstance as any;
    app.planningLineDraft = {
      displayLabel: 'Bus 200',
      lineLabel: 'L 200',
      start: '08:00',
      end: '16:00',
    };
    app.createPlanningLine();
    fixture.detectChanges();

    expect(compiled.querySelector('.planning-line-modal')).toBeFalsy();
    expect(compiled.querySelectorAll('.line-heading')).toHaveLength(3);
    expect(compiled.querySelector('.line-heading[data-vehicle="BUS-200"]')?.textContent).toContain('Bus 200');
    expect(compiled.querySelectorAll('.schedule-row')[0].querySelectorAll('.schedule-cell')).toHaveLength(3);
    expect(compiled.querySelector('.toast--planning')?.textContent).toContain('Linie hinzugefügt');
    expect(window.localStorage.getItem('busdispo.state.v1')).toContain('BUS-200');
  });

  it('should delete a planning column with its trips and assignments after confirmation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('.line-heading[data-vehicle="DEMO-91"]') as HTMLElement;

    (heading.querySelector('.planning-vehicle-delete') as HTMLButtonElement).click();
    fixture.detectChanges();

    const modal = compiled.querySelector('.planning-line-delete-modal') as HTMLElement;
    expect(modal.textContent).toContain('DEMO 91 · L 91');
    expect(modal.textContent).toContain('2 Fahrten');
    expect(modal.textContent).toContain('5 Einsätze');

    (modal.querySelector('.planning-line-delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.planning-line-delete-modal')).toBeFalsy();
    expect(compiled.querySelectorAll('.line-heading')).toHaveLength(1);
    expect(compiled.querySelector('[data-vehicle="DEMO-91"]')).toBeFalsy();
    expect(compiled.querySelectorAll('.planning-trip-card')).toHaveLength(2);
    expect(compiled.querySelectorAll('.schedule-row')[0].querySelectorAll('.schedule-cell')).toHaveLength(1);
    expect(compiled.querySelector('.toast--planning')?.textContent).toContain('Spalte gelöscht');

    const stored = JSON.parse(window.localStorage.getItem('busdispo.state.v1') ?? '{}');
    expect(stored.vehicles.some((vehicle: { id: string }) => vehicle.id === 'DEMO-91')).toBe(false);
    expect(stored.planningTrips.some((trip: { vehicle: string }) => trip.vehicle === 'DEMO-91')).toBe(false);
    expect(stored.shifts.some((shift: { vehicle: string }) => shift.vehicle === 'DEMO-91')).toBe(false);

    (compiled.querySelector('.planning-vehicle-delete') as HTMLButtonElement).click();
    fixture.detectChanges();
    (compiled.querySelector('.planning-line-delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.line-heading')).toHaveLength(0);
    expect(compiled.querySelector('.planning-empty-lines')?.textContent).toContain('Noch keine Linien eingeplant');
    expect((compiled.querySelector('.assignment-add-button') as HTMLButtonElement).disabled).toBe(true);

    const emptyStateButton = compiled.querySelector('.planning-empty-lines .button--primary') as HTMLButtonElement;
    emptyStateButton.click();
    fixture.detectChanges();
    const app = fixture.componentInstance as any;
    app.planningLineDraft = { displayLabel: 'BUS-300', lineLabel: 'Gerolstein – Daun', start: '08:00', end: '16:00' };
    app.createPlanningLine();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.line-heading')).toHaveLength(1);
    expect(compiled.querySelector('.line-heading')?.textContent).toContain('BUS-300');
    expect(compiled.querySelector('.planning-empty-lines')).toBeFalsy();
  });

  it('should add a driver from weekly planning and make them assignable', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.planning-driver-add-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(compiled.querySelector('.planning-driver-modal')).toBeTruthy();

    const app = fixture.componentInstance as any;
    app.newDriver = {
      name: 'Fahrer 20',
      phone: '0000 000 0120',
      email: 'fahrer20@example.com',
      status: 'Verfügbar',
      license: 'D, DE',
      licenseExpiry: '2029-08-10',
      medicalCheck: '2027-05-12',
    };
    app.createDriver();
    fixture.detectChanges();

    expect(compiled.querySelector('.planning-driver-modal')).toBeFalsy();
    (compiled.querySelector('.assignment-add-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(compiled.querySelector('.assignment-form')?.textContent).toContain('Fahrer 20');
    expect(window.localStorage.getItem('busdispo.state.v1')).toContain('fahrer20@example.com');
  });

  it('should add and persist a trip by clicking its line column', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const column = compiled.querySelector('.trip-column[data-vehicle="DEMO-91"]') as HTMLElement;

    (column.querySelector('.planning-trip-add-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const form = compiled.querySelector('.planning-trip-form') as HTMLFormElement;
    expect(form).toBeTruthy();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(compiled.querySelector('.planning-trip-modal .driver-create-error')?.textContent).toContain('Pflichtfelder');

    const app = fixture.componentInstance as any;
    app.planningTripDraft = {
      vehicle: 'DEMO-91',
      label: 'Linienfahrt',
      start: '09:15',
      end: '10:05',
      route: 'Demo Ort 01 → Demo Ort 02',
    };
    app.createPlanningTrip();
    fixture.detectChanges();

    expect(compiled.querySelector('.planning-trip-modal')).toBeFalsy();
    expect(column.querySelectorAll('.planning-trip-card')).toHaveLength(3);
    expect(column.textContent).toContain('Linienfahrt');
    expect(column.textContent).toContain('09:15 – 10:05');
    expect(compiled.querySelectorAll('.planning-trip-card')).toHaveLength(5);
    expect(compiled.querySelector('.toast--planning')?.textContent).toContain('Fahrt hinzugefügt');
    expect(window.localStorage.getItem('busdispo.state.v1')).toContain('09:15 – 10:05');
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

    expect(compiled.querySelector('.details-panel')?.textContent).toContain('DEMO-91');
    expect(compiled.querySelector('.details-panel')?.textContent).toContain('Linie L 91');
    expect(compiled.querySelector('.route-table')).toBeFalsy();
  });

  it('should edit a bus number from the planning header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('.trip-grid--header [data-vehicle="DEMO-91"]') as HTMLElement;

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
    expect(compiled.querySelector('.schedule-row [data-vehicle="DEMO-91"]')).toBeTruthy();
  });

  it('should move a trip card to another vehicle column by drag and drop', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const sourceColumn = compiled.querySelector('.trip-column[data-vehicle="DEMO-91"]') as HTMLElement;
    const targetColumn = compiled.querySelector('.trip-column[data-vehicle="DEMO-102"]') as HTMLElement;
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
    expect(targetColumn.textContent).toContain('07:04 – 07:28');
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

  it('should restore saved changes from local storage', async () => {
    const firstFixture = TestBed.createComponent(App);
    await firstFixture.whenStable();
    const firstView = firstFixture.nativeElement as HTMLElement;
    const card = firstView.querySelector('.planning-trip-card') as HTMLElement;

    (card.querySelector('.planning-trip-route-edit') as HTMLButtonElement).click();
    firstFixture.detectChanges();
    const input = card.querySelector('.planning-trip-route-input') as HTMLInputElement;
    input.value = 'Gespeicherte Linie';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    firstFixture.detectChanges();

    expect(window.localStorage.getItem('busdispo.state.v1')).toBeTruthy();
    firstFixture.destroy();

    const restoredFixture = TestBed.createComponent(App);
    await restoredFixture.whenStable();
    restoredFixture.detectChanges();
    expect((restoredFixture.nativeElement as HTMLElement).textContent).toContain('Gespeicherte Linie');
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
    expect(compiled.querySelector('.assignment-form')?.textContent).toContain('Tagesplan L 91');

    (compiled.querySelector('.assignment-form .save-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.shift')).toHaveLength(shiftsBefore + 1);
    expect(compiled.querySelector('.assignment-form')).toBeFalsy();
    expect(compiled.querySelector('.details-panel')?.textContent).toContain('Fahrer 10');
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

    expect(target.querySelector('.shift')?.textContent).toContain('Fahrer 10');
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

    expect(sourceCell.querySelector('.shift')?.textContent).toContain('Fahrer 10');
    expect(targetCell.querySelector('.shift')?.textContent).toContain('Fahrer 07');
    expect(compiled.querySelector('.toast--error')?.textContent).toContain('bereits belegt');
  });

  it('should switch to the next week', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const nextWeekButton = compiled.querySelector(
      'button[aria-label="Nächste Woche"]',
    ) as HTMLButtonElement;
    const currentRange = compiled.querySelector('.week-switcher span')?.textContent;

    nextWeekButton.click();
    fixture.detectChanges();

    const app = fixture.componentInstance as any;
    expect(compiled.querySelector('.week-switcher strong')?.textContent).toContain(`KW ${app.weekNumber()}`);
    expect(compiled.querySelector('.week-switcher span')?.textContent).not.toBe(currentRange);

    (compiled.querySelector('.today-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(compiled.querySelector('.week-switcher span')?.textContent).toBe(currentRange);
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
    expect(compiled.querySelectorAll('.fleet-row')).toHaveLength(2);
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

    searchInput.value = 'DEMO-102';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.fleet-row')).toHaveLength(1);
    expect(compiled.querySelector('.fleet-row')?.textContent).toContain('DEMO-102');
  });

  it('should open the duty plan management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const schedulesButton = compiled.querySelector('.nav button:nth-child(4)') as HTMLButtonElement;

    schedulesButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Dienstpläne');
    expect(compiled.querySelectorAll('.duty-row')).toHaveLength(2);
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Tagesplan L 91');
    expect(compiled.querySelector('.duty-detail-card')?.textContent).toContain('Linienverlauf');
  });

  it('should create and persist a duty plan from the modal', async () => {
    window.history.replaceState(null, '', '#schedules');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.duty-intro > .button--primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    const form = compiled.querySelector('.duty-create-form') as HTMLFormElement;
    expect(form).toBeTruthy();
    expect(compiled.querySelectorAll('.duty-create-form .duty-edit-stop')).toHaveLength(2);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(compiled.querySelector('.duty-create-form .duty-edit-error')?.textContent).toContain('Pflichtfelder');

    const app = fixture.componentInstance as any;
    app.dutyPlanDraft = {
      name: 'Tagesplan L 200',
      route: 'Demo Ort 20 → Demo Ort 21',
      start: '08:00',
      end: '16:30',
      breakTime: '30m',
      weekdays: 'Mo – Fr',
      status: 'Entwurf',
      stops: ['Demo Ort 20', 'Demo Ort 21'],
    };
    app.createDutyPlan();
    fixture.detectChanges();

    expect(compiled.querySelector('.duty-create-modal')).toBeFalsy();
    expect(compiled.querySelectorAll('.duty-row')).toHaveLength(3);
    expect(compiled.querySelector('.duty-row--selected')?.textContent).toContain('Tagesplan L 200');
    expect(compiled.querySelector('.duty-row--selected')?.textContent).toContain('8h 30m');
    expect(compiled.querySelector('.duty-metrics article b')?.textContent).toBe('3');
    expect(window.localStorage.getItem('busdispo.state.v1')).toContain('Tagesplan L 200');
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

    searchInput.value = 'Demo Ort 04';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.duty-row')).toHaveLength(1);
    expect(compiled.querySelector('.duty-row')?.textContent).toContain('Tagesplan L 102');
  });

  it('should open the driver management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const driversButton = compiled.querySelector('.nav button:nth-child(5)') as HTMLButtonElement;

    driversButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Fahrer');
    expect(compiled.querySelectorAll('.driver-row')).toHaveLength(2);
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
    expect(compiled.querySelectorAll('.driver-row')).toHaveLength(3);
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('Demo Fahrer 20');
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('10.08.2029');
    expect(compiled.querySelector('.driver-metrics article b')?.textContent).toBe('3');
    expect(compiled.querySelector('.toast--driver')?.textContent).toContain('Fahrer hinzugefügt');
  });

  it('should edit the selected driver', async () => {
    window.history.replaceState(null, '', '#drivers');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.driver-detail-actions .button--primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('#driver-create-title')?.textContent).toContain('Fahrer bearbeiten');
    const app = fixture.componentInstance as any;
    app.newDriver = {
      ...app.newDriver,
      name: 'Fahrer 10 Neu',
      phone: '0000 000 9999',
      status: 'Verfügbar',
    };
    app.updateDriver();
    fixture.detectChanges();

    expect(compiled.querySelector('.driver-create-modal')).toBeFalsy();
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('Fahrer 10 Neu');
    expect(compiled.querySelector('.driver-detail-card')?.textContent).toContain('0000 000 9999');
    expect(compiled.querySelector('.toast--driver')?.textContent).toContain('Fahrer aktualisiert');
  });

  it('should delete the selected driver after confirmation', async () => {
    window.history.replaceState(null, '', '#drivers');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.driver-delete-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.driver-delete-modal')?.textContent).toContain('Fahrer 10');
    (compiled.querySelector('.driver-delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.driver-delete-modal')).toBeFalsy();
    expect(compiled.querySelectorAll('.driver-row')).toHaveLength(1);
    expect(compiled.querySelector('.driver-detail-card')?.textContent).not.toContain('Fahrer 10');
    expect(compiled.querySelector('.toast--driver')?.textContent).toContain('Fahrer gelöscht');
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
    expect(compiled.querySelectorAll('.absence-row')).toHaveLength(2);
    expect(compiled.querySelector('.absence-detail-card')?.textContent).toContain('Fahrer 07');
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

    expect(compiled.querySelectorAll('.absence-row')).toHaveLength(1);
    expect(compiled.querySelector('.absence-list')?.textContent).toContain('Fahrer 10');
  });

  it('should open the special trip management view', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const tripsButton = compiled.querySelector('.nav button:nth-child(7)') as HTMLButtonElement;

    tripsButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Sonderfahrten');
    expect(compiled.querySelectorAll('.special-trip-row')).toHaveLength(2);
    expect(compiled.querySelector('.special-trip-detail-card')?.textContent).toContain('Vereinsausflug Demo Ort 47');
    expect(compiled.querySelector('.special-trip-detail-card')?.textContent).toContain('Demo-Kunde 03');
  });

  it('should filter special trips by status', async () => {
    window.history.replaceState(null, '', '#trips');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const statusFilter = compiled.querySelector('.special-trip-toolbar select') as HTMLSelectElement;

    statusFilter.value = 'Abgeschlossen';
    statusFilter.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.special-trip-row')).toHaveLength(1);
    expect(compiled.querySelector('.special-trip-list')?.textContent).toContain('Seniorenfahrt Demo Ort 08');
  });

  it('should open messages and mark a thread as read', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const messagesButton = compiled.querySelector('.nav button:nth-child(8)') as HTMLButtonElement;

    messagesButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('h1')?.textContent).toContain('Nachrichten');
    expect(compiled.querySelectorAll('.message-thread-row')).toHaveLength(2);
    expect(compiled.querySelectorAll('.message-thread-row--unread')).toHaveLength(2);
    expect(compiled.querySelector('.message-detail-card')?.textContent).toContain('Verspätung auf der Demo-Straße');

    (compiled.querySelector('.message-thread-row') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.message-thread-row--unread')).toHaveLength(1);
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

    expect(compiled.querySelectorAll('.message-thread-row')).toHaveLength(1);
    expect(compiled.querySelector('.message-thread-list')?.textContent).toContain('Kontakt 03');
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
