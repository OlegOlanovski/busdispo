import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type ShiftTone = 'green' | 'blue' | 'amber' | 'violet' | 'cyan' | 'orange' | 'rose';
type AppView = 'overview' | 'planning' | 'vehicles' | 'schedules' | 'drivers' | 'absence' | 'trips' | 'messages' | 'driver-portal';
type DriverShiftState = 'ready' | 'active' | 'completed';
type DriverReportMode = 'none' | 'delay' | 'issue';

interface Shift {
  id: string;
  vehicle: string;
  day: number;
  driver: string;
  start: string;
  end: string;
  plan: string;
  tone: ShiftTone;
  type?: string;
  status?: string;
  note?: string;
}

interface AssignmentDraft {
  vehicle: string;
  day: number;
  driver: string;
  plan: string;
  start: string;
  end: string;
  note: string;
}

interface PlanningFeedback {
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface PlanningTripCard {
  id: string;
  vehicle: string;
  time: string;
  route: string;
  label: string;
  tone: ShiftTone;
}

interface Vehicle {
  id: string;
  seats: number;
}

interface PlanningVehicle extends Vehicle {
  displayLabel: string;
  lineLabel: string;
  tone: ShiftTone;
  start: string;
  end: string;
}

interface FleetVehicle extends Vehicle {
  model: string;
  year: number;
  mileage: string;
  status: 'Einsatz' | 'Verfügbar' | 'Werkstatt';
  driver: string;
  inspection: string;
  safetyInspection: string;
}

interface DutyPlan {
  id: string;
  name: string;
  route: string;
  start: string;
  end: string;
  duration: string;
  breakTime: string;
  stops: string[];
  weekdays: string;
  assignedVehicles: number;
  status: 'Aktiv' | 'Entwurf' | 'Archiviert';
  tone: 'blue' | 'violet' | 'green' | 'orange' | 'cyan';
}

interface DutyPlanDraft {
  name: string;
  route: string;
  start: string;
  end: string;
  breakTime: string;
  weekdays: string;
  status: DutyPlan['status'];
  stops: string[];
}

interface Driver {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  status: 'Im Einsatz' | 'Verfügbar' | 'Abwesend';
  vehicle: string;
  shift: string;
  weeklyHours: number;
  targetHours: number;
  overtime: string;
  license: string;
  licenseExpiry: string;
  medicalCheck: string;
  color: 'blue' | 'violet' | 'green' | 'orange' | 'cyan' | 'rose';
}

interface DriverDraft {
  name: string;
  phone: string;
  email: string;
  status: Driver['status'];
  license: string;
  licenseExpiry: string;
  medicalCheck: string;
}

interface Absence {
  id: string;
  driver: string;
  initials: string;
  type: 'Krank' | 'Urlaub' | 'Fortbildung' | 'Sonstige';
  start: string;
  end: string;
  duration: string;
  workingDays: number;
  status: 'Aktiv' | 'Geplant' | 'Beendet';
  note: string;
  conflicts: number;
  color: 'blue' | 'violet' | 'green' | 'orange' | 'rose';
}

interface SpecialTrip {
  id: string;
  title: string;
  type: 'Tagesfahrt' | 'Transferfahrt' | 'Vereinsfahrt' | 'Klassenfahrt';
  date: string;
  start: string;
  end: string;
  from: string;
  to: string;
  stops: string[];
  driver: string;
  vehicle: string;
  passengers: number;
  customer: string;
  contact: string;
  phone: string;
  status: 'Geplant' | 'Offen' | 'Abgeschlossen';
  note: string;
  tone: 'blue' | 'violet' | 'green' | 'orange' | 'rose' | 'cyan';
}

interface MessageThread {
  id: string;
  sender: string;
  initials: string;
  role: string;
  subject: string;
  preview: string;
  date: string;
  time: string;
  category: 'Fahrer' | 'Kunde' | 'System';
  body: string[];
  relatedLabel: string;
  relatedView: AppView;
  tone: 'blue' | 'violet' | 'green' | 'orange' | 'rose' | 'cyan';
}

interface PersistedAppState {
  version: 1;
  vehicles: PlanningVehicle[];
  fleetVehicles: FleetVehicle[];
  dutyPlans: DutyPlan[];
  drivers: Driver[];
  absences: Absence[];
  specialTrips: SpecialTrip[];
  messageThreads: MessageThread[];
  shifts: Shift[];
  planningTrips: PlanningTripCard[];
  unreadMessageIds: string[];
  driverPortal: {
    shiftState: DriverShiftState;
    startMileage: string;
    endMileage: string;
    vehicleChecked: boolean;
    documentsChecked: boolean;
    delay: string;
    issue: string;
    note: string;
  };
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly storageKey = 'busdispo.state.v1';
  protected readonly activeView = signal<AppView>(
    window.location.hash === '#overview'
      ? 'overview'
      : window.location.hash === '#vehicles'
        ? 'vehicles'
        : window.location.hash === '#schedules'
          ? 'schedules'
          : window.location.hash === '#drivers'
            ? 'drivers'
            : window.location.hash === '#absence'
              ? 'absence'
              : window.location.hash === '#trips'
                ? 'trips'
                : window.location.hash === '#messages'
                  ? 'messages'
                  : window.location.hash === '#driver-portal'
                    ? 'driver-portal'
                    : 'planning',
  );
  protected readonly menuOpen = signal(false);
  protected readonly weekOffset = signal(0);
  protected readonly published = signal(false);
  protected readonly saved = signal(false);
  protected readonly addingAssignment = signal(false);
  protected readonly assignmentPanelOpen = signal(false);
  protected readonly assignmentError = signal('');
  protected readonly draggingTripId = signal<string | null>(null);
  protected readonly tripDragTargetVehicle = signal<string | null>(null);
  protected readonly draggingShiftId = signal<string | null>(null);
  protected readonly dragTargetKey = signal<string | null>(null);
  protected readonly dragTargetValid = signal(false);
  protected readonly planningFeedback = signal<PlanningFeedback | null>(null);
  protected readonly editingPlanningVehicleId = signal<string | null>(null);
  protected readonly planningVehicleDraft = signal('');
  protected readonly editingPlanningTripId = signal<string | null>(null);
  protected readonly planningTripRouteDraft = signal('');
  protected readonly selectedShiftId = signal('xls-3-demo-91');
  protected readonly selectedVehicleId = signal('DEMO-91');
  protected readonly vehicleSearch = signal('');
  protected readonly vehicleStatus = signal('Alle Status');
  protected readonly vehicleSaved = signal(false);
  protected readonly selectedDutyPlanId = signal('demo-plan-91');
  protected readonly dutyPlanSearch = signal('');
  protected readonly dutyPlanStatus = signal('Alle Status');
  protected readonly dutyPlanSaved = signal(false);
  protected readonly dutyPlanEditing = signal(false);
  protected readonly dutyPlanCreateOpen = signal(false);
  protected readonly dutyPlanEditError = signal('');
  private readonly dutyPlanRevision = signal(0);
  protected dutyPlanDraft: DutyPlanDraft = {
    name: '', route: '', start: '', end: '', breakTime: '', weekdays: 'Mo – Fr', status: 'Entwurf', stops: [],
  };
  protected readonly selectedDriverId = signal('fahrer-10');
  protected readonly driverSearch = signal('');
  protected readonly driverStatus = signal('Alle Status');
  protected readonly driverSaved = signal(false);
  protected readonly driverFormOpen = signal(false);
  protected readonly driverEditing = signal(false);
  protected readonly driverDeleteConfirmOpen = signal(false);
  protected readonly driverFormError = signal('');
  protected readonly driverCreated = signal<string | null>(null);
  protected readonly driverUpdated = signal<string | null>(null);
  protected readonly driverDeleted = signal<string | null>(null);
  private readonly driverRevision = signal(0);
  protected newDriver: DriverDraft = this.emptyDriverDraft();
  protected readonly selectedAbsenceId = signal('fahrer-07-training');
  protected readonly absenceSearch = signal('');
  protected readonly absenceType = signal('Alle Arten');
  protected readonly absenceSaved = signal(false);
  protected readonly selectedSpecialTripId = signal('demo-trip-03');
  protected readonly specialTripSearch = signal('');
  protected readonly specialTripStatus = signal('Alle Status');
  protected readonly specialTripSaved = signal(false);
  protected readonly selectedMessageId = signal('fahrer-10-delay');
  protected readonly messageSearch = signal('');
  protected readonly messageFilter = signal('Alle Nachrichten');
  protected readonly unreadMessageIds = signal(['fahrer-10-delay', 'demo-trip-passengers']);
  protected readonly messageReply = signal('');
  protected readonly messageSent = signal(false);
  protected readonly driverShiftState = signal<DriverShiftState>('ready');
  protected readonly driverReportMode = signal<DriverReportMode>('none');
  protected readonly driverStartMileage = signal('221450');
  protected readonly driverEndMileage = signal('');
  protected readonly driverVehicleChecked = signal(false);
  protected readonly driverDocumentsChecked = signal(false);
  protected readonly driverDelay = signal('Keine Verspätung');
  protected readonly driverIssue = signal('Keine Mängel');
  protected readonly driverShiftNote = signal('');

