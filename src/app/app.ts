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

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly activeView = signal<'overview' | 'planning' | 'vehicles'>(
    window.location.hash === '#overview'
      ? 'overview'
      : window.location.hash === '#vehicles'
        ? 'vehicles'
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

  protected showView(view: 'overview' | 'planning' | 'vehicles'): void {
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
