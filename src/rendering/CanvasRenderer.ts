import { AREAS, COLORS, FIELD_HEIGHT, FIELD_WIDTH, GOAL_CONFIG, PITCH_BOUNDS } from '../constants/field';
import { AimState, Ball, Disc, Particle, Team } from '../types/game';

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export class CanvasRenderer {
  public transform: ViewportTransform = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
  };

  /**
   * Recalculate viewport scale and offset to center virtual field in canvas.
   */
  public updateDimensions(canvasWidth: number, canvasHeight: number) {
    const scaleX = canvasWidth / FIELD_WIDTH;
    const scaleY = canvasHeight / FIELD_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const scaledW = FIELD_WIDTH * scale;
    const scaledH = FIELD_HEIGHT * scale;

    this.transform = {
      scale,
      offsetX: (canvasWidth - scaledW) / 2,
      offsetY: (canvasHeight - scaledH) / 2,
      width: canvasWidth,
      height: canvasHeight,
    };
  }

  public screenToVirtual(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.transform.offsetX) / this.transform.scale,
      y: (screenY - this.transform.offsetY) / this.transform.scale,
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    discs: Disc[],
    ball: Ball,
    aimState: AimState,
    particles: Particle[],
    currentTurn: Team,
    isPhysicsRunning: boolean,
    animTime: number
  ) {
    const { scale, offsetX, offsetY, width, height } = this.transform;

    // Clear canvas background (dark stadium surround)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply viewport scale and translation
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 1. Draw pitch outer cushion/table border
    this.drawCushions(ctx);

    // 2. Draw grass and turf stripes
    this.drawGrass(ctx);

    // 3. Draw goals and net meshes
    this.drawGoals(ctx);

    // 4. Draw pitch lines and markings
    this.drawPitchMarkings(ctx);

    // 5. Draw particles (behind or in front of players)
    this.drawParticles(ctx, particles);

    // 6. Draw players (discs)
    for (const disc of discs) {
      this.drawDisc(ctx, disc, currentTurn, aimState, isPhysicsRunning, animTime);
    }

    // 7. Draw ball
    this.drawBall(ctx, ball);

    // 8. Draw goal posts on top of everything
    this.drawGoalPosts(ctx);

    // 9. Draw aiming preview (trajectory, arrow, power indicator)
    if (aimState.active && aimState.discId) {
      const activeDisc = discs.find((d) => d.id === aimState.discId);
      if (activeDisc) {
        this.drawAimGuide(ctx, activeDisc, aimState, discs, ball);
      }
    }

    ctx.restore();
  }

  private drawCushions(ctx: CanvasRenderingContext2D) {
    // Outer wooden bumper table frame
    ctx.save();
    ctx.fillStyle = COLORS.cushionWood;
    ctx.beginPath();
    ctx.roundRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT, 24);
    ctx.fill();

    // Wood grain highlight trim
    ctx.strokeStyle = COLORS.cushionTrim;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner green rubber cushion rail
    ctx.fillStyle = COLORS.cushionInner;
    ctx.beginPath();
    ctx.roundRect(40, 30, FIELD_WIDTH - 80, FIELD_HEIGHT - 60, 16);
    ctx.fill();
    ctx.restore();
  }

  private drawGrass(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const { left, right, top, bottom, width, height } = PITCH_BOUNDS;

    // Clip to pitch area
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();

    // Alternating vertical grass stripes
    const stripeCount = 14;
    const stripeWidth = width / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? COLORS.pitchGrassDark : COLORS.pitchGrassLight;
      ctx.fillRect(left + i * stripeWidth, top, stripeWidth, height);
    }

    ctx.restore();
  }

  private drawGoals(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Left Goal area (behind left goal line)
    const leftGoalX = GOAL_CONFIG.leftBackX;
    const goalW = GOAL_CONFIG.leftGoalLineX - GOAL_CONFIG.leftBackX;
    const goalH = GOAL_CONFIG.bottomY - GOAL_CONFIG.topY;

    // Left Net Background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(leftGoalX, GOAL_CONFIG.topY, goalW, goalH);

    // Left Net Mesh
    ctx.strokeStyle = COLORS.netLines;
    ctx.lineWidth = 1.2;
    for (let x = leftGoalX; x <= GOAL_CONFIG.leftGoalLineX; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, GOAL_CONFIG.topY);
      ctx.lineTo(x, GOAL_CONFIG.bottomY);
      ctx.stroke();
    }
    for (let y = GOAL_CONFIG.topY; y <= GOAL_CONFIG.bottomY; y += 10) {
      ctx.beginPath();
      ctx.moveTo(leftGoalX, y);
      ctx.lineTo(GOAL_CONFIG.leftGoalLineX, y);
      ctx.stroke();
    }

    // Right Goal area (behind right goal line)
    const rightGoalX = GOAL_CONFIG.rightGoalLineX;
    const rightGoalW = GOAL_CONFIG.rightBackX - GOAL_CONFIG.rightGoalLineX;

    ctx.fillStyle = '#064e3b';
    ctx.fillRect(rightGoalX, GOAL_CONFIG.topY, rightGoalW, goalH);

    // Right Net Mesh
    for (let x = rightGoalX; x <= GOAL_CONFIG.rightBackX; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, GOAL_CONFIG.topY);
      ctx.lineTo(x, GOAL_CONFIG.bottomY);
      ctx.stroke();
    }
    for (let y = GOAL_CONFIG.topY; y <= GOAL_CONFIG.bottomY; y += 10) {
      ctx.beginPath();
      ctx.moveTo(rightGoalX, y);
      ctx.lineTo(GOAL_CONFIG.rightBackX, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawPitchMarkings(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const { left, right, top, bottom, centerX, centerY, width, height } = PITCH_BOUNDS;

    ctx.strokeStyle = COLORS.pitchLines;
    ctx.lineWidth = 3;

    // 1. Outer boundary line
    ctx.strokeRect(left, top, width, height);

    // 2. Halfway line
    ctx.beginPath();
    ctx.moveTo(centerX, top);
    ctx.lineTo(centerX, bottom);
    ctx.stroke();

    // 3. Center circle & Center spot
    ctx.beginPath();
    ctx.arc(centerX, centerY, AREAS.centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.pitchLines;
    ctx.beginPath();
    ctx.arc(centerX, centerY, AREAS.centerSpotRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Penalty areas (Grande Área)
    const penBoxY = centerY - AREAS.penaltyBoxHeight / 2;
    // Left
    ctx.strokeRect(left, penBoxY, AREAS.penaltyBoxWidth, AREAS.penaltyBoxHeight);
    // Right
    ctx.strokeRect(right - AREAS.penaltyBoxWidth, penBoxY, AREAS.penaltyBoxWidth, AREAS.penaltyBoxHeight);

    // 5. Goal areas (Pequena Área)
    const goalBoxY = centerY - AREAS.goalBoxHeight / 2;
    // Left
    ctx.strokeRect(left, goalBoxY, AREAS.goalBoxWidth, AREAS.goalBoxHeight);
    // Right
    ctx.strokeRect(right - AREAS.goalBoxWidth, goalBoxY, AREAS.goalBoxWidth, AREAS.goalBoxHeight);

    // 6. Penalty spots
    const leftPenSpotX = left + AREAS.penaltySpotDist;
    const rightPenSpotX = right - AREAS.penaltySpotDist;
    ctx.beginPath();
    ctx.arc(leftPenSpotX, centerY, AREAS.centerSpotRadius, 0, Math.PI * 2);
    ctx.arc(rightPenSpotX, centerY, AREAS.centerSpotRadius, 0, Math.PI * 2);
    ctx.fill();

    // 7. Penalty arcs (D-box outside penalty area)
    ctx.beginPath();
    ctx.arc(leftPenSpotX, centerY, 55, -0.6, 0.6);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightPenSpotX, centerY, 55, Math.PI - 0.6, Math.PI + 0.6);
    ctx.stroke();

    // 8. Corner arcs
    const r = AREAS.cornerArcRadius;
    // Top-left
    ctx.beginPath();
    ctx.arc(left, top, r, 0, Math.PI / 2);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.arc(left, bottom, r, -Math.PI / 2, 0);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.arc(right, top, r, Math.PI / 2, Math.PI);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.arc(right, bottom, r, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }

  private drawGoalPosts(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const posts = [
      { x: GOAL_CONFIG.leftGoalLineX, y: GOAL_CONFIG.topY },
      { x: GOAL_CONFIG.leftGoalLineX, y: GOAL_CONFIG.bottomY },
      { x: GOAL_CONFIG.rightGoalLineX, y: GOAL_CONFIG.topY },
      { x: GOAL_CONFIG.rightGoalLineX, y: GOAL_CONFIG.bottomY },
    ];

    for (const p of posts) {
      // Shadow
      ctx.fillStyle = COLORS.postShadow;
      ctx.beginPath();
      ctx.arc(p.x + 2, p.y + 2, GOAL_CONFIG.postRadius, 0, Math.PI * 2);
      ctx.fill();

      // Post body (metallic white)
      ctx.fillStyle = COLORS.postColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, GOAL_CONFIG.postRadius, 0, Math.PI * 2);
      ctx.fill();

      // Metallic rim
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawDisc(
    ctx: CanvasRenderingContext2D,
    disc: Disc,
    currentTurn: Team,
    aimState: AimState,
    isPhysicsRunning: boolean,
    animTime: number
  ) {
    ctx.save();
    const isSelected = aimState.active && aimState.discId === disc.id;
    const isMyTurn = disc.team === currentTurn && !isPhysicsRunning;

    // 1. Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(disc.x + 3, disc.y + 4, disc.radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pulse indicator if selectable on current turn
    if (isMyTurn && !isSelected) {
      const pulse = Math.sin(animTime * 4) * 0.5 + 0.5;
      ctx.strokeStyle = disc.team === 'blue' ? `rgba(96, 165, 250, ${0.4 + pulse * 0.4})` : `rgba(248, 113, 113, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(disc.x, disc.y, disc.radius + 3 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Highlight halo if selected
    if (isSelected) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(disc.x, disc.y, disc.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Main Disc Outer Base
    const isBlue = disc.team === 'blue';
    const mainColor = isBlue ? COLORS.blueTeamMain : COLORS.redTeamMain;
    const darkColor = isBlue ? COLORS.blueTeamDark : COLORS.redTeamDark;
    const secColor = isBlue ? COLORS.blueTeamSecondary : COLORS.redTeamSecondary;

    // Radial gradient for glossy arcade plastic/acrylic look
    const grad = ctx.createRadialGradient(
      disc.x - disc.radius * 0.3,
      disc.y - disc.radius * 0.3,
      disc.radius * 0.1,
      disc.x,
      disc.y,
      disc.radius
    );
    grad.addColorStop(0, secColor);
    grad.addColorStop(0.65, mainColor);
    grad.addColorStop(1, darkColor);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, disc.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim bevel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Goalkeeper distinctive accent
    if (disc.isGoalkeeper) {
      ctx.strokeStyle = '#fbbf24'; // Golden ring
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(disc.x, disc.y, disc.radius - 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6. Inner recessed circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, disc.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // 7. Player Number
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${disc.isGoalkeeper ? 16 : 17}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(disc.isGoalkeeper ? '1' : `${disc.number}`, disc.x, disc.y + 0.5);

    ctx.restore();
  }

  private drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
    ctx.save();

    // Drop shadow
    ctx.fillStyle = COLORS.ballShadow;
    ctx.beginPath();
    ctx.arc(ball.x + 2, ball.y + 3, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball Base (radial gradient for 3D sphere)
    const grad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.35,
      ball.y - ball.radius * 0.35,
      ball.radius * 0.1,
      ball.x,
      ball.y,
      ball.radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.8, '#e2e8f0');
    grad.addColorStop(1, '#94a3b8');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Rotating soccer ball patches
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    ctx.fillStyle = '#1e293b';
    // Center pentagon
    this.drawPolygon(ctx, 0, 0, ball.radius * 0.38, 5);
    ctx.fill();

    // Edge triangles
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const ex = Math.cos(angle) * (ball.radius * 0.85);
      const ey = Math.sin(angle) * (ball.radius * 0.85);
      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.35, ball.y - ball.radius * 0.35, ball.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  private drawAimGuide(
    ctx: CanvasRenderingContext2D,
    disc: Disc,
    aim: AimState,
    discs: Disc[],
    ball: Ball
  ) {
    ctx.save();

    // Shot launch direction is opposite to pull direction
    const shotAngle = aim.angle;
    const power = aim.power;

    // 1. Pull line (from disc center to user finger/pointer)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(disc.x, disc.y);
    ctx.lineTo(aim.currentX, aim.currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Touch handle circle where user's finger is
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(aim.currentX, aim.currentY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Trajectory prediction raycast (with wall bounce!)
    const rayLength = 120 + power * 340;
    const dirX = Math.cos(shotAngle);
    const dirY = Math.sin(shotAngle);

    let startX = disc.x;
    let startY = disc.y;
    let endX = startX + dirX * rayLength;
    let endY = startY + dirY * rayLength;

    // Check if ray hits top or bottom cushion
    const topY = PITCH_BOUNDS.top + disc.radius;
    const bottomY = PITCH_BOUNDS.bottom - disc.radius;
    let bounced = false;
    let bounceX = 0;
    let bounceY = 0;
    let bounceEndX = 0;
    let bounceEndY = 0;

    if (dirY < 0 && startY + dirY * rayLength < topY) {
      // hits top
      const t = (topY - startY) / dirY;
      bounceX = startX + dirX * t;
      bounceY = topY;
      const remainingLen = (rayLength - t) * 0.6;
      bounceEndX = bounceX + dirX * remainingLen;
      bounceEndY = bounceY - dirY * remainingLen; // bounce y reflected
      bounced = true;
      endX = bounceX;
      endY = bounceY;
    } else if (dirY > 0 && startY + dirY * rayLength > bottomY) {
      // hits bottom
      const t = (bottomY - startY) / dirY;
      bounceX = startX + dirX * t;
      bounceY = bottomY;
      const remainingLen = (rayLength - t) * 0.6;
      bounceEndX = bounceX + dirX * remainingLen;
      bounceEndY = bounceY - dirY * remainingLen;
      bounced = true;
      endX = bounceX;
      endY = bounceY;
    }

    // Draw primary trajectory
    const powerColor = power > 0.75 ? COLORS.aimPowerHigh : power > 0.4 ? COLORS.aimPowerMid : COLORS.aimPowerLow;

    ctx.strokeStyle = powerColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw bounce trajectory if any
    if (bounced) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(bounceX, bounceY);
      ctx.lineTo(bounceEndX, bounceEndY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Forward Arrow head at end of main trajectory
    const headLen = 14;
    ctx.fillStyle = powerColor;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLen * Math.cos(shotAngle - Math.PI / 6),
      endY - headLen * Math.sin(shotAngle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLen * Math.cos(shotAngle + Math.PI / 6),
      endY - headLen * Math.sin(shotAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // 4. Power Arc around disc
    const arcRadius = disc.radius + 12;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, arcRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = powerColor;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, arcRadius, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2);
    ctx.stroke();

    // 5. High Density Range Ring (maximum pull boundary)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, 140, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. High Density Power Pill Badge
    const powerPct = Math.round(power * 100);
    const badgeText = `FORÇA: ${powerPct}%`;
    const badgeY = disc.y + disc.radius + 28;

    ctx.font = 'bold 11px monospace';
    const textW = ctx.measureText(badgeText).width;
    const badgePadX = 8;
    const badgeH = 18;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(disc.x - textW / 2 - badgePadX, badgeY - badgeH / 2, textW + badgePadX * 2, badgeH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, disc.x, badgeY);

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    ctx.save();
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
