import { AIController } from '../ai/AIController';
import { sounds } from '../audio/SoundManager';
import { GOAL_CONFIG, PHYSICS_CONFIG, PITCH_BOUNDS } from '../constants/field';
import { CollisionEvent, PhysicsEngine } from '../physics/PhysicsEngine';
import { StorageManager } from '../storage/StorageManager';
import {
  AIDifficulty,
  AimState,
  Ball,
  Disc,
  GameMode,
  MatchSettings,
  MatchStatus,
  Particle,
  PenaltyShootoutState,
  Team,
} from '../types/game';

export interface GameEngineListener {
  onScoreChange?: (blueScore: number, redScore: number) => void;
  onTurnChange?: (turn: Team) => void;
  onStatusChange?: (status: MatchStatus) => void;
  onTimerTick?: (secondsLeft: number) => void;
  onGoalScored?: (team: Team) => void;
  onMatchEnd?: (winner: Team | 'draw', blueScore: number, redScore: number) => void;
  onPenaltyUpdate?: (penaltyState: PenaltyShootoutState) => void;
}

export class GameEngine {
  public discs: Disc[] = [];
  public ball: Ball = {
    x: PITCH_BOUNDS.centerX,
    y: PITCH_BOUNDS.centerY,
    vx: 0,
    vy: 0,
    radius: PHYSICS_CONFIG.ballRadius,
    mass: PHYSICS_CONFIG.ballMass,
    friction: PHYSICS_CONFIG.ballFriction,
    restitution: PHYSICS_CONFIG.discBallRestitution,
    rotation: 0,
  };

  public aimState: AimState = {
    active: false,
    discId: null,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
    shootVx: 0,
    shootVy: 0,
    power: 0,
    angle: 0,
  };

  public particles: Particle[] = [];
  public currentTurn: Team = 'blue';
  public matchStatus: MatchStatus = 'MENU';
  public blueScore = 0;
  public redScore = 0;
  public secondsRemaining = 180;
  public isGoldenGoal = false;

  public gameMode: GameMode = 'cpu';
  public difficulty: AIDifficulty = 'normal';
  public settings: MatchSettings;

  public physics: PhysicsEngine = new PhysicsEngine();
  public listener: GameEngineListener = {};

  private cpuThinkingTimeout: number | null = null;
  private goalCelebrationTimer: number | null = null;
  private timerInterval: number | null = null;
  private animationTime = 0;

  // Penalties mode state
  public penaltyState: PenaltyShootoutState | null = null;

  constructor(settings: MatchSettings, listener: GameEngineListener = {}) {
    this.settings = settings;
    this.difficulty = settings.difficulty;
    this.secondsRemaining = settings.durationSeconds;
    this.listener = listener;

    this.physics.onCollision = (event) => this.handleCollision(event);
    this.physics.onGoalScored = (team) => this.handleGoal(team);
  }

  public initMatch(mode: GameMode, duration: number = 180, isGoldenGoal = false) {
    this.cleanupTimers();
    this.gameMode = mode;
    this.secondsRemaining = duration;
    this.blueScore = 0;
    this.redScore = 0;
    this.currentTurn = 'blue';
    this.isGoldenGoal = isGoldenGoal;
    this.penaltyState = null;

    this.setupKickoffPositions('blue');
    this.setMatchStatus('READY');

    sounds.playWhistle('start');

    if (this.gameMode !== 'practice') {
      this.startMatchTimer();
    }

    this.notifyAll();
  }

  public initPenalties(blueScore = 0, redScore = 0) {
    this.cleanupTimers();
    this.gameMode = 'penalties';
    this.blueScore = blueScore;
    this.redScore = redScore;
    this.penaltyState = {
      round: 0,
      currentTeam: 'blue',
      blueScore: 0,
      redScore: 0,
      blueHistory: [],
      redHistory: [],
      suddenDeath: false,
      finished: false,
      winner: null,
    };

    this.setupPenaltyRound();
    this.setMatchStatus('READY');
    this.notifyAll();
  }