  protected newAssignment: AssignmentDraft = {
    vehicle: 'DEMO-91',
    day: 0,
    driver: '',
    plan: 'Tagesplan L 91',
    start: '06:05',
    end: '14:24',
    note: '',
  };

  protected readonly days = [
    { short: 'Mo', date: '15.06' },
    { short: 'Di', date: '16.06' },
    { short: 'Mi', date: '17.06' },
    { short: 'Do', date: '18.06' },
    { short: 'Fr', date: '19.06' },
    { short: 'Sa', date: '20.06' },
    { short: 'So', date: '21.06' },
  ];

  protected readonly vehicles: PlanningVehicle[] = [
    { id: 'DEMO-91', displayLabel: 'DEMO 91', lineLabel: 'L 91', seats: 0, tone: 'violet', start: '07:04', end: '16:56' },
    { id: 'DEMO-102', displayLabel: 'DEMO 102', lineLabel: 'L 102', seats: 0, tone: 'green', start: '06:05', end: '14:20' },
  ];
  protected get planningGridWidth(): number {
    return 96 + this.vehicles.length * 135;
  }

  protected readonly fleetVehicles: FleetVehicle[] = [
    { id: 'DEMO-91', seats: 52, model: 'Mercedes-Benz Intouro', year: 2020, mileage: '221.450 km', status: 'Einsatz', driver: 'Fahrer 10', inspection: '18.08.2026', safetyInspection: '18.11.2026' },
    { id: 'DEMO-102', seats: 52, model: 'Mercedes-Benz Intouro', year: 2021, mileage: '184.320 km', status: 'Einsatz', driver: 'Fahrer 07', inspection: '14.11.2026', safetyInspection: '14.08.2026' },
  ];

