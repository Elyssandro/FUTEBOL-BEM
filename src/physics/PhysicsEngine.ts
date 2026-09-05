import { GOAL_CONFIG, PHYSICS_CONFIG, PITCH_BOUNDS } from '../constants/field';
import { Ball, Disc, Team } from '../types/game';

export interface CollisionEvent {
  type: 'disc-disc' | 'disc-ball' | 'disc-wall' | 'ball-wall' | 'ball-post';
  x: number;
  y: number;
  intensity: number;
}

export class PhysicsEngine {
  private posts = [
    { x: GOAL_CONFIG.leftGoalLineX, y: GOAL_CONFIG.topY, radius: GOAL_CONFIG.postRadius },
    { x: GOAL_CONFIG.leftGoalLineX, y: GOAL_CONFIG.bottomY, radius: GOAL_CONFIG.postRadius },
    { x: GOAL_CONFIG.rightGoalLineX, y: GOAL_CONFIG.topY, radius: GOAL_CONFIG.postRadius },
    { x: GOAL_CONFIG.rightGoalLineX, y: GOAL_CONFIG.bottomY, radius: GOAL_CONFIG.postRadius },
  ];

  public onCollision?: (event: CollisionEvent) => void;
  public onGoalScored?: (scoringTeam: Team) => void;

  private goalAlreadyTriggeredInShot = false;

  public resetGoalFlag() {
    this.goalAlreadyTriggeredInShot = false;
  }

  /**
   * Run physics simulation for a given delta time using multiple sub-steps.
   */
  public update(
    discs: Disc[],
    ball: Ball,
    deltaTime: number,
    subSteps: number = PHYSICS_CONFIG.subSteps
  ): boolean {
    const dt = (deltaTime > 0.1 ? 0.1 : deltaTime) / subSteps;

    let anyMoved = false;

    for (let step = 0; step < subSteps; step++) {
      // 1. Move objects
      for (let i = 0; i < discs.length; i++) {
        const d = discs[i];
        if (d.vx !== 0 || d.vy !== 0) {
          d.x += d.vx * dt * 60;
          d.y += d.vy * dt * 60;
          d.vx *= Math.pow(PHYSICS_CONFIG.discsFriction, dt * 60);
          d.vy *= Math.pow(PHYSICS_CONFIG.discsFriction, dt * 60);

          if (d.vx * d.vx + d.vy * d.vy < PHYSICS_CONFIG.sleepVelocityThreshold) {
            d.vx = 0;
            d.vy = 0;
          } else {
            anyMoved = true;
          }
        }
      }

      if (ball.vx !== 0 || ball.vy !== 0) {
        ball.x += ball.vx * dt * 60;
        ball.y += ball.vy * dt * 60;
        ball.vx *= Math.pow(PHYSICS_CONFIG.ballFriction, dt * 60);
        ball.vy *= Math.pow(PHYSICS_CONFIG.ballFriction, dt * 60);

        // Rotation spin for ball visual effect
        const speed = Math.hypot(ball.vx, ball.vy);
        ball.rotation = (ball.rotation + speed * 0.08) % (Math.PI * 2);

        if (ball.vx * ball.vx + ball.vy * ball.vy < PHYSICS_CONFIG.sleepVelocityThreshold) {
          ball.vx = 0;
          ball.vy = 0;
        } else {
          anyMoved = true;
        }
      }

      // 2. Disc vs Disc collisions
      for (let i = 0; i < discs.length; i++) {
        for (let j = i + 1; j < discs.length; j++) {
          this.resolveDiscDiscCollision(discs[i], discs[j]);
        }
      }

      // 3. Disc vs Ball collisions
      for (let i = 0; i < discs.length; i++) {
        this.resolveDiscBallCollision(discs[i], ball);
      }

      // 4. Goal posts collisions
      for (let i = 0; i < discs.length; i++) {
        this.resolveDiscPostCollision(discs[i]);
      }
      this.resolveBallPostCollision(ball);

      // 5. Rails & Goal Nets boundaries
      for (let i = 0; i < discs.length; i++) {
        this.resolveDiscBoundaries(discs[i]);
      }
      this.resolveBallBoundaries(ball);

      // 6. Check goal
      if (!this.goalAlreadyTriggeredInShot) {
        this.checkGoal(ball);
      }
    }

    return anyMoved;
  }

