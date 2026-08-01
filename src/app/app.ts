import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type ShiftTone = 'green' | 'blue' | 'amber' | 'violet' | 'cyan' | 'orange' | 'rose';

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
}

interface Vehicle {
  id: string;
  seats: number;
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

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly activeView = signal<'overview' | 'planning' | 'vehicles' | 'schedules' | 'drivers'>(
    window.location.hash === '#overview'
      ? 'overview'
      : window.location.hash === '#vehicles'
        ? 'vehicles'
        : window.location.hash === '#schedules'
          ? 'schedules'
          : window.location.hash === '#drivers'
            ? 'drivers'
            : 'planning',
  );
  protected readonly menuOpen = signal(false);
  protected readonly weekOffset = signal(0);
  protected readonly published = signal(false);
  protected readonly saved = signal(false);
  protected readonly selectedShiftId = signal('rh91-thu');
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

  protected readonly days = [
    { short: 'Mo', date: '20.07' },
    { short: 'Di', date: '21.07' },
    { short: 'Mi', date: '22.07' },
    { short: 'Do', date: '23.07' },
    { short: 'Fr', date: '24.07' },
    { short: 'Sa', date: '25.07' },
    { short: 'So', date: '26.07' },
  ];

  protected readonly vehicles: Vehicle[] = [
    { id: 'DAU-RH 102', seats: 52 },
    { id: 'DAU-RH 515', seats: 58 },
    { id: 'DAU-RH 94', seats: 52 },
    { id: 'DAU-RH 91', seats: 52 },
    { id: 'DAU-RH 11', seats: 56 },
    { id: 'DAU-RH 8', seats: 53 },
  ];

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

  protected readonly shifts: Shift[] = [
    { id: 'rh102-thu', vehicle: 'DAU-RH 102', day: 3, driver: 'Koch', start: '06:05', end: '14:20', plan: 'Standard RH 102', tone: 'green' },
    { id: 'rh102-fri', vehicle: 'DAU-RH 102', day: 4, driver: 'Koch', start: '06:05', end: '14:20', plan: 'Standard RH 102', tone: 'green' },
    { id: 'rh515-thu', vehicle: 'DAU-RH 515', day: 3, driver: 'Zeyen B.', start: '07:30', end: '15:45', plan: 'Standard RH 515', tone: 'blue' },
    { id: 'rh515-fri', vehicle: 'DAU-RH 515', day: 4, driver: 'Zeyen B.', start: '07:30', end: '15:45', plan: 'Standard RH 515', tone: 'blue' },
    { id: 'rh94-thu', vehicle: 'DAU-RH 94', day: 3, driver: 'Block', start: '08:00', end: '16:10', plan: 'Standard RH 94', tone: 'amber' },
    { id: 'rh94-fri', vehicle: 'DAU-RH 94', day: 4, driver: 'Block', start: '08:00', end: '16:10', plan: 'Standard RH 94', tone: 'amber' },
    { id: 'rh91-thu', vehicle: 'DAU-RH 91', day: 3, driver: 'Olanovski', start: '06:05', end: '14:24', plan: 'Standard RH 91', tone: 'violet', status: 'Geplant' },
    { id: 'rh91-fri', vehicle: 'DAU-RH 91', day: 4, driver: 'Olanovski', start: '06:05', end: '14:24', plan: 'Standard RH 91', tone: 'violet', status: 'Geplant' },
    { id: 'rh11-thu', vehicle: 'DAU-RH 11', day: 3, driver: 'Spinger', start: '06:30', end: '14:40', plan: 'Standard RH 11', tone: 'cyan' },
    { id: 'rh11-fri', vehicle: 'DAU-RH 11', day: 4, driver: 'Spinger', start: '06:30', end: '14:40', plan: 'Standard RH 11', tone: 'cyan' },
    { id: 'rh11-sat', vehicle: 'DAU-RH 11', day: 5, driver: 'Kyriakos', start: '12:15', end: '19:15', plan: 'Tagesfahrt', tone: 'rose', type: 'Sonderfahrt' },
    { id: 'rh8-thu', vehicle: 'DAU-RH 8', day: 3, driver: 'Vater Ilias', start: '05:55', end: '14:10', plan: 'Standard RH 8', tone: 'orange' },
    { id: 'rh8-fri', vehicle: 'DAU-RH 8', day: 4, driver: 'Vater Ilias', start: '05:55', end: '14:10', plan: 'Standard RH 8', tone: 'orange' },
  ];

  protected readonly routeRows = [
    ['06:05 – 06:24', 'Mannbach', 'Mannbach', '–', 'Start'],
    ['06:24 – 06:50', 'Mannbach', 'Ortsmitte', '–', ''],
    ['06:50 – 07:20', 'Ortsmitte', 'Auel Kirche', '–', ''],
    ['07:20 – 08:05', 'Auel Kirche', 'Dockweiler', '–', ''],
    ['08:05 – 08:28', 'Dockweiler', 'Kiga', '–', ''],
    ['…', '', '', '', ''],
    ['11:00 – 11:30', '', 'Pause', '30m', 'Gerolstein'],
    ['11:30 – 12:12', 'Gerolstein', 'Trier (Wechsel)', '–', ''],
    ['12:12 – 12:24', 'Trier (Wexel)', 'Rübenach', '–', ''],
    ['12:24 – 12:47', 'Rübenach', 'Darscheid', '–', ''],
    ['12:47 – 14:24', 'Darscheid', 'Kötterichen', '–', 'Ende'],
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

  protected readonly weekNumber = computed(() => 30 + this.weekOffset());
  protected readonly dateRange = computed(() => {
    if (this.weekOffset() === 0) return '20.07.2026 – 26.07.2026';
    const monday = new Date(2026, 6, 20 + this.weekOffset() * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const format = (date: Date) =>
      new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    return `${format(monday)} – ${format(sunday)}`;
  });

  protected getShift(vehicle: string, day: number): Shift | undefined {
    return this.shifts.find((shift) => shift.vehicle === vehicle && shift.day === day);
  }

  protected showView(view: 'overview' | 'planning' | 'vehicles' | 'schedules' | 'drivers'): void {
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

  protected selectShift(shift: Shift): void {
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