  protected readonly dutyPlans: DutyPlan[] = [
    { id: 'demo-plan-91', name: 'Tagesplan L 91', route: 'Demo Ort 01 → Demo Ort 02', start: '06:05', end: '14:24', duration: '8h 19m', breakTime: '30m', stops: ['Demo Ort 01', 'Demo Halt A', 'Demo Ort 13', 'Demo Ort 03', 'Demo Ort 47', 'Demo Ort 02'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'violet' },
    { id: 'demo-plan-102', name: 'Tagesplan L 102', route: 'Demo Ort 03 → Demo Ort 04', start: '06:05', end: '14:20', duration: '8h 15m', breakTime: '30m', stops: ['Demo Ort 03', 'Demo Ort 12', 'Demo Ort 13', 'Demo Ort 04 ZOB'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'green' },
  ];

  protected readonly drivers: Driver[] = [
    { id: 'fahrer-10', name: 'Fahrer 10', initials: '10', phone: '0000 000 0110', email: 'fahrer10@example.com', status: 'Im Einsatz', vehicle: 'DEMO-91', shift: '06:05 – 14:24', weeklyHours: 33.3, targetHours: 40, overtime: '+3h 05m', license: 'D, DE', licenseExpiry: '16.12.2027', medicalCheck: '18.09.2026', color: 'violet' },
    { id: 'fahrer-07', name: 'Fahrer 07', initials: '07', phone: '0000 000 0107', email: 'fahrer07@example.com', status: 'Im Einsatz', vehicle: 'DEMO-102', shift: '06:05 – 14:20', weeklyHours: 32, targetHours: 40, overtime: '+2h 15m', license: 'D, DE', licenseExpiry: '18.03.2028', medicalCheck: '12.01.2027', color: 'green' },
  ];

  protected readonly absences: Absence[] = [
    { id: 'fahrer-07-training', driver: 'Fahrer 07', initials: '07', type: 'Fortbildung', start: '03.08.2026', end: '04.08.2026', duration: '2 Tage', workingDays: 2, status: 'Geplant', note: 'Schulung Fahrgastsicherheit.', conflicts: 2, color: 'green' },
    { id: 'fahrer-10-vacation', driver: 'Fahrer 10', initials: '10', type: 'Urlaub', start: '10.08.2026', end: '14.08.2026', duration: '5 Tage', workingDays: 5, status: 'Geplant', note: 'Genehmigter Erholungsurlaub.', conflicts: 0, color: 'violet' },
  ];

  protected readonly specialTrips: SpecialTrip[] = [
    { id: 'demo-trip-03', title: 'Vereinsausflug Demo Ort 47', type: 'Vereinsfahrt', date: '01.08.2026', start: '08:30', end: '20:45', from: 'Demo Ort 04 ZOB', to: 'Demo Ort 47 Porta Nigra', stops: ['Demo Ort 04 ZOB', 'Demo Ort 03 Bahnhof', 'Demo Ort 47 Porta Nigra'], driver: 'Fahrer 10', vehicle: 'DEMO-91', passengers: 49, customer: 'Demo-Kunde 03', contact: 'Kontakt 03', phone: '0000 000 0203', status: 'Geplant', note: 'Ein Zustieg in Demo Ort 03. Rückfahrt um 19:00 Uhr.', tone: 'violet' },
    { id: 'demo-trip-06', title: 'Seniorenfahrt Demo Ort 08', type: 'Tagesfahrt', date: '18.07.2026', start: '09:00', end: '17:10', from: 'Demo Ort 10 Rathaus', to: 'Demo Ort 08 Marktplatz', stops: ['Demo Ort 10 Rathaus', 'Demo Ort 56 Kirche', 'Demo Ort 08 Marktplatz'], driver: 'Fahrer 07', vehicle: 'DEMO-102', passengers: 41, customer: 'Demo-Kunde 06', contact: 'Kontakt 06', phone: '0000 000 0206', status: 'Abgeschlossen', note: 'Fahrt planmäßig und ohne Vorkommnisse abgeschlossen.', tone: 'green' },
  ];

  protected readonly messageThreads: MessageThread[] = [
    { id: 'fahrer-10-delay', sender: 'Fahrer 10', initials: '10', role: 'Fahrer · DEMO-91', subject: 'Verspätung auf der Demo-Straße', preview: 'Wegen einer Baustelle komme ich voraussichtlich 15 Minuten später in Demo Ort 02 an.', date: 'Heute', time: '11:42', category: 'Fahrer', body: ['Hallo Demo Admin,', 'wegen einer kurzfristigen Baustelle auf der Demo-Straße verzögert sich die Fahrt. Ich rechne aktuell mit etwa 15 Minuten Verspätung bei der Ankunft in Demo Ort 02.', 'Die Fahrgäste sind informiert. Ich melde mich, falls sich die Situation verändert.'], relatedLabel: 'Einsatz in Wochenplanung öffnen', relatedView: 'planning', tone: 'violet' },
    { id: 'demo-trip-passengers', sender: 'Kontakt 03', initials: 'C3', role: 'Kundin · Demo-Kunde 03', subject: 'Teilnehmerzahl für Demo Ort 47', preview: 'Die endgültige Teilnehmerzahl für Samstag beträgt 49 Personen inklusive Betreuung.', date: 'Heute', time: '10:18', category: 'Kunde', body: ['Guten Morgen,', 'für unsere Fahrt nach Demo Ort 47 am Samstag sind es endgültig 49 Personen inklusive Betreuung.', 'Bitte bestätigen Sie kurz, dass der eingeplante Bus ausreichend Sitzplätze hat. Vielen Dank!'], relatedLabel: 'Sonderfahrt anzeigen', relatedView: 'trips', tone: 'green' },
  ];

  private readonly weeklyDriverAssignments: string[][] = [
    ['Fahrer 10', 'Fahrer 07'],
    ['Fahrer 10', 'Fahrer 07'],
    ['Fahrer 10', 'Fahrer 07'],
    ['Fahrer 10', 'Fahrer 07'],
    ['Fahrer 10', 'Fahrer 07'],
    ['', ''],
    ['', ''],
  ];

  protected readonly shifts: Shift[] = this.weeklyDriverAssignments.flatMap((assignments, day) =>
    assignments.flatMap((driver, vehicleIndex) => {
      if (!driver) return [];
      const vehicle = this.vehicles[vehicleIndex];
      const slug = vehicle.id.toLocaleLowerCase('de').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return [{
        id: `xls-${day}-${slug}`,
        vehicle: vehicle.id,
        day,
        driver,
        start: vehicle.start,
        end: vehicle.end,
        plan: `Linie ${vehicle.lineLabel}`,
        tone: vehicle.tone,
        status: 'Geplant',
      } satisfies Shift];
    }),
  );

  protected get overviewShifts(): Shift[] {
    return this.shifts.slice(0, 6);
  }

  protected readonly planningTrips: PlanningTripCard[] = [
    { id: 'rh91-1', vehicle: 'DEMO-91', time: '07:04 – 07:28', route: 'Demo Ort 01 → Demo Ort 03', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-2', vehicle: 'DEMO-91', time: '15:16 – 16:00', route: 'Demo Ort 03 → Demo Ort 02', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh102-1', vehicle: 'DEMO-102', time: '07:07 – 07:35', route: 'Demo Ort 03 → Demo Ort 13', label: 'Linienfahrt', tone: 'green' },
    { id: 'rh102-2', vehicle: 'DEMO-102', time: '13:15 – 13:48', route: 'Demo Ort 13 → Demo Ort 04', label: 'Linienfahrt', tone: 'green' },
  ];

  constructor() {
    this.restoreState();
  }
  protected readonly driverPortalStops = [
    { time: '06:05', place: 'Demo Ort 01', meta: 'Abfahrt · Start' },
    { time: '06:50', place: 'Demo Halt A', meta: 'Planmäßiger Halt' },
    { time: '08:05', place: 'Demo Ort 13', meta: 'Planmäßiger Halt' },
    { time: '11:00', place: 'Demo Ort 03', meta: 'Pause · 30 Min.' },
    { time: '12:12', place: 'Demo Ort 47', meta: 'Fahrzeugwechsel' },
    { time: '14:24', place: 'Demo Ort 02', meta: 'Ankunft · Ende' },
  ];

  protected readonly selectedShift = computed(
    () => this.shifts.find((shift) => shift.id === this.selectedShiftId()) ?? this.shifts[0],
  );

  protected readonly pageTitle = computed(() =>
    this.activeView() === 'overview'
      ? 'Übersicht'
      : this.activeView() === 'vehicles'
        ? 'Fahrzeuge'
        : this.activeView() === 'schedules'
          ? 'Dienstpläne'
          : this.activeView() === 'drivers'
            ? 'Fahrer'
          : this.activeView() === 'absence'
            ? 'Abwesenheiten'
            : this.activeView() === 'trips'
              ? 'Sonderfahrten'
              : this.activeView() === 'messages'
                ? 'Nachrichten'
                : this.activeView() === 'driver-portal'
                  ? 'Fahrerportal'
                  : 'Wochenplanung',
  );

  protected readonly filteredVehicles = computed(() => {
    const query = this.vehicleSearch().trim().toLocaleLowerCase('de');
    const status = this.vehicleStatus();
    return this.fleetVehicles.filter(
      (vehicle) =>
        (status === 'Alle Status' || vehicle.status === status) &&
        (!query || `${vehicle.id} ${vehicle.model} ${vehicle.driver}`.toLocaleLowerCase('de').includes(query)),
    );
  });

  protected readonly selectedVehicle = computed(
    () => this.fleetVehicles.find((vehicle) => vehicle.id === this.selectedVehicleId()) ?? this.fleetVehicles[0],
  );

  protected readonly filteredDutyPlans = computed(() => {
    this.dutyPlanRevision();
    const query = this.dutyPlanSearch().trim().toLocaleLowerCase('de');
    const status = this.dutyPlanStatus();
    return this.dutyPlans.filter(
      (plan) =>
        (status === 'Alle Status' || plan.status === status) &&
        (!query || `${plan.name} ${plan.route}`.toLocaleLowerCase('de').includes(query)),
    );
  });

  protected readonly selectedDutyPlan = computed(
    () => this.dutyPlans.find((plan) => plan.id === this.selectedDutyPlanId()) ?? this.dutyPlans[0],
  );

  protected readonly dutyPlanCounts = computed(() => {
    this.dutyPlanRevision();
    return {
      total: this.dutyPlans.length,
      active: this.dutyPlans.filter((plan) => plan.status === 'Aktiv').length,
      draft: this.dutyPlans.filter((plan) => plan.status === 'Entwurf').length,
      archived: this.dutyPlans.filter((plan) => plan.status === 'Archiviert').length,
    };
  });

  protected readonly filteredDrivers = computed(() => {
    this.driverRevision();
    const query = this.driverSearch().trim().toLocaleLowerCase('de');
    const status = this.driverStatus();
    return this.drivers.filter(
      (driver) =>
        (status === 'Alle Status' || driver.status === status) &&
        (!query || `${driver.name} ${driver.vehicle} ${driver.email}`.toLocaleLowerCase('de').includes(query)),
    );
  });

  protected readonly selectedDriver = computed(
    () => this.drivers.find((driver) => driver.id === this.selectedDriverId()) ?? this.drivers[0],
  );

  protected readonly driverCounts = computed(() => {
    this.driverRevision();
    return {
      total: this.drivers.length,
      active: this.drivers.filter((driver) => driver.status === 'Im Einsatz').length,
      available: this.drivers.filter((driver) => driver.status === 'Verfügbar').length,
      absent: this.drivers.filter((driver) => driver.status === 'Abwesend').length,
    };
  });

  protected readonly filteredAbsences = computed(() => {
    const query = this.absenceSearch().trim().toLocaleLowerCase('de');
    const type = this.absenceType();
    return this.absences.filter(
      (absence) =>
        (type === 'Alle Arten' || absence.type === type) &&
        (!query || `${absence.driver} ${absence.type} ${absence.note}`.toLocaleLowerCase('de').includes(query)),
    );
  });

  protected readonly selectedAbsence = computed(
    () => this.absences.find((absence) => absence.id === this.selectedAbsenceId()) ?? this.absences[1],
  );

  protected readonly filteredSpecialTrips = computed(() => {
    const query = this.specialTripSearch().trim().toLocaleLowerCase('de');
    const status = this.specialTripStatus();
    return this.specialTrips.filter(
      (trip) =>
        (status === 'Alle Status' || trip.status === status) &&
        (!query || `${trip.title} ${trip.type} ${trip.from} ${trip.to} ${trip.customer} ${trip.driver} ${trip.vehicle}`.toLocaleLowerCase('de').includes(query)),
    );
  });

  protected readonly selectedSpecialTrip = computed(
    () => this.specialTrips.find((trip) => trip.id === this.selectedSpecialTripId()) ?? this.specialTrips[0],
  );

  protected readonly unreadMessageCount = computed(() => this.unreadMessageIds().length);

  protected readonly filteredMessageThreads = computed(() => {
    const query = this.messageSearch().trim().toLocaleLowerCase('de');
    const filter = this.messageFilter();
    const unreadIds = this.unreadMessageIds();
    return this.messageThreads.filter(
      (thread) =>
        (filter === 'Alle Nachrichten' ||
          (filter === 'Ungelesen' && unreadIds.includes(thread.id)) ||
          thread.category === filter) &&
        (!query || `${thread.sender} ${thread.subject} ${thread.preview} ${thread.role}`.toLocaleLowerCase('de').includes(query)),
    );
  });

  protected readonly selectedMessage = computed(
    () => this.messageThreads.find((thread) => thread.id === this.selectedMessageId()) ?? this.messageThreads[0],
  );

  protected readonly canStartDriverShift = computed(
    () => Number(this.driverStartMileage()) > 0 && this.driverVehicleChecked() && this.driverDocumentsChecked(),
  );
  protected readonly drivenDistance = computed(() =>
    Math.max(0, Number(this.driverEndMileage()) - Number(this.driverStartMileage())),
  );
  protected readonly canCompleteDriverShift = computed(
    () => Number(this.driverEndMileage()) > Number(this.driverStartMileage()),
  );

  protected readonly weekNumber = computed(() => 25 + this.weekOffset());
  protected readonly dateRange = computed(() => {
    if (this.weekOffset() === 0) return '15.06.2026 – 21.06.2026';
    const monday = new Date(2026, 5, 15 + this.weekOffset() * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const format = (date: Date) =>
      new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    return `${format(monday)} – ${format(sunday)}`;
  });

  private restoreState(): void {
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) return;

      const state = JSON.parse(stored) as Partial<PersistedAppState>;
      if (state.version !== 1) return;

      this.restoreArray(this.vehicles, state.vehicles);
      this.restoreArray(this.fleetVehicles, state.fleetVehicles);
      this.restoreArray(this.dutyPlans, state.dutyPlans);
      this.restoreArray(this.drivers, state.drivers);
      this.restoreArray(this.absences, state.absences);
      this.restoreArray(this.specialTrips, state.specialTrips);
      this.restoreArray(this.messageThreads, state.messageThreads);
      this.restoreArray(this.shifts, state.shifts);
      this.restoreArray(this.planningTrips, state.planningTrips);

      if (Array.isArray(state.unreadMessageIds)) {
        this.unreadMessageIds.set(state.unreadMessageIds.filter((id): id is string => typeof id === 'string'));
      }
      if (state.driverPortal) {
        const portal = state.driverPortal;
        if (portal.shiftState === 'ready' || portal.shiftState === 'active' || portal.shiftState === 'completed') {
          this.driverShiftState.set(portal.shiftState);
        }
        if (typeof portal.startMileage === 'string') this.driverStartMileage.set(portal.startMileage);
        if (typeof portal.endMileage === 'string') this.driverEndMileage.set(portal.endMileage);
        if (typeof portal.vehicleChecked === 'boolean') this.driverVehicleChecked.set(portal.vehicleChecked);
        if (typeof portal.documentsChecked === 'boolean') this.driverDocumentsChecked.set(portal.documentsChecked);
        if (typeof portal.delay === 'string') this.driverDelay.set(portal.delay);
        if (typeof portal.issue === 'string') this.driverIssue.set(portal.issue);
        if (typeof portal.note === 'string') this.driverShiftNote.set(portal.note);
      }

      if (!this.shifts.some((shift) => shift.id === this.selectedShiftId())) {
        this.selectedShiftId.set(this.shifts[0]?.id ?? '');
      }
      if (!this.fleetVehicles.some((vehicle) => vehicle.id === this.selectedVehicleId())) {
        this.selectedVehicleId.set(this.fleetVehicles[0]?.id ?? '');
      }
      if (!this.dutyPlans.some((plan) => plan.id === this.selectedDutyPlanId())) {
        this.selectedDutyPlanId.set(this.dutyPlans[0]?.id ?? '');
      }
      if (!this.drivers.some((driver) => driver.id === this.selectedDriverId())) {
        this.selectedDriverId.set(this.drivers[0]?.id ?? '');
      }

      this.dutyPlanRevision.update((revision) => revision + 1);
      this.driverRevision.update((revision) => revision + 1);
    } catch {
      try {
        window.localStorage.removeItem(this.storageKey);
      } catch {
        // Ignore browsers that block access to local storage entirely.
      }
    }
  }

  private restoreArray<T>(target: T[], stored: T[] | undefined): void {
    if (!Array.isArray(stored)) return;
    target.splice(0, target.length, ...stored);
  }

  private persistState(): void {
    const state: PersistedAppState = {
      version: 1,
      vehicles: this.vehicles,
      fleetVehicles: this.fleetVehicles,
      dutyPlans: this.dutyPlans,
      drivers: this.drivers,
      absences: this.absences,
      specialTrips: this.specialTrips,
      messageThreads: this.messageThreads,
      shifts: this.shifts,
      planningTrips: this.planningTrips,
      unreadMessageIds: this.unreadMessageIds(),
      driverPortal: {
        shiftState: this.driverShiftState(),
        startMileage: this.driverStartMileage(),
        endMileage: this.driverEndMileage(),
        vehicleChecked: this.driverVehicleChecked(),
        documentsChecked: this.driverDocumentsChecked(),
        delay: this.driverDelay(),
        issue: this.driverIssue(),
        note: this.driverShiftNote(),
      },
    };

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // The app remains usable if browser storage is unavailable or full.
    }
  }

