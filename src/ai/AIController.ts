import { GOAL_CONFIG, PHYSICS_CONFIG, PITCH_BOUNDS } from '../constants/field';
import { AIDifficulty, Ball, Disc, Team } from '../types/game';

export interface AIShotPlan {
  discId: string;
  vx: number;
  vy: number;
  power: number;
  targetDisc: Disc;
  aimAngle: number;
}

interface ShotCandidate {
  disc: Disc;
  angle: number; // direction to launch disc towards ball
  power: number;
  score: number; // fitness rating
  type: 'direct-goal' | 'direct-ball' | 'bank-shot' | 'defensive-clear';
}

export class AIController {
  /**
   * Plan best shot for the given team (usually 'red').
   */
  public static calculateBestShot(
    discs: Disc[],
    ball: Ball,
    team: Team,
    difficulty: AIDifficulty
  ): AIShotPlan | null {
    const myDiscs = discs.filter((d) => d.team === team);
    if (myDiscs.length === 0) return null;

    // Red attacks left goal (x = 80, y = 370), defends right goal (x = 1120, y = 370)
    // Blue attacks right goal, defends left goal
    const targetGoalX = team === 'red' ? GOAL_CONFIG.leftGoalLineX : GOAL_CONFIG.rightGoalLineX;
    const targetGoalY = (GOAL_CONFIG.topY + GOAL_CONFIG.bottomY) / 2;
    const ownGoalX = team === 'red' ? GOAL_CONFIG.rightGoalLineX : GOAL_CONFIG.leftGoalLineX;
    const ownGoalY = targetGoalY;

    const candidates: ShotCandidate[] = [];

    for (const disc of myDiscs) {
      // 1. Evaluate direct shot: hit ball towards opponent goal
      const toBallAngle = Math.atan2(ball.y - disc.y, ball.x - disc.x);
      const distToBall = Math.hypot(ball.x - disc.x, ball.y - disc.y);

      // Where ball would go if hit by this disc along normal
      // Ideally we want to hit the ball on its back side so it travels towards opponent goal
      const ballToGoalAngle = Math.atan2(targetGoalY - ball.y, targetGoalX - ball.x);
      
      // Point on the ball perimeter opposite to the goal
      const impactTargetX = ball.x - Math.cos(ballToGoalAngle) * (disc.radius + ball.radius);
      const impactTargetY = ball.y - Math.sin(ballToGoalAngle) * (disc.radius + ball.radius);

      const angleToImpact = Math.atan2(impactTargetY - disc.y, impactTargetX - disc.x);
      const distToImpact = Math.hypot(impactTargetX - disc.x, impactTargetY - disc.y);

      // Fitness calculation
      let directScore = 100 - distToImpact * 0.1;

      // Bonus if disc is behind the ball relative to target goal
      const isBehindBall = team === 'red' ? disc.x > ball.x : disc.x < ball.x;
      if (isBehindBall) {
        directScore += 60;
      }

      // If ball is very close to opponent goal, high priority to shoot!
      const distBallToGoal = Math.hypot(targetGoalX - ball.x, targetGoalY - ball.y);
      if (distBallToGoal < 380) {
        directScore += 75;
      }

      // Defensive urgency: ball is close to own goal
      const distBallToOwnGoal = Math.hypot(ownGoalX - ball.x, ownGoalY - ball.y);
      let isEmergencyDefend = false;
      if (distBallToOwnGoal < 260) {
        isEmergencyDefend = true;
        directScore += 90;
      }

      // Goalkeeper penalty for leaving goal unless emergency
      if (disc.isGoalkeeper && !isEmergencyDefend && distBallToOwnGoal > 280) {
        directScore -= 50;
      }

      // Required power calculation
      let calculatedPower = Math.min(1.0, Math.max(0.4, (distToImpact + distBallToGoal * 0.7) / 600));
      if (isEmergencyDefend) {
        calculatedPower = 0.95;
      }

      candidates.push({
        disc,
        angle: angleToImpact,
        power: calculatedPower,
        score: directScore,
        type: 'direct-goal',
      });

      // 2. Direct hit to ball (simpler trajectory)
      candidates.push({
        disc,
        angle: toBallAngle,
        power: Math.min(1.0, Math.max(0.35, distToBall / 450)),
        score: directScore - 15,
        type: 'direct-ball',
      });

      // 3. Bank shot off top or bottom rail (Hard / Normal)
      if (difficulty !== 'easy') {
        // Upper wall rebound
        const topWallY = PITCH_BOUNDS.top;
        // virtual reflected ball
        const reflectedBallY = 2 * topWallY - ball.y;
        const bankTopAngle = Math.atan2(reflectedBallY - disc.y, ball.x - disc.x);
        
        candidates.push({
          disc,
          angle: bankTopAngle,
          power: 0.85,
          score: directScore - 25,
          type: 'bank-shot',
        });

        // Bottom wall rebound
        const bottomWallY = PITCH_BOUNDS.bottom;
        const reflectedBottomBallY = 2 * bottomWallY - ball.y;
        const bankBottomAngle = Math.atan2(reflectedBottomBallY - disc.y, ball.x - disc.x);

        candidates.push({
          disc,
          angle: bankBottomAngle,
          power: 0.85,
          score: directScore - 25,
          type: 'bank-shot',
        });
      }
    }

    if (candidates.length === 0) return null;

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Pick candidate according to difficulty
    let chosen: ShotCandidate;
    if (difficulty === 'easy') {
      // Pick randomly from top 4 candidates to allow human to win more easily
      const topPool = candidates.slice(0, Math.min(4, candidates.length));
      chosen = topPool[Math.floor(Math.random() * topPool.length)];
    } else if (difficulty === 'normal') {
      // Pick top 2
      const topPool = candidates.slice(0, Math.min(2, candidates.length));
      chosen = topPool[Math.floor(Math.random() * topPool.length)];
    } else {
      // Hard: Best candidate
      chosen = candidates[0];
    }

    // Apply natural human-like inaccuracy based on difficulty
    let finalAngle = chosen.angle;
    let finalPower = chosen.power;

    if (difficulty === 'easy') {
      const angleErr = (Math.random() - 0.5) * 0.35; // +/- ~10 degrees
      const powerErr = (Math.random() - 0.5) * 0.25;
      finalAngle += angleErr;
      finalPower = Math.min(1.0, Math.max(0.3, finalPower + powerErr));
    } else if (difficulty === 'normal') {
      const angleErr = (Math.random() - 0.5) * 0.12; // +/- ~3.5 degrees
      const powerErr = (Math.random() - 0.5) * 0.1;
      finalAngle += angleErr;
      finalPower = Math.min(1.0, Math.max(0.35, finalPower + powerErr));
    } else {
      // Hard: very small variance
      const angleErr = (Math.random() - 0.5) * 0.04; // +/- ~1.1 degrees
      finalAngle += angleErr;
      finalPower = Math.min(1.0, Math.max(0.4, finalPower));
    }

    const impulse = finalPower * PHYSICS_CONFIG.maxImpulsePower;
    const vx = Math.cos(finalAngle) * impulse;
    const vy = Math.sin(finalAngle) * impulse;

    return {
      discId: chosen.disc.id,
      vx,
      vy,
      power: finalPower,
      targetDisc: chosen.disc,
      aimAngle: finalAngle,
    };
  }
}
