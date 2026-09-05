// Calendar, day/night phase, and season derivation, plus time-speed
// controls (pause / 1x / 2x / 4x / skip). Movement and rendering read the
// real clock; only this system's "game minutes" advance at variable speed.

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const DAYS_PER_SEASON = 5;
export const BASE_SECONDS_PER_DAY = 240; // real seconds for one full game day at 1x speed

const PHASE_BOUNDARIES = { dawn: 5, day: 7, dusk: 18, night: 20 };

export class TimeSystem {
  constructor(bus) {
    this.bus = bus;
    this.totalMinutes = 6 * 60; // start just after dawn
    this.speed = 1; // 0 = paused
    this._lastDay = this.dayCount;
    this._lastHour = this.hour;
    this._lastPhase = this.phase;
    this._lastSeason = this.season;
  }

  get minuteOfDay() {
    return Math.floor(this.totalMinutes) % (24 * 60);
  }
  get hour() {
    return Math.floor(this.minuteOfDay / 60);
  }
  get minute() {
    return this.minuteOfDay % 60;
  }
  get dayCount() {
    return Math.floor(this.totalMinutes / (24 * 60));
  }
  get dayOfSeason() {
    return this.dayCount % DAYS_PER_SEASON;
  }
  get seasonIndex() {
    return Math.floor(this.dayCount / DAYS_PER_SEASON) % SEASONS.length;
  }
  get season() {
    return SEASONS[this.seasonIndex];
  }
  get year() {
    return Math.floor(this.dayCount / (DAYS_PER_SEASON * SEASONS.length)) + 1;
  }
  get dayFraction() {
    return this.minuteOfDay / (24 * 60);
  }
  get phase() {
    const h = this.hour + this.minute / 60;
    if (h >= PHASE_BOUNDARIES.dawn && h < PHASE_BOUNDARIES.day) return 'dawn';
    if (h >= PHASE_BOUNDARIES.day && h < PHASE_BOUNDARIES.dusk) return 'day';
    if (h >= PHASE_BOUNDARIES.dusk && h < PHASE_BOUNDARIES.night) return 'dusk';
    return 'night';
  }

  formattedTime() {
    const h24 = this.hour;
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const mm = String(this.minute).padStart(2, '0');
    return `${h12}:${mm} ${period}`;
  }

  setSpeed(speed) {
    this.speed = speed;
    this.bus.emit('time:speedChanged', speed);
  }

  togglePause() {
    this.speed = this.speed > 0 ? 0 : 1;
    this.bus.emit('time:speedChanged', this.speed);
    return this.speed;
  }

  skipToNextPhase() {
    const boundaries = [5, 7, 18, 20, 29]; // 29 == 5am next day (24+5)
    const hFrac = this.hour + this.minute / 60;
    const next = boundaries.find((b) => b > hFrac + 0.01);
    const targetHour = next >= 24 ? next - 24 : next;
    const daysToAdd = next >= 24 ? 1 : 0;
    const currentDayStart = this.dayCount * 24 * 60;
    this.totalMinutes = currentDayStart + daysToAdd * 24 * 60 + targetHour * 60;
    this.bus.emit('time:skipped', { phase: this.phase });
  }

  update(realDtSeconds) {
    if (this.speed > 0) {
      const gameMinutesPerRealSecond = ((24 * 60) / BASE_SECONDS_PER_DAY) * this.speed;
      this.totalMinutes += realDtSeconds * gameMinutesPerRealSecond;
    }
    if (this.dayCount !== this._lastDay) {
      this._lastDay = this.dayCount;
      this.bus.emit('time:newDay', { day: this.dayCount });
    }
    if (this.season !== this._lastSeason) {
      this._lastSeason = this.season;
      this.bus.emit('time:newSeason', { season: this.season });
    }
    if (this.phase !== this._lastPhase) {
      this._lastPhase = this.phase;
      this.bus.emit('time:newPhase', { phase: this.phase });
    }
    if (this.hour !== this._lastHour) {
      this._lastHour = this.hour;
      this.bus.emit('time:hour', { hour: this.hour });
    }
  }

  serialize() {
    return { totalMinutes: this.totalMinutes, speed: this.speed };
  }

  deserialize(data) {
    if (!data) return;
    this.totalMinutes = data.totalMinutes ?? this.totalMinutes;
    this.speed = data.speed ?? 1;
    this._lastDay = this.dayCount;
    this._lastHour = this.hour;
    this._lastPhase = this.phase;
    this._lastSeason = this.season;
  }
}