  protected persistDriverPortalState(): void {
    this.persistState();
  }

  protected getShift(vehicle: string, day: number): Shift | undefined {
    return this.shifts.find((shift) => shift.vehicle === vehicle && shift.day === day);
  }

  protected planningLine(vehicle: string): string {
    return this.vehicles.find((item) => item.id === vehicle)?.lineLabel ?? vehicle;
  }

  protected planningVehicleLabel(vehicle: string): string {
    return this.vehicles.find((item) => item.id === vehicle)?.displayLabel ?? vehicle;
  }

  protected editPlanningVehicleLabel(vehicle: PlanningVehicle): void {
    this.editingPlanningVehicleId.set(vehicle.id);
    this.planningVehicleDraft.set(vehicle.displayLabel);
    window.setTimeout(() => {
      const input = Array.from(document.querySelectorAll<HTMLInputElement>('.planning-vehicle-input'))
        .find((item) => item.dataset['vehicleEdit'] === vehicle.id);
      input?.focus();
      input?.select();
    }, 0);
  }

  protected savePlanningVehicleLabel(vehicle: PlanningVehicle): void {
    if (this.editingPlanningVehicleId() !== vehicle.id) return;

    const nextLabel = this.planningVehicleDraft().trim();
    if (!nextLabel) {
      this.showPlanningFeedback({
        type: 'error',
        title: 'Busnummer fehlt',
        message: 'Bitte geben Sie eine Busnummer ein.',
      });
      return;
    }

    const previousLabel = vehicle.displayLabel;
    vehicle.displayLabel = nextLabel;
    this.editingPlanningVehicleId.set(null);
    this.saved.set(false);

    if (previousLabel !== nextLabel) {
      this.persistState();
      this.showPlanningFeedback({
        type: 'success',
        title: 'Busnummer geändert',
        message: `${previousLabel} → ${nextLabel}`,
      });
    }
  }

