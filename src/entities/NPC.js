// NPCs follow a data-driven daily schedule (see data/npcs.js): they hold
// position at each schedule point and walk in a straight line during the
// final stretch before the next scheduled hour, so they visibly arrive
// "on time" rather than teleporting. This is intentionally simple --
// there's no obstacle-avoidance pathfinding yet (see DEVELOPMENT.md).

const WALK_MINUTES = 45;

export class NPC {
  constructor(data) {
    this.id = data.id;
    this.data = data;
    this.x = data.schedule[0].x;
    this.y = data.schedule[0].y;
    this.currentActivity = data.schedule[0].activity;
    this.bobT = Math.random() * Math.PI * 2;
    this.facing = 'down';
  }

  _scheduleWindow(hourFrac) {
    const sched = this.data.schedule;
    let idx = -1;
    for (let i = 0; i < sched.length; i++) {
      if (sched[i].hour <= hourFrac) idx = i;
    }
    if (idx === -1) idx = sched.length - 1;
    const prev = sched[idx];
    const next = sched[(idx + 1) % sched.length];
    let prevHour = prev.hour;
    let nextHour = next.hour;
    let curHour = hourFrac;
    if (nextHour <= prevHour) nextHour += 24;
    if (curHour < prevHour) curHour += 24;
    return { prev, next, prevHour, nextHour, curHour };
  }

  update(dt, timeSystem) {
    const hourFrac = timeSystem.hour + timeSystem.minute / 60;
    const { prev, next, prevHour, nextHour, curHour } = this._scheduleWindow(hourFrac);
    const span = nextHour - prevHour;
    const walkHours = Math.min(WALK_MINUTES / 60, span || 24);
    const timeIntoWindow = curHour - prevHour;
    let t = 0;
    if (span > 0) {
      if (timeIntoWindow >= span - walkHours) {
        t = (timeIntoWindow - (span - walkHours)) / walkHours;
        t = Math.max(0, Math.min(1, t));
      }
    }
    const nx = prev.x + (next.x - prev.x) * t;
    const ny = prev.y + (next.y - prev.y) * t;
    const dx = nx - this.x;
    const dy = ny - this.y;
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    }
    this.x = nx;
    this.y = ny;
    this.currentActivity = t < 0.5 ? prev.activity : next.activity;
    this.moving = t > 0 && t < 1;
    this.bobT += dt;
  }
}