  public startMatchTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      if (this.matchStatus === 'PAUSED' || this.matchStatus === 'GOAL' || this.matchStatus === 'MATCH_END') {
        return;
      }

      if (this.secondsRemaining > 0) {
        this.secondsRemaining -= 1;
        if (this.listener.onTimerTick) {
          this.listener.onTimerTick(this.secondsRemaining);
        }

        if (this.secondsRemaining <= 0) {
          this.handleTimeExpired();
        }
      }
    }, 1000);
  }

  public pauseMatch() {
    if (this.matchStatus !== 'PAUSED') {
      this.setMatchStatus('PAUSED');
    }
  }

  public resumeMatch() {
    if (this.matchStatus === 'PAUSED') {
      this.setMatchStatus('READY');
      if (this.currentTurn === 'red' && this.gameMode === 'cpu') {
        this.triggerCpuTurn();
      }
    }
  }

  public setupKickoffPositions(kickoffTeam: Team) {
    this.discs = [];
    this.physics.resetGoalFlag();

    // Reset ball to exact center
    this.ball.x = PITCH_BOUNDS.centerX;
    this.ball.y = PITCH_BOUNDS.centerY;
    this.ball.vx = 0;
    this.ball.vy = 0;

    // Team Blue (attacks Right, defends Left goal)
    // 1: GK, 2: DF Top, 3: DF Bottom, 4: MF, 5: FW
    this.discs.push({
      id: 'blue-gk',
      number: 1,
      team: 'blue',
      isGoalkeeper: true,
      x: 130,
      y: 370,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.gkRadius,
      mass: PHYSICS_CONFIG.gkMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'blue-2',
      number: 2,
      team: 'blue',
      isGoalkeeper: false,
      x: 290,
      y: 220,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'blue-3',
      number: 3,
      team: 'blue',
      isGoalkeeper: false,
      x: 290,
      y: 520,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'blue-4',
      number: 4,
      team: 'blue',
      isGoalkeeper: false,
      x: 440,
      y: 370,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'blue-5',
      number: 5,
      team: 'blue',
      isGoalkeeper: false,
      x: kickoffTeam === 'blue' ? 570 : 510,
      y: 370,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });

    // Team Red (attacks Left, defends Right goal)
    this.discs.push({
      id: 'red-gk',
      number: 1,
      team: 'red',
      isGoalkeeper: true,
      x: 1070,
      y: 370,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.gkRadius,
      mass: PHYSICS_CONFIG.gkMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'red-2',
      number: 2,
      team: 'red',
      isGoalkeeper: false,
      x: 910,
      y: 220,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'red-3',
      number: 3,
      team: 'red',
      isGoalkeeper: false,
      x: 910,
      y: 520,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'red-4',
      number: 4,
      team: 'red',
      isGoalkeeper: false,
      x: 760,
      y: 370,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
    this.discs.push({
      id: 'red-5',
      number: 5,
      team: 'red',
      isGoalkeeper: false,
      x: kickoffTeam === 'red' ? 630 : 690,
      y: 370,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONFIG.discRadius,
      mass: PHYSICS_CONFIG.discMass,
      friction: PHYSICS_CONFIG.discsFriction,
      restitution: PHYSICS_CONFIG.discDiscRestitution,
    });
  }

  public setupPenaltyRound() {
    if (!this.penaltyState) return;
    this.discs = [];
    this.physics.resetGoalFlag();

    const currentShooter = this.penaltyState.currentTeam;

    if (currentShooter === 'blue') {
      // Blue attacks Right Goal: ball placed on right penalty spot
      this.ball.x = 1000;
      this.ball.y = 370;
      this.ball.vx = 0;
      this.ball.vy = 0;

      // Opponent Goalkeeper on right goal line
      this.discs.push({
        id: 'red-gk',
        number: 1,
        team: 'red',
        isGoalkeeper: true,
        x: 1100,
        y: 370,
        vx: 0,
        vy: 0,
        radius: PHYSICS_CONFIG.gkRadius,
        mass: PHYSICS_CONFIG.gkMass,
        friction: PHYSICS_CONFIG.discsFriction,
        restitution: PHYSICS_CONFIG.discDiscRestitution,
      });

      // Blue shooter behind penalty spot
      this.discs.push({
        id: 'blue-5',
        number: 5,
        team: 'blue',
        isGoalkeeper: false,
        x: 910,
        y: 370,
        vx: 0,
        vy: 0,
        radius: PHYSICS_CONFIG.discRadius,
        mass: PHYSICS_CONFIG.discMass,
        friction: PHYSICS_CONFIG.discsFriction,
        restitution: PHYSICS_CONFIG.discDiscRestitution,
      });
    } else {
      // Red attacks Left Goal: ball on left penalty spot
      this.ball.x = 200;
      this.ball.y = 370;
      this.ball.vx = 0;
      this.ball.vy = 0;

      // Opponent Goalkeeper on left goal line
      this.discs.push({
        id: 'blue-gk',
        number: 1,
        team: 'blue',
        isGoalkeeper: true,
        x: 100,
        y: 370,
        vx: 0,
        vy: 0,
        radius: PHYSICS_CONFIG.gkRadius,
        mass: PHYSICS_CONFIG.gkMass,
        friction: PHYSICS_CONFIG.discsFriction,
        restitution: PHYSICS_CONFIG.discDiscRestitution,
      });

      // Red shooter behind penalty spot
      this.discs.push({
        id: 'red-5',
        number: 5,
        team: 'red',
        isGoalkeeper: false,
        x: 290,
        y: 370,
        vx: 0,
        vy: 0,
        radius: PHYSICS_CONFIG.discRadius,
        mass: PHYSICS_CONFIG.discMass,
        friction: PHYSICS_CONFIG.discsFriction,
        restitution: PHYSICS_CONFIG.discDiscRestitution,
      });
    }
  }

  public update(deltaTime: number) {
    this.animationTime += deltaTime;

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life += deltaTime;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    if (this.matchStatus === 'PAUSED' || this.matchStatus === 'MENU' || this.matchStatus === 'MATCH_END') {
      return;
    }

    // Run physics
    if (this.matchStatus === 'SIMULATING' || this.matchStatus === 'GOAL') {
      const moved = this.physics.update(this.discs, this.ball, deltaTime);

      // Check if all stopped
      if (this.physics.areAllStopped(this.discs, this.ball) || !moved) {
        if (this.matchStatus === 'SIMULATING') {
          this.onPhysicsStopped();
        }
      }
    }
  }

  private onPhysicsStopped() {
    if (this.gameMode === 'penalties' && this.penaltyState) {
      // In penalty shootout, check if shot resulted in goal or miss
      this.evaluatePenaltyShot();
      return;
    }

    // Standard turn change
    const nextTurn = this.currentTurn === 'blue' ? 'red' : 'blue';
    this.currentTurn = nextTurn;
    this.physics.resetGoalFlag();
    this.setMatchStatus('READY');

    if (this.listener.onTurnChange) {
      this.listener.onTurnChange(this.currentTurn);
    }

    // If CPU turn, trigger automated aim
    if (this.currentTurn === 'red' && this.gameMode === 'cpu') {
      this.triggerCpuTurn();
    }
  }

  private triggerCpuTurn() {
    if (this.matchStatus === 'PAUSED' || this.matchStatus === 'MATCH_END') return;

    // Delay before CPU starts aiming (realistic feel)
    this.cpuThinkingTimeout = window.setTimeout(() => {
      if (this.matchStatus === 'PAUSED' || this.matchStatus === 'MATCH_END') return;

      const plan = AIController.calculateBestShot(this.discs, this.ball, 'red', this.difficulty);
      if (!plan) {
        this.onPhysicsStopped();
        return;
      }

      // Show aiming preview briefly
      this.aimState = {
        active: true,
        discId: plan.discId,
        originX: plan.targetDisc.x,
        originY: plan.targetDisc.y,
        currentX: plan.targetDisc.x - Math.cos(plan.aimAngle) * (plan.power * PHYSICS_CONFIG.maxDragLength),
        currentY: plan.targetDisc.y - Math.sin(plan.aimAngle) * (plan.power * PHYSICS_CONFIG.maxDragLength),
        shootVx: plan.vx,
        shootVy: plan.vy,
        power: plan.power,
        angle: plan.aimAngle,
      };

      // CPU releases after 650ms
      this.cpuThinkingTimeout = window.setTimeout(() => {
        if (this.matchStatus === 'PAUSED' || this.matchStatus === 'MATCH_END') return;
        this.executeShot(plan.discId, plan.vx, plan.vy, plan.power);
      }, 650);
    }, 800);
  }

  public onPointerDown(virtX: number, virtY: number): boolean {
    if (this.matchStatus !== 'READY') return false;

    // Only allow input if it's player's turn
    if (this.gameMode === 'cpu' && this.currentTurn !== 'blue') return false;

    // In 2 player mode, allow whoever's turn it is
    // Find disc under pointer
    const touchedDisc = this.discs.find((d) => {
      if (d.team !== this.currentTurn) return false;
      const dist = Math.hypot(d.x - virtX, d.y - virtY);
      return dist <= d.radius + 15; // slightly generous touch target for mobile
    });

    if (touchedDisc) {
      this.aimState = {
        active: true,
        discId: touchedDisc.id,
        originX: touchedDisc.x,
        originY: touchedDisc.y,
        currentX: virtX,
        currentY: virtY,
        shootVx: 0,
        shootVy: 0,
        power: 0,
        angle: 0,
      };
      sounds.playClick();
      return true;
    }

    // In practice mode, allow dragging the ball directly!
    if (this.gameMode === 'practice') {
      const distToBall = Math.hypot(this.ball.x - virtX, this.ball.y - virtY);
      if (distToBall <= this.ball.radius + 18) {
        this.ball.x = Math.max(PITCH_BOUNDS.left + 20, Math.min(PITCH_BOUNDS.right - 20, virtX));
        this.ball.y = Math.max(PITCH_BOUNDS.top + 20, Math.min(PITCH_BOUNDS.bottom - 20, virtY));
        this.ball.vx = 0;
        this.ball.vy = 0;
        return true;
      }
    }

    return false;
  }

  public onPointerMove(virtX: number, virtY: number) {
    if (!this.aimState.active || !this.aimState.discId) return;

    const disc = this.discs.find((d) => d.id === this.aimState.discId);
    if (!disc) return;

    this.aimState.currentX = virtX;
    this.aimState.currentY = virtY;

    // Calculate drag vector (pull back)
    const pullX = disc.x - virtX;
    const pullY = disc.y - virtY;
    const pullDist = Math.hypot(pullX, pullY);

    if (pullDist < PHYSICS_CONFIG.minDragThreshold) {
      this.aimState.power = 0;
      this.aimState.shootVx = 0;
      this.aimState.shootVy = 0;
      return;
    }

    // Power clamped to max
    const power = Math.min(1.0, (pullDist - PHYSICS_CONFIG.minDragThreshold) / PHYSICS_CONFIG.maxDragLength);
    const angle = Math.atan2(pullY, pullX); // Shoot direction is opposite of drag finger

    const impulse = power * PHYSICS_CONFIG.maxImpulsePower;
    this.aimState.power = power;
    this.aimState.angle = angle;
    this.aimState.shootVx = Math.cos(angle) * impulse;
    this.aimState.shootVy = Math.sin(angle) * impulse;
  }

  public onPointerUp() {
    if (!this.aimState.active || !this.aimState.discId) return;

    const { discId, shootVx, shootVy, power } = this.aimState;
    this.aimState.active = false;
    this.aimState.discId = null;

    if (power <= 0.05) {
      // Cancelled by dead zone
      return;
    }

    this.executeShot(discId, shootVx, shootVy, power);
  }

  public executeShot(discId: string, vx: number, vy: number, power: number) {
    const disc = this.discs.find((d) => d.id === discId);
    if (!disc) return;

    disc.vx = vx;
    disc.vy = vy;

    this.spawnTurfDust(disc.x, disc.y);
    sounds.playKick(power);

    this.setMatchStatus('SIMULATING');
  }

  private handleCollision(event: CollisionEvent) {
    if (event.type === 'disc-disc') {
      sounds.playDiscCollision(event.intensity);
      this.spawnSparks(event.x, event.y, '#93c5fd');
    } else if (event.type === 'disc-ball') {
      sounds.playBallCollision(event.intensity);
      this.spawnSparks(event.x, event.y, '#fef08a');
    } else if (event.type === 'ball-post') {
      sounds.playPostHit();
      this.spawnSparks(event.x, event.y, '#ffffff');
    }
  }

  private handleGoal(scoringTeam: Team) {
    if (this.gameMode === 'penalties' && this.penaltyState) {
      // Handled in penalty mode
      if (this.penaltyState.currentTeam === 'blue') {
        this.penaltyState.blueScore += 1;
        this.penaltyState.blueHistory.push('goal');
      } else {
        this.penaltyState.redScore += 1;
        this.penaltyState.redHistory.push('goal');
      }
    } else {
      if (scoringTeam === 'blue') {
        this.blueScore += 1;
      } else {
        this.redScore += 1;
      }
    }

    sounds.playGoal();
    this.spawnConfetti(scoringTeam === 'blue' ? '#3b82f6' : '#ef4444');
    this.setMatchStatus('GOAL');

    if (this.listener.onScoreChange) {
      this.listener.onScoreChange(this.blueScore, this.redScore);
    }
    if (this.listener.onGoalScored) {
      this.listener.onGoalScored(scoringTeam);
    }

    // Golden Goal instant win check
    if (this.isGoldenGoal) {
      this.goalCelebrationTimer = window.setTimeout(() => {
        this.endMatch(scoringTeam);
      }, 2500);
      return;
    }

    // Reset after goal celebration (3 seconds)
    this.goalCelebrationTimer = window.setTimeout(() => {
      if (this.matchStatus === 'MATCH_END') return;

      if (this.gameMode === 'penalties') {
        this.advancePenaltyTurn();
      } else {
        // Conceding team restarts from center
        const nextKickoffTeam = scoringTeam === 'blue' ? 'red' : 'blue';
        this.currentTurn = nextKickoffTeam;
        this.setupKickoffPositions(nextKickoffTeam);
        this.setMatchStatus('READY');

        sounds.playWhistle('start');

        if (this.currentTurn === 'red' && this.gameMode === 'cpu') {
          this.triggerCpuTurn();
        }
      }
    }, 2800);
  }

  private evaluatePenaltyShot() {
    if (!this.penaltyState) return;

    // Check if goal was already triggered
    const isGoal = this.matchStatus === 'GOAL';
    if (!isGoal) {
      // It's a miss!
      if (this.penaltyState.currentTeam === 'blue') {
        this.penaltyState.blueHistory.push('miss');
      } else {
        this.penaltyState.redHistory.push('miss');
      }
      this.advancePenaltyTurn();
    }
  }

  private advancePenaltyTurn() {
    if (!this.penaltyState) return;

    if (this.penaltyState.currentTeam === 'blue') {
      this.penaltyState.currentTeam = 'red';
    } else {
      this.penaltyState.currentTeam = 'blue';
      this.penaltyState.round += 1;
    }

    // Check shootout win conditions
    const roundsCompleted = this.penaltyState.round;
    const bScore = this.penaltyState.blueScore;
    const rScore = this.penaltyState.redScore;
    const bHistory = this.penaltyState.blueHistory;
    const rHistory = this.penaltyState.redHistory;

    // Standard 5 rounds check
    if (roundsCompleted < 5) {
      const bRemaining = 5 - bHistory.length;
      const rRemaining = 5 - rHistory.length;

      // Mathematically impossible for red to catch up
      if (bScore > rScore + rRemaining) {
        this.finishPenalties('blue');
        return;
      }
      // Mathematically impossible for blue to catch up
      if (rScore > bScore + bRemaining) {
        this.finishPenalties('red');
        return;
      }
    } else {
      // Rounds >= 5: Sudden Death check after both teams shot in this round
      if (bHistory.length === rHistory.length) {
        if (bScore > rScore) {
          this.finishPenalties('blue');
          return;
        } else if (rScore > bScore) {
          this.finishPenalties('red');
          return;
        }
      }
      this.penaltyState.suddenDeath = true;
    }

    if (this.listener.onPenaltyUpdate) {
      this.listener.onPenaltyUpdate(this.penaltyState);
    }

    this.setupPenaltyRound();
    this.setMatchStatus('READY');

    if (this.penaltyState.currentTeam === 'red' && this.gameMode === 'cpu') {
      this.triggerCpuTurn();
    }
  }

  private finishPenalties(winner: Team) {
    if (!this.penaltyState) return;
    this.penaltyState.finished = true;
    this.penaltyState.winner = winner;
    if (this.listener.onPenaltyUpdate) {
      this.listener.onPenaltyUpdate(this.penaltyState);
    }
    this.endMatch(winner);
  }

  private handleTimeExpired() {
    sounds.playWhistle('end');

    if (this.blueScore > this.redScore) {
      this.endMatch('blue');
    } else if (this.redScore > this.blueScore) {
      this.endMatch('red');
    } else {
      // Draw! Handled by UI modal (offer extra time or penalties)
      this.setMatchStatus('MATCH_END');
      if (this.listener.onMatchEnd) {
        this.listener.onMatchEnd('draw', this.blueScore, this.redScore);
      }
    }
  }

  public endMatch(winner: Team | 'draw') {
    this.cleanupTimers();
    this.setMatchStatus('MATCH_END');

    // Record stats
    if (this.gameMode === 'cpu') {
      const playerWon = winner === 'blue';
      const isDraw = winner === 'draw';
      StorageManager.recordMatch(playerWon, isDraw, this.blueScore, this.redScore);
    }

    if (this.listener.onMatchEnd) {
      this.listener.onMatchEnd(winner, this.blueScore, this.redScore);
    }
  }

  private setMatchStatus(status: MatchStatus) {
    this.matchStatus = status;
    if (this.listener.onStatusChange) {
      this.listener.onStatusChange(status);
    }
  }

  private notifyAll() {
    if (this.listener.onScoreChange) this.listener.onScoreChange(this.blueScore, this.redScore);
    if (this.listener.onTurnChange) this.listener.onTurnChange(this.currentTurn);
    if (this.listener.onStatusChange) this.listener.onStatusChange(this.matchStatus);
    if (this.listener.onTimerTick) this.listener.onTimerTick(this.secondsRemaining);
  }

  private spawnSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 2.5,
        alpha: 1,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
      });
    }
  }

  private spawnTurfDust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: 'rgba(255, 255, 255, 0.4)',
        radius: 3 + Math.random() * 3,
        alpha: 0.8,
        life: 0,
        maxLife: 0.3,
      });
    }
  }

  private spawnConfetti(mainColor: string) {
    const colors = [mainColor, '#fbbf24', '#ffffff', '#22c55e', '#a855f7'];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        x: PITCH_BOUNDS.centerX + (Math.random() - 0.5) * 300,
        y: PITCH_BOUNDS.centerY + (Math.random() - 0.5) * 200,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0,
      });
    }
  }

  public cleanupTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.cpuThinkingTimeout) {
      clearTimeout(this.cpuThinkingTimeout);
      this.cpuThinkingTimeout = null;
    }
    if (this.goalCelebrationTimer) {
      clearTimeout(this.goalCelebrationTimer);
      this.goalCelebrationTimer = null;
    }
  }

  public resetPracticePositions() {
    this.setupKickoffPositions('blue');
    this.setMatchStatus('READY');
  }

  public resetPracticeBall() {
    this.ball.x = PITCH_BOUNDS.centerX;
    this.ball.y = PITCH_BOUNDS.centerY;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }
}