  protected cancelPlanningVehicleEdit(): void {
    this.editingPlanningVehicleId.set(null);
    this.planningVehicleDraft.set('');
  }

  protected planningLineTone(vehicle: string): ShiftTone {
    return this.vehicles.find((item) => item.id === vehicle)?.tone ?? 'blue';
  }

  protected planningTripsFor(vehicle: string): PlanningTripCard[] {
    return this.planningTrips.filter((trip) => trip.vehicle === vehicle);
  }

  protected editPlanningTripRoute(event: Event, trip: PlanningTripCard): void {
    event.stopPropagation();
    this.editingPlanningTripId.set(trip.id);
    this.planningTripRouteDraft.set(trip.route);
    window.setTimeout(() => {
      const input = Array.from(document.querySelectorAll<HTMLInputElement>('.planning-trip-route-input'))
        .find((item) => item.dataset['tripEdit'] === trip.id);
      input?.focus();
      input?.select();
    }, 0);
  }

  protected savePlanningTripRoute(event: Event, trip: PlanningTripCard): void {
    event.stopPropagation();
    if (this.editingPlanningTripId() !== trip.id) return;

    const nextRoute = this.planningTripRouteDraft().trim();
    if (!nextRoute) {
      this.showPlanningFeedback({
        type: 'error',
        title: 'Linie fehlt',
        message: 'Bitte geben Sie eine Linie ein.',
      });
      return;
    }

    const previousRoute = trip.route;
    trip.route = nextRoute;
    this.editingPlanningTripId.set(null);
    this.saved.set(false);

    if (previousRoute !== nextRoute) {
      this.persistState();
      this.showPlanningFeedback({
        type: 'success',
        title: 'Linie geändert',
        message: `${previousRoute} → ${nextRoute}`,
      });
    }
  }

  protected cancelPlanningTripEdit(event: Event): void {
    event.stopPropagation();
    this.editingPlanningTripId.set(null);
    this.planningTripRouteDraft.set('');
  }

  protected selectPlanningLine(vehicle: string): void {
    const shift = this.shifts.find((item) => item.vehicle === vehicle);
    if (shift) this.selectShift(shift);
  }

