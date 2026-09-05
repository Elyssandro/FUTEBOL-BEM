/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sounds } from './audio/SoundManager';
import { GoalOverlay } from './components/GoalOverlay';
import { MainMenu } from './components/MainMenu';
import { MatchEndModal } from './components/MatchEndModal';
import { OrientationNotice } from './components/OrientationNotice';
import { PauseModal } from './components/PauseModal';
import { Scoreboard } from './components/Scoreboard';
import { SettingsModal } from './components/SettingsModal';
import { TacticalFooter } from './components/TacticalFooter';
import { TournamentModal } from './components/TournamentModal';
import { TrainingControls } from './components/TrainingControls';
import { GameEngine } from './game/GameEngine';
import { CanvasRenderer } from './rendering/CanvasRenderer';
import { StorageManager } from './storage/StorageManager';
import { TournamentManager } from './tournament/TournamentManager';
import {
  AIDifficulty,
  GameMode,
  MatchSettings,
  MatchStatus,
  PenaltyShootoutState,
  Team,
  TournamentData,
} from './types/game';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer>(new CanvasRenderer());
  const engineRef = useRef<GameEngine | null>(null);

  // App UI states
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('cpu');
  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [currentTurn, setCurrentTurn] = useState<Team>('blue');
  const [scoringTeam, setScoringTeam] = useState<Team | null>(null);
  const [matchWinner, setMatchWinner] = useState<Team | 'draw' | null>(null);

  // Modals & Overlays
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [aimInfo, setAimInfo] = useState<{ isAiming: boolean; power: number; discNumber: number | null }>({
    isAiming: false,
    power: 0,
    discNumber: null,
  });

  // Settings & Storage
  const [settings, setSettings] = useState<MatchSettings>(() => StorageManager.loadSettings());
  const [stats, setStats] = useState(() => StorageManager.loadStats());
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [penaltyState, setPenaltyState] = useState<PenaltyShootoutState | null>(null);

  // Sync settings with audio manager
  useEffect(() => {
    sounds.setSoundEnabled(settings.soundEnabled);
    sounds.setMusicEnabled(settings.musicEnabled);
    sounds.setVibrationEnabled(settings.vibrationEnabled);
    StorageManager.saveSettings(settings);
  }, [settings]);

  // Initialize GameEngine once
  useEffect(() => {
    const engine = new GameEngine(settings, {
      onScoreChange: (b, r) => {
        setBlueScore(b);
        setRedScore(r);
      },
      onTurnChange: (turn) => {
        setCurrentTurn(turn);
      },
      onStatusChange: (status) => {
        setMatchStatus(status);
        if (status === 'GOAL') {
          // Goal celebration shown
        } else {
          setScoringTeam(null);
        }
      },
      onTimerTick: (secs) => {
        setSecondsRemaining(secs);
      },
      onGoalScored: (team) => {
        setScoringTeam(team);
      },
      onMatchEnd: (winner, bScore, rScore) => {
        setMatchWinner(winner);
        setStats(StorageManager.loadStats());
      },
      onPenaltyUpdate: (pState) => {
        setPenaltyState({ ...pState });
      },
    });

    engineRef.current = engine;

    return () => {
      engine.cleanupTimers();
    };
  }, []);

  // Main Render & Physics Animation Loop
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const engine = engineRef.current;
      const renderer = rendererRef.current;
      const canvas = canvasRef.current;

      if (engine && renderer && canvas) {
        // Update physics & game logic
        engine.update(dt);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderer.render(
            ctx,
            engine.discs,
            engine.ball,
            engine.aimState,
            engine.particles,
            engine.currentTurn,
            engine.matchStatus === 'SIMULATING',
            time * 0.001
          );
        }
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Resize canvas according to container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      rendererRef.current.updateDimensions(rect.width, rect.height);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvas);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Pointer Event Handlers
  const getVirtualCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return rendererRef.current.screenToVirtual(screenX, screenY);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    sounds.init(); // Initialize audio context on first touch

    const coords = getVirtualCoords(e);
    const engine = engineRef.current;
    if (!engine) return;

    const captured = engine.onPointerDown(coords.x, coords.y);
    if (captured && canvasRef.current) {
      canvasRef.current.setPointerCapture(e.pointerId);
      const selected = engine.discs.find((d) => d.id === engine.aimState.selectedDiscId);
      setAimInfo({
        isAiming: true,
        power: engine.aimState.aimPower,
        discNumber: selected ? selected.number : null,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getVirtualCoords(e);
    const engine = engineRef.current;
    if (engine) {
      engine.onPointerMove(coords.x, coords.y);
      if (engine.aimState.isAiming) {
        setAimInfo((prev) => ({
          ...prev,
          power: engine.aimState.aimPower,
        }));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (canvasRef.current && canvasRef.current.hasPointerCapture(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
    engineRef.current?.onPointerUp();
    setAimInfo({ isAiming: false, power: 0, discNumber: null });
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (canvasRef.current && canvasRef.current.hasPointerCapture(e.pointerId)) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
    engineRef.current?.onPointerUp();
    setAimInfo({ isAiming: false, power: 0, discNumber: null });
  };

  // Game Flow Actions
  const handleStartMatch = (mode: GameMode, difficulty: AIDifficulty = settings.difficulty) => {
    setGameMode(mode);
    setMatchWinner(null);
    setScoringTeam(null);
    setIsPaused(false);
    setShowTournamentModal(false);

    const engine = engineRef.current;
    if (engine) {
      engine.difficulty = difficulty;
      engine.initMatch(mode, mode === 'practice' ? 999999 : settings.durationSeconds);
    }
  };

  const handleStartPenaltiesMode = () => {
    setGameMode('penalties');
    setMatchWinner(null);
    setScoringTeam(null);
    setIsPaused(false);
    setShowTournamentModal(false);

    const engine = engineRef.current;
    if (engine) {
      engine.initPenalties();
    }
  };

  const handleStartGoldenGoal = () => {
    setMatchWinner(null);
    setScoringTeam(null);
    setIsPaused(false);

    const engine = engineRef.current;
    if (engine) {
      // 1 minute golden goal match
      engine.initMatch(gameMode, 60, true);
    }
  };

  const handleOpenTournament = () => {
    if (!tournamentData) {
      const created = TournamentManager.createTournament('Estrela Azul');
      setTournamentData(created);
    }
    setShowTournamentModal(true);
  };

  const handlePlayTournamentMatch = () => {
    setShowTournamentModal(false);
    handleStartMatch('tournament', settings.difficulty);
  };

  const handleRestartTournament = () => {
    const created = TournamentManager.createTournament('Estrela Azul');
    setTournamentData(created);
  };

  const handleContinueTournamentAfterMatch = () => {
    if (!tournamentData) return;
    const result = TournamentManager.advanceTournament(tournamentData, blueScore, redScore);
    setTournamentData(result.tournament);
    setMatchWinner(null);
    setShowTournamentModal(true);
  };

  const handlePause = () => {
    engineRef.current?.pauseMatch();
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    engineRef.current?.resumeMatch();
  };

  const handleRestartMatch = () => {
    setIsPaused(false);
    setMatchWinner(null);
    setScoringTeam(null);
    engineRef.current?.initMatch(gameMode, gameMode === 'practice' ? 999999 : settings.durationSeconds);
  };

  const handleMainMenu = () => {
    setIsPaused(false);
    setMatchWinner(null);
    setScoringTeam(null);
    setShowTournamentModal(false);
    engineRef.current?.cleanupTimers();
    setMatchStatus('MENU');
  };

  const handleResetStats = () => {
    const fresh = StorageManager.resetStats();
    setStats(fresh);
  };

  return (
    <div
      id="futebol-de-botao-root"
      className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center select-none"
    >
      {/* HTML5 Canvas Stage */}
      <canvas
        id="futebol-canvas"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />

      {/* Scoreboard when playing */}
      {matchStatus !== 'MENU' && (
        <Scoreboard
          blueScore={blueScore}
          redScore={redScore}
          secondsRemaining={secondsRemaining}
          currentTurn={currentTurn}
          gameMode={gameMode}
          penaltyState={penaltyState}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
          onPause={handlePause}
          onResetPractice={() => engineRef.current?.resetPracticePositions()}
        />
      )}

      {/* Practice Mode controls */}
      {matchStatus !== 'MENU' && gameMode === 'practice' && (
        <TrainingControls
          onResetBall={() => engineRef.current?.resetPracticeBall()}
          onResetTeams={() => engineRef.current?.resetPracticePositions()}
          onExitPractice={handleMainMenu}
        />
      )}

      {/* Tactical HUD Footer */}
      {matchStatus !== 'MENU' && gameMode !== 'practice' && (
        <TacticalFooter
          currentTurn={currentTurn}
          activeDiscNumber={aimInfo.discNumber}
          isAiming={aimInfo.isAiming}
          aimPower={aimInfo.power}
          isPhysicsRunning={matchStatus === 'SIMULATING'}
          gameMode={gameMode}
          tournamentStage={tournamentData?.stage}
          blueScore={blueScore}
          redScore={redScore}
          onPause={handlePause}
        />
      )}

      {/* Goal Celebration Overlay */}
      {scoringTeam && <GoalOverlay scoringTeam={scoringTeam} />}

      {/* Main Menu */}
      {matchStatus === 'MENU' && (
        <MainMenu
          onStartMatch={handleStartMatch}
          onOpenTournament={handleOpenTournament}
          onOpenSettings={() => setShowSettings(true)}
          onStartPenalties={handleStartPenaltiesMode}
        />
      )}

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartMatch}
          onOpenSettings={() => setShowSettings(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Match End Modal */}
      {matchWinner && (
        <MatchEndModal
          winner={matchWinner}
          blueScore={blueScore}
          redScore={redScore}
          gameMode={gameMode}
          onPlayAgain={handleRestartMatch}
          onStartExtraTime={handleStartGoldenGoal}
          onStartPenalties={handleStartPenaltiesMode}
          onMainMenu={handleMainMenu}
          isTournament={gameMode === 'tournament'}
          onContinueTournament={handleContinueTournamentAfterMatch}
        />
      )}

      {/* Tournament Modal */}
      {showTournamentModal && tournamentData && (
        <TournamentModal
          tournament={tournamentData}
          onPlayNextMatch={handlePlayTournamentMatch}
          onRestartTournament={handleRestartTournament}
          onClose={() => setShowTournamentModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          stats={stats}
          onUpdateSettings={(newSet) => setSettings(newSet)}
          onResetStats={handleResetStats}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Mobile Orientation Hint */}
      <OrientationNotice />
    </div>
  );
}
