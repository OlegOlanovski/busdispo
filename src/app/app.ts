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
  protected readonly selectedShiftId = signal('xls-3-dau-rh-91');
  protected readonly selectedVehicleId = signal('DAU-RH 91');
  protected readonly vehicleSearch = signal('');
  protected readonly vehicleStatus = signal('Alle Status');
  protected readonly vehicleSaved = signal(false);
  protected readonly selectedDutyPlanId = signal('standard-rh91');
  protected readonly dutyPlanSearch = signal('');
  protected readonly dutyPlanStatus = signal('Alle Status');
  protected readonly dutyPlanSaved = signal(false);
  protected readonly selectedDriverId = signal('olanovski');
  protected readonly driverSearch = signal('');
  protected readonly driverStatus = signal('Alle Status');
  protected readonly driverSaved = signal(false);
  protected readonly driverFormOpen = signal(false);
  protected readonly driverFormError = signal('');
  protected readonly driverCreated = signal<string | null>(null);
  private readonly driverRevision = signal(0);
  protected newDriver: DriverDraft = this.emptyDriverDraft();
  protected readonly selectedAbsenceId = signal('blum-vacation');
  protected readonly absenceSearch = signal('');
  protected readonly absenceType = signal('Alle Arten');
  protected readonly absenceSaved = signal(false);
  protected readonly selectedSpecialTripId = signal('rheinbach-day-trip');
  protected readonly specialTripSearch = signal('');
  protected readonly specialTripStatus = signal('Alle Status');
  protected readonly specialTripSaved = signal(false);
  protected readonly selectedMessageId = signal('olanovski-delay');
  protected readonly messageSearch = signal('');
  protected readonly messageFilter = signal('Alle Nachrichten');
  protected readonly unreadMessageIds = signal(['olanovski-delay', 'rheinbach-passengers', 'rh11-service']);
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
    vehicle: 'DAU-RH 91',
    day: 0,
    driver: '',
    plan: 'Standard RH 91',
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
    { id: 'DAU-RH 13', displayLabel: 'DAU RH13', lineLabel: 'RH 13', seats: 0, tone: 'green', start: '07:00', end: '16:00' },
    { id: 'DAU-RH 11', displayLabel: 'DAU RH11', lineLabel: 'RH 11', seats: 0, tone: 'green', start: '06:30', end: '16:53' },
    { id: 'DAU-RH 5', displayLabel: 'DAU RH5', lineLabel: 'RH 5', seats: 0, tone: 'green', start: '06:30', end: '15:05' },
    { id: 'DAU-RH 89', displayLabel: 'DAU RH89', lineLabel: 'RH 89', seats: 0, tone: 'cyan', start: '06:30', end: '16:33' },
    { id: 'DAU-RH 102', displayLabel: 'DAU RH102', lineLabel: 'RH 102', seats: 0, tone: 'blue', start: '07:07', end: '13:48' },
    { id: 'DAU-RH 92', displayLabel: 'DAU RH92', lineLabel: 'RH 92', seats: 0, tone: 'cyan', start: '07:19', end: '13:56' },
    { id: 'DAU-RH 775', displayLabel: 'DAU RH775', lineLabel: 'RH 775', seats: 0, tone: 'blue', start: '05:50', end: '16:53' },
    { id: 'DAU-RH 93', displayLabel: 'DAU RH93', lineLabel: 'RH 93', seats: 0, tone: 'cyan', start: '07:12', end: '17:53' },
    { id: 'DAU-RH 94', displayLabel: 'DAU RH94', lineLabel: 'RH 94', seats: 0, tone: 'blue', start: '06:27', end: '17:21' },
    { id: 'DAU-RH 91', displayLabel: 'DAU RH91', lineLabel: 'RH 91', seats: 0, tone: 'violet', start: '07:04', end: '16:56' },
    { id: 'DAU-RH 98', displayLabel: 'DAU RH98', lineLabel: 'RH 98', seats: 0, tone: 'blue', start: '06:11', end: '16:32' },
    { id: 'DAU-RH 101', displayLabel: 'DAU RH101', lineLabel: 'RH 101', seats: 0, tone: 'cyan', start: '06:25', end: '17:52' },
    { id: 'DAU-RH 96', displayLabel: 'DAU RH96', lineLabel: 'RH 96', seats: 0, tone: 'blue', start: '07:14', end: '17:02' },
    { id: 'DAU-RH 90', displayLabel: 'DAU RH90', lineLabel: 'RH 90', seats: 0, tone: 'amber', start: '06:45', end: '00:51' },
    { id: 'DAU-RH 96/14', displayLabel: 'DAU RH96/14', lineLabel: 'RH 96/14', seats: 0, tone: 'amber', start: '06:28', end: '17:06' },
    { id: 'DAU-RH Nacht 1', displayLabel: 'DAU RH Nacht', lineLabel: 'RH Nacht', seats: 0, tone: 'rose', start: '23:25', end: '01:29' },
    { id: 'DAU-RH Nacht 2', displayLabel: 'DAU RH Fr/Sa', lineLabel: 'RH Fr/Sa', seats: 0, tone: 'amber', start: '00:55', end: '02:29' },
    { id: 'Wochenende Trier', displayLabel: 'Wochenende', lineLabel: 'Sa/So', seats: 0, tone: 'amber', start: '22:13', end: '00:51' },
    { id: 'RMB 520 Samstag', displayLabel: 'RMB 520 Sa', lineLabel: 'RMB 520 Sa', seats: 0, tone: 'blue', start: '14:17', end: '22:48' },
    { id: 'RMB 520 Sonntag A', displayLabel: 'RMB 520 So', lineLabel: 'RMB 520 So', seats: 0, tone: 'blue', start: '08:17', end: '14:48' },
    { id: 'RMB 520 Sonntag B', displayLabel: 'RMB 520 So', lineLabel: 'RMB 520 So', seats: 0, tone: 'violet', start: '15:13', end: '21:42' },
  ];
  protected readonly planningGridWidth = 96 + this.vehicles.length * 135;

  protected readonly fleetVehicles: FleetVehicle[] = [
    { id: 'DAU-RH 102', seats: 52, model: 'Mercedes-Benz Intouro', year: 2021, mileage: '184.320 km', status: 'Einsatz', driver: 'Koch', inspection: '14.11.2026', safetyInspection: '14.08.2026' },
    { id: 'DAU-RH 515', seats: 58, model: 'MAN Lion\'s Intercity', year: 2022, mileage: '128.740 km', status: 'Einsatz', driver: 'Zeyen B.', inspection: '02.02.2027', safetyInspection: '02.08.2026' },
    { id: 'DAU-RH 94', seats: 52, model: 'Setra S 415 UL', year: 2019, mileage: '267.810 km', status: 'Einsatz', driver: 'Block', inspection: '28.09.2026', safetyInspection: '28.08.2026' },
    { id: 'DAU-RH 91', seats: 52, model: 'Mercedes-Benz Intouro', year: 2020, mileage: '221.450 km', status: 'Einsatz', driver: 'Olanovski', inspection: '18.08.2026', safetyInspection: '18.11.2026' },
    { id: 'DAU-RH 11', seats: 56, model: 'IVECO Crossway', year: 2018, mileage: '312.090 km', status: 'Werkstatt', driver: '–', inspection: '05.08.2026', safetyInspection: '05.08.2026' },
    { id: 'DAU-RH 8', seats: 53, model: 'Setra S 415 LE', year: 2023, mileage: '74.620 km', status: 'Verfügbar', driver: 'Vater Ilias', inspection: '21.04.2027', safetyInspection: '21.10.2026' },
  ];

  protected readonly dutyPlans: DutyPlan[] = [
    { id: 'standard-rh91', name: 'Standard RH 91', route: 'Mannbach → Kötterichen', start: '06:05', end: '14:24', duration: '8h 19m', breakTime: '30m', stops: ['Mannbach', 'Auel Kirche', 'Dockweiler', 'Gerolstein', 'Trier', 'Kötterichen'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'violet' },
    { id: 'standard-rh102', name: 'Standard RH 102', route: 'Gerolstein → Daun', start: '06:05', end: '14:20', duration: '8h 15m', breakTime: '30m', stops: ['Gerolstein', 'Pelm', 'Dockweiler', 'Daun ZOB'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'green' },
    { id: 'standard-rh515', name: 'Standard RH 515', route: 'Ulmen → Cochem', start: '07:30', end: '15:45', duration: '8h 15m', breakTime: '45m', stops: ['Ulmen', 'Büchel', 'Faid', 'Cochem Bahnhof'], weekdays: 'Mo – Fr', assignedVehicles: 1, status: 'Aktiv', tone: 'blue' },
    { id: 'standard-rh94', name: 'Standard RH 94', route: 'Adenau → Mayen', start: '08:00', end: '16:10', duration: '8h 10m', breakTime: '30m', stops: ['Adenau', 'Kelberg', 'Boos', 'Mayen Ost'], weekdays: 'Mo – Sa', assignedVehicles: 1, status: 'Aktiv', tone: 'orange' },
    { id: 'school-service', name: 'Schulverkehr Daun', route: 'Daun → Gillenfeld', start: '06:40', end: '08:15', duration: '1h 35m', breakTime: '–', stops: ['Daun ZOB', 'Rengen', 'Mehren', 'Gillenfeld Schule'], weekdays: 'Mo – Fr', assignedVehicles: 2, status: 'Entwurf', tone: 'cyan' },
    { id: 'winter-relief', name: 'Winter Verstärker', route: 'Kelberg → Nürburgring', start: '05:50', end: '09:20', duration: '3h 30m', breakTime: '–', stops: ['Kelberg', 'Nürburg', 'Nürburgring'], weekdays: 'Mo – Fr', assignedVehicles: 0, status: 'Archiviert', tone: 'blue' },
  ];

  protected readonly drivers: Driver[] = [
    { id: 'koch', name: 'Koch', initials: 'K', phone: '+49 6592 410 221', email: 'koch@busdispo.de', status: 'Im Einsatz', vehicle: 'DAU-RH 102', shift: '06:05 – 14:20', weeklyHours: 32, targetHours: 40, overtime: '+2h 15m', license: 'D, DE', licenseExpiry: '18.03.2028', medicalCheck: '12.01.2027', color: 'green' },
    { id: 'zeyen', name: 'Zeyen B.', initials: 'ZB', phone: '+49 6592 410 228', email: 'zeyen@busdispo.de', status: 'Im Einsatz', vehicle: 'DAU-RH 515', shift: '07:30 – 15:45', weeklyHours: 33, targetHours: 40, overtime: '+1h 40m', license: 'D, DE', licenseExpiry: '09.11.2027', medicalCheck: '22.04.2027', color: 'blue' },
    { id: 'block', name: 'Block', initials: 'B', phone: '+49 6592 410 235', email: 'block@busdispo.de', status: 'Im Einsatz', vehicle: 'DAU-RH 94', shift: '08:00 – 16:10', weeklyHours: 32.5, targetHours: 40, overtime: '−0h 30m', license: 'D, DE', licenseExpiry: '27.08.2029', medicalCheck: '04.03.2027', color: 'orange' },
    { id: 'olanovski', name: 'Olanovski', initials: 'O', phone: '+49 6592 410 244', email: 'olanovski@busdispo.de', status: 'Im Einsatz', vehicle: 'DAU-RH 91', shift: '06:05 – 14:24', weeklyHours: 33.3, targetHours: 40, overtime: '+3h 05m', license: 'D, DE', licenseExpiry: '16.12.2027', medicalCheck: '18.09.2026', color: 'violet' },
    { id: 'spinger', name: 'Spinger', initials: 'S', phone: '+49 6592 410 251', email: 'spinger@busdispo.de', status: 'Im Einsatz', vehicle: 'DAU-RH 11', shift: '06:30 – 14:40', weeklyHours: 32.7, targetHours: 40, overtime: '+0h 55m', license: 'D, DE', licenseExpiry: '05.05.2028', medicalCheck: '30.11.2026', color: 'cyan' },
    { id: 'vater-ilias', name: 'Vater Ilias', initials: 'VI', phone: '+49 6592 410 267', email: 'ilias@busdispo.de', status: 'Verfügbar', vehicle: '–', shift: 'Kein Einsatz', weeklyHours: 24, targetHours: 40, overtime: '−1h 20m', license: 'D, DE', licenseExpiry: '14.02.2029', medicalCheck: '08.06.2027', color: 'rose' },
    { id: 'kyriakos', name: 'Kyriakos', initials: 'K', phone: '+49 6592 410 273', email: 'kyriakos@busdispo.de', status: 'Abwesend', vehicle: '–', shift: 'Krank', weeklyHours: 16, targetHours: 40, overtime: '+0h 10m', license: 'D, DE', licenseExpiry: '25.07.2028', medicalCheck: '11.10.2026', color: 'orange' },
  ];

  protected readonly absences: Absence[] = [
    { id: 'kyriakos-sick', driver: 'Kyriakos', initials: 'K', type: 'Krank', start: '25.07.2026', end: '25.07.2026', duration: '1 Tag', workingDays: 1, status: 'Aktiv', note: 'Krankmeldung liegt vor.', conflicts: 1, color: 'rose' },
    { id: 'blum-vacation', driver: 'Blum/Böhnke', initials: 'BB', type: 'Urlaub', start: '20.07.2026', end: '08.08.2026', duration: '20 Tage', workingDays: 15, status: 'Aktiv', note: 'Genehmigter Sommerurlaub.', conflicts: 3, color: 'blue' },
    { id: 'koch-training', driver: 'Koch', initials: 'K', type: 'Fortbildung', start: '03.08.2026', end: '04.08.2026', duration: '2 Tage', workingDays: 2, status: 'Geplant', note: 'Schulung Fahrgastsicherheit.', conflicts: 2, color: 'green' },
    { id: 'zeyen-vacation', driver: 'Zeyen B.', initials: 'ZB', type: 'Urlaub', start: '10.08.2026', end: '14.08.2026', duration: '5 Tage', workingDays: 5, status: 'Geplant', note: 'Genehmigter Erholungsurlaub.', conflicts: 0, color: 'violet' },
    { id: 'spinger-other', driver: 'Spinger', initials: 'S', type: 'Sonstige', start: '18.08.2026', end: '18.08.2026', duration: '1 Tag', workingDays: 1, status: 'Geplant', note: 'Behördentermin.', conflicts: 1, color: 'orange' },
    { id: 'block-training', driver: 'Block', initials: 'B', type: 'Fortbildung', start: '06.07.2026', end: '07.07.2026', duration: '2 Tage', workingDays: 2, status: 'Beendet', note: 'Eco-Training erfolgreich abgeschlossen.', conflicts: 0, color: 'green' },
  ];

  protected readonly specialTrips: SpecialTrip[] = [
    { id: 'rheinbach-day-trip', title: 'Ausflug Rheinbach', type: 'Tagesfahrt', date: '25.07.2026', start: '12:15', end: '19:15', from: 'Hönningen Zeltlagerplatz', to: 'Rheinbach Schwimmbad', stops: ['Hönningen Zeltlagerplatz', 'Adenau Markt', 'Rheinbach Schwimmbad'], driver: 'Kyriakos', vehicle: 'DAU-RH 11', passengers: 44, customer: 'Jugendfreizeit Hönningen', contact: 'Anna Schmitz', phone: '+49 2691 440 218', status: 'Geplant', note: 'Rückfahrt nach Ende des Schwimmbadbesuchs. Gepäckraum freihalten.', tone: 'rose' },
    { id: 'duesseldorf-transfer', title: 'Flughafentransfer', type: 'Transferfahrt', date: '26.07.2026', start: '23:00', end: '02:00', from: 'Düsseldorf Innenstadt', to: 'Mehren Ortsmitte', stops: ['Düsseldorf Innenstadt', 'Flughafen Düsseldorf', 'Mehren Ortsmitte'], driver: 'Vater Ilias', vehicle: 'DAU-RH 8', passengers: 31, customer: 'Reisegruppe Vulkaneifel', contact: 'Markus Weber', phone: '+49 6592 880 146', status: 'Geplant', note: 'Nachtfahrt. Flugankunft vor Abfahrt telefonisch bestätigen.', tone: 'blue' },
    { id: 'trier-club-trip', title: 'Vereinsausflug Trier', type: 'Vereinsfahrt', date: '01.08.2026', start: '08:30', end: '20:45', from: 'Daun ZOB', to: 'Trier Porta Nigra', stops: ['Daun ZOB', 'Gerolstein Bahnhof', 'Trier Porta Nigra'], driver: 'Olanovski', vehicle: 'DAU-RH 91', passengers: 49, customer: 'Sportverein Daun 1921', contact: 'Peter Lenz', phone: '+49 6592 731 009', status: 'Geplant', note: 'Ein Zustieg in Gerolstein. Rückfahrt um 19:00 Uhr.', tone: 'violet' },
    { id: 'cochem-school-trip', title: 'Schulausflug Cochem', type: 'Klassenfahrt', date: '04.08.2026', start: '07:45', end: '16:30', from: 'Gillenfeld Schule', to: 'Cochem Reichsburg', stops: ['Gillenfeld Schule', 'Ulmen Busbahnhof', 'Cochem Reichsburg'], driver: 'Noch offen', vehicle: 'DAU-RH 515', passengers: 53, customer: 'Grundschule Gillenfeld', contact: 'Laura Klein', phone: '+49 6573 340 112', status: 'Offen', note: 'Begleitpersonen: 4. Fahrerzuweisung noch erforderlich.', tone: 'orange' },
    { id: 'koblenz-transfer', title: 'Messe-Transfer Koblenz', type: 'Transferfahrt', date: '08.08.2026', start: '06:10', end: '18:20', from: 'Dockweiler', to: 'Koblenz Messegelände', stops: ['Dockweiler', 'Daun ZOB', 'Koblenz Messegelände'], driver: 'Noch offen', vehicle: 'Noch offen', passengers: 38, customer: 'Wirtschaftsforum Eifel', contact: 'Sabine Roth', phone: '+49 261 920 884', status: 'Offen', note: 'Fahrzeug und Fahrer müssen noch eingeplant werden.', tone: 'cyan' },
    { id: 'mayen-day-trip', title: 'Seniorenfahrt Mayen', type: 'Tagesfahrt', date: '18.07.2026', start: '09:00', end: '17:10', from: 'Kelberg Rathaus', to: 'Mayen Marktplatz', stops: ['Kelberg Rathaus', 'Boos Kirche', 'Mayen Marktplatz'], driver: 'Koch', vehicle: 'DAU-RH 102', passengers: 41, customer: 'Seniorenkreis Kelberg', contact: 'Maria Becker', phone: '+49 2692 618 330', status: 'Abgeschlossen', note: 'Fahrt planmäßig und ohne Vorkommnisse abgeschlossen.', tone: 'green' },
  ];

  protected readonly messageThreads: MessageThread[] = [
    { id: 'olanovski-delay', sender: 'Olanovski', initials: 'O', role: 'Fahrer · DAU-RH 91', subject: 'Verspätung auf der B257', preview: 'Wegen einer Baustelle komme ich voraussichtlich 15 Minuten später in Kötterichen an.', date: 'Heute', time: '11:42', category: 'Fahrer', body: ['Hallo Sebi,', 'wegen einer kurzfristigen Baustelle auf der B257 verzögert sich die Fahrt. Ich rechne aktuell mit etwa 15 Minuten Verspätung bei der Ankunft in Kötterichen.', 'Die Fahrgäste sind informiert. Ich melde mich, falls sich die Situation verändert.'], relatedLabel: 'Einsatz in Wochenplanung öffnen', relatedView: 'planning', tone: 'violet' },
    { id: 'rheinbach-passengers', sender: 'Anna Schmitz', initials: 'AS', role: 'Kundin · Jugendfreizeit Hönningen', subject: 'Teilnehmerzahl für Rheinbach', preview: 'Die endgültige Teilnehmerzahl für Samstag beträgt 44 Personen inklusive Betreuung.', date: 'Heute', time: '10:18', category: 'Kunde', body: ['Guten Morgen,', 'für unsere Tagesfahrt nach Rheinbach am Samstag sind es endgültig 44 Personen, davon vier Betreuungskräfte.', 'Bitte bestätigen Sie kurz, dass der eingeplante Bus ausreichend Sitzplätze hat. Vielen Dank!'], relatedLabel: 'Sonderfahrt anzeigen', relatedView: 'trips', tone: 'rose' },
    { id: 'rh11-service', sender: 'Werkstatt Daun', initials: 'WD', role: 'Servicepartner', subject: 'DAU-RH 11 ab 15 Uhr verfügbar', preview: 'Die Sicherheitsprüfung ist abgeschlossen. Das Fahrzeug kann heute ab 15 Uhr abgeholt werden.', date: 'Heute', time: '09:05', category: 'System', body: ['Guten Morgen,', 'die Arbeiten und die Sicherheitsprüfung am Fahrzeug DAU-RH 11 sind abgeschlossen.', 'Der Bus kann heute ab 15:00 Uhr abgeholt und wieder eingesetzt werden.'], relatedLabel: 'Fahrzeugdetails anzeigen', relatedView: 'vehicles', tone: 'orange' },
    { id: 'kyriakos-certificate', sender: 'Kyriakos', initials: 'K', role: 'Fahrer', subject: 'Krankmeldung eingereicht', preview: 'Die Bescheinigung für meine heutige Abwesenheit habe ich soeben hochgeladen.', date: 'Gestern', time: '18:26', category: 'Fahrer', body: ['Hallo,', 'die Arbeitsunfähigkeitsbescheinigung für meine heutige Abwesenheit ist jetzt vollständig eingereicht.', 'Bei Rückfragen bin ich telefonisch erreichbar.'], relatedLabel: 'Abwesenheit anzeigen', relatedView: 'absence', tone: 'orange' },
    { id: 'system-plan', sender: 'BusDispo System', initials: 'BD', role: 'Automatische Meldung', subject: 'Wochenplan erfolgreich veröffentlicht', preview: 'Der Plan für KW 30 wurde an fünf Fahrer verteilt. Zwei Einsätze sind weiterhin offen.', date: 'Gestern', time: '16:02', category: 'System', body: ['Der Wochenplan für KW 30 wurde erfolgreich veröffentlicht.', 'Fünf Fahrer haben ihre Zuweisung erhalten. Für zwei offene Einsätze ist noch keine Fahrerin oder kein Fahrer hinterlegt.'], relatedLabel: 'Wochenplanung prüfen', relatedView: 'planning', tone: 'blue' },
    { id: 'zeyen-shift', sender: 'Zeyen B.', initials: 'ZB', role: 'Fahrer · DAU-RH 515', subject: 'Rückfrage zum Dienst am Freitag', preview: 'Bleibt der Fahrzeugwechsel in Cochem wie im aktuellen Dienstplan hinterlegt?', date: '30.07.2026', time: '14:37', category: 'Fahrer', body: ['Hallo Sebi,', 'bleibt der Fahrzeugwechsel in Cochem am Freitag wie im aktuellen Dienstplan eingetragen?', 'Dann plane ich meine Pause entsprechend. Danke für eine kurze Rückmeldung.'], relatedLabel: 'Dienstplan anzeigen', relatedView: 'schedules', tone: 'blue' },
    { id: 'cochem-request', sender: 'Laura Klein', initials: 'LK', role: 'Grundschule Gillenfeld', subject: 'Abfahrtszeit Schulausflug', preview: 'Könnten wir die Abfahrt am 4. August auf 07:30 Uhr vorziehen?', date: '29.07.2026', time: '12:10', category: 'Kunde', body: ['Guten Tag,', 'für den Schulausflug nach Cochem würden wir die Abfahrt gerne von 07:45 Uhr auf 07:30 Uhr vorziehen.', 'Wäre diese Änderung für Sie möglich? Die Teilnehmerzahl bleibt unverändert.'], relatedLabel: 'Sonderfahrt anzeigen', relatedView: 'trips', tone: 'green' },
  ];

  private readonly weeklyDriverAssignments: string[][] = [
    ['Steffes R.', 'Zeyen B.', 'Kettel H.', 'Blum', 'Böhnke', 'Bohlenschmidt', 'Koch', 'Otto', 'Di Giacomo', 'Olanovski', 'Mayer', 'Grab', 'Zahnd / Ilias / Zahnd', 'Kettel / Vater Ilias', 'Ilias / Spinger', 'Mahrouk', '', '', '', '', ''],
    ['Steffes R.', 'Zeyen B. / Zahnd', 'Kettel H.', 'Blum', 'Böhnke', 'Bohlenschmidt', 'Koch', 'Otto', 'Di Giacomo', 'Olanovski', 'Mayer', 'Grab', 'Zahnd / Ilias', 'Ilias / Vater / Spinger', 'Spinger', 'Mahrouk', '', '', '', '', ''],
    ['Steffes R.', 'Zeyen B.', 'Kettel H.', 'Blum', 'Böhnke', 'Bohlenschmidt', 'Koch', 'Otto', 'Di Giacomo', 'Olanovski', 'Mayer / Zahnd', 'Grab', 'Block', 'Ilias / Zeyen / Spinger', 'Vater Ilias / Spinger', 'Mahrouk', '', '', '', '', ''],
    ['Steffes R.', 'Zeyen B.', 'Kettel H. / Zahnd', 'Blum', 'Böhnke', 'Bohlenschmidt', 'Koch', 'Otto', 'Di Giacomo', 'Olanovski', 'Kettel / Zahnd', 'Grab', 'Block', 'Ilias / Spinger', 'Vater Ilias', 'Mahrouk', '', '', '', '', ''],
    ['Steffes R.', 'Zeyen B.', 'Kettel H.', 'Blum', 'Böhnke', 'Bohlenschmidt', 'Koch', 'Otto', 'Di Giacomo', 'Olanovski', 'Mayer', 'Grab', 'Block', 'Kettel / Spinger / Vater Ilias', 'Vater Ilias', 'Mahrouk', 'Spinger', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Spinger', 'Grab', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Spinger', '', 'Vater Ilias', 'Vater Ilias'],
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
    { id: 'rh13-1', vehicle: 'DAU-RH 13', time: '07:00 – 08:15', route: 'Förderzentrum Gerolstein', label: 'Mo – Fr', tone: 'green' },
    { id: 'rh13-2', vehicle: 'DAU-RH 13', time: '15:15 – 16:00', route: 'Förderzentrum Gerolstein', label: 'Mo – Do', tone: 'green' },
    { id: 'rh13-3', vehicle: 'DAU-RH 13', time: '12:45 – 13:30', route: 'Förderzentrum Gerolstein', label: 'Fr', tone: 'green' },
    { id: 'rh11-1', vehicle: 'DAU-RH 11', time: '06:30 – 08:15', route: 'Förderzentrum Daun', label: 'Mo – Fr', tone: 'green' },
    { id: 'rh11-2', vehicle: 'DAU-RH 11', time: '15:05', route: 'Förderzentrum Daun', label: 'Mo – Do', tone: 'green' },
    { id: 'rh11-3', vehicle: 'DAU-RH 11', time: '12:15', route: 'Förderzentrum Daun', label: 'Fr', tone: 'green' },
    { id: 'rh11-4', vehicle: 'DAU-RH 11', time: '16:25 – 16:53', route: 'Kelberg Busbahnhof → Nachtsheim, Ort', label: 'Nur Mi + Do', tone: 'cyan' },
    { id: 'rh5-1', vehicle: 'DAU-RH 5', time: '06:30 – 08:15', route: 'Förderzentrum Daun', label: 'Mo – Fr', tone: 'green' },
    { id: 'rh5-2', vehicle: 'DAU-RH 5', time: '15:05', route: 'Förderzentrum Daun', label: 'Mo – Do', tone: 'green' },
    { id: 'rh5-3', vehicle: 'DAU-RH 5', time: '12:15', route: 'Förderzentrum Daun', label: 'Fr', tone: 'green' },
    { id: 'rh89-1', vehicle: 'DAU-RH 89', time: '06:30 – 06:46', route: 'Borler → Boxberg', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-2', vehicle: 'DAU-RH 89', time: '07:25 – 07:42', route: 'Müllenbach → Kelberg Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-3', vehicle: 'DAU-RH 89', time: '07:59 – 08:07', route: 'Meisental → Kelberg Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-4', vehicle: 'DAU-RH 89', time: '08:07 – 08:18', route: 'Kelberg Busbahnhof → Kelberg Kiga', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-5', vehicle: 'DAU-RH 89', time: '11:48 – 12:00', route: 'Dockweiler Feuerwehr → Dreis Brück', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-6', vehicle: 'DAU-RH 89', time: '12:15 – 12:31', route: 'Darscheid Schule → Kradenbach', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-7', vehicle: 'DAU-RH 89', time: '12:45 – 13:01', route: 'Dockweiler GS/KG → Kirchweiler, I. d. Holl', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-8', vehicle: 'DAU-RH 89', time: '13:10 – 13:45', route: 'Gerolstein BBS → Daun ZOB', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-9', vehicle: 'DAU-RH 89', time: '13:50 – 14:27', route: 'Daun ZOB → Kelberg Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh89-10', vehicle: 'DAU-RH 89', time: '16:05 – 16:33', route: 'Kelberg Kiga → Borler', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh102-1', vehicle: 'DAU-RH 102', time: '07:07 – 07:35', route: 'Sarmersbach → Dockweiler', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh102-2', vehicle: 'DAU-RH 102', time: '08:02 – 08:20', route: 'Kirchweiler → Dockweiler Kiga', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh102-3', vehicle: 'DAU-RH 102', time: '12:15 – 12:52', route: 'Kelberg Kiga → Borler', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh102-4', vehicle: 'DAU-RH 102', time: '13:15 – 13:48', route: 'Kelberg KiTa → Borler Ort', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh92-1', vehicle: 'DAU-RH 92', time: '07:19 – 07:54', route: 'Borler → Kelberg Grund- und Realschule plus', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh92-2', vehicle: 'DAU-RH 92', time: '07:59 – 08:35', route: 'Borler → Kelberg Kindergarten', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh92-3', vehicle: 'DAU-RH 92', time: '12:15 – 12:59', route: 'Kelberg Kiga → Darscheid', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh92-4', vehicle: 'DAU-RH 92', time: '13:12 – 13:56', route: 'Darscheid → Kelberg G u. RS', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh775-1', vehicle: 'DAU-RH 775', time: '05:50 – 06:37', route: 'Uersfeld → Ulmen Bahnhof', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-2', vehicle: 'DAU-RH 775', time: '07:12 – 07:52', route: 'Kötterichen → Kelberg G u. RS', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-3', vehicle: 'DAU-RH 775', time: '08:05 – 08:24', route: 'Mannebach Abzw. → Uersfeld Kirche', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-4', vehicle: 'DAU-RH 775', time: '11:55 – 12:11', route: 'Uersfeld Römerhügel → Arbach', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-5', vehicle: 'DAU-RH 775', time: '12:50 – 13:07', route: 'Uersfeld Römerhügel → Kötterichen', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-6', vehicle: 'DAU-RH 775', time: '13:20 – 13:48', route: 'Kelberg Busbahnhof → Ditscheid', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh775-7', vehicle: 'DAU-RH 775', time: '16:05 – 16:32', route: 'Kelberg Kiga und Schulzentrum → Müllenbach', label: 'Nur Mi + Do', tone: 'blue' },
    { id: 'rh775-8', vehicle: 'DAU-RH 775', time: '16:25 – 16:53', route: 'Kelberg Busbahnhof → Nachtsheim, Ort', label: 'Nicht Mi + Do', tone: 'cyan' },
    { id: 'rh93-1', vehicle: 'DAU-RH 93', time: '07:12 – 07:54', route: 'Darscheid → Kelberg G u. RS', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-2', vehicle: 'DAU-RH 93', time: '08:04 – 08:18', route: 'Berenbach → Uersfeld Römerhügel', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-3', vehicle: 'DAU-RH 93', time: '11:50 – 12:07', route: 'Uersfeld Römerhügel → Kötterichen', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-4', vehicle: 'DAU-RH 93', time: '12:53 – 13:13', route: 'Uersfeld Römerhügel → Bereborn', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-5', vehicle: 'DAU-RH 93', time: '13:16 – 13:54', route: 'Kelberg G u. RS → Kötterichen', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-6', vehicle: 'DAU-RH 93', time: '16:25', route: 'Kelberg G u. RS → Kötterichen', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh93-7', vehicle: 'DAU-RH 93', time: '17:15 – 17:53', route: 'Ulmen Bahnhof → Kaisersesch', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh94-1', vehicle: 'DAU-RH 94', time: '06:27 – 07:13', route: 'Meerfeld → Daun ZOB', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-2', vehicle: 'DAU-RH 94', time: '07:16 – 07:59', route: 'Daun ZOB → Gerolstein GS', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-3', vehicle: 'DAU-RH 94', time: '12:14 – 12:49', route: 'Kelberg Grund- und Realschule plus → Nitz', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-4', vehicle: 'DAU-RH 94', time: '13:19 – 14:12', route: 'Kelberg Grund- und Realschule plus → Ulmen Bahnhof', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-5', vehicle: 'DAU-RH 94', time: '15:22 – 16:02', route: 'Cochem Endertplatz → Gillenbeuren Kirchstraße', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh94-6', vehicle: 'DAU-RH 94', time: '16:15 – 16:29', route: 'Alflen Kirchstraße → Ulmen Bahnhof', label: 'Nur Mo – Do', tone: 'blue' },
    { id: 'rh94-7', vehicle: 'DAU-RH 94', time: '16:33 – 17:21', route: 'Ulmen Bahnhof → Kelberg Busbahnhof', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh91-1', vehicle: 'DAU-RH 91', time: '07:04 – 07:28', route: 'Usch → Gerolstein', label: 'SEV RMV', tone: 'amber' },
    { id: 'rh91-2', vehicle: 'DAU-RH 91', time: '07:41 – 08:00', route: 'Michelbach → Gerolstein', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-3', vehicle: 'DAU-RH 91', time: '12:09 – 12:40', route: 'Gillenfeld → Strotzbüsch', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-4', vehicle: 'DAU-RH 91', time: '13:16 – 14:00', route: 'Gillenfeld → Daun', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-5', vehicle: 'DAU-RH 91', time: '15:16 – 16:00', route: 'Daun → Gillenfeld', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh91-6', vehicle: 'DAU-RH 91', time: '16:11 – 16:56', route: 'Gillenfeld → Daun', label: 'Linienfahrt', tone: 'violet' },
    { id: 'rh98-1', vehicle: 'DAU-RH 98', time: '06:11 – 07:23', route: 'Nitz → Daun', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh98-2', vehicle: 'DAU-RH 98', time: '12:14 – 12:44', route: 'Kelberg KiTa → Müllenbach Ort', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh98-3', vehicle: 'DAU-RH 98', time: '13:17 – 13:44', route: 'Kelberg Busbahnhof → Müllenbach Oberdorf', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh98-4', vehicle: 'DAU-RH 98', time: '16:05 – 16:32', route: 'Kelberg Kiga und Schulzentrum → Müllenbach', label: 'Nicht Mi + Do', tone: 'blue' },
    { id: 'rh101-1', vehicle: 'DAU-RH 101', time: '06:25 – 07:36', route: 'Manderscheid → Gerolstein', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-2', vehicle: 'DAU-RH 101', time: '08:18 – 08:44', route: 'Kradenbach → Daun ZOB', label: 'Nur Mo + Di', tone: 'cyan' },
    { id: 'rh101-3', vehicle: 'DAU-RH 101', time: '11:55 – 12:41', route: 'Gerolstein → Salm', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-4', vehicle: 'DAU-RH 101', time: '12:57 – 13:41', route: 'Gerolstein → Salm', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-5', vehicle: 'DAU-RH 101', time: '13:42 – 14:16', route: 'Salm → Manderscheid', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-6', vehicle: 'DAU-RH 101', time: '15:42 – 16:21', route: 'Gerolstein → Salm', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-7', vehicle: 'DAU-RH 101', time: '16:22 – 16:56', route: 'Salm → Manderscheid', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh101-8', vehicle: 'DAU-RH 101', time: '17:02 – 17:52', route: 'Darscheid → Kelberg Busbahnhof', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh96-1', vehicle: 'DAU-RH 96', time: '07:14 – 07:54', route: 'Berenbach → Kelberg GRS+', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-2', vehicle: 'DAU-RH 96', time: '08:18 – 08:44', route: 'Kradenbach → Daun ZOB', label: 'Nur Mi + Do + Fr', tone: 'blue' },
    { id: 'rh96-3', vehicle: 'DAU-RH 96', time: '11:45 – 12:10', route: 'Dockweiler → Kradenbach', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-4', vehicle: 'DAU-RH 96', time: '12:52 – 13:12', route: 'Uersfeld → Ulmen', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-5', vehicle: 'DAU-RH 96', time: '13:19 – 13:44', route: 'Ulmen → Uersfeld', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-6', vehicle: 'DAU-RH 96', time: '13:45 – 14:01', route: 'Uersfeld → Ahrbach', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh96-7', vehicle: 'DAU-RH 96', time: '16:11 – 17:02', route: 'Kelberg Kiga → Darscheid', label: 'Linienfahrt', tone: 'blue' },
    { id: 'rh90-1', vehicle: 'DAU-RH 90', time: '–', route: 'Koblenz (HEB Umlauf)', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh90-2', vehicle: 'DAU-RH 90', time: '06:45 – 07:47', route: 'Kyllburg → Oberbettingen', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh90-3', vehicle: 'DAU-RH 90', time: '13:23 – 13:55', route: 'Jünkerath → Gerolstein', label: 'SEV für RMV', tone: 'rose' },
    { id: 'rh90-4', vehicle: 'DAU-RH 90', time: '22:13 – 00:51', route: 'Gerolstein → Trier (Wechsel in Speicher)', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-1', vehicle: 'DAU-RH 96/14', time: '–', route: 'Koblenz', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-2', vehicle: 'DAU-RH 96/14', time: '06:28 – 06:48', route: 'Densborn → Gerolstein', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-3', vehicle: 'DAU-RH 96/14', time: '07:18 – 07:42', route: 'Usch → Gerolstein', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-4', vehicle: 'DAU-RH 96/14', time: '13:15 – 13:59', route: 'Hillesheim → St. Thomas', label: 'SEV für RMV', tone: 'amber' },
    { id: 'rh9614-5', vehicle: 'DAU-RH 96/14', time: '15:25 – 16:00', route: 'Gerolstein → Daun', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'rh9614-6', vehicle: 'DAU-RH 96/14', time: '16:00 – 17:06', route: 'Daun → Kaisersesch', label: 'Linienfahrt', tone: 'cyan' },
    { id: 'night1-1', vehicle: 'DAU-RH Nacht 1', time: '23:25 – 00:59', route: 'Kall → Gerolstein', label: 'Nur Mo – Do', tone: 'rose' },
    { id: 'night1-2', vehicle: 'DAU-RH Nacht 1', time: '23:55 – 01:29', route: 'Kall → Gerolstein', label: 'Nur Fr', tone: 'rose' },
    { id: 'night2-1', vehicle: 'DAU-RH Nacht 2', time: '00:55 – 02:29', route: 'Kall → Gerolstein', label: 'Nur Fr auf Sa', tone: 'amber' },
    { id: 'weekend-trier', vehicle: 'Wochenende Trier', time: '22:13 – 00:51', route: 'Gerolstein → Trier (Wechsel in Speicher)', label: 'Sa + So', tone: 'amber' },
    { id: 'rmb-sa', vehicle: 'RMB 520 Samstag', time: '14:17 – 22:48', route: 'RMB 520', label: 'Sa', tone: 'blue' },
    { id: 'rmb-so-a', vehicle: 'RMB 520 Sonntag A', time: '08:17 – 14:48', route: 'RMB 520', label: 'So', tone: 'blue' },
    { id: 'rmb-so-b-1', vehicle: 'RMB 520 Sonntag B', time: '15:13 – 21:42', route: 'RMB 520', label: 'So', tone: 'violet' },
    { id: 'rmb-so-b-2', vehicle: 'RMB 520 Sonntag B', time: '23:55 – 01:29', route: 'Kall → Gerolstein', label: 'So', tone: 'rose' },
  ];

  protected readonly driverPortalStops = [
    { time: '06:05', place: 'Mannbach', meta: 'Abfahrt · Start' },
    { time: '06:50', place: 'Auel Kirche', meta: 'Planmäßiger Halt' },
    { time: '08:05', place: 'Dockweiler', meta: 'Planmäßiger Halt' },
    { time: '11:00', place: 'Gerolstein', meta: 'Pause · 30 Min.' },
    { time: '12:12', place: 'Trier', meta: 'Fahrzeugwechsel' },
    { time: '14:24', place: 'Kötterichen', meta: 'Ankunft · Ende' },
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
    const suggestedPlan = this.dutyPlans.find((plan) => plan.name.includes(target.vehicle.replace('DAU-RH ', 'RH ')))
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
    if (window.innerWidth < 900) {
      window.setTimeout(() => document.querySelector('.duty-detail-card')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  protected saveDutyPlan(): void {
    this.dutyPlanSaved.set(true);
    window.setTimeout(() => this.dutyPlanSaved.set(false), 2400);
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