  protected startPlanningTripDrag(event: DragEvent, trip: PlanningTripCard): void {
    this.draggingTripId.set(trip.id);
    this.tripDragTargetVehicle.set(null);
    this.planningFeedback.set(null);
    event.dataTransfer?.setData('text/plain', trip.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected updatePlanningTripDropTarget(event: DragEvent, vehicle: string): void {
    if (!this.draggingTripId()) return;
    event.preventDefault();
    this.tripDragTargetVehicle.set(vehicle);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected leavePlanningTripDropTarget(event: DragEvent, vehicle: string): void {
    const column = event.currentTarget as HTMLElement | null;
    if (column && event.relatedTarget instanceof Node && column.contains(event.relatedTarget)) return;
    if (this.tripDragTargetVehicle() === vehicle) this.tripDragTargetVehicle.set(null);
  }

  protected dropPlanningTrip(event: DragEvent, vehicle: string): void {
    event.preventDefault();
    const tripIndex = this.planningTrips.findIndex((item) => item.id === this.draggingTripId());
    if (tripIndex < 0) {
      this.finishPlanningTripDrag();
      return;
    }

    const trip = this.planningTrips[tripIndex];
    const previousVehicle = trip.vehicle;
    if (previousVehicle === vehicle) {
      this.finishPlanningTripDrag();
      return;
    }

    this.planningTrips.splice(tripIndex, 1);
    trip.vehicle = vehicle;

    let insertionIndex = this.planningTrips.length;
    for (let index = 0; index < this.planningTrips.length; index += 1) {
      if (this.planningTrips[index].vehicle === vehicle) insertionIndex = index + 1;
    }
    this.planningTrips.splice(insertionIndex, 0, trip);

    this.saved.set(false);
    this.persistState();
    this.showPlanningFeedback({
      type: 'success',
      title: 'Fahrt verschoben',
      message: `${trip.time}: ${this.planningVehicleLabel(previousVehicle)} → ${this.planningVehicleLabel(vehicle)}`,
    });
    this.finishPlanningTripDrag();
  }

  protected finishPlanningTripDrag(): void {
    this.draggingTripId.set(null);
    this.tripDragTargetVehicle.set(null);
  }

  protected planningCellKey(vehicle: string, day: number): string {
    return `${vehicle}-${day}`;
  }

  protected startShiftDrag(event: DragEvent, shift: Shift): void {
    this.addingAssignment.set(false);
    this.assignmentError.set('');
    this.draggingShiftId.set(shift.id);
    this.dragTargetKey.set(null);
    this.dragTargetValid.set(false);
    this.planningFeedback.set(null);
    event.dataTransfer?.setData('text/plain', shift.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected updateShiftDropTarget(event: DragEvent, vehicle: string, day: number): void {
    if (!this.draggingShiftId()) return;
    event.preventDefault();
    const valid = this.canDropDraggedShift(vehicle, day);
    this.dragTargetKey.set(this.planningCellKey(vehicle, day));
    this.dragTargetValid.set(valid);
    if (event.dataTransfer) event.dataTransfer.dropEffect = valid ? 'move' : 'none';
  }

  protected leaveShiftDropTarget(event: DragEvent, vehicle: string, day: number): void {
    const cell = event.currentTarget as HTMLElement | null;
    if (cell && event.relatedTarget instanceof Node && cell.contains(event.relatedTarget)) return;
    if (this.dragTargetKey() === this.planningCellKey(vehicle, day)) {
      this.dragTargetKey.set(null);
      this.dragTargetValid.set(false);
    }
  }

  protected dropShift(event: DragEvent, vehicle: string, day: number): void {
    event.preventDefault();
    const shift = this.shifts.find((item) => item.id === this.draggingShiftId());
    if (!shift) {
      this.finishShiftDrag();
      return;
    }

    const previousVehicle = shift.vehicle;
    const previousDay = shift.day;
    if (previousVehicle === vehicle && previousDay === day) {
      this.finishShiftDrag();
      return;
    }

    if (!this.canDropDraggedShift(vehicle, day)) {
      const occupied = this.getShift(vehicle, day);
      this.showPlanningFeedback({
        type: 'error',
        title: 'Verschieben nicht möglich',
        message: occupied
          ? `${vehicle} ist am ${this.days[day].short} bereits belegt.`
          : `${shift.driver} hat am ${this.days[day].short} bereits einen zeitgleichen Einsatz.`,
      });
      this.finishShiftDrag();
      return;
    }

    shift.vehicle = vehicle;
    shift.day = day;
    this.selectedShiftId.set(shift.id);
    this.saved.set(false);
    this.persistState();
    this.showPlanningFeedback({
      type: 'success',
      title: 'Einsatz verschoben',
      message: `${shift.driver}: ${this.days[previousDay].short} · ${previousVehicle} → ${this.days[day].short} · ${vehicle}`,
    });
    this.finishShiftDrag();
  }

  protected finishShiftDrag(): void {
    this.draggingShiftId.set(null);
    this.dragTargetKey.set(null);
    this.dragTargetValid.set(false);
  }

  private canDropDraggedShift(vehicle: string, day: number): boolean {
    const shift = this.shifts.find((item) => item.id === this.draggingShiftId());
    if (!shift) return false;
    if (shift.vehicle === vehicle && shift.day === day) return true;
    if (this.getShift(vehicle, day)) return false;
    return !this.driverHasConflict(shift.driver, day, shift.id, shift.start, shift.end);
  }

  private showPlanningFeedback(feedback: PlanningFeedback): void {
    this.planningFeedback.set(feedback);
    window.setTimeout(() => {
      if (this.planningFeedback() === feedback) this.planningFeedback.set(null);
    }, 3200);
  }

  protected openNewAssignment(vehicle?: string, day?: number): void {
    const target = vehicle && day !== undefined
      ? { vehicle, day }
      : this.findFirstEmptyCell();
    const suggestedPlan = this.dutyPlans.find((plan) => plan.name.includes(target.vehicle.replace('DEMO-', 'L ')))
      ?? this.dutyPlans.find((plan) => plan.status === 'Aktiv')
      ?? this.dutyPlans[0];
    const suggestedDriver = this.drivers.find(
      (driver) => driver.status !== 'Abwesend'
        && !this.driverHasConflict(driver.name, target.day, undefined, suggestedPlan.start, suggestedPlan.end),
    );

    this.newAssignment = {
      vehicle: target.vehicle,
      day: target.day,
      driver: suggestedDriver?.name ?? '',
      plan: suggestedPlan.name,
      start: suggestedPlan.start,
      end: suggestedPlan.end,
      note: '',
    };
    this.addingAssignment.set(true);
    this.assignmentPanelOpen.set(true);
    this.assignmentError.set('');
    this.saved.set(false);

    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.details-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  }

  protected closeAssignmentForm(): void {
    this.addingAssignment.set(false);
    this.assignmentPanelOpen.set(false);
    this.assignmentError.set('');
  }

  protected updateNewAssignment<K extends keyof AssignmentDraft>(field: K, value: AssignmentDraft[K]): void {
    this.newAssignment = { ...this.newAssignment, [field]: value };
    this.assignmentError.set('');
  }

  protected updateNewAssignmentSlot(field: 'vehicle' | 'day', value: string | number): void {
    if (field === 'day') {
      this.updateNewAssignment('day', Number(value));
      return;
    }

    const vehicle = String(value);
    const currentDay = this.newAssignment.day;
    const nextFreeDay = this.days.findIndex((_, day) => !this.getShift(vehicle, day));
    this.newAssignment = {
      ...this.newAssignment,
      vehicle,
      day: this.getShift(vehicle, currentDay) && nextFreeDay >= 0 ? nextFreeDay : currentDay,
    };
    this.assignmentError.set('');
  }

  protected selectNewAssignmentPlan(planName: string): void {
    const plan = this.dutyPlans.find((item) => item.name === planName);
    this.newAssignment = {
      ...this.newAssignment,
      plan: planName,
      start: plan?.start ?? this.newAssignment.start,
      end: plan?.end ?? this.newAssignment.end,
    };
    this.assignmentError.set('');
  }

  protected isDriverOptionUnavailable(driverName: string): boolean {
    const driver = this.drivers.find((item) => item.name === driverName);
    return driver?.status === 'Abwesend'
      || this.driverHasConflict(
        driverName,
        this.newAssignment.day,
        undefined,
        this.newAssignment.start,
        this.newAssignment.end,
      );
  }

  protected isAssignmentSlotUnavailable(day: number): boolean {
    return Boolean(this.getShift(this.newAssignment.vehicle, day));
  }

  protected createAssignment(): void {
    const draft = this.newAssignment;
    if (!draft.vehicle || !draft.driver || !draft.plan || !draft.start || !draft.end) {
      this.assignmentError.set('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    if (this.getShift(draft.vehicle, draft.day)) {
      this.assignmentError.set('Für dieses Fahrzeug ist an diesem Tag bereits ein Einsatz geplant.');
      return;
    }
    if (this.driverHasConflict(draft.driver, draft.day, undefined, draft.start, draft.end)) {
      this.assignmentError.set(`${draft.driver} ist zu dieser Zeit bereits eingeplant.`);
      return;
    }

    const driver = this.drivers.find((item) => item.name === draft.driver);
    const plan = this.dutyPlans.find((item) => item.name === draft.plan);
    const shift: Shift = {
      id: `assignment-${this.shifts.length + 1}`,
      vehicle: draft.vehicle,
      day: draft.day,
      driver: draft.driver,
      start: draft.start,
      end: draft.end,
      plan: draft.plan,
      tone: (plan?.tone ?? driver?.color ?? 'blue') as ShiftTone,
      status: 'Geplant',
      note: draft.note.trim() || 'Keine besonderen Hinweise',
    };

    this.shifts.push(shift);
    this.selectedShiftId.set(shift.id);
    this.addingAssignment.set(false);
    this.assignmentError.set('');
    this.saved.set(true);
    this.persistState();
    window.setTimeout(() => this.saved.set(false), 2600);
  }

  protected deleteSelectedAssignment(): void {
    const index = this.shifts.findIndex((shift) => shift.id === this.selectedShiftId());
    if (index < 0) return;
    this.shifts.splice(index, 1);
    this.selectedShiftId.set(this.shifts[0]?.id ?? '');
    this.assignmentPanelOpen.set(false);
    this.saved.set(false);
    this.persistState();
  }

  private findFirstEmptyCell(): { vehicle: string; day: number } {
    for (const vehicle of this.vehicles) {
      for (let day = 0; day < this.days.length; day += 1) {
        if (!this.getShift(vehicle.id, day)) return { vehicle: vehicle.id, day };
      }
    }
    return { vehicle: this.vehicles[0].id, day: 0 };
  }

  private driverHasConflict(
    driverName: string,
    day: number,
    excludeShiftId?: string,
    start?: string,
    end?: string,
  ): boolean {
    return this.shifts.some((shift) => {
      if (shift.driver !== driverName || shift.day !== day || shift.id === excludeShiftId) return false;
      if (!start || !end) return true;
      return this.timesOverlap(start, end, shift.start, shift.end);
    });
  }

  private timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const startAMinutes = toMinutes(startA);
    const startBMinutes = toMinutes(startB);
    const endAMinutes = toMinutes(endA) <= startAMinutes ? toMinutes(endA) + 24 * 60 : toMinutes(endA);
    const endBMinutes = toMinutes(endB) <= startBMinutes ? toMinutes(endB) + 24 * 60 : toMinutes(endB);
    return startAMinutes < endBMinutes && startBMinutes < endAMinutes;
  }

  protected showView(view: AppView): void {
    this.activeView.set(view);
    this.menuOpen.set(false);
    window.history.replaceState(null, '', `#${view}`);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  protected selectVehicle(vehicle: FleetVehicle): void {
    this.selectedVehicleId.set(vehicle.id);
    this.vehicleSaved.set(false);
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.vehicle-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected saveVehicle(): void {
    this.vehicleSaved.set(true);
    this.persistState();
    window.setTimeout(() => this.vehicleSaved.set(false), 2400);
  }

  protected selectDutyPlan(plan: DutyPlan): void {
    this.selectedDutyPlanId.set(plan.id);
    this.dutyPlanSaved.set(false);
    this.dutyPlanEditing.set(false);
    this.dutyPlanEditError.set('');
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.duty-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected openNewDutyPlanForm(): void {
    this.dutyPlanDraft = {
      name: '',
      route: '',
      start: '',
      end: '',
      breakTime: '30m',
      weekdays: 'Mo – Fr',
      status: 'Entwurf',
      stops: ['', ''],
    };
    this.dutyPlanEditing.set(false);
    this.dutyPlanEditError.set('');
    this.dutyPlanCreateOpen.set(true);
  }

  protected closeNewDutyPlanForm(): void {
    this.dutyPlanCreateOpen.set(false);
    this.dutyPlanEditError.set('');
  }

  protected createDutyPlan(): void {
    const draft = this.normalizedDutyPlanDraft();
    const validationError = this.validateDutyPlanDraft(draft);
    if (validationError) {
      this.dutyPlanEditError.set(validationError);
      return;
    }

    const baseId = draft.name
      .toLocaleLowerCase('de')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'dienstplan';
    let id = baseId;
    let suffix = 2;
    while (this.dutyPlans.some((plan) => plan.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const tones: DutyPlan['tone'][] = ['blue', 'violet', 'green', 'orange', 'cyan'];
    const plan: DutyPlan = {
      id,
      ...draft,
      duration: this.calculateDutyPlanDuration(draft.start, draft.end),
      assignedVehicles: 0,
      tone: tones[this.dutyPlans.length % tones.length],
    };

    this.dutyPlans.push(plan);
    this.dutyPlanRevision.update((revision) => revision + 1);
    this.selectedDutyPlanId.set(plan.id);
    this.dutyPlanSearch.set('');
    this.dutyPlanStatus.set('Alle Status');
    this.dutyPlanCreateOpen.set(false);
    this.dutyPlanEditError.set('');
    this.dutyPlanSaved.set(true);
    this.persistState();
    window.setTimeout(() => this.dutyPlanSaved.set(false), 2400);
  }

  protected startDutyPlanEdit(): void {
    const plan = this.selectedDutyPlan();
    this.dutyPlanDraft = {
      name: plan.name,
      route: plan.route,
      start: plan.start,
      end: plan.end,
      breakTime: plan.breakTime,
      weekdays: plan.weekdays,
      status: plan.status,
      stops: [...plan.stops],
    };
    this.dutyPlanSaved.set(false);
    this.dutyPlanEditError.set('');
    this.dutyPlanEditing.set(true);
  }

  protected cancelDutyPlanEdit(): void {
    this.dutyPlanEditing.set(false);
    this.dutyPlanEditError.set('');
  }

  protected addDutyPlanStop(): void {
    this.dutyPlanDraft = { ...this.dutyPlanDraft, stops: [...this.dutyPlanDraft.stops, ''] };
    this.dutyPlanEditError.set('');
  }

  protected removeDutyPlanStop(index: number): void {
    if (this.dutyPlanDraft.stops.length <= 2) {
      this.dutyPlanEditError.set('Ein Linienverlauf benötigt mindestens zwei Haltestellen.');
      return;
    }
    this.dutyPlanDraft = {
      ...this.dutyPlanDraft,
      stops: this.dutyPlanDraft.stops.filter((_, stopIndex) => stopIndex !== index),
    };
    this.dutyPlanEditError.set('');
  }

  protected moveDutyPlanStop(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.dutyPlanDraft.stops.length) return;
    const stops = [...this.dutyPlanDraft.stops];
    [stops[index], stops[targetIndex]] = [stops[targetIndex], stops[index]];
    this.dutyPlanDraft = { ...this.dutyPlanDraft, stops };
  }

  protected dutyPlanDraftDuration(): string {
    return this.calculateDutyPlanDuration(this.dutyPlanDraft.start, this.dutyPlanDraft.end);
  }

  protected saveDutyPlan(): void {
    const draft = this.normalizedDutyPlanDraft();
    const validationError = this.validateDutyPlanDraft(draft);
    if (validationError) {
      this.dutyPlanEditError.set(validationError);
      return;
    }

    Object.assign(this.selectedDutyPlan(), {
      ...draft,
      duration: this.calculateDutyPlanDuration(draft.start, draft.end),
    });
    this.dutyPlanRevision.update((revision) => revision + 1);
    this.dutyPlanEditing.set(false);
    this.dutyPlanEditError.set('');
    this.dutyPlanSaved.set(true);
    this.persistState();
    window.setTimeout(() => this.dutyPlanSaved.set(false), 2400);
  }

  private normalizedDutyPlanDraft(): DutyPlanDraft {
    return {
      ...this.dutyPlanDraft,
      name: this.dutyPlanDraft.name.trim(),
      route: this.dutyPlanDraft.route.trim(),
      breakTime: this.dutyPlanDraft.breakTime.trim(),
      stops: this.dutyPlanDraft.stops.map((stop) => stop.trim()),
    };
  }

  private validateDutyPlanDraft(draft: DutyPlanDraft): string {
    if (!draft.name || !draft.route || !draft.start || !draft.end || !draft.breakTime || !draft.weekdays) {
      return 'Bitte füllen Sie alle Pflichtfelder aus.';
    }
    if (draft.stops.length < 2 || draft.stops.some((stop) => !stop)) {
      return 'Bitte geben Sie mindestens zwei vollständige Haltestellen an.';
    }
    return '';
  }

  private calculateDutyPlanDuration(start: string, end: string): string {
    if (!start || !end) return '–';
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const startMinutes = toMinutes(start);
    let duration = toMinutes(end) - startMinutes;
    if (duration < 0) duration += 24 * 60;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }

  protected selectDriver(driver: Driver): void {
    this.selectedDriverId.set(driver.id);
    this.driverSaved.set(false);
    this.driverDeleteConfirmOpen.set(false);
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.driver-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected saveDriver(): void {
    this.openDriverEditForm();
  }

  protected openNewDriverForm(): void {
    this.newDriver = this.emptyDriverDraft();
    this.driverEditing.set(false);
    this.driverFormError.set('');
    this.driverFormOpen.set(true);
  }

  protected openDriverEditForm(): void {
    const driver = this.selectedDriver();
    this.newDriver = {
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      status: driver.status,
      license: driver.license,
      licenseExpiry: this.toInputDate(driver.licenseExpiry),
      medicalCheck: this.toInputDate(driver.medicalCheck),
    };
    this.driverEditing.set(true);
    this.driverFormError.set('');
    this.driverFormOpen.set(true);
  }

  protected closeNewDriverForm(): void {
    this.driverFormOpen.set(false);
    this.driverEditing.set(false);
    this.driverFormError.set('');
  }

  protected saveDriverForm(): void {
    if (this.driverEditing()) this.updateDriver();
    else this.createDriver();
  }

  protected createDriver(): void {
    const draft = this.normalizedDriverDraft();
    const validationError = this.validateDriverDraft(draft);
    if (validationError) {
      this.driverFormError.set(validationError);
      return;
    }

    const baseId = draft.name
      .toLocaleLowerCase('de')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'fahrer';
    let id = baseId;
    let suffix = 2;
    while (this.drivers.some((driver) => driver.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const colors: Driver['color'][] = ['blue', 'violet', 'green', 'orange', 'cyan', 'rose'];
    const driver: Driver = {
      id,
      name: draft.name,
      initials: this.driverInitials(draft.name),
      phone: draft.phone,
      email: draft.email,
      status: draft.status,
      vehicle: '–',
      shift: draft.status === 'Abwesend' ? 'Abwesend' : 'Kein Einsatz',
      weeklyHours: 0,
      targetHours: 40,
      overtime: '+0h 00m',
      license: draft.license,
      licenseExpiry: this.toGermanDate(draft.licenseExpiry),
      medicalCheck: this.toGermanDate(draft.medicalCheck),
      color: colors[this.drivers.length % colors.length],
    };

    this.drivers.push(driver);
    this.driverRevision.update((revision) => revision + 1);
    this.driverSearch.set('');
    this.driverStatus.set('Alle Status');
    this.selectedDriverId.set(driver.id);
    this.driverFormOpen.set(false);
    this.driverFormError.set('');
    this.driverCreated.set(driver.name);
    this.persistState();
    window.setTimeout(() => {
      if (this.driverCreated() === driver.name) this.driverCreated.set(null);
    }, 3200);
  }

  protected updateDriver(): void {
    const currentDriver = this.selectedDriver();
    const draft = this.normalizedDriverDraft();
    const validationError = this.validateDriverDraft(draft, currentDriver.id);
    if (validationError) {
      this.driverFormError.set(validationError);
      return;
    }

    Object.assign(currentDriver, {
      name: draft.name,
      initials: this.driverInitials(draft.name),
      phone: draft.phone,
      email: draft.email,
      status: draft.status,
      license: draft.license,
      licenseExpiry: this.toGermanDate(draft.licenseExpiry),
      medicalCheck: this.toGermanDate(draft.medicalCheck),
    });
    if (draft.status === 'Abwesend' && currentDriver.vehicle === '–') currentDriver.shift = 'Abwesend';
    if (draft.status !== 'Abwesend' && currentDriver.vehicle === '–') currentDriver.shift = 'Kein Einsatz';

    this.driverRevision.update((revision) => revision + 1);
    this.driverFormOpen.set(false);
    this.driverEditing.set(false);
    this.driverFormError.set('');
    this.driverSaved.set(true);
    this.driverUpdated.set(currentDriver.name);
    this.persistState();
    window.setTimeout(() => {
      this.driverSaved.set(false);
      if (this.driverUpdated() === currentDriver.name) this.driverUpdated.set(null);
    }, 3200);
  }

  protected requestDriverDelete(): void {
    this.driverDeleteConfirmOpen.set(true);
  }

  protected cancelDriverDelete(): void {
    this.driverDeleteConfirmOpen.set(false);
  }

  protected deleteDriver(): void {
    if (this.drivers.length <= 1) return;
    const driver = this.selectedDriver();
    const index = this.drivers.findIndex((item) => item.id === driver.id);
    if (index < 0) return;

    this.drivers.splice(index, 1);
    const nextDriver = this.drivers[Math.min(index, this.drivers.length - 1)];
    if (nextDriver) this.selectedDriverId.set(nextDriver.id);
    this.driverRevision.update((revision) => revision + 1);
    this.driverDeleteConfirmOpen.set(false);
    this.driverDeleted.set(driver.name);
    this.persistState();
    window.setTimeout(() => {
      if (this.driverDeleted() === driver.name) this.driverDeleted.set(null);
    }, 3200);
  }

  private normalizedDriverDraft(): DriverDraft {
    return {
      ...this.newDriver,
      name: this.newDriver.name.trim(),
      phone: this.newDriver.phone.trim(),
      email: this.newDriver.email.trim().toLocaleLowerCase('de'),
      license: this.newDriver.license.trim(),
    };
  }

  private validateDriverDraft(draft: DriverDraft, excludedDriverId?: string): string {
    if (!draft.name || !draft.phone || !draft.email || !draft.license || !draft.licenseExpiry || !draft.medicalCheck) {
      return 'Bitte füllen Sie alle Pflichtfelder aus.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    if (this.drivers.some((driver) => driver.id !== excludedDriverId && driver.email.toLocaleLowerCase('de') === draft.email)) {
      return 'Ein Fahrer mit dieser E-Mail-Adresse ist bereits vorhanden.';
    }
    return '';
  }

  private emptyDriverDraft(): DriverDraft {
    return {
      name: '',
      phone: '',
      email: '',
      status: 'Verfügbar',
      license: 'D, DE',
      licenseExpiry: '',
      medicalCheck: '',
    };
  }

  private driverInitials(name: string): string {
    return name
      .split(/[\s/]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('de');
  }

  private toGermanDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}.${month}.${year}` : value;
  }

  private toInputDate(value: string): string {
    const [day, month, year] = value.split('.');
    return year && month && day ? `${year}-${month}-${day}` : value;
  }

  protected selectAbsence(absence: Absence): void {
    this.selectedAbsenceId.set(absence.id);
    this.absenceSaved.set(false);
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.absence-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected saveAbsence(): void {
    this.absenceSaved.set(true);
    this.persistState();
    window.setTimeout(() => this.absenceSaved.set(false), 2400);
  }

  protected selectSpecialTrip(trip: SpecialTrip): void {
    this.selectedSpecialTripId.set(trip.id);
    this.specialTripSaved.set(false);
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.special-trip-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected saveSpecialTrip(): void {
    this.specialTripSaved.set(true);
    this.persistState();
    window.setTimeout(() => this.specialTripSaved.set(false), 2400);
  }

  protected selectMessage(thread: MessageThread): void {
    this.selectedMessageId.set(thread.id);
    this.unreadMessageIds.update((ids) => ids.filter((id) => id !== thread.id));
    this.messageReply.set('');
    this.messageSent.set(false);
    this.persistState();
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.message-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected markAllMessagesRead(): void {
    this.unreadMessageIds.set([]);
    this.persistState();
  }

  protected sendMessageReply(): void {
    if (!this.messageReply().trim()) return;
    this.messageSent.set(true);
    this.messageReply.set('');
    window.setTimeout(() => this.messageSent.set(false), 2800);
  }

  protected startDriverShift(): void {
    if (!this.canStartDriverShift()) return;
    this.driverShiftState.set('active');
    this.driverReportMode.set('none');
    this.persistState();
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  protected completeDriverShift(): void {
    if (!this.canCompleteDriverShift()) return;
    this.driverShiftState.set('completed');
    this.persistState();
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  protected resetDriverShiftDemo(): void {
    this.driverShiftState.set('ready');
    this.driverReportMode.set('none');
    this.driverEndMileage.set('');
    this.driverVehicleChecked.set(false);
    this.driverDocumentsChecked.set(false);
    this.driverDelay.set('Keine Verspätung');
    this.driverIssue.set('Keine Mängel');
    this.driverShiftNote.set('');
    this.persistState();
  }

  protected selectShift(shift: Shift): void {
    this.addingAssignment.set(false);
    this.assignmentPanelOpen.set(true);
    this.assignmentError.set('');
    this.selectedShiftId.set(shift.id);
    this.saved.set(false);
    if (window.innerWidth < 900) {
      document.querySelector('.details-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected updateSelectedShift(field: 'driver' | 'plan' | 'note', value: string): void {
    this.selectedShift()[field] = value;
    this.saved.set(false);
    this.persistState();
  }

  protected changeWeek(delta: number): void {
    this.weekOffset.update((value) => value + delta);
    this.published.set(false);
  }

  protected resetWeek(): void {
    this.weekOffset.set(0);
  }

  protected publish(): void {
    this.published.set(true);
    window.setTimeout(() => this.published.set(false), 3200);
  }

  protected save(): void {
    this.saved.set(true);
    this.persistState();
    window.setTimeout(() => this.saved.set(false), 2600);
  }
}
