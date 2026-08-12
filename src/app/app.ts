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

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
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
  protected readonly driverFormError = signal('');
  protected readonly driverCreated = signal<string | null>(null);
  private readonly driverRevision = signal(0);
  protected newDriver: DriverDraft = this.emptyDriverDraft();
  protected readonly selectedAbsenceId = signal('fahrer-04-05-vacation');
  protected readonly absenceSearch = signal('');
  protected readonly absenceType = signal('Alle Arten');
  protected readonly absenceSaved = signal(false);
  protected readonly selectedSpecialTripId = signal('demo-trip-01');
  protected readonly specialTripSearch = signal('');
  protected readonly specialTripStatus = signal('Alle Status');
  protected readonly specialTripSaved = signal(false);
  protected readonly selectedMessageId = signal('fahrer-10-delay');
  protected readonly messageSearch = signal('');
  protected readonly messageFilter = signal('Alle Nachrichten');
  protected readonly unreadMessageIds = signal(['fahrer-10-delay', 'demo-trip-passengers', 'demo-vehicle-service']);
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
    { id: 'DEMO-13', displayLabel: 'DEMO 13', lineLabel: 'L 13', seats: 0, tone: 'green', start: '07:00', end: '16:00' },
    { id: 'DEMO-11', displayLabel: 'DEMO 11', lineLabel: 'L 11', seats: 0, tone: 'green', start: '06:30', end: '16:53' },
    { id: 'DEMO-5', displayLabel: 'DEMO 5', lineLabel: 'L 5', seats: 0, tone: 'green', start: '06:30', end: '15:05' },
    { id: 'DEMO-89', displayLabel: 'DEMO 89', lineLabel: 'L 89', seats: 0, tone: 'cyan', start: '06:30', end: '16:33' },
    { id: 'DEMO-102', displayLabel: 'DEMO 102', lineLabel: 'L 102', seats: 0, tone: 'blue', start: '07:07', end: '13:48' },
    { id: 'DEMO-92', displayLabel: 'DEMO 92', lineLabel: 'L 92', seats: 0, tone: 'cyan', start: '07:19', end: '13:56' },
    { id: 'DEMO-775', displayLabel: 'DEMO 775', lineLabel: 'L 775', seats: 0, tone: 'blue', start: '05:50', end: '16:53' },
    { id: 'DEMO-93', displayLabel: 'DEMO 93', lineLabel: 'L 93', seats: 0, tone: 'cyan', start: '07:12', end: '17:53' },
    { id: 'DEMO-94', displayLabel: 'DEMO 94', lineLabel: 'L 94', seats: 0, tone: 'blue', start: '06:27', end: '17:21' },
    { id: 'DEMO-91', displayLabel: 'DEMO 91', lineLabel: 'L 91', seats: 0, tone: 'violet', start: '07:04', end: '16:56' },
    { id: 'DEMO-98', displayLabel: 'DEMO 98', lineLabel: 'L 98', seats: 0, tone: 'blue', start: '06:11', end: '16:32' },
    { id: 'DEMO-101', displayLabel: 'DEMO 101', lineLabel: 'L 101', seats: 0, tone: 'cyan', start: '06:25', end: '17:52' },
    { id: 'DEMO-96', displayLabel: 'DEMO 96', lineLabel: 'L 96', seats: 0, tone: 'blue', start: '07:14', end: '17:02' },
    { id: 'DEMO-90', displayLabel: 'DEMO 90', lineLabel: 'L 90', seats: 0, tone: 'amber', start: '06:45', end: '00:51' },
    { id: 'DEMO-96/14', displayLabel: 'DEMO 96/14', lineLabel: 'L 96/14', seats: 0, tone: 'amber', start: '06:28', end: '17:06' },
    { id: 'DEMO-Nacht 1', displayLabel: 'DEMO  Nacht', lineLabel: 'L Nacht', seats: 0, tone: 'rose', start: '23:25', end: '01:29' },
    { id: 'DEMO-Nacht 2', displayLabel: 'DEMO  Fr/Sa', lineLabel: 'L Fr/Sa', seats: 0, tone: 'amber', start: '00:55', end: '02:29' },
    { id: 'Demo Wochenende', displayLabel: 'Wochenende', lineLabel: 'Sa/So', seats: 0, tone: 'amber', start: '22:13', end: '00:51' },
    { id: 'DEMO-WE Samstag', displayLabel: 'DEMO-WE Sa', lineLabel: 'DEMO-WE Sa', seats: 0, tone: 'blue', start: '14:17', end: '22:48' },
    { id: 'DEMO-WE Sonntag A', displayLabel: 'DEMO-WE So', lineLabel: 'DEMO-WE So', seats: 0, tone: 'blue', start: '08:17', end: '14:48' },
    { id: 'DEMO-WE Sonntag B', displayLabel: 'DEMO-WE So', lineLabel: 'DEMO-WE So', seats: 0, tone: 'violet', start: '15:13', end: '21:42' },
  ];
  protected readonly planningGridWidth = 96 + this.vehicles.length * 135;

  protected readonly fleetVehicles: FleetVehicle[] = [
    { id: 'DEMO-102', seats: 52, model: 'Mercedes-Benz Intouro', year: 2021, mileage: '184.320 km', status: 'Einsatz', driver: 'Fahrer 07', inspection: '14.11.2026', safetyInspection: '14.08.2026' },
    { id: 'DEMO-515', seats: 58, model: 'MAN Lion\'s Intercity', year: 2022, mileage: '128.740 km', status: 'Einsatz', driver: 'Fahrer 02', inspection: '02.02.2027', safetyInspection: '02.08.2026' },
    { id: 'DEMO-94', seats: 52, model: 'Setra S 415 UL', year: 2019, mileage: '267.810 km', status: 'Einsatz', driver: 'Fahrer 18', inspection: '28.09.2026', safetyInspection: '28.08.2026' },
    { id: 'DEMO-91', seats: 52, model: 'Mercedes-Benz Intouro', year: 2020, mileage: '221.450 km', status: 'Einsatz', driver: 'Fahrer 10', inspection: '18.08.2026', safetyInspection: '18.11.2026' },
    { id: 'DEMO-11', seats: 56, model: 'IVECO Crossway', year: 2018, mileage: '312.090 km', status: 'Werkstatt', driver: '–', inspection: '05.08.2026', safetyInspection: '05.08.2026' },
    { id: 'DEMO-8', seats: 53, model: 'Setra S 415 LE', year: 2023, mileage: '74.620 km', status: 'Verfügbar', driver: 'Fahrer 15', inspection: '21.04.2027', safetyInspection: '21.10.2026' },
  ];

  protected readonly dutyPlans: DutyPlan[] = [
    { id: 'demo-plan-91', name: 'Tagesplan L 91', route: 'Demo Ort 01 → Demo Ort 02', start: '06:05', end: '14:24', duration: '8h 19m', breakTime: '30m', stops: ['Demo Ort 01', 'Demo Halt A', 'Demo Ort 13', 'Demo Ort 03', 'Demo Ort 47', 'Demo Ort 02'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'violet' },
    { id: 'demo-plan-102', name: 'Tagesplan L 102', route: 'Demo Ort 03 → Demo Ort 04', start: '06:05', end: '14:20', duration: '8h 15m', breakTime: '30m', stops: ['Demo Ort 03', 'Demo Ort 12', 'Demo Ort 13', 'Demo Ort 04 ZOB'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'green' },
    { id: 'demo-plan-515', name: 'Tagesplan L 515', route: 'Demo Ort 05 → Demo Ort 06', start: '07:30', end: '15:45', duration: '8h 15m', breakTime: '45m', stops: ['Demo Ort 05', 'Demo Ort 14', 'Demo Ort 15', 'Demo Ort 06 Bahnhof'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'blue' },
    { id: 'demo-plan-94', name: 'Tagesplan L 94', route: 'Demo Ort 07 → Demo Ort 08', start: '08:00', end: '16:10', duration: '8h 10m', breakTime: '30m', stops: ['Demo Ort 07', 'Demo Ort 10', 'Demo Ort 56', 'Demo Ort 08 Ost'], weekdays: 'Mo – Sa', assignedVehicles: 1, status: 'Aktiv', tone: 'orange' },
    { id: 'school-service', name: 'Schulverkehr Demo Ort 04', route: 'Demo Ort 04 → Demo Ort 09', start: '06:40', end: '08:15', duration: '1h 35m', breakTime: '–', stops: ['Demo Ort 04 ZOB', 'Demo Ort 16', 'Demo Ort 17', 'Demo Ort 09 Schule'], weekdays: 'Mo – Fr', assignedVehicles: 2, status: 'Entwurf', tone: 'cyan' },
    { id: 'winter-relief', name: 'Winter Verstärker', route: 'Demo Ort 10 → Demo Arena', start: '05:50', end: '09:20', duration: '3h 30m', breakTime: '–', stops: ['Demo Ort 10', 'Demo Ort 11', 'Demo Arena'], weekdays: 'Mo – Fr', assignedVehicles: 0, status: 'Archiviert', tone: 'blue' },
  ];

  protected readonly drivers: Driver[] = [
    { id: 'fahrer-07', name: 'Fahrer 07', initials: '07', phone: '0000 000 0107', email: 'fahrer07@example.com', status: 'Im Einsatz', vehicle: 'DEMO-102', shift: '06:05 – 14:20', weeklyHours: 32, targetHours: 40, overtime: '+2h 15m', license: 'D, DE', licenseExpiry: '18.03.2028', medicalCheck: '12.01.2027', color: 'green' },
    { id: 'fahrer-02', name: 'Fahrer 02', initials: '02', phone: '0000 000 0102', email: 'fahrer02@example.com', status: 'Im Einsatz', vehicle: 'DEMO-515', shift: '07:30 – 15:45', weeklyHours: 33, targetHours: 40, overtime: '+1h 40m', license: 'D, DE', licenseExpiry: '09.11.2027', medicalCheck: '22.04.2027', color: 'blue' },
    { id: 'fahrer-18', name: 'Fahrer 18', initials: '18', phone: '0000 000 0118', email: 'fahrer18@example.com', status: 'Im Einsatz', vehicle: 'DEMO-94', shift: '08:00 – 16:10', weeklyHours: 32.5, targetHours: 40, overtime: '−0h 30m', license: 'D, DE', licenseExpiry: '27.08.2029', medicalCheck: '04.03.2027', color: 'orange' },
    { id: 'fahrer-10', name: 'Fahrer 10', initials: '10', phone: '0000 000 0110', email: 'fahrer10@example.com', status: 'Im Einsatz', vehicle: 'DEMO-91', shift: '06:05 – 14:24', weeklyHours: 33.3, targetHours: 40, overtime: '+3h 05m', license: 'D, DE', licenseExpiry: '16.12.2027', medicalCheck: '18.09.2026', color: 'violet' },
    { id: 'fahrer-16', name: 'Fahrer 16', initials: '16', phone: '0000 000 0116', email: 'fahrer16@example.com', status: 'Im Einsatz', vehicle: 'DEMO-11', shift: '06:30 – 14:40', weeklyHours: 32.7, targetHours: 40, overtime: '+0h 55m', license: 'D, DE', licenseExpiry: '05.05.2028', medicalCheck: '30.11.2026', color: 'cyan' },
    { id: 'fahrer-15', name: 'Fahrer 15', initials: '15', phone: '0000 000 0115', email: 'fahrer15@example.com', status: 'Verfügbar', vehicle: '–', shift: 'Kein Einsatz', weeklyHours: 24, targetHours: 40, overtime: '−1h 20m', license: 'D, DE', licenseExpiry: '14.02.2029', medicalCheck: '08.06.2027', color: 'rose' },
    { id: 'fahrer-19', name: 'Fahrer 19', initials: '19', phone: '0000 000 0119', email: 'fahrer19@example.com', status: 'Abwesend', vehicle: '–', shift: 'Krank', weeklyHours: 16, targetHours: 40, overtime: '+0h 10m', license: 'D, DE', licenseExpiry: '25.07.2028', medicalCheck: '11.10.2026', color: 'orange' },
  ];

  protected readonly absences: Absence[] = [
    { id: 'fahrer-19-absence', driver: 'Fahrer 19', initials: '19', type: 'Krank', start: '25.07.2026', end: '25.07.2026', duration: '1 Tag', workingDays: 1, status: 'Aktiv', note: 'Krankmeldung liegt vor.', conflicts: 1, color: 'rose' },
    { id: 'fahrer-04-05-vacation', driver: 'Fahrer 04/05', initials: '45', type: 'Urlaub', start: '20.07.2026', end: '08.08.2026', duration: '20 Tage', workingDays: 15, status: 'Aktiv', note: 'Genehmigter Sommerurlaub.', conflicts: 3, color: 'blue' },
    { id: 'fahrer-07-training', driver: 'Fahrer 07', initials: '07', type: 'Fortbildung', start: '03.08.2026', end: '04.08.2026', duration: '2 Tage', workingDays: 2, status: 'Geplant', note: 'Schulung Fahrgastsicherheit.', conflicts: 2, color: 'green' },
    { id: 'fahrer-02-vacation', driver: 'Fahrer 02', initials: '02', type: 'Urlaub', start: '10.08.2026', end: '14.08.2026', duration: '5 Tage', workingDays: 5, status: 'Geplant', note: 'Genehmigter Erholungsurlaub.', conflicts: 0, color: 'violet' },
    { id: 'fahrer-16-other', driver: 'Fahrer 16', initials: '16', type: 'Sonstige', start: '18.08.2026', end: '18.08.2026', duration: '1 Tag', workingDays: 1, status: 'Geplant', note: 'Behördentermin.', conflicts: 1, color: 'orange' },
    { id: 'fahrer-18-training', driver: 'Fahrer 18', initials: '18', type: 'Fortbildung', start: '06.07.2026', end: '07.07.2026', duration: '2 Tage', workingDays: 2, status: 'Beendet', note: 'Eco-Training erfolgreich abgeschlossen.', conflicts: 0, color: 'green' },
  ];

  protected readonly specialTrips: SpecialTrip[] = [
    { id: 'demo-trip-01', title: 'Ausflug Demo Ort 54', type: 'Tagesfahrt', date: '25.07.2026', start: '12:15', end: '19:15', from: 'Demo Ort 53 Zeltlagerplatz', to: 'Demo Ort 54 Schwimmbad', stops: ['Demo Ort 53 Zeltlagerplatz', 'Demo Ort 07 Markt', 'Demo Ort 54 Schwimmbad'], driver: 'Fahrer 19', vehicle: 'DEMO-11', passengers: 44, customer: 'Demo-Kunde 01', contact: 'Kontakt 01', phone: '0000 000 0201', status: 'Geplant', note: 'Rückfahrt nach Ende des Schwimmbadbesuchs. Gepäckraum freihalten.', tone: 'rose' },
    { id: 'demo-trip-02', title: 'Flughafentransfer', type: 'Transferfahrt', date: '26.07.2026', start: '23:00', end: '02:00', from: 'Demo Ort 55 Innenstadt', to: 'Demo Ort 17 Ortsmitte', stops: ['Demo Ort 55 Innenstadt', 'Flughafen Demo Ort 55', 'Demo Ort 17 Ortsmitte'], driver: 'Fahrer 15', vehicle: 'DEMO-8', passengers: 31, customer: 'Demo-Kunde 02', contact: 'Kontakt 02', phone: '0000 000 0202', status: 'Geplant', note: 'Nachtfahrt. Flugankunft vor Abfahrt telefonisch bestätigen.', tone: 'blue' },
    { id: 'demo-trip-03', title: 'Vereinsausflug Demo Ort 47', type: 'Vereinsfahrt', date: '01.08.2026', start: '08:30', end: '20:45', from: 'Demo Ort 04 ZOB', to: 'Demo Ort 47 Porta Nigra', stops: ['Demo Ort 04 ZOB', 'Demo Ort 03 Bahnhof', 'Demo Ort 47 Porta Nigra'], driver: 'Fahrer 10', vehicle: 'DEMO-91', passengers: 49, customer: 'Demo-Kunde 03', contact: 'Kontakt 03', phone: '0000 000 0203', status: 'Geplant', note: 'Ein Zustieg in Demo Ort 03. Rückfahrt um 19:00 Uhr.', tone: 'violet' },
    { id: 'demo-trip-04', title: 'Schulausflug Demo Ort 06', type: 'Klassenfahrt', date: '04.08.2026', start: '07:45', end: '16:30', from: 'Demo Ort 09 Schule', to: 'Demo Ort 06 Reichsburg', stops: ['Demo Ort 09 Schule', 'Demo Ort 05 Busbahnhof', 'Demo Ort 06 Reichsburg'], driver: 'Noch offen', vehicle: 'DEMO-515', passengers: 53, customer: 'Demo-Kunde 04', contact: 'Kontakt 04', phone: '0000 000 0204', status: 'Offen', note: 'Begleitpersonen: 4. Fahrerzuweisung noch erforderlich.', tone: 'orange' },
    { id: 'demo-trip-05', title: 'Messe-Transfer Demo Ort 43', type: 'Transferfahrt', date: '08.08.2026', start: '06:10', end: '18:20', from: 'Demo Ort 13', to: 'Demo Ort 43 Messegelände', stops: ['Demo Ort 13', 'Demo Ort 04 ZOB', 'Demo Ort 43 Messegelände'], driver: 'Noch offen', vehicle: 'Noch offen', passengers: 38, customer: 'Demo-Kunde 05', contact: 'Kontakt 05', phone: '0000 000 0205', status: 'Offen', note: 'Fahrzeug und Fahrer müssen noch eingeplant werden.', tone: 'cyan' },
    { id: 'demo-trip-06', title: 'Seniorenfahrt Demo Ort 08', type: 'Tagesfahrt', date: '18.07.2026', start: '09:00', end: '17:10', from: 'Demo Ort 10 Rathaus', to: 'Demo Ort 08 Marktplatz', stops: ['Demo Ort 10 Rathaus', 'Demo Ort 56 Kirche', 'Demo Ort 08 Marktplatz'], driver: 'Fahrer 07', vehicle: 'DEMO-102', passengers: 41, customer: 'Demo-Kunde 06', contact: 'Kontakt 06', phone: '0000 000 0206', status: 'Abgeschlossen', note: 'Fahrt planmäßig und ohne Vorkommnisse abgeschlossen.', tone: 'green' },
  ];

  protected readonly messageThreads: MessageThread[] = [
    { id: 'fahrer-10-delay', sender: 'Fahrer 10', initials: '10', role: 'Fahrer · DEMO-91', subject: 'Verspätung auf der Demo-Straße', preview: 'Wegen einer Baustelle komme ich voraussichtlich 15 Minuten später in Demo Ort 02 an.', date: 'Heute', time: '11:42', category: 'Fahrer', body: ['Hallo Demo Admin,', 'wegen einer kurzfristigen Baustelle auf der Demo-Straße verzögert sich die Fahrt. Ich rechne aktuell mit etwa 15 Minuten Verspätung bei der Ankunft in Demo Ort 02.', 'Die Fahrgäste sind informiert. Ich melde mich, falls sich die Situation verändert.'], relatedLabel: 'Einsatz in Wochenplanung öffnen', relatedView: 'planning', tone: 'violet' },
    { id: 'demo-trip-passengers', sender: 'Kontakt 01', initials: 'C1', role: 'Kundin · Demo-Kunde 01', subject: 'Teilnehmerzahl für Demo Ort 54', preview: 'Die endgültige Teilnehmerzahl für Samstag beträgt 44 Personen inklusive Betreuung.', date: 'Heute', time: '10:18', category: 'Kunde', body: ['Guten Morgen,', 'für unsere Tagesfahrt nach Demo Ort 54 am Samstag sind es endgültig 44 Personen, davon vier Betreuungskräfte.', 'Bitte bestätigen Sie kurz, dass der eingeplante Bus ausreichend Sitzplätze hat. Vielen Dank!'], relatedLabel: 'Sonderfahrt anzeigen', relatedView: 'trips', tone: 'rose' },
    { id: 'demo-vehicle-service', sender: 'Demo-Werkstatt', initials: 'DW', role: 'Servicepartner', subject: 'DEMO-11 ab 15 Uhr verfügbar', preview: 'Die Sicherheitsprüfung ist abgeschlossen. Das Fahrzeug kann heute ab 15 Uhr abgeholt werden.', date: 'Heute', time: '09:05', category: 'System', body: ['Guten Morgen,', 'die Arbeiten und die Sicherheitsprüfung am Fahrzeug DEMO-11 sind abgeschlossen.', 'Der Bus kann heute ab 15:00 Uhr abgeholt und wieder eingesetzt werden.'], relatedLabel: 'Fahrzeugdetails anzeigen', relatedView: 'vehicles', tone: 'orange' },
    { id: 'fahrer-19-certificate', sender: 'Fahrer 19', initials: '19', role: 'Fahrer', subject: 'Krankmeldung eingereicht', preview: 'Die Bescheinigung für meine heutige Abwesenheit habe ich soeben hochgeladen.', date: 'Gestern', time: '18:26', category: 'Fahrer', body: ['Hallo,', 'die Arbeitsunfähigkeitsbescheinigung für meine heutige Abwesenheit ist jetzt vollständig eingereicht.', 'Bei Rückfragen bin ich telefonisch erreichbar.'], relatedLabel: 'Abwesenheit anzeigen', relatedView: 'absence', tone: 'orange' },
    { id: 'system-plan', sender: 'BusDispo System', initials: 'BD', role: 'Automatische Meldung', subject: 'Wochenplan erfolgreich veröffentlicht', preview: 'Der Plan für KW 30 wurde an fünf Fahrer verteilt. Zwei Einsätze sind weiterhin offen.', date: 'Gestern', time: '16:02', category: 'System', body: ['Der Wochenplan für KW 30 wurde erfolgreich veröffentlicht.', 'Fünf Fahrer haben ihre Zuweisung erhalten. Für zwei offene Einsätze ist noch keine Fahrerin oder kein Fahrer hinterlegt.'], relatedLabel: 'Wochenplanung prüfen', relatedView: 'planning', tone: 'blue' },
    { id: 'fahrer-02-shift', sender: 'Fahrer 02', initials: '02', role: 'Fahrer · DEMO-515', subject: 'Rückfrage zum Dienst am Freitag', preview: 'Bleibt der Fahrzeugwechsel in Demo Ort 06 wie im aktuellen Dienstplan hinterlegt?', date: '30.07.2026', time: '14:37', category: 'Fahrer', body: ['Hallo Demo Admin,', 'bleibt der Fahrzeugwechsel in Demo Ort 06 am Freitag wie im aktuellen Dienstplan eingetragen?', 'Dann plane ich meine Pause entsprechend. Danke für eine kurze Rückmeldung.'], relatedLabel: 'Dienstplan anzeigen', relatedView: 'schedules', tone: 'blue' },
    { id: 'demo-trip-request', sender: 'Kontakt 04', initials: 'C4', role: 'Demo-Kunde 04', subject: 'Abfahrtszeit Schulausflug', preview: 'Könnten wir die Abfahrt am 4. August auf 07:30 Uhr vorziehen?', date: '29.07.2026', time: '12:10', category: 'Kunde', body: ['Guten Tag,', 'für den Schulausflug nach Demo Ort 06 würden wir die Abfahrt gerne von 07:45 Uhr auf 07:30 Uhr vorziehen.', 'Wäre diese Änderung für Sie möglich? Die Teilnehmerzahl bleibt unverändert.'], relatedLabel: 'Sonderfahrt anzeigen', relatedView: 'trips', tone: 'green' },
  ];

  private readonly weeklyDriverAssignments: string[][] = [
    ['Fahrer 01', 'Fahrer 02', 'Fahrer 03', 'Fahrer 04', 'Fahrer 05', 'Fahrer 06', 'Fahrer 07', 'Fahrer 08', 'Fahrer 09', 'Fahrer 10', 'Fahrer 11', 'Fahrer 12', 'Fahrer 13 / Fahrer 14 / Fahrer 13', 'Fahrer 03 / Fahrer 15', 'Fahrer 14 / Fahrer 16', 'Fahrer 17', '', '', '', '', ''],
    ['Fahrer 01', 'Fahrer 02 / Fahrer 13', 'Fahrer 03', 'Fahrer 04', 'Fahrer 05', 'Fahrer 06', 'Fahrer 07', 'Fahrer 08', 'Fahrer 09', 'Fahrer 10', 'Fahrer 11', 'Fahrer 12', 'Fahrer 13 / Fahrer 14', 'Fahrer 14 / Fahrer 15 / Fahrer 16', 'Fahrer 16', 'Fahrer 17', '', '', '', '', ''],
    ['Fahrer 01', 'Fahrer 02', 'Fahrer 03', 'Fahrer 04', 'Fahrer 05', 'Fahrer 06', 'Fahrer 07', 'Fahrer 08', 'Fahrer 09', 'Fahrer 10', 'Fahrer 11 / Fahrer 13', 'Fahrer 12', 'Fahrer 18', 'Fahrer 14 / Fahrer 02 / Fahrer 16', 'Fahrer 15 / Fahrer 16', 'Fahrer 17', '', '', '', '', ''],
    ['Fahrer 01', 'Fahrer 02', 'Fahrer 03 / Fahrer 13', 'Fahrer 04', 'Fahrer 05', 'Fahrer 06', 'Fahrer 07', 'Fahrer 08', 'Fahrer 09', 'Fahrer 10', 'Fahrer 03 / Fahrer 13', 'Fahrer 12', 'Fahrer 18', 'Fahrer 14 / Fahrer 16', 'Fahrer 15', 'Fahrer 17', '', '', '', '', ''],
    ['Fahrer 01', 'Fahrer 02', 'Fahrer 03', 'Fahrer 04', 'Fahrer 05', 'Fahrer 06', 'Fahrer 07', 'Fahrer 08', 'Fahrer 09', 'Fahrer 10', 'Fahrer 11', 'Fahrer 12', 'Fahrer 18', 'Fahrer 03 / Fahrer 16 / Fahrer 15', 'Fahrer 15', 'Fahrer 17', 'Fahrer 16', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Fahrer 16', 'Fahrer 12', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Fahrer 16', '', 'Fahrer 15', 'Fahrer 15'],
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

  protected readonly planningTrips: PlanningTripCard[] = [
    { id: 'rh13-1', vehicle: 'DEMO-13', time: '07:00 – 08:15', route: 'Förderzentrum Demo Ort 03', label: 'Mo – Fr', tone: 'green' },
    { id: 'rh13-2', vehicle: 'DEMO-13', time: '15:15 – 16:00', route: 'Förderzentrum Demo Ort 03', label: 'Mo – Do', tone: 'green' },
    { id: 'rh13-3', vehicle: 'DEMO-13', time: '12:45 – 13:30', route: 'Förderzentrum Demo Ort 03', label: 'Fr', tone: 'green' },
    { id: 'rh11-1', vehicle: 'DEMO-11', time: '06:30 – 08:15', route: 'Förderzentrum Demo Ort 04', label: 'Mo – Fr', tone: 'green' },
    { id: 'rh11-2', vehicle: 'DEMO-11', time: '15:05', route: 'Förderzentrum Demo Ort 04', label: 'Mo – Do', tone: 'green' },
    { id: 'rh11-3', vehicle: 'DEMO-11', time: '12:15', route: 'Förderzentrum Demo Ort 04', label: 'Fr', tone: 'green' },
    { id: 'rh11-4', vehicle: 'DEMO-11', time: '16:25 – 16:53', route: 'Demo Ort 10 Busbahnhof → Demo Ort 18, Ort', label: 'Nur Mi + Do', tone: 'cyan' },
    { id: 'rh5-1', vehicle: 'DEMO-5', time: '06:30 – 08:15', route: 'Förderzentrum Demo Ort 04', label: 'Mo – Fr', tone: 'green' },
    { id: 'rh5-2', vehicle: 'DEMO-5', time: '15:05', route: 'Förderzentrum Demo Ort 04', label: 'Mo – Do', tone: 'green' },
    { id: 'rh5-3', vehicle: 'DEMO-5', time: '12:15', route: 'Förderzentrum Demo Ort 04', label: 'Fr', tone: 'green' },
    { id: 'rh89-1', vehicle: 'DEMO-89', time: '06:30 – 06:46', route: 'Demo Ort 19 → Demo Ort 20', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-2', vehicle: 'DEMO-89', time: '07:25 – 07:42', route: 'Demo Ort 21 → Demo Ort 10 Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-3', vehicle: 'DEMO-89', time: '07:59 – 08:07', route: 'Demo Ort 22 → Demo Ort 10 Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-4', vehicle: 'DEMO-89', time: '08:07 – 08:18', route: 'Demo Ort 10 Busbahnhof → Demo Ort 10 Kiga', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-5', vehicle: 'DEMO-89', time: '11:48 – 12:00', route: 'Demo Ort 13 Feuerwehr → Demo Ort 23', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-6', vehicle: 'DEMO-89', time: '12:15 – 12:31', route: 'Demo Ort 24 Schule → Demo Ort 25', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-7', vehicle: 'DEMO-89', time: '12:45 – 13:01', route: 'Demo Ort 13 GS/KG → Demo Ort 26, I. d. Holl', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-8', vehicle: 'DEMO-89', time: '13:10 – 13:45', route: 'Demo Ort 03 BBS → Demo Ort 04 ZOB', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-9', vehicle: 'DEMO-89', time: '13:50 – 14:27', route: 'Demo Ort 04 ZOB → Demo Ort 10 Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-10', vehicle: 'DEMO-89', time: '16:05 – 16:33', route: 'Demo Ort 10 Kiga → Demo Ort 19', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh102-1', vehicle: 'DEMO-102', time: '07:07 – 07:35', route: 'Demo Ort 27 → Demo Ort 13', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh102-2', vehicle: 'DEMO-102', time: '08:02 – 08:20', route: 'Demo Ort 26 → Demo Ort 13 Kiga', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh102-3', vehicle: 'DEMO-102', time: '12:15 – 12:52', route: 'Demo Ort 10 Kiga → Demo Ort 19', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh102-4', vehicle: 'DEMO-102', time: '13:15 – 13:48', route: 'Demo Ort 10 KiTa → Demo Ort 19 Ort', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh92-1', vehicle: 'DEMO-92', time: '07:19 – 07:54', route: 'Demo Ort 19 → Demo Ort 10 Grund- und Realschule plus', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh92-2', vehicle: 'DEMO-92', time: '07:59 – 08:35', route: 'Demo Ort 19 → Demo Ort 10 Kindergarten', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh92-3', vehicle: 'DEMO-92', time: '12:15 – 12:59', route: 'Demo Ort 10 Kiga → Demo Ort 24', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh92-4', vehicle: 'DEMO-92', time: '13:12 – 13:56', route: 'Demo Ort 24 → Demo Ort 10 G u. RS', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh775-1', vehicle: 'DEMO-775', time: '05:50 – 06:37', route: 'Demo Ort 28 → Demo Ort 05 Bahnhof', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-2', vehicle: 'DEMO-775', time: '07:12 – 07:52', route: 'Demo Ort 02 → Demo Ort 10 G u. RS', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-3', vehicle: 'DEMO-775', time: '08:05 – 08:24', route: 'Demo Ort 01 Abzw. → Demo Ort 28 Kirche', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-4', vehicle: 'DEMO-775', time: '11:55 – 12:11', route: 'Demo Ort 28 Römerhügel → Demo Ort 29', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-5', vehicle: 'DEMO-775', time: '12:50 – 13:07', route: 'Demo Ort 28 Römerhügel → Demo Ort 02', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-6', vehicle: 'DEMO-775', time: '13:20 – 13:48', route: 'Demo Ort 10 Busbahnhof → Demo Ort 30', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-7', vehicle: 'DEMO-775', time: '16:05 – 16:32', route: 'Demo Ort 10 Kiga und Schulzentrum → Demo Ort 21', label: 'Nur Mi + Do', tone: 'blue' },
    { id: 'rh775-8', vehicle: 'DEMO-775', time: '16:25 – 16:53', route: 'Demo Ort 10 Busbahnhof → Demo Ort 18, Ort', label: 'Nicht Mi + Do', tone: 'cyan' },
    { id: 'rh93-1', vehicle: 'DEMO-93', time: '07:12 – 07:54', route: 'Demo Ort 24 → Demo Ort 10 G u. RS', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-2', vehicle: 'DEMO-93', time: '08:04 – 08:18', route: 'Demo Ort 31 → Demo Ort 28 Römerhügel', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-3', vehicle: 'DEMO-93', time: '11:50 – 12:07', route: 'Demo Ort 28 Römerhügel → Demo Ort 02', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-4', vehicle: 'DEMO-93', time: '12:53 – 13:13', route: 'Demo Ort 28 Römerhügel → Demo Ort 32', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-5', vehicle: 'DEMO-93', time: '13:16 – 13:54', route: 'Demo Ort 10 G u. RS → Demo Ort 02', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-6', vehicle: 'DEMO-93', time: '16:25', route: 'Demo Ort 10 G u. RS → Demo Ort 02', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-7', vehicle: 'DEMO-93', time: '17:15 – 17:53', route: 'Demo Ort 05 Bahnhof → Demo Ort 33', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh94-1', vehicle: 'DEMO-94', time: '06:27 – 07:13', route: 'Demo Ort 34 → Demo Ort 04 ZOB', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-2', vehicle: 'DEMO-94', time: '07:16 – 07:59', route: 'Demo Ort 04 ZOB → Demo Ort 03 GS', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-3', vehicle: 'DEMO-94', time: '12:14 – 12:49', route: 'Demo Ort 10 Grund- und Realschule plus → Demo Ort 35', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-4', vehicle: 'DEMO-94', time: '13:19 – 14:12', route: 'Demo Ort 10 Grund- und Realschule plus → Demo Ort 05 Bahnhof', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-5', vehicle: 'DEMO-94', time: '15:22 – 16:02', route: 'Demo Ort 06 Endertplatz → Demo Ort 36 Kirchstraße', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-6', vehicle: 'DEMO-94', time: '16:15 – 16:29', route: 'Demo Ort 37 Kirchstraße → Demo Ort 05 Bahnhof', label: 'Nur Mo – Do', tone: 'blue' },
    { id: 'rh94-7', vehicle: 'DEMO-94', time: '16:33 – 17:21', route: 'Demo Ort 05 Bahnhof → Demo Ort 10 Busbahnhof', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh91-1', vehicle: 'DEMO-91', time: '07:04 – 07:28', route: 'Demo Ort 38 → Demo Ort 03', label: 'SEV RMV', tone: 'amber' },
    { id: 'rh91-2', vehicle: 'DEMO-91', time: '07:41 – 08:00', route: 'Demo Ort 39 → Demo Ort 03', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-3', vehicle: 'DEMO-91', time: '12:09 – 12:40', route: 'Demo Ort 09 → Demo Ort 40', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-4', vehicle: 'DEMO-91', time: '13:16 – 14:00', route: 'Demo Ort 09 → Demo Ort 04', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-5', vehicle: 'DEMO-91', time: '15:16 – 16:00', route: 'Demo Ort 04 → Demo Ort 09', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-6', vehicle: 'DEMO-91', time: '16:11 – 16:56', route: 'Demo Ort 09 → Demo Ort 04', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh98-1', vehicle: 'DEMO-98', time: '06:11 – 07:23', route: 'Demo Ort 35 → Demo Ort 04', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh98-2', vehicle: 'DEMO-98', time: '12:14 – 12:44', route: 'Demo Ort 10 KiTa → Demo Ort 21 Ort', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh98-3', vehicle: 'DEMO-98', time: '13:17 – 13:44', route: 'Demo Ort 10 Busbahnhof → Demo Ort 21 Oberdorf', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh98-4', vehicle: 'DEMO-98', time: '16:05 – 16:32', route: 'Demo Ort 10 Kiga und Schulzentrum → Demo Ort 21', label: 'Nicht Mi + Do', tone: 'blue' },
    { id: 'rh101-1', vehicle: 'DEMO-101', time: '06:25 – 07:36', route: 'Demo Ort 41 → Demo Ort 03', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-2', vehicle: 'DEMO-101', time: '08:18 – 08:44', route: 'Demo Ort 25 → Demo Ort 04 ZOB', label: 'Nur Mo + Di', tone: 'cyan' },
    { id: 'rh101-3', vehicle: 'DEMO-101', time: '11:55 – 12:41', route: 'Demo Ort 03 → Demo Ort 42', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-4', vehicle: 'DEMO-101', time: '12:57 – 13:41', route: 'Demo Ort 03 → Demo Ort 42', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-5', vehicle: 'DEMO-101', time: '13:42 – 14:16', route: 'Demo Ort 42 → Demo Ort 41', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-6', vehicle: 'DEMO-101', time: '15:42 – 16:21', route: 'Demo Ort 03 → Demo Ort 42', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-7', vehicle: 'DEMO-101', time: '16:22 – 16:56', route: 'Demo Ort 42 → Demo Ort 41', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-8', vehicle: 'DEMO-101', time: '17:02 – 17:52', route: 'Demo Ort 24 → Demo Ort 10 Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh96-1', vehicle: 'DEMO-96', time: '07:14 – 07:54', route: 'Demo Ort 31 → Demo Ort 10 GRS+', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-2', vehicle: 'DEMO-96', time: '08:18 – 08:44', route: 'Demo Ort 25 → Demo Ort 04 ZOB', label: 'Nur Mi + Do + Fr', tone: 'blue' },
    { id: 'rh96-3', vehicle: 'DEMO-96', time: '11:45 – 12:10', route: 'Demo Ort 13 → Demo Ort 25', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-4', vehicle: 'DEMO-96', time: '12:52 – 13:12', route: 'Demo Ort 28 → Demo Ort 05', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-5', vehicle: 'DEMO-96', time: '13:19 – 13:44', route: 'Demo Ort 05 → Demo Ort 28', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-6', vehicle: 'DEMO-96', time: '13:45 – 14:01', route: 'Demo Ort 28 → Demo Ort 29', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-7', vehicle: 'DEMO-96', time: '16:11 – 17:02', route: 'Demo Ort 10 Kiga → Demo Ort 24', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh90-1', vehicle: 'DEMO-90', time: '–', route: 'Demo Ort 43 (HEB Umlauf)', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh90-2', vehicle: 'DEMO-90', time: '06:45 – 07:47', route: 'Demo Ort 44 → Demo Ort 45', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh90-3', vehicle: 'DEMO-90', time: '13:23 – 13:55', route: 'Demo Ort 46 → Demo Ort 03', label: 'SEV für RMV', tone: 'rose' },
    { id: 'rh90-4', vehicle: 'DEMO-90', time: '22:13 – 00:51', route: 'Demo Ort 03 → Demo Ort 47 (Wechsel in Demo Ort 48)', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-1', vehicle: 'DEMO-96/14', time: '–', route: 'Demo Ort 43', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-2', vehicle: 'DEMO-96/14', time: '06:28 – 06:48', route: 'Demo Ort 49 → Demo Ort 03', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-3', vehicle: 'DEMO-96/14', time: '07:18 – 07:42', route: 'Demo Ort 38 → Demo Ort 03', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-4', vehicle: 'DEMO-96/14', time: '13:15 – 13:59', route: 'Demo Ort 50 → Demo Ort 51', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-5', vehicle: 'DEMO-96/14', time: '15:25 – 16:00', route: 'Demo Ort 03 → Demo Ort 04', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh9614-6', vehicle: 'DEMO-96/14', time: '16:00 – 17:06', route: 'Demo Ort 04 → Demo Ort 33', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'night1-1', vehicle: 'DEMO-Nacht 1', time: '23:25 – 00:59', route: 'Demo Ort 52 → Demo Ort 03', label: 'Nur Mo – Do', tone: 'rose' },
    { id: 'night1-2', vehicle: 'DEMO-Nacht 1', time: '23:55 – 01:29', route: 'Demo Ort 52 → Demo Ort 03', label: 'Nur Fr', tone: 'rose' },
    { id: 'night2-1', vehicle: 'DEMO-Nacht 2', time: '00:55 – 02:29', route: 'Demo Ort 52 → Demo Ort 03', label: 'Nur Fr auf Sa', tone: 'amber' },
    { id: 'demo-weekend', vehicle: 'Demo Wochenende', time: '22:13 – 00:51', route: 'Demo Ort 03 → Demo Ort 47 (Wechsel in Demo Ort 48)', label: 'Sa + So', tone: 'amber' },
    { id: 'rmb-sa', vehicle: 'DEMO-WE Samstag', time: '14:17 – 22:48', route: 'DEMO-WE', label: 'Sa', tone: 'blue' },
    { id: 'rmb-so-a', vehicle: 'DEMO-WE Sonntag A', time: '08:17 – 14:48', route: 'DEMO-WE', label: 'So', tone: 'blue' },
    { id: 'rmb-so-b-1', vehicle: 'DEMO-WE Sonntag B', time: '15:13 – 21:42', route: 'DEMO-WE', label: 'So', tone: 'violet' },
    { id: 'rmb-so-b-2', vehicle: 'DEMO-WE Sonntag B', time: '23:55 – 01:29', route: 'Demo Ort 52 → Demo Ort 03', label: 'So', tone: 'rose' },
  ];

  protected readonly driverPortalStops = [
    { time: '06:05', place: 'Demo Ort 01', meta: 'Abfahrt · Start' },
    { time: '06:50', place: 'Demo Halt A', meta: 'Planmäßiger Halt' },
    { time: '08:05', place: 'Demo Ort 13', meta: 'Planmäßiger Halt' },
    { time: '11:00', place: 'Demo Ort 03', meta: 'Pause · 30 Min.' },
    { time: '12:12', place: 'Demo Ort 47', meta: 'Fahrzeugwechsel' },
    { time: '14:24', place: 'Demo Ort 02', meta: 'Ankunft · Ende' },
  ];

  protected readonly selectedShift = computed(
    () => this.shifts.find((shift) => shift.id === this.selectedShiftId()) ?? this.shifts[6],
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
    () => this.fleetVehicles.find((vehicle) => vehicle.id === this.selectedVehicleId()) ?? this.fleetVehicles[3],
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
    () => this.drivers.find((driver) => driver.id === this.selectedDriverId()) ?? this.drivers[3],
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
    window.setTimeout(() => this.saved.set(false), 2600);
  }

  protected deleteSelectedAssignment(): void {
    const index = this.shifts.findIndex((shift) => shift.id === this.selectedShiftId());
    if (index < 0) return;
    this.shifts.splice(index, 1);
    this.selectedShiftId.set(this.shifts[0]?.id ?? '');
    this.assignmentPanelOpen.set(false);
    this.saved.set(false);
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
    const draft: DutyPlanDraft = {
      ...this.dutyPlanDraft,
      name: this.dutyPlanDraft.name.trim(),
      route: this.dutyPlanDraft.route.trim(),
      breakTime: this.dutyPlanDraft.breakTime.trim(),
      stops: this.dutyPlanDraft.stops.map((stop) => stop.trim()),
    };
    if (!draft.name || !draft.route || !draft.start || !draft.end || !draft.breakTime || !draft.weekdays) {
      this.dutyPlanEditError.set('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    if (draft.stops.length < 2 || draft.stops.some((stop) => !stop)) {
      this.dutyPlanEditError.set('Bitte geben Sie mindestens zwei vollständige Haltestellen an.');
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
    window.setTimeout(() => this.dutyPlanSaved.set(false), 2400);
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
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.driver-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected saveDriver(): void {
    this.driverSaved.set(true);
    window.setTimeout(() => this.driverSaved.set(false), 2400);
  }

  protected openNewDriverForm(): void {
    this.newDriver = this.emptyDriverDraft();
    this.driverFormError.set('');
    this.driverFormOpen.set(true);
  }

  protected closeNewDriverForm(): void {
    this.driverFormOpen.set(false);
    this.driverFormError.set('');
  }

  protected createDriver(): void {
    const draft: DriverDraft = {
      ...this.newDriver,
      name: this.newDriver.name.trim(),
      phone: this.newDriver.phone.trim(),
      email: this.newDriver.email.trim().toLocaleLowerCase('de'),
      license: this.newDriver.license.trim(),
    };

    if (!draft.name || !draft.phone || !draft.email || !draft.license || !draft.licenseExpiry || !draft.medicalCheck) {
      this.driverFormError.set('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      this.driverFormError.set('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (this.drivers.some((driver) => driver.email.toLocaleLowerCase('de') === draft.email)) {
      this.driverFormError.set('Ein Fahrer mit dieser E-Mail-Adresse ist bereits vorhanden.');
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
    window.setTimeout(() => {
      if (this.driverCreated() === driver.name) this.driverCreated.set(null);
    }, 3200);
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

  protected selectAbsence(absence: Absence): void {
    this.selectedAbsenceId.set(absence.id);
    this.absenceSaved.set(false);
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.absence-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected saveAbsence(): void {
    this.absenceSaved.set(true);
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
    window.setTimeout(() => this.specialTripSaved.set(false), 2400);
  }

  protected selectMessage(thread: MessageThread): void {
    this.selectedMessageId.set(thread.id);
    this.unreadMessageIds.update((ids) => ids.filter((id) => id !== thread.id));
    this.messageReply.set('');
    this.messageSent.set(false);
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.message-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected markAllMessagesRead(): void {
    this.unreadMessageIds.set([]);
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
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  protected completeDriverShift(): void {
    if (!this.canCompleteDriverShift()) return;
    this.driverShiftState.set('completed');
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
    window.setTimeout(() => this.saved.set(false), 2600);
  }
}
