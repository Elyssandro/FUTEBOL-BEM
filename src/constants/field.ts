export const FIELD_WIDTH = 1200;
export const FIELD_HEIGHT = 740;

// Bounds of the actual green pitch lines
export const PITCH_BOUNDS = {
  left: 80,
  right: 1120,
  top: 60,
  bottom: 680,
  width: 1040,
  height: 620,
  centerX: 600,
  centerY: 370,
};

// Goals dimensions
export const GOAL_CONFIG = {
  topY: 295,
  bottomY: 445,
  height: 150,
  depth: 65,
  postRadius: 6,
  leftGoalLineX: 80,
  rightGoalLineX: 1120,
  leftBackX: 15,
  rightBackX: 1185,
};

// Penalty and Goal areas
export const AREAS = {
  penaltyBoxWidth: 170,
  penaltyBoxHeight: 360,
  goalBoxWidth: 65,
  goalBoxHeight: 210,
  penaltySpotDist: 125, // from goal line
  centerCircleRadius: 85,
  centerSpotRadius: 5,
  cornerArcRadius: 20,
};

// Physics parameters
export const PHYSICS_CONFIG = {
  fixedDeltaTime: 1 / 60,
  subSteps: 8,
  
  // Damping / rolling friction per second
  ballFriction: 0.985,
  discsFriction: 0.978,
  
  // Restitutions (bounciness)
  discDiscRestitution: 0.82,
  discBallRestitution: 0.88,
  cushionRestitution: 0.75,
  postRestitution: 0.85,
  netDamping: 0.35,

  // Radii
  discRadius: 26,
  gkRadius: 28,
  ballRadius: 12,

  // Masses
  discMass: 2.2,
  gkMass: 3.6,
  ballMass: 0.65,

  // Velocity thresholds
  sleepVelocityThreshold: 0.12, // when squared velocity < this, consider stopped
  maxImpulsePower: 34,
  minDragThreshold: 10, // dead zone in virtual units
  maxDragLength: 150, // max pull length in virtual units
};

// Colors
export const COLORS = {
  pitchGrassDark: '#064e3b',
  pitchGrassLight: '#14532d',
  pitchLines: 'rgba(255, 255, 255, 0.75)',
  cushionWood: '#0f172a',
  cushionTrim: '#334155',
  cushionInner: '#064e3b',
  postColor: '#f8fafc',
  postShadow: 'rgba(0, 0, 0, 0.5)',
  netLines: 'rgba(255, 255, 255, 0.35)',

  blueTeamMain: '#2563eb',
  blueTeamSecondary: '#60a5fa',
  blueTeamDark: '#1e40af',
  blueTeamGk: '#0284c7',

  redTeamMain: '#dc2626',
  redTeamSecondary: '#f87171',
  redTeamDark: '#991b1b',
  redTeamGk: '#d97706',

  ballMain: '#f8fafc',
  ballAccent: '#0f172a',
  ballShadow: 'rgba(0, 0, 0, 0.45)',

  aimLine: '#38bdf8',
  aimArrow: '#f59e0b',
  aimPowerHigh: '#ef4444',
  aimPowerMid: '#eab308',
  aimPowerLow: '#10b981',
};