  /**
   * Check if all discs and the ball are virtually at rest.
   */
  public areAllStopped(discs: Disc[], ball: Ball): boolean {
    if (Math.hypot(ball.vx, ball.vy) > 0.15) return false;
    for (let i = 0; i < discs.length; i++) {
      if (Math.hypot(discs[i].vx, discs[i].vy) > 0.15) {
        return false;
      }
    }
    return true;
  }

  private resolveDiscDiscCollision(d1: Disc, d2: Disc) {
    const dx = d2.x - d1.x;
    const dy = d2.y - d1.y;
    const distSq = dx * dx + dy * dy;
    const minDist = d1.radius + d2.radius;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Position separation to prevent overlap
      const overlap = minDist - dist;
      const totalMass = d1.mass + d2.mass;
      d1.x -= nx * overlap * (d2.mass / totalMass);
      d1.y -= ny * overlap * (d2.mass / totalMass);
      d2.x += nx * overlap * (d1.mass / totalMass);
      d2.y += ny * overlap * (d1.mass / totalMass);

      // Elastic impulse
      const rvx = d2.vx - d1.vx;
      const rvy = d2.vy - d1.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const e = PHYSICS_CONFIG.discDiscRestitution;
        const j = -(1 + e) * velAlongNormal / (1 / d1.mass + 1 / d2.mass);

        d1.vx -= (j / d1.mass) * nx;
        d1.vy -= (j / d1.mass) * ny;
        d2.vx += (j / d2.mass) * nx;
        d2.vy += (j / d2.mass) * ny;

        const intensity = Math.min(1.0, Math.abs(velAlongNormal) / 18);
        if (this.onCollision && intensity > 0.05) {
          this.onCollision({
            type: 'disc-disc',
            x: (d1.x + d2.x) / 2,
            y: (d1.y + d2.y) / 2,
            intensity,
          });
        }
      }
    }
  }

  private resolveDiscBallCollision(disc: Disc, ball: Ball) {
    const dx = ball.x - disc.x;
    const dy = ball.y - disc.y;
    const distSq = dx * dx + dy * dy;
    const minDist = disc.radius + ball.radius;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Positional separation
      const overlap = minDist - dist;
      const totalMass = disc.mass + ball.mass;
      disc.x -= nx * overlap * (ball.mass / totalMass);
      disc.y -= ny * overlap * (ball.mass / totalMass);
      ball.x += nx * overlap * (disc.mass / totalMass);
      ball.y += ny * overlap * (disc.mass / totalMass);

      // Elastic impulse
      const rvx = ball.vx - disc.vx;
      const rvy = ball.vy - disc.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const e = PHYSICS_CONFIG.discBallRestitution;
        const j = -(1 + e) * velAlongNormal / (1 / disc.mass + 1 / ball.mass);

        disc.vx -= (j / disc.mass) * nx;
        disc.vy -= (j / disc.mass) * ny;
        ball.vx += (j / ball.mass) * nx;
        ball.vy += (j / ball.mass) * ny;

        const intensity = Math.min(1.0, Math.abs(velAlongNormal) / 20);
        if (this.onCollision && intensity > 0.05) {
          this.onCollision({
            type: 'disc-ball',
            x: ball.x,
            y: ball.y,
            intensity,
          });
        }
      }
    }
  }

  private resolveDiscPostCollision(disc: Disc) {
    for (let p = 0; p < this.posts.length; p++) {
      const post = this.posts[p];
      const dx = disc.x - post.x;
      const dy = disc.y - post.y;
      const distSq = dx * dx + dy * dy;
      const minDist = disc.radius + post.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        disc.x = post.x + nx * minDist;
        disc.y = post.y + ny * minDist;

        const velAlongNormal = disc.vx * nx + disc.vy * ny;
        if (velAlongNormal < 0) {
          disc.vx -= (1 + PHYSICS_CONFIG.postRestitution) * velAlongNormal * nx;
          disc.vy -= (1 + PHYSICS_CONFIG.postRestitution) * velAlongNormal * ny;
        }
      }
    }
  }

  private resolveBallPostCollision(ball: Ball) {
    for (let p = 0; p < this.posts.length; p++) {
      const post = this.posts[p];
      const dx = ball.x - post.x;
      const dy = ball.y - post.y;
      const distSq = dx * dx + dy * dy;
      const minDist = ball.radius + post.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        ball.x = post.x + nx * minDist;
        ball.y = post.y + ny * minDist;

        const velAlongNormal = ball.vx * nx + ball.vy * ny;
        if (velAlongNormal < 0) {
          ball.vx -= (1 + PHYSICS_CONFIG.postRestitution) * velAlongNormal * nx;
          ball.vy -= (1 + PHYSICS_CONFIG.postRestitution) * velAlongNormal * ny;

          const speed = Math.hypot(ball.vx, ball.vy);
          if (this.onCollision && speed > 2) {
            this.onCollision({
              type: 'ball-post',
              x: post.x,
              y: post.y,
              intensity: Math.min(1.0, speed / 15),
            });
          }
        }
      }
    }
  }

  private resolveDiscBoundaries(disc: Disc) {
    const r = disc.radius;
    const e = PHYSICS_CONFIG.cushionRestitution;

    // Top and Bottom cushions
    if (disc.y - r < PITCH_BOUNDS.top) {
      disc.y = PITCH_BOUNDS.top + r;
      disc.vy = -disc.vy * e;
    } else if (disc.y + r > PITCH_BOUNDS.bottom) {
      disc.y = PITCH_BOUNDS.bottom - r;
      disc.vy = -disc.vy * e;
    }

    // Left wall: outside goal mouth
    const isGoalMouthY = disc.y >= GOAL_CONFIG.topY && disc.y <= GOAL_CONFIG.bottomY;

    if (!isGoalMouthY) {
      if (disc.x - r < PITCH_BOUNDS.left) {
        disc.x = PITCH_BOUNDS.left + r;
        disc.vx = -disc.vx * e;
      }
      if (disc.x + r > PITCH_BOUNDS.right) {
        disc.x = PITCH_BOUNDS.right - r;
        disc.vx = -disc.vx * e;
      }
    } else {
      // Inside goal mouth bounds (net sides & back)
      if (disc.x < PITCH_BOUNDS.left) {
        // Inside left goal
        if (disc.x - r < GOAL_CONFIG.leftBackX) {
          disc.x = GOAL_CONFIG.leftBackX + r;
          disc.vx = -disc.vx * 0.3;
        }
        if (disc.y - r < GOAL_CONFIG.topY) {
          disc.y = GOAL_CONFIG.topY + r;
          disc.vy = -disc.vy * 0.3;
        } else if (disc.y + r > GOAL_CONFIG.bottomY) {
          disc.y = GOAL_CONFIG.bottomY - r;
          disc.vy = -disc.vy * 0.3;
        }
      } else if (disc.x > PITCH_BOUNDS.right) {
        // Inside right goal
        if (disc.x + r > GOAL_CONFIG.rightBackX) {
          disc.x = GOAL_CONFIG.rightBackX - r;
          disc.vx = -disc.vx * 0.3;
        }
        if (disc.y - r < GOAL_CONFIG.topY) {
          disc.y = GOAL_CONFIG.topY + r;
          disc.vy = -disc.vy * 0.3;
        } else if (disc.y + r > GOAL_CONFIG.bottomY) {
          disc.y = GOAL_CONFIG.bottomY - r;
          disc.vy = -disc.vy * 0.3;
        }
      }
    }
  }

  private resolveBallBoundaries(ball: Ball) {
    const r = ball.radius;
    const e = PHYSICS_CONFIG.cushionRestitution;

    // Top and Bottom cushions
    if (ball.y - r < PITCH_BOUNDS.top) {
      ball.y = PITCH_BOUNDS.top + r;
      ball.vy = -ball.vy * e;
      if (this.onCollision && Math.abs(ball.vy) > 1.5) {
        this.onCollision({ type: 'ball-wall', x: ball.x, y: ball.y, intensity: Math.min(1, Math.abs(ball.vy) / 15) });
      }
    } else if (ball.y + r > PITCH_BOUNDS.bottom) {
      ball.y = PITCH_BOUNDS.bottom - r;
      ball.vy = -ball.vy * e;
      if (this.onCollision && Math.abs(ball.vy) > 1.5) {
        this.onCollision({ type: 'ball-wall', x: ball.x, y: ball.y, intensity: Math.min(1, Math.abs(ball.vy) / 15) });
      }
    }

    const inGoalMouthY = ball.y >= GOAL_CONFIG.topY && ball.y <= GOAL_CONFIG.bottomY;

    if (!inGoalMouthY) {
      if (ball.x - r < PITCH_BOUNDS.left) {
        ball.x = PITCH_BOUNDS.left + r;
        ball.vx = -ball.vx * e;
        if (this.onCollision && Math.abs(ball.vx) > 1.5) {
          this.onCollision({ type: 'ball-wall', x: ball.x, y: ball.y, intensity: Math.min(1, Math.abs(ball.vx) / 15) });
        }
      }
      if (ball.x + r > PITCH_BOUNDS.right) {
        ball.x = PITCH_BOUNDS.right - r;
        ball.vx = -ball.vx * e;
        if (this.onCollision && Math.abs(ball.vx) > 1.5) {
          this.onCollision({ type: 'ball-wall', x: ball.x, y: ball.y, intensity: Math.min(1, Math.abs(ball.vx) / 15) });
        }
      }
    } else {
      // Inside goal net area
      if (ball.x < PITCH_BOUNDS.left) {
        // Left goal net
        if (ball.x - r < GOAL_CONFIG.leftBackX) {
          ball.x = GOAL_CONFIG.leftBackX + r;
          ball.vx = -ball.vx * PHYSICS_CONFIG.netDamping;
          ball.vy *= 0.7; // net absorbs energy
        }
        if (ball.y - r < GOAL_CONFIG.topY) {
          ball.y = GOAL_CONFIG.topY + r;
          ball.vy = -ball.vy * PHYSICS_CONFIG.netDamping;
        } else if (ball.y + r > GOAL_CONFIG.bottomY) {
          ball.y = GOAL_CONFIG.bottomY - r;
          ball.vy = -ball.vy * PHYSICS_CONFIG.netDamping;
        }
      } else if (ball.x > PITCH_BOUNDS.right) {
        // Right goal net
        if (ball.x + r > GOAL_CONFIG.rightBackX) {
          ball.x = GOAL_CONFIG.rightBackX - r;
          ball.vx = -ball.vx * PHYSICS_CONFIG.netDamping;
          ball.vy *= 0.7;
        }
        if (ball.y - r < GOAL_CONFIG.topY) {
          ball.y = GOAL_CONFIG.topY + r;
          ball.vy = -ball.vy * PHYSICS_CONFIG.netDamping;
        } else if (ball.y + r > GOAL_CONFIG.bottomY) {
          ball.y = GOAL_CONFIG.bottomY - r;
          ball.vy = -ball.vy * PHYSICS_CONFIG.netDamping;
        }
      }
    }
  }

  private checkGoal(ball: Ball) {
    const isInsideGoalY =
      ball.y - ball.radius >= GOAL_CONFIG.topY &&
      ball.y + ball.radius <= GOAL_CONFIG.bottomY;

    if (!isInsideGoalY) return;

    // Blue scores in the right goal: ball completely crosses right goal line
    if (ball.x - ball.radius > GOAL_CONFIG.rightGoalLineX) {
      this.goalAlreadyTriggeredInShot = true;
      if (this.onGoalScored) {
        this.onGoalScored('blue');
      }
    }
    // Red scores in the left goal: ball completely crosses left goal line
    else if (ball.x + ball.radius < GOAL_CONFIG.leftGoalLineX) {
      this.goalAlreadyTriggeredInShot = true;
      if (this.onGoalScored) {
        this.onGoalScored('red');
      }
    }
  }
}
