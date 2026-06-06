/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import Phaser from 'phaser';
import { gameAudio } from './game/audio';
import { BootScene, MainMenuScene, DifficultyScene, CutsceneScene1, VillageScene, ForestScene, ShrineScene, EndingScene, GameOverScene } from './game/scenes';
import { GameState, GameInput, Difficulty } from './types';
import { Shield, Flame, Skull, Compass, Award, Volume2, VolumeX, RefreshCw, BookOpen, User, HelpCircle, Swords, Zap, Loader2, EyeOff } from 'lucide-react';

const INITIAL_STATE: GameState = {
  difficulty: 'WARRIOR',
  currentDifficulty: 'medium',
  health: 100,
  maxHealth: 100,
  timer: 300,
  initialTimer: 300,
  artifactsCollected: [],
  relicsFound: [false, false, false, false, false],
  hasPower: false,
  gameCompleted: false,
  isGameOver: false,
  score: 0,
  activeScene: 'BootScene',
  lanternFuel: 100,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<'none' | 'howToPlay' | 'credits' | 'stats'>('none');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [dialogueRejected, setDialogueRejected] = useState(false);
  const [dashCoolDownPct, setDashCoolDownPct] = useState(0);
  const [powerCoolDownPct, setPowerCoolDownPct] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');
  const [isCrouching, setIsCrouching] = useState(false);
  const [isBlockingPressed, setIsBlockingPressed] = useState(false);

  // New states for difficulty, chapter intro, and save system
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [showForestIntro, setShowForestIntro] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  // Re-check save existence on menu mount or activeScene changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nightforest_v2_save');
      setHasSave(!!saved);
    } catch (e) {
      setHasSave(false);
    }
  }, [gameState.activeScene]);

  // Keyboard and gamepad arrow state sync
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!window.gameInput) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') window.gameInput.up = true;
      if (key === 's' || e.key === 'ArrowDown') window.gameInput.down = true;
      if (key === 'a' || e.key === 'ArrowLeft') window.gameInput.left = true;
      if (key === 'd' || e.key === 'ArrowRight') window.gameInput.right = true;
      if (key === ' ' || key === 'k') {
        if ((window as any).triggerPhaserAttack) (window as any).triggerPhaserAttack();
      }
      if (key === 'j') {
        if (dashCoolDownPct <= 0 && (window as any).triggerPhaserDash) (window as any).triggerPhaserDash();
      }
      if (key === 'l' || key === 'b') {
        window.gameInput.block = true;
        setIsBlockingPressed(true);
      }
      if (key === 'i' || key === 'v') {
        if ((window as any).triggerPhaserBash) (window as any).triggerPhaserBash();
      }
      if (key === 'c' || e.key === 'Shift') {
        const nextCrouched = !isCrouching;
        setIsCrouching(nextCrouched);
        window.gameInput.crouch = nextCrouched;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!window.gameInput) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') window.gameInput.up = false;
      if (key === 's' || e.key === 'ArrowDown') window.gameInput.down = false;
      if (key === 'a' || e.key === 'ArrowLeft') window.gameInput.left = false;
      if (key === 'd' || e.key === 'ArrowRight') window.gameInput.right = false;
      if (key === 'l' || key === 'b') {
        window.gameInput.block = false;
        setIsBlockingPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isCrouching, dashCoolDownPct, isBlockingPressed]);

  // Persistent Player Statistics System Local State
  const [stats, setStats] = useState({
    totalPlaytime: 0,
    totalArtifacts: 0,
    totalEnemies: 0,
    completedWanderer: 0,
    completedWarrior: 0,
    completedShadow: 0,
  });
  
  const phaserGameRef = useRef<any>(null);
  const audioInitializedRef = useRef(false);

  // Keep track of active cooldown intervals
  const dashCooldownTimerRef = useRef<any>(null);
  const powerCooldownTimerRef = useRef<any>(null);

  // Initialize input object in window
  useEffect(() => {
    window.gameInput = {
      up: false,
      down: false,
      left: false,
      right: false,
      attack: false,
      dash: false,
      power: false,
      collect: false,
      crouch: false,
      block: false,
      bash: false,
    };
    window.gameState = INITIAL_STATE;

    // Boot Phaser Game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: 'game-canvas-container',
      audio: {
        noAudio: true
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [
        BootScene,
        MainMenuScene,
        DifficultyScene,
        CutsceneScene1,
        VillageScene,
        ForestScene,
        ShrineScene,
        EndingScene,
        GameOverScene,
      ],
    };

    const g = new Phaser.Game(config);
    phaserGameRef.current = g;
    window.phaserGame = g;

    // Bridge callback for Phaser state syncs
    (window as any).onGameStateChange = (updatedState: GameState) => {
      setGameState({ ...updatedState });
      // Autosave gameplay state
      if (updatedState.activeScene === 'ForestScene' || updatedState.activeScene === 'ShrineScene') {
        if (!updatedState.isGameOver && !updatedState.gameCompleted) {
          try {
            localStorage.setItem('nightforest_v2_save', JSON.stringify({
              currentDifficulty: window.gameState.currentDifficulty || 'medium',
              difficulty: window.gameState.difficulty || 'WARRIOR',
              health: window.gameState.health,
              maxHealth: window.gameState.maxHealth,
              timer: window.gameState.timer,
              relicsFound: window.gameState.relicsFound,
              artifactsCollected: window.gameState.artifactsCollected,
              score: window.gameState.score,
              lanternFuel: window.gameState.lanternFuel,
              activeScene: window.gameState.activeScene
            }));
          } catch (e) {}
        }
      }
    };

    (window as any).showReactForestIntro = () => {
      setShowForestIntro(true);
    };

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
      }
      if (dashCooldownTimerRef.current) clearInterval(dashCooldownTimerRef.current);
      if (powerCooldownTimerRef.current) clearInterval(powerCooldownTimerRef.current);
    };
  }, []);

  // Synchronize dynamic player statistics hooks and loaders
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nightforest_v1_stats');
      if (stored) {
        setStats(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load stats from localStorage', e);
    }

    (window as any).incrementPlaytime = (seconds: number) => {
      setStats(prev => {
        const next = { ...prev, totalPlaytime: prev.totalPlaytime + seconds };
        try { localStorage.setItem('nightforest_v1_stats', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    };

    (window as any).incrementArtifactsCollected = (count: number) => {
      setStats(prev => {
        const next = { ...prev, totalArtifacts: prev.totalArtifacts + count };
        try { localStorage.setItem('nightforest_v1_stats', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    };

    (window as any).incrementEnemiesDefeated = (count: number) => {
      setStats(prev => {
        const next = { ...prev, totalEnemies: prev.totalEnemies + count };
        try { localStorage.setItem('nightforest_v1_stats', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    };

    (window as any).incrementCompletion = (diff: Difficulty) => {
      setStats(prev => {
        const next = {
          ...prev,
          completedWanderer: prev.completedWanderer + (diff === 'WANDERER' ? 1 : 0),
          completedWarrior: prev.completedWarrior + (diff === 'WARRIOR' ? 1 : 0),
          completedShadow: prev.completedShadow + (diff === 'SHADOW' ? 1 : 0),
        };
        try { localStorage.setItem('nightforest_v1_stats', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    };
  }, []);

  // Sync Audio context on interaction
  const handleInteraction = () => {
    if (!audioInitializedRef.current) {
      audioInitializedRef.current = true;
      gameAudio.init();
    } else {
      gameAudio.resume();
    }
  };

  useEffect(() => {
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  // Cooldown timers listeners to draw dashboard indicator sweep
  useEffect(() => {
    if (gameState.lastDashTime && gameState.activeScene && (gameState.activeScene === 'ForestScene' || gameState.activeScene === 'ShrineScene')) {
      if (dashCooldownTimerRef.current) clearInterval(dashCooldownTimerRef.current);
      const start = gameState.lastDashTime;
      const cooldown = gameState.dashCooldown || 2000;

      dashCooldownTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, cooldown - elapsed);
        setDashCoolDownPct(remaining / cooldown);

        if (remaining <= 0) {
          clearInterval(dashCooldownTimerRef.current);
          setDashCoolDownPct(0);
        }
      }, 50);
    }
  }, [gameState.lastDashTime, gameState.activeScene]);

  // Audio mute/unmute
  const toggleMute = () => {
    setAudioEnabled(!audioEnabled);
    if (audioEnabled) {
      if (window.gameAudio && window.gameAudio.masterVolume) {
        window.gameAudio.masterVolume.gain.value = 0;
      }
    } else {
      if (window.gameAudio && window.gameAudio.masterVolume) {
        window.gameAudio.masterVolume.gain.value = 0.8;
      }
    }
  };

  // Scene transitioners from React buttons
  const startDifficultySelection = () => {
    gameAudio.playSfx('click');
    setSelectedDifficulty(null); // Reset local card selection
    // Clear save state to avoid conflicts when starting a completely new game
    try {
      localStorage.removeItem('nightforest_v2_save');
      localStorage.removeItem('isSaveLoaded');
    } catch (e) {}
    (window as any).skipForestIntroOnce = false;

    if (phaserGameRef.current) {
      const activeScene = phaserGameRef.current.scene.getScenes(true)[0];
      if (activeScene) {
        activeScene.scene.start('DifficultyScene');
      }
    }
  };

  const continueMission = () => {
    gameAudio.playSfx('click');
    try {
      const savedStr = localStorage.getItem('nightforest_v2_save');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        (window as any).skipForestIntroOnce = true;
        localStorage.setItem('isSaveLoaded', 'true');

        const targetScene = saved.activeScene === 'ShrineScene' ? 'ShrineScene' : 'ForestScene';
        
        // Restore initial saved parameters to window and react states
        window.gameState.difficulty = saved.difficulty || 'WARRIOR';
        window.gameState.currentDifficulty = saved.currentDifficulty || 'medium';
        window.gameState.health = saved.health;
        window.gameState.maxHealth = saved.maxHealth;
        window.gameState.timer = saved.timer;
        window.gameState.relicsFound = saved.relicsFound || [false, false, false, false, false];
        window.gameState.artifactsCollected = saved.artifactsCollected || [];
        window.gameState.score = saved.score;
        window.gameState.lanternFuel = saved.lanternFuel;
        window.gameState.activeScene = targetScene;

        setGameState({ ...window.gameState });

        if (phaserGameRef.current) {
          const activeSceneObj = phaserGameRef.current.scene.getScenes(true)[0];
          if (activeSceneObj) {
            activeSceneObj.scene.start(targetScene, { loadFromSave: true });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load game", e);
    }
  };

  const selectDifficulty = (diff: Difficulty) => {
    // Left for backwards compatibility or Phaser scenes calling it
    gameAudio.playSfx('click');
    window.gameState.difficulty = diff;
    const tier = diff === 'SHADOW' ? 'hard' : (diff === 'WANDERER' ? 'easy' : 'medium');
    window.gameState.currentDifficulty = tier;
    setSelectedDifficulty(tier);
  };

  // Dedicated "BEGIN HUNT" confirmation function for Difficulty Screen
  const confirmAndBeginHunt = () => {
    if (!selectedDifficulty) return;
    gameAudio.playSfx('click');
    
    const diffMap: Record<'easy' | 'medium' | 'hard', Difficulty> = {
      easy: 'WANDERER',
      medium: 'WARRIOR',
      hard: 'SHADOW'
    };

    const phaserDiff = diffMap[selectedDifficulty];
    window.gameState.difficulty = phaserDiff;
    window.gameState.currentDifficulty = selectedDifficulty;

    // Reset game state for fresh mission
    const defaultTimer = selectedDifficulty === 'hard' ? 180 : (selectedDifficulty === 'easy' ? 480 : 300);
    window.gameState.health = 100;
    window.gameState.lanternFuel = 100;
    window.gameState.timer = defaultTimer;
    window.gameState.initialTimer = defaultTimer;
    window.gameState.relicsFound = [false, false, false, false, false];
    window.gameState.artifactsCollected = [];

    setGameState({ ...window.gameState });

    if (phaserGameRef.current) {
      const activeScene = phaserGameRef.current.scene.getScenes(true)[0];
      if (activeScene) {
        activeScene.scene.start('CutsceneScene1');
      }
    }
  };

  const startLevel1Calling = () => {
    gameAudio.playSfx('click');
    if (phaserGameRef.current) {
      const activeScene = phaserGameRef.current.scene.getScenes(true)[0];
      if (activeScene) {
        activeScene.scene.start('VillageScene');
      }
    }
  };

  const enterForestLevel = () => {
    gameAudio.playSfx('chime');
    if (phaserGameRef.current) {
      const activeScene = phaserGameRef.current.scene.getScenes(true)[0];
      if (activeScene) {
        activeScene.scene.start('ForestScene');
      }
    }
  };

  const restartCurrentLevel = () => {
    gameAudio.playSfx('click');
    if (phaserGameRef.current) {
      const activeScene = phaserGameRef.current.scene.getScenes(true)[0];
      if (activeScene) {
        // Decide what scene we died in
        const levelKey = gameState.activeScene === 'ShrineScene' ? 'ShrineScene' : 'ForestScene';
        activeScene.scene.start(levelKey);
      }
    }
  };

  const returnToMainMenu = () => {
    gameAudio.playSfx('click');
    if (phaserGameRef.current) {
      const activeScene = phaserGameRef.current.scene.getScenes(true)[0];
      if (activeScene) {
        activeScene.scene.start('MainMenuScene');
      }
    }
  };

  // Typewriter simulated typewriter effect hook
  const runTypewriter = (text: string, onDone?: () => void) => {
    setTypewriterText('');
    let current = '';
    let i = 0;
    const interval = setInterval(() => {
      current += text.charAt(i);
      setTypewriterText(current);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, 28);
    return () => clearInterval(interval);
  };

  // Cutscenes Script List
  const CUTSCENE_PANELS = [
    {
      img: '/src/assets/panel1.jpg', // we can use styled backdrops inside React
      text: "The village of Umbuso slept beneath a moonlit sky, unaware that darkness had come to collect its due.",
      title: "Panel 1 — The Village at Night",
      bgStyle: "bg-gradient-to-b from-[#03030d] via-[#070b1c] to-[#040409]",
      animElements: "fireflies"
    },
    {
      img: '/src/assets/panel2.jpg',
      text: "They came without sound. The Izithunzi Zobumnyama — the Shadow Walkers — ancient spirits that feed on the innocent. The sacred campfire hissed and died.",
      title: "Panel 2 — The Night Spirits Descend",
      bgStyle: "bg-gradient-to-b from-[#05030e] via-[#10031f] to-[#020205]",
      animElements: "violet-fog"
    },
    {
      img: '/src/assets/panel3.jpg',
      text: "Young Khwezi was dragged out of her hut by skeletal claws. Her terrified screams pierced the night, echoing through the cold valley floor.",
      title: "Panel 3 — The Abduction",
      bgStyle: "bg-gradient-to-b from-[#210202] via-[#080208] to-[#030105]",
      animElements: "screaming-face"
    },
    {
      img: '/src/assets/panel4.jpg',
      text: "Jama, her brother, burst out of his hut, spear in hand! He ran faster than he had ever run, but the canopy shadow swallowed her whole.",
      title: "Panel 4 — The Brother Gives Chase",
      bgStyle: "bg-gradient-to-r from-[#030c0c] to-[#01080d]",
      animElements: "sprinting-silh"
    },
    {
      img: '/src/assets/panel5.jpg',
      text: "He knelt at the edge of the forbidden forest — the place the elders warned never to enter. Not at night. Not ever. But he had no choice.",
      title: "Panel 5 — Forbidden Threshold",
      bgStyle: "bg-[#020202]",
      animElements: "kneeling-brother"
    }
  ];

  useEffect(() => {
    if (gameState.activeScene === 'Cutscene') {
      const curPanel = CUTSCENE_PANELS[currentTextIndex];
      if (curPanel) {
        runTypewriter(curPanel.text);
      }
    }
  }, [currentTextIndex, gameState.activeScene]);

  // Village calling dialog script advancement
  const VILLAGE_DIALOGUES = [
    "Rise, child of Umbuso. I am Onezwa — Guardian of the Ancestors. I have watched over your bloodline for seven generations.",
    "Your sister Khwezi has been taken to the Shrine of Shadows, deep within the Forbidden Forest. There, the Izithunzi Zobumnyama plan to offer her as sacrifice — at the first light of dawn, when they still hold power.",
    "But there is a way. Five ancient artifacts are hidden within the forest — scattered there by your ancestors long ago to protect against exactly this evil. Collect them all, and a sacred gateway will open, transporting you directly to the Shrine.",
    "But be warned, Jama. The forest is alive with the Spirits' minions. They will hunt you. You must be swift, clever, and brave. And you must reach the Shrine before the sacrifice begins.",
    "The clock is already running. Will you enter the forest and fight for your sister?"
  ];

  useEffect(() => {
    if (gameState.activeScene === 'Village') {
      runTypewriter(VILLAGE_DIALOGUES[dialogueIdx]);
    }
  }, [dialogueIdx, gameState.activeScene]);

  const advanceDialogue = () => {
    gameAudio.playSfx('click');
    if (dialogueIdx < VILLAGE_DIALOGUES.length - 1) {
      setDialogueIdx(dialogueIdx + 1);
    }
  };

  const acceptVillageQuest = () => {
    enterForestLevel();
  };

  const rejectVillageQuest = () => {
    gameAudio.playSfx('chime');
    setDialogueRejected(true);
  };

  // Power burst skill lock helper
  const triggerPowerButton = () => {
    if (powerCoolDownPct > 0) return;
    setPowerCoolDownPct(1.0);
    window.gameInput.power = true;

    // 8 second cooldown
    const cooldown = 8000;
    const start = Date.now();
    powerCooldownTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, cooldown - elapsed);
      setPowerCoolDownPct(remaining / cooldown);

      if (remaining <= 0) {
        clearInterval(powerCooldownTimerRef.current);
        setPowerCoolDownPct(0);
      }
    }, 100);
  };

  // D-Pad input trigger functions for continuous movement
  const toggleDirection = (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    if (window.gameInput) {
      window.gameInput[dir] = pressed;
    }
  };

  // Format countdown clock nicely
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${minutes}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  // Render Illustrated Panel elements during graphic cutscenes
  const renderPanelVisual = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#030211]">
            {/* Celestial starfield and mountains backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#030214] via-[#090b2b] to-[#04040a]" />
            
            {/* Glowing stars */}
            <div className="absolute top-8 left-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
            <div className="absolute top-20 left-12 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-pulse opacity-80" />
            <div className="absolute top-16 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse opacity-90" />
            <div className="absolute top-28 right-12 w-1.5 h-1.5 bg-yellow-100 rounded-full animate-ping opacity-60" />
            <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse opacity-40" />
            <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-85" />
            
            {/* Distant mountains silhouette */}
            <svg className="absolute bottom-20 w-full h-32 text-[#050616]" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,120 L0,70 L150,40 L350,90 L600,30 L850,85 L1050,45 L1200,80 L1200,120 Z" fill="currentColor" />
              <path d="M0,120 L0,90 L200,75 L450,110 L700,65 L1000,95 L1200,85 L1200,120 Z" fill="#02030d" opacity="0.6" />
            </svg>

            {/* Glowing Moon with Halo corona */}
            <div className="absolute top-8 right-16 w-20 h-20 rounded-full bg-yellow-50/15 blur-md animate-pulse duration-[4000ms]" />
            <div className="absolute top-10 right-18 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-50 to-amber-100 shadow-[0_0_30px_rgba(253,251,212,0.8)]">
              {/* Moon Crates */}
              <div className="absolute top-4 left-3 w-4 h-4 rounded-full bg-amber-200/50" />
              <div className="absolute bottom-3 right-5 w-3 h-3 rounded-full bg-amber-200/65" />
              <div className="absolute top-8 right-3 w-2 h-2 rounded-full bg-amber-200/40" />
            </div>

            {/* Detailed Traditional Rondavel Huts */}
            <div className="absolute bottom-0 w-full h-44 flex justify-around items-end px-12 z-10 pointer-events-none">
              {/* Hut Left */}
              <div className="relative w-36 h-24 mb-4 flex flex-col items-center">
                {/* Straw thatch roof cone */}
                <div className="w-40 h-16 bg-gradient-to-b from-stone-800 to-[#1c1917] clip-cone rounded-t-full border-b border-stone-900 shadow-lg relative">
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-900/30" />
                </div>
                {/* Clay walls */}
                <div className="w-28 h-12 bg-[#090913] border-x border-[#1a1c2d] flex items-center justify-center relative">
                  {/* Glowing Window hearth-fire */}
                  <div className="absolute top-2 right-4 w-3.5 h-2.5 rounded-sm bg-orange-500 shadow-[0_0_12px_#f97316] animate-pulse" />
                  {/* Warm entry door */}
                  <div className="w-7 h-11 bg-orange-950/40 border-t border-x border-orange-500/30 rounded-t-lg absolute bottom-0 left-6 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                  </div>
                </div>
              </div>

              {/* Hut Right (Closer, larger) */}
              <div className="relative w-44 h-32 mb-2 flex flex-col items-center">
                <div className="w-48 h-20 bg-gradient-to-b from-stone-850 to-[#141210] clip-cone rounded-t-full shadow-2xl relative">
                  <span className="absolute top-1 left-24 text-[8px] text-stone-600 font-mono">||</span>
                </div>
                <div className="w-36 h-16 bg-[#040409] border-x border-[#11121d] relative">
                  {/* Window glowing orange */}
                  <div className="absolute top-3 left-6 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse" />
                  <div className="w-8 h-16 bg-gradient-to-t from-transparent to-orange-950/50 border-x border-orange-500/25 absolute bottom-0 right-8" />
                </div>
              </div>
            </div>

            {/* Blue Stick Villager 1 (Standing near Hut Left) - Zulu Warrior Guard */}
            <div className="absolute bottom-4 left-24 z-20 w-16 h-24 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] font-mono">
              <svg className="w-full h-full text-[#38bdf8]" viewBox="0 0 50 100">
                {/* Feather Plume Crest */}
                <path d="M25,12 C28,0 34,4 27,15" fill="#ffd700" stroke="#f59e0b" strokeWidth="1" />
                <path d="M25,12 C22,2 18,5 23,15" fill="#fca311" stroke="#f59e0b" strokeWidth="1" />
                {/* Head */}
                <circle cx="25" cy="22" r="7" fill="currentColor" />
                <circle cx="27" cy="21" r="1" fill="#fff" />
                {/* Copper neck-ring jewelry */}
                <ellipse cx="25" cy="29" rx="4" ry="1.5" fill="#f59e0b" />
                {/* Body / spine */}
                <line x1="25" y1="29" x2="25" y2="58" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                {/* Traditional warrior belt / girdle wrapper */}
                <rect x="21" y="52" width="8" height="6" fill="#78350f" rx="1" />
                {/* Left arm holding spear */}
                <line x1="25" y1="35" x2="10" y2="48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                {/* Vertical Royal Zulu Spear of Light */}
                <line x1="9" y1="15" x2="9" y2="85" stroke="#ffd700" strokeWidth="2.2" />
                <path d="M9,15 L12,8 L6,15 Z" fill="#ffffff" stroke="#ffd700" strokeWidth="1" />
                {/* Right arm holding Zulu shield */}
                <line x1="25" y1="35" x2="40" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                {/* Traditional oval Zulu Shield */}
                <g transform="translate(36, 32)">
                  <ellipse cx="6" cy="18" rx="7" ry="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Geometric checker points on tribal shield */}
                  <rect x="3" y="8" width="6" height="3" fill="#ffffff" />
                  <rect x="3" y="14" width="6" height="3" fill="#ffffff" />
                  <rect x="3" y="20" width="6" height="3" fill="#ffffff" />
                  <rect x="3" y="26" width="6" height="3" fill="#ffffff" />
                </g>
                {/* Sturdy stick legs */}
                <line x1="25" y1="58" x2="16" y2="88" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="25" y1="58" x2="34" y2="88" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Blue Stick Villager 2 (Waving/Looking at the Moon) - Wise Elder */}
            <div className="absolute bottom-2 right-[40%] z-20 w-16 h-24 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-x-[-1] font-mono">
              <svg className="w-full h-full text-[#38bdf8]" viewBox="0 0 50 100">
                {/* Feather Plume Crest */}
                <path d="M25,12 C28,0 34,4 27,15" fill="#00d2ff" stroke="#38bdf8" strokeWidth="1" />
                {/* Head */}
                <circle cx="25" cy="22" r="7" fill="currentColor" />
                <circle cx="23" cy="21" r="1" fill="#fff" />
                {/* Clay necklace rings */}
                <ellipse cx="25" cy="29" rx="4" ry="1.5" fill="#14b8a6" />
                {/* Spine */}
                <line x1="25" y1="29" x2="25" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                {/* Cloak/robe wrapper */}
                <path d="M19,34 C19,34 16,56 22,58 C28,60 31,52 31,34 Z" fill="rgba(13,148,136,0.3)" stroke="#14b8a6" strokeWidth="1" />
                {/* Left arm down */}
                <line x1="25" y1="35" x2="12" y2="48" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                {/* Right arm pointing to the heavenly stars */}
                <line x1="25" y1="35" x2="42" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                {/* Glowing Star Staff of the Elder */}
                <line x1="42" y1="12" x2="42" y2="78" stroke="#ffd700" strokeWidth="1.5" />
                <circle cx="42" cy="12" r="3" fill="#ffffff" className="animate-ping" />
                <circle cx="42" cy="12" r="1.5" fill="#14b8a6" />
                {/* Legs */}
                <line x1="25" y1="58" x2="16" y2="88" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="25" y1="58" x2="34" y2="88" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Floating golden firefly particles */}
            <div className="absolute bottom-16 left-12 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce shadow-[0_0_8px_yellow]" style={{ animationDelay: '0.2s', animationDuration: '3.5s' }} />
            <div className="absolute bottom-24 right-24 w-2 h-2 bg-amber-300 rounded-full animate-bounce shadow-[0_0_10px_amber]" style={{ animationDelay: '1.4s', animationDuration: '4s' }} />
            <div className="absolute bottom-36 left-1/3 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-bounce shadow-[0_0_8px_orange]" style={{ animationDelay: '0.9s', animationDuration: '5s' }} />
            <div className="absolute bottom-28 right-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_12px_yellow]" style={{ animationDelay: '2s', animationDuration: '2.8s' }} />

            {/* Acacia Tree Silhouette framing the right */}
            <div className="absolute -bottom-8 -right-8 w-64 h-96 opacity-90 z-10 pointer-events-none">
              <svg className="w-full h-full text-[#020205]" viewBox="0 0 200 300">
                {/* Trunk */}
                <path d="M165,300 Q150,180 120,110 T70,40" fill="none" stroke="currentColor" strokeWidth="11" />
                <path d="M120,110 Q90,90 60,85" fill="none" stroke="currentColor" strokeWidth="6" />
                <path d="M95,70 Q115,50 145,45" fill="none" stroke="currentColor" strokeWidth="5" />
                {/* Flat Acacia Canopies */}
                <ellipse cx="60" cy="80" rx="45" ry="12" fill="currentColor" />
                <ellipse cx="135" cy="40" rx="55" ry="14" fill="currentColor" />
                <ellipse cx="65" cy="30" rx="35" ry="10" fill="currentColor" />
                <ellipse cx="145" cy="180" rx="25" ry="8" fill="currentColor" />
              </svg>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#0a001a]">
            {/* Swirling celestial portal & shadow rift */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#090117] via-[#15032a] to-[#04010b]" />
            
            {/* Concentric swirling ritual lines */}
            <div className="absolute w-[420px] h-[420px] border-2 border-purple-500/10 rounded-full animate-spin duration-[9000ms] flex items-center justify-center">
              <div className="w-[300px] h-[300px] border border-dashed border-purple-400/15 rounded-full animate-spin duration-[5000ms] flex items-center justify-center">
                <div className="w-[180px] h-[180px] border border-dotted border-pink-500/20 rounded-full" />
              </div>
            </div>

            {/* Rising Fog Ground levels */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-purple-950/45 via-purple-900/15 to-transparent blur-md z-10" />

            {/* Looming Shadow Walkers (Izithunzi Zobumnyama) Silhouettes with glowing eyes */}
            <div className="absolute inset-x-0 bottom-4 flex justify-around items-end h-64 z-20 pointer-events-none px-6">
              
              {/* Spirit 1 (Red Glowing Devil) */}
              <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '4.5s' }}>
                <svg className="w-24 h-56 text-[#ef4444] filter drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]" viewBox="0 0 100 220">
                  {/* Demonic Horns with shadow lines */}
                  <path d="M50,18 Q35,0 23,23 Q35,22 50,43 Q65,22 77,23 Q65,0 50,18 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.2" />
                  <path d="M50,18 Q42,5 34,22 Q43,21 50,43 Z" fill="#b91c1c" />
                  {/* Skull details and head */}
                  <path d="M32,32 Q50,22 68,32 Q72,48 50,56 Q28,48 32,32 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
                  {/* Crimson graphic mask lines */}
                  <path d="M36,36 Q50,42 64,36" stroke="#fca311" strokeWidth="1.5" fill="none" />
                  {/* Glowing vertical slit eyes */}
                  <ellipse cx="43" cy="37" rx="2" ry="4" fill="#ffeb3b" className="animate-pulse" />
                  <ellipse cx="57" cy="37" rx="2" ry="4" fill="#ffeb3b" className="animate-pulse" />
                  {/* Muscular graphic segmented torso */}
                  <path d="M50,56 Q24,100 36,220 L64,220 Q76,100 50,56 Z" fill="#450a0a" stroke="#7f1d1d" strokeWidth="1.5" />
                  {/* Skeletal gold/orange rib-plates */}
                  <path d="M42,75 Q50,80 58,75 M39,95 Q50,102 61,95 M38,115 Q50,123 62,115" stroke="#fca311" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-pulse" />
                  {/* Spiky demonic clawed wings with multiple bone segments */}
                  <path d="M38,65 Q0,40 -2,120 Q22,110 38,82" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
                  <path d="M62,65 Q100,40 102,120 Q78,110 62,82" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
                  <path d="M38,65 Q-8,80 5,145 M62,65 Q108,80 95,145" stroke="#b91c1c" strokeWidth="1.5" fill="none" />
                </svg>
              </div>

              {/* Central Dominating Shadow Spirit (Devil Lord) */}
              <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '6s', animationDelay: '1s' }}>
                <svg className="w-32 h-64 text-[#991b1b] filter drop-shadow-[0_0_30px_rgba(239,68,68,0.95)]" viewBox="0 0 100 220">
                  {/* Segmented Giant Horns with dark shadow ridges */}
                  <path d="M50,12 Q22,-15 6,22 Q26,22 50,48 Q74,22 94,22 Q78,-15 50,12 Z" fill="#991b1b" stroke="#450a0a" strokeWidth="2" />
                  <path d="M50,12 Q32,-3 14,21 Q28,21 50,48 Z" fill="#ef4444" />
                  <path d="M12,12 Q28,5 40,16 M88,12 Q72,5 60,16" stroke="#450a0a" strokeWidth="1.8" />
                  {/* Sharp skeletal skull head */}
                  <path d="M28,28 Q50,16 72,28 Q78,48 50,58 Q22,48 28,28 Z" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
                  {/* Giant flaming yellow/amber eyes with halo rings */}
                  <circle cx="38" cy="36" r="6" fill="rgba(245,158,11,0.3)" className="animate-pulse" />
                  <circle cx="38" cy="36" r="3" fill="#ffeb3b" />
                  <circle cx="62" cy="36" r="6" fill="rgba(245,158,11,0.3)" className="animate-pulse" />
                  <circle cx="62" cy="36" r="3" fill="#ffeb3b" />
                  {/* Giant demonic muscular body */}
                  <path d="M50,58 Q4,100 22,220 L78,220 Q96,100 50,58 Z" fill="#1f0202" stroke="#991b1b" strokeWidth="2" />
                  {/* Bright volcanic molten magma core cracks */}
                  <path d="M50,70 Q42,120 32,150 M50,70 Q58,120 68,150 M50,110 L50,190" stroke="#fca311" strokeWidth="4.5" strokeLinecap="round" className="animate-pulse" />
                  <path d="M50,70 L35,130 M50,70 L65,130" stroke="#ffeb3b" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Spirit 3 (Red Glowing Devil) */}
              <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '5.2s', animationDelay: '0.5s' }}>
                <svg className="w-20 h-48 text-[#b91c1c] filter drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" viewBox="0 0 100 220">
                  {/* Glowing jagged skull mask */}
                  <path d="M50,22 Q35,5 25,27 Q37,25 50,40 Q63,25 75,27 Q65,5 50,22 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1" />
                  <circle cx="43" cy="29" r="3" fill="#ffeb3b" className="animate-pulse" />
                  <circle cx="57" cy="29" r="3" fill="#ffeb3b" className="animate-pulse" />
                  {/* Spiky claw arms */}
                  <path d="M35,45 Q15,55 8,72" stroke="#7f1d1d" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M65,45 Q85,55 92,72" stroke="#7f1d1d" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Segmented lava rib cages */}
                  <path d="M50,40 Q21,85 35,220 L65,220 Q79,85 50,40 Z" fill="#450a0a" stroke="#7f1d1d" strokeWidth="1.5" />
                  <line x1="43" y1="75" x2="57" y2="75" stroke="#f97316" strokeWidth="2.5" />
                  <line x1="41" y1="95" x2="59" y2="95" stroke="#f97316" strokeWidth="2.5" />
                  <line x1="40" y1="115" x2="60" y2="115" stroke="#f97316" strokeWidth="2.5" />
                </svg>
              </div>

            </div>

            {/* Sacred dying Campfire ash pit in foreground corner */}
            <div className="absolute bottom-2 left-10 w-44 h-24 bg-transparent z-30 flex flex-col items-center">
              {/* Ring of dark grey stones */}
              <div className="w-24 h-8 bg-zinc-900/60 rounded-full border border-black/80 flex items-center justify-center">
                {/* Cold camp ashes */}
                <div className="w-18 h-5 bg-[#1f1e24] rounded-full flex items-center justify-center">
                  {/* Extremely faint trailing purple embers */}
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 animate-ping blur-[1px]" />
                </div>
              </div>
              <div className="text-[9px] font-mono text-purple-400/40 mt-1 uppercase tracking-widest animate-pulse">FIRE EXTINGUISHED</div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#160101]">
            {/* Crimson sky shadow fight */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#180000] via-[#0d010e] to-[#010105]" />
            
            {/* Ominous blood-red sunset storm clouds (vector path shapes) */}
            <svg className="absolute top-0 w-full h-44 text-[#350303]/40" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,40 Q150,90 300,50 T600,80 T900,40 T1200,60 L1200,0 L0,0 Z" fill="currentColor" />
              <path d="M0,60 Q200,110 500,70 T1000,90 L1200,0 L0,0 Z" fill="#4d0a0a" opacity="0.25" />
            </svg>

            {/* Slashed lightning lines */}
            <div className="absolute inset-0 bg-red-600/5 animate-pulse" />
            
            {/* Torn Hut backdrop silhouette */}
            <div className="absolute bottom-0 left-12 w-80 h-60 z-10 pointer-events-none opacity-50">
              <svg className="w-full h-full text-[#030105]" viewBox="0 0 200 200">
                <path d="M20,160 L180,160 L140,80 L60,80 Z" fill="currentColor" />
                {/* Torn roof shards */}
                <path d="M100,20 L60,80 L140,80 Z" fill="currentColor" />
                <path d="M40,75 L20,95 L45,90 Z" fill="#000000" />
                <path d="M150,75 L175,95 L145,90 Z" fill="#000000" />
              </svg>
            </div>

            {/* Dynamic Abduction Silhouette Action elements */}
            <div className="absolute bottom-2 right-12 w-full max-w-xl h-96 z-20 flex items-end justify-center pointer-events-none">
              <svg className="w-full h-full text-black filter drop-shadow-[0_2px_22px_rgba(239,68,68,0.7)]" viewBox="0 0 450 300">
                
                {/* HERO JAMA AND VILLAGERS CHASING FIERCELY FROM THE LEFT */}
                {/* 1. Jama (Front Runner at X=110, Y=175) */}
                <g transform="translate(10, 85)" className="text-[#00d2ff]">
                  {/* Spine & Head */}
                  <circle cx="95" cy="115" r="7" fill="currentColor" />
                  <path d="M95,108 C93,98 90,100 96,104" stroke="#ffeb3b" strokeWidth="1.2" fill="none" /> {/* feather plume */}
                  <line x1="95" y1="122" x2="84" y2="150" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
                  {/* Back arm swinging */}
                  <line x1="88" y1="127" x2="72" y2="135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  {/* Left front arm holding spear */}
                  <line x1="88" y1="127" x2="108" y2="135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  {/* Glowing spear pointing at abductor */}
                  <line x1="65" y1="145" x2="135" y2="125" stroke="#fca311" strokeWidth="2" />
                  <polygon points="135,125 142,122 136,128" fill="#ffffff" stroke="#fca311" strokeWidth="0.8" />
                  {/* Running legs */}
                  <line x1="84" y1="150" x2="105" y2="180" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="84" y1="150" x2="68" y2="175" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                </g>

                {/* 2. Villager 1 with Roaring Torch and Shield (Behind Jama at X=55, Y=185) */}
                <g transform="translate(-18, 95)" className="text-[#38bdf8]">
                  {/* Spine & Head */}
                  <circle cx="70" cy="115" r="6" fill="currentColor" />
                  <line x1="70" y1="121" x2="62" y2="148" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
                  {/* Front arm holding raging fire torch */}
                  <line x1="66" y1="126" x2="82" y2="114" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                  {/* Fire Torch stick and glowing flame */}
                  <line x1="82" y1="114" x2="86" y2="102" stroke="#78350f" strokeWidth="2" />
                  <path d="M86,102 Q94,86 86,90 Q78,86 86,102 Z" fill="#f97316" className="animate-pulse" />
                  <circle cx="86" cy="94" r="3" fill="#fca311" className="animate-ping" strokeWidth="0" />
                  {/* Running Left Leg */}
                  <line x1="62" y1="148" x2="78" y2="178" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                  {/* Running Right Leg */}
                  <line x1="62" y1="148" x2="48" y2="170" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                </g>

                {/* 3. Villager 2 sprinting with a Tribal War Club (Back at X=20, Y=190) */}
                <g transform="translate(-48, 100)" className="text-[#2563eb]">
                  {/* Head & Spine */}
                  <circle cx="50" cy="115" r="5.5" fill="currentColor" />
                  <line x1="50" y1="121" x2="42" y2="148" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  {/* Arm holding war knob-kierie club high */}
                  <line x1="46" y1="126" x2="52" y2="106" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="52" cy="106" r="3.5" fill="#1e293b" stroke="#ffd700" strokeWidth="1" />
                  {/* Legs running */}
                  <line x1="42" y1="148" x2="56" y2="178" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <line x1="42" y1="148" x2="30" y2="168" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </g>

                {/* Glowing Red Devil Abductor (Highly Graphic Version) */}
                {/* Double horn profiles with shaded ridges */}
                <path d="M220,110 Q200,40 148,82 Q180,128 220,162 Q260,128 292,82 Q240,40 220,110 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                <path d="M220,110 Q208,46 172,83 Q196,120 220,162 Z" fill="#ef4444" />
                {/* Bony face structure */}
                <path d="M190,80 Q220,68 250,80 Q258,102 220,114 Q182,102 190,80 Z" fill="#7f1d1d" stroke="#5c0707" strokeWidth="1.5" />
                {/* Detailed Devil Wings with web membranes */}
                <path d="M170,110 Q80,30 92,150 Q130,135 170,110 Z" fill="#450a0a" stroke="#dc2626" strokeWidth="2.5" />
                <path d="M270,110 Q360,30 348,150 Q310,135 270,110 Z" fill="#450a0a" stroke="#dc2626" strokeWidth="2.5" />
                {/* Glowing sulfur veins on wings */}
                <path d="M150,95 Q115,80 110,135 M290,95 Q325,80 330,135" stroke="#fca311" strokeWidth="1.5" fill="none" />

                {/* Flaming Yellow-Crimson Eyes */}
                <circle cx="205" cy="92" r="6" fill="rgba(245,158,11,0.5)" className="animate-pulse" />
                <circle cx="205" cy="92" r="3.5" fill="#ffeb3b" />
                <circle cx="235" cy="92" r="6" fill="rgba(245,158,11,0.5)" className="animate-pulse" />
                <circle cx="235" cy="92" r="3.5" fill="#ffeb3b" />

                {/* Demonic claws holding carrying figure with detailed muscle joints */}
                <path d="M185,130 Q115,110 90,125" fill="none" stroke="#1f0202" strokeWidth="9.5" strokeLinecap="round" />
                <path d="M185,130 Q115,110 90,125" fill="none" stroke="#7f1d1d" strokeWidth="6" strokeLinecap="round" />
                
                <path d="M255,130 Q325,115 340,115" fill="none" stroke="#1f0202" strokeWidth="9.5" strokeLinecap="round" />
                <path d="M255,130 Q325,115 340,115" fill="none" stroke="#7f1d1d" strokeWidth="6" strokeLinecap="round" />

                {/* Blue Stickman Sister (Khwezi) bound in red ropes being carried away */}
                <g transform="translate(68, 100) rotate(-15)">
                  {/* Head */}
                  <circle cx="22" cy="22" r="9" fill="#00d2ff" stroke="#00d2ff" strokeWidth="1" />
                  {/* Braids */}
                  <path d="M13,19 Q4,15 5,9" stroke="#00d2ff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M13,25 Q4,29 6,34" stroke="#00d2ff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  {/* Torso/Spine */}
                  <line x1="22" y1="31" x2="38" y2="52" stroke="#00d2ff" strokeWidth="5" strokeLinecap="round" />
                  {/* Reaching Out Screaming arms */}
                  <line x1="27" y1="38" x2="68" y2="35" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" />
                  <line x1="27" y1="38" x2="65" y2="46" stroke="#00d2ff" strokeWidth="3" strokeLinecap="round" />
                  {/* Red ropes around her stick torso */}
                  <path d="M23,34 L32,46" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M27,39 L36,51" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
                  {/* Kicking stick legs */}
                  <line x1="38" y1="52" x2="16" y2="82" stroke="#00d2ff" strokeWidth="4" strokeLinecap="round" />
                  <line x1="38" y1="52" x2="44" y2="84" stroke="#00d2ff" strokeWidth="4" strokeLinecap="round" />
                </g>

                {/* Giant claw-like branch reaching over */}
                <path d="M450,30 Q320,50 310,160" fill="none" stroke="#030001" strokeWidth="12" />
                <path d="M310,160 Q260,200 240,170" fill="none" stroke="#030001" strokeWidth="7" />
              </svg>
            </div>

            {/* Glowing crimson light sparks floating */}
            <div className="absolute bottom-20 right-36 w-2 h-2 bg-rose-500 rounded-full animate-ping shadow-[0_0_12px_red]" style={{ animationDuration: '2s' }} />
            <div className="absolute bottom-32 left-24 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse shadow-[0_0_8px_red]" style={{ animationDuration: '3.1s' }} />
          </div>
        );
      case 3:
        return (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#01090d]">
            {/* Moody deep teal/cyan forest chase trail */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#01050a] via-[#041d24] to-[#010a0c]" />

            {/* Left/Right foreground tree silhouettes framing speed chase */}
            <div className="absolute -left-16 inset-y-0 w-44 bg-[#010305] blur-[1px] opacity-95 flex flex-col justify-between py-12">
              <div className="w-16 h-12 bg-black rounded-r-full transform -translate-x-4" />
              <div className="w-24 h-16 bg-black rounded-r-full transform translate-y-12" />
            </div>
            
            <div className="absolute -right-16 inset-y-0 w-48 bg-[#010406] blur-[1px] opacity-95">
              <div className="absolute top-1/4 right-0 w-24 h-56 bg-black rounded-l-full" />
            </div>

            {/* Running Silhouette of Hero Brother (Jama) as a Blue Stickman */}
            <div className="absolute bottom-0 inset-x-0 h-48 flex justify-center items-end pointer-events-none z-20">
              <svg className="w-72 h-44 text-[#00d2ff] filter drop-shadow-[0_0_15px_rgba(0,210,255,0.7)]" viewBox="0 0 200 120">
                {/* SPRINTING HERO JAMA BODY PROFILE FACING RIGHT */}
                {/* Left bent forward knee stick leg */}
                <line x1="80" y1="75" x2="115" y2="80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <line x1="115" y1="80" x2="140" y2="115" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                
                {/* Right back kicking stick leg */}
                <line x1="80" y1="75" x2="52" y2="92" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <line x1="52" y1="92" x2="24" y2="102" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                
                {/* Spine/torso leaning forward */}
                <line x1="80" y1="75" x2="100" y2="42" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                
                {/* Stickman head */}
                <circle cx="106" cy="27" r="9" fill="currentColor" />
                <circle cx="108" cy="26" r="1.5" fill="#ffffff" /> {/* small determined eye */}
                {/* Braids flying backward */}
                <path d="M98,24 Q80,20 66,24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M98,30 Q78,28 64,34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Back arm swinging */}
                <line x1="95" y1="45" x2="72" y2="58" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="72" y1="58" x2="55" y2="52" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />

                {/* Front arm holding spear */}
                <line x1="95" y1="45" x2="115" y2="58" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                
                {/* Golden Spear of Light */}
                {/* Spear shaft */}
                <line x1="30" y1="78" x2="182" y2="48" stroke="#fca311" strokeWidth="3" />
                {/* Spear head */}
                <path d="M182,48 L198,45 L184,54 Z" fill="#ffffff" stroke="#f97316" strokeWidth="2.5" className="animate-pulse" />
                {/* Star-spark at tip */}
                <circle cx="198" cy="45" r="4" fill="#ffffff" className="animate-ping" />
              </svg>
            </div>

            {/* Action Speeds overlays (horizontal neon cyan strips) */}
            <div className="absolute top-1/4 left-10 w-32 h-0.5 bg-cyan-500/30 blur-[1px] animate-pulse" />
            <div className="absolute top-1/3 right-12 w-64 h-1 bg-cyan-400/20 blur-[2px] animate-pulse" style={{ animationDuration: '1.2s' }} />
            <div className="absolute bottom-1/3 left-1/4 w-48 h-0.5 bg-cyan-500/25 blur-sm animate-pulse" style={{ animationDuration: '1.8s' }} />
            <div className="absolute top-2/3 right-24 w-52 h-1 bg-cyan-400/15 blur-[1px] animate-pulse" style={{ animationDuration: '0.9s' }} />

            {/* Floating violet trail of particles in distance */}
            <div className="absolute right-36 top-1/3 w-3 h-3 rounded-full bg-purple-500/15 blur-sm animate-ping" />
            <div className="absolute right-20 top-1/2 w-4 h-4 rounded-full bg-purple-500/20 blur-[1px] animate-ping" />
          </div>
        );
      case 4:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#020302]">
            {/* Jade/Green twilight swamp threshold */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#020502] via-[#031c11] to-[#010402]" />

            {/* Entwined giant thorny archway of the Forbidden Forest */}
            <svg className="absolute inset-0 w-full h-full text-[#030c07] opacity-90 pointer-events-none" viewBox="0 0 600 350">
              {/* Intertwining roots and spikes */}
              <path d="M-10,360 Q60,180 120,100 T300,45 T480,100 T610,360 L600,360 L480,120 T300,75 T120,120 T0,360 Z" fill="currentColor" />
              
              {/* Pointy thorns */}
              {/* Left roots thorns */}
              <polygon points="45,210 25,195 52,192" fill="#000000" />
              <polygon points="85,145 68,125 90,130" fill="#000000" />
              <polygon points="175,90 170,60 190,80" fill="#000000" />
              {/* Right root thorns */}
              <polygon points="555,210 575,195 548,192" fill="#000000" />
              <polygon points="515,145 532,125 510,130" fill="#000000" />
              <polygon points="425,90 430,60 410,80" fill="#000000" />
              
              {/* Bioluminescent poison drops on thorns */}
              <circle cx="28" cy="193" r="3" fill="#ef4444" className="animate-pulse" />
              <circle cx="69" cy="123" r="2.5" fill="#ef4444" className="animate-pulse" />
              <circle cx="170" cy="58" r="3.5" fill="#a855f7" className="animate-ping" />
              <circle cx="573" cy="193" r="3" fill="#ef4444" className="animate-pulse" />
              <circle cx="533" cy="123" r="2.5" fill="#ef4444" className="animate-pulse" />
            </svg>

            {/* Glowing hidden wraiths eyes blinking in negative spaces */}
            <div className="absolute left-10 top-1/2 flex space-x-1.5 animate-pulse duration-[2500ms]">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </div>
            <div className="absolute right-12 top-1/3 flex space-x-1.5 animate-pulse duration-[1800ms]">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_4px_purple]" />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_4px_purple]" />
            </div>
            <div className="absolute right-24 bottom-24 flex space-x-2 animate-bounce">
              <div className="w-2 h-1 bg-red-600 rounded-full" />
              <div className="w-2 h-1 bg-red-600 rounded-full" />
            </div>

            {/* Kneeling Sorrowful Silhouette of Hero (Jama) as a Blue Stickman */}
            <div className="absolute bottom-0 inset-x-0 h-44 z-20 flex justify-center items-end pointer-events-none">
              <svg className="w-60 h-40 text-[#00d2ff] filter drop-shadow-[0_0_12px_rgba(0,210,255,0.6)]" viewBox="0 0 200 120">
                {/* Kneeling stick legs */}
                {/* Back leg kneeling */}
                <line x1="85" y1="102" x2="60" y2="115" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                {/* Front leg folded knees */}
                <line x1="85" y1="102" x2="110" y2="100" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <line x1="110" y1="100" x2="100" y2="115" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                
                {/* Bowed downward stick torso */}
                <line x1="85" y1="102" x2="115" y2="72" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                
                {/* Bowed tired stick head */}
                <circle cx="120" cy="56" r="9" fill="currentColor" />
                {/* Hanging down braids covering face in fatigue */}
                <path d="M116,62 C104,74 110,84 114,88" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M122,62 C114,79 120,89 122,93" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                
                {/* Arm planted on ground or held forward in grief */}
                <line x1="106" y1="78" x2="90" y2="115" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                
                {/* Spear driven vertical straight into ground next to him */}
                <line x1="78" y1="115" x2="78" y2="25" stroke="#fca311" strokeWidth="3" strokeLinecap="round" />
                {/* Glowing gold spear point standing on the soil, illuminating base range */}
                <path d="M78,115 L74,105 L82,105 Z" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="78" cy="115" r="3" fill="#ffffff" className="animate-ping" />
              </svg>
            </div>

            {/* Spearpole gold light circular gradient dome of safety */}
            <div className="absolute bottom-0 left-1/2 -translate-x-[75px] w-48 h-24 bg-gradient-to-t from-amber-500/35 to-transparent rounded-t-full filter blur-[1px] pointer-events-none" />

            {/* Glowing toxic jade forest spores drifting upwards slowly */}
            <div className="absolute bottom-16 left-1/4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce shadow-[0_0_8px_emerald]" style={{ animationDelay: '0.4s', animationDuration: '4.5s' }} />
            <div className="absolute bottom-28 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-bounce shadow-[0_0_8px_purple]" style={{ animationDelay: '1.8s', animationDuration: '3.8s' }} />
            <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-[#ef4444]/30 rounded-full animate-pulse" />
          </div>
        );
      default:
        return null;
    }
  };

  // Formulate Relic collection overlay details
  const RELICS_SPEC = [
    { name: 'Drum of Ancestors', color: '#ffb703', symbol: '🪘' },
    { name: 'Bone Mask of Elders', color: '#219ebc', symbol: '🎭' },
    { name: 'Spear of Mbeki', color: '#7209b7', symbol: '🗡️' },
    { name: 'Beaded Crown of Queens', color: '#ff006e', symbol: '👑' },
    { name: 'Calabash of Spirits', color: '#fb8500', symbol: '🍶' }
  ];

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen text-gray-100 font-sans p-4 select-none overflow-hidden relative"
      style={{ backgroundColor: "#05050f", backgroundImage: "radial-gradient(circle at 50% 0%, #1a1a4a 0%, #05050f 70%)" }}
    >
      {/* Environmental Background Lines & Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/10 blur-[100px]" />
        {/* Ritual Floor grid pattern matching design */}
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle, #3a2a5a 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      </div>
      
      {/* Outer Game Console Wrapper */}
      <div className="w-full max-w-[1280px] aspect-[16/9] relative bg-black/30 backdrop-blur-[2px] rounded-2xl border border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center overflow-hidden z-10">
        
        {/* Absolute Game Canvas Frame */}
        <div id="game-canvas-container" className="absolute inset-0 z-0 bg-[#020205] w-full h-full" />

        {/* Global Toolbar Header Overlay (Top utility rail) */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
          <div className="backdrop-blur-md bg-black/40 px-4 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center space-x-2 pointer-events-auto">
            <span className="text-indigo-300 text-xs font-mono font-bold tracking-[0.13em]">THE NIGHT FOREST</span>
            <span className="text-white/40 text-xs font-mono">v1.1</span>
          </div>

          <div className="flex items-center space-x-2 pointer-events-auto">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white/80 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button
              onClick={() => setActiveModal(activeModal === 'howToPlay' ? 'none' : 'howToPlay')}
              className="p-1.5 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white/80 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <HelpCircle size={15} />
            </button>
          </div>
        </div>

        {/* ==================== SCREEN 1: BOOT SCENE ==================== */}
        {gameState.activeScene === 'BootScene' && (
          <div className="absolute inset-0 bg-[#050512]/90 backdrop-blur-lg z-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-450 mb-3" size={45} />
            <span className="font-mono text-indigo-300 text-xs tracking-[0.25em] animate-pulse uppercase">Procedural Textures Initializing...</span>
          </div>
        )}

        {/* ==================== SCREEN 2: MAIN MENU ==================== */}
        {gameState.activeScene === 'MainMenu' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#020205]/30 backdrop-blur-[2px]">
            
            {/* Elegant Display Title Header */}
            <div className="text-center mb-8 transform translate-y-3">
              <h1 
                className="text-6xl sm:text-7xl font-bold tracking-[0.1em] text-white bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-900 drop-shadow-[0_2px_20px_rgba(165,180,252,0.4)]"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                THE NIGHT FOREST
              </h1>
              <p className="text-indigo-300 text-xs sm:text-sm font-mono mt-3 uppercase tracking-[0.23em] opacity-80">
                "She was taken before dawn. You are her only hope."
              </p>
            </div>

            {/* Menu options buttons styled as kente-carved wooden plaques */}
            <div className="flex flex-col space-y-4 w-72">
              {hasSave && (
                <button
                  onClick={continueMission}
                  className="group relative px-6 py-3 backdrop-blur-md bg-emerald-950/50 border-2 border-[#00FFA3]/50 hover:border-[#00FFA3] rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,255,163,0.3)] cursor-pointer text-center select-none text-white font-mono font-bold tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse"
                >
                  <div className="absolute inset-0 bg-[#00FFA3]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-[#00FFA3] group-hover:text-white">CONTINUE MISSION</span>
                </button>
              )}

              <button
                onClick={startDifficultySelection}
                className="group relative px-6 py-3 backdrop-blur-md bg-indigo-950/40 border border-indigo-400/30 hover:border-indigo-400/80 rounded-xl overflow-hidden shadow-[0_4px_25px_rgba(99,102,241,0.2)] cursor-pointer text-center select-none text-white font-mono font-bold tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 text-indigo-200 group-hover:text-white">PLAY MISSION</span>
              </button>

              <button
                onClick={() => setActiveModal('howToPlay')}
                className="group relative px-6 py-2.5 backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/30 rounded-xl cursor-pointer text-center select-none font-mono text-white/80 hover:text-white transition-all hover:scale-102 active:scale-98 text-sm tracking-widest"
              >
                HOW TO PLAY
              </button>

              <button
                onClick={() => setActiveModal('stats')}
                className="group relative px-6 py-2.5 backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/30 rounded-xl cursor-pointer text-center select-none font-mono text-white/80 hover:text-white transition-all hover:scale-102 active:scale-98 text-sm tracking-widest"
              >
                STATISTICS
              </button>

              <button
                onClick={() => setActiveModal('credits')}
                className="group relative px-6 py-2.5 backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/30 rounded-xl cursor-pointer text-center select-none font-mono text-white/80 hover:text-white transition-all hover:scale-102 active:scale-98 text-sm tracking-widest"
              >
                CREDITS
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 3: DIFFICULTY SELECTOR ==================== */}
        {gameState.activeScene === 'Difficulty' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#020205]/95 p-6 animate-fade-in overflow-y-auto">
            <h2 className="text-2xl sm:text-3xl font-mono text-white tracking-[0.3em] uppercase mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] text-center">
              CHOOSE YOUR SPIRIT LEVEL
            </h2>
            <p className="text-indigo-300 text-xs font-mono tracking-widest text-center uppercase mb-8">
              Adjust difficulty variables to guide Jama's journey
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-8">
              {/* EASY Card */}
              <div 
                onClick={() => selectDifficulty('WANDERER')}
                className={`group cursor-pointer backdrop-blur-md bg-black/60 p-6 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                  selectedDifficulty === 'easy'
                    ? 'border-[#00FFA3] shadow-[0_0_20px_rgba(0,255,163,0.3)] opacity-100 scale-102 bg-black/75'
                    : selectedDifficulty === null
                    ? 'border-emerald-500/25 hover:border-[#00FFA3]/80 hover:shadow-[0_0_12px_rgba(0,255,163,0.15)] opacity-90'
                    : 'border-white/5 opacity-40 hover:opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`p-2.5 rounded-xl border transition-all ${
                    selectedDifficulty === 'easy'
                      ? 'bg-emerald-950/30 text-[#00FFA3] border-[#00FFA3]'
                      : 'bg-emerald-950/10 text-emerald-400 border-emerald-500/25'
                  }`}>
                    <Compass size={24} />
                  </span>
                  <span className="text-[10px] font-mono text-[#00FFA3] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">EASY</span>
                </div>
                <h3 className="text-lg font-mono font-bold text-[#00FFA3] mb-1 tracking-wide">🌙 WANDERER</h3>
                <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mb-3">Exploring the African night canopy</p>
                
                <p className="text-white/70 text-xs leading-relaxed mb-4 min-h-[48px]">
                  Spirits are slow and deal minimal damage. Perfect for guiding Jama easily through the dark forest.
                </p>

                <div className="border-t border-white/10 pt-3 space-y-1.5 text-[11px] font-mono text-emerald-350">
                  <div className="flex justify-between"><span>⏱️ Artifact timer:</span> <span className="font-bold font-sans text-white">8 mins</span></div>
                  <div className="flex justify-between"><span>👤 Player speed:</span> <span className="font-bold text-white">120%</span></div>
                  <div className="flex justify-between"><span>👻 Enemy limit:</span> <span className="font-bold text-white font-sans">3 max</span></div>
                  <div className="flex justify-between"><span>🌿 Crouch heal:</span> <span className="font-bold text-white font-sans">5 HP/s</span></div>
                  <div className="flex justify-between"><span>🪔 Lantern decay:</span> <span className="font-bold text-white font-sans">Slow</span></div>
                </div>
              </div>

              {/* MEDIUM Card */}
              <div 
                onClick={() => selectDifficulty('WARRIOR')}
                className={`group cursor-pointer backdrop-blur-md bg-black/60 p-6 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                  selectedDifficulty === 'medium'
                    ? 'border-[#f5a623] shadow-[0_0_20px_rgba(245,166,35,0.3)] opacity-100 scale-102 bg-black/75'
                    : selectedDifficulty === null
                    ? 'border-amber-500/25 hover:border-[#f5a623]/80 hover:shadow-[0_0_12px_rgba(245,166,35,0.15)] opacity-90'
                    : 'border-white/5 opacity-40 hover:opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`p-2.5 rounded-xl border transition-all ${
                    selectedDifficulty === 'medium'
                      ? 'bg-amber-950/40 text-[#f5a623] border-[#f5a623]'
                      : 'bg-amber-950/20 text-amber-400 border-amber-500/25'
                  }`}>
                    <Flame size={24} />
                  </span>
                  <span className="text-[10px] font-mono text-[#f5a623] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">BALANCED</span>
                </div>
                <h3 className="text-lg font-mono font-bold text-[#f5a623] mb-1 tracking-wide">🔥 WARRIOR</h3>
                <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mb-3">The true spirit standard</p>

                <p className="text-white/70 text-xs leading-relaxed mb-4 min-h-[48px]">
                  Aggressive stalker minions, standard damage pacing. Balanced difficulty for skilled hunt actions.
                </p>

                <div className="border-t border-white/10 pt-3 space-y-1.5 text-[11px] font-mono text-amber-300">
                  <div className="flex justify-between"><span>⏱️ Artifact timer:</span> <span className="font-bold font-sans text-white">5 mins</span></div>
                  <div className="flex justify-between"><span>👤 Player speed:</span> <span className="font-bold text-white">100%</span></div>
                  <div className="flex justify-between"><span>👻 Enemy limit:</span> <span className="font-bold text-white font-sans">5 max</span></div>
                  <div className="flex justify-between"><span>🌿 Crouch heal:</span> <span className="font-bold text-white font-sans">3 HP/s</span></div>
                  <div className="flex justify-between"><span>🪔 Lantern decay:</span> <span className="font-bold text-white font-sans">Moderate</span></div>
                </div>
              </div>

              {/* HARD Card */}
              <div 
                onClick={() => selectDifficulty('SHADOW')}
                className={`group cursor-pointer backdrop-blur-md bg-black/60 p-6 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                  selectedDifficulty === 'hard'
                    ? 'border-[#ff3a3a] shadow-[0_0_20px_rgba(255,58,58,0.3)] opacity-100 scale-102 bg-black/75'
                    : selectedDifficulty === null
                    ? 'border-rose-500/25 hover:border-[#ff3a3a]/80 hover:shadow-[0_0_12px_rgba(255,58,58,0.15)] opacity-90'
                    : 'border-white/5 opacity-40 hover:opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`p-2.5 rounded-xl border transition-all ${
                    selectedDifficulty === 'hard'
                      ? 'bg-rose-950/40 text-[#ff3a3a] border-[#ff3a3a]'
                      : 'bg-rose-950/20 text-rose-400 border-rose-500/25'
                  }`}>
                    <Skull size={24} />
                  </span>
                  <span className="text-[10px] font-mono text-[#ff3a3a] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">BRUTAL</span>
                </div>
                <h3 className="text-lg font-mono font-bold text-[#ff3a3a] mb-1 tracking-wide">💀 SHADOW</h3>
                <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mb-3">Survive the infinite abyss</p>

                <p className="text-white/70 text-xs leading-relaxed mb-4 min-h-[48px]">
                  Spirits respawn continuously. Damage is devastating. Do you have the sheer speed to save Khwezi?
                </p>

                <div className="border-t border-white/10 pt-3 space-y-1.5 text-[11px] font-mono text-rose-300">
                  <div className="flex justify-between"><span>⏱️ Artifact timer:</span> <span className="font-bold text-white">3 mins</span></div>
                  <div className="flex justify-between"><span>👤 Player speed:</span> <span className="font-bold text-white">85%</span></div>
                  <div className="flex justify-between"><span>👻 Enemy limit:</span> <span className="font-bold text-white font-sans">8, continuous</span></div>
                  <div className="flex justify-between"><span>🌿 Crouch heal:</span> <span className="font-bold text-white font-sans">1 HP/s</span></div>
                  <div className="flex justify-between"><span>🪔 Lantern decay:</span> <span className="font-bold text-white font-sans">Rapid</span></div>
                </div>
              </div>
            </div>

            {/* Warning Message Center for Shadow level */}
            <div className="h-8 mb-6 flex items-center justify-center">
              {selectedDifficulty === 'hard' && (
                <p className="text-[#ff3a3a] text-xs sm:text-sm font-mono tracking-[0.15em] uppercase font-bold animate-pulse text-center">
                  "The alpha spirit cannot be killed. Only survived."
                </p>
              )}
            </div>

            {/* Dual Actions: Back to main menu VS confirm begin selection */}
            <div className="flex items-center space-x-6">
              <button
                onClick={returnToMainMenu}
                className="px-6 py-2 border border-white/20 hover:border-white/50 text-white/70 hover:text-white rounded-xl font-mono text-xs tracking-widest uppercase transition-all duration-300"
              >
                RETURN TO MENU
              </button>

              {selectedDifficulty && (
                <button
                  onClick={confirmAndBeginHunt}
                  className={`px-8 py-3 rounded-xl font-mono text-sm tracking-[0.2em] font-bold uppercase cursor-pointer transition-all duration-300 scale-100 hover:scale-105 active:scale-95 shadow-lg ${
                    selectedDifficulty === 'easy'
                      ? 'bg-[#00FFA3] text-black shadow-[#00FFA3]/20 hover:shadow-[#00FFA3]/40 animate-pulse'
                      : selectedDifficulty === 'medium'
                      ? 'bg-[#f5a623] text-black shadow-[#f5a623]/20 hover:shadow-[#f5a623]/40'
                      : 'bg-[#ff3a3a] text-white shadow-[#ff3a3a]/20 hover:shadow-[#ff3a3a]/40'
                  }`}
                >
                  BEGIN HUNT
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================== SCREEN 4: CUTSCENES SEQUENCE ==================== */}
        {gameState.activeScene === 'Cutscene' && (
          <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between bg-[#050512]/60 backdrop-blur-md animate-fade-in">
            
            {/* Header sequence bar */}
            <div className="flex justify-between items-center backdrop-blur-md bg-black/40 px-4 py-2 rounded-xl border border-white/10 w-full mb-4">
              <span className="text-white/60 text-xs uppercase font-mono tracking-widest">
                Prologue Cinematic: {currentTextIndex + 1} / {CUTSCENE_PANELS.length}
              </span>
              <span className="text-indigo-350 text-xs font-bold font-mono tracking-wider">
                {CUTSCENE_PANELS[currentTextIndex].title}
              </span>
            </div>

            {/* Illustrated graphic layout inside React overlays */}
            <div className="flex-1 relative border border-white/10 bg-black/10 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-6">
              {renderPanelVisual(currentTextIndex)}
            </div>

            {/* Narrative text dialog panel typewriter */}
            <div className="mt-4 backdrop-blur-xl bg-black/50 border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p 
                className="text-stone-100 font-serif text-sm md:text-base leading-relaxed flex-1"
                style={{ minHeight: '3.5rem' }}
              >
                {typewriterText}
              </p>

              <button
                onClick={() => {
                  gameAudio.playSfx('click');
                  if (currentTextIndex < CUTSCENE_PANELS.length - 1) {
                    setCurrentTextIndex(currentTextIndex + 1);
                  } else {
                    startLevel1Calling();
                  }
                }}
                className="px-6 py-2.5 backdrop-blur-md bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-400/40 text-stone-100 font-mono text-xs font-bold tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                {currentTextIndex === CUTSCENE_PANELS.length - 1 ? 'BEGIN OVERVIEW' : 'NEXT PANEL'}
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 5: VILLAGE CALLING DIALOG ==================== */}
        {gameState.activeScene === 'Village' && (
          <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            
            {/* Dialogue text overlay */}
            <div className="backdrop-blur-xl bg-black/55 border border-white/10 rounded-2xl p-6 shadow-2xl flex items-start gap-4 pointer-events-auto max-w-4xl mx-auto w-full">
              
              {/* Speaker Avatar: pulsing guide orb Onezwa (made extremely large and majestic) */}
              <div className="relative flex-shrink-0 w-24 h-24 bg-amber-950/40 border border-amber-400/30 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                <div className="absolute inset-0 w-full h-full bg-amber-500/10 rounded-full animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-white animate-bounce flex items-center justify-center text-3xl shadow-[0_0_20px_#fca311]" style={{ animationDuration: '2.5s' }}>
                  ☀️
                </div>
              </div>

              {/* Text content details */}
              <div className="flex-1 select-text">
                <h4 className="text-indigo-300 font-mono text-xs font-bold tracking-widest uppercase mb-1">
                  ~ Onezwa, Ancestral Guide ~
                </h4>
                
                <p className="text-white/90 font-serif text-sm sm:text-base leading-relaxed mb-4">
                  {typewriterText}
                </p>

                {/* ADVANCE vs CHOICE buttons */}
                {dialogueIdx < VILLAGE_DIALOGUES.length - 1 ? (
                  <button
                    onClick={advanceDialogue}
                    className="px-5 py-2 backdrop-blur-md bg-white/5 hover:bg-white/10 hover:text-white text-white/80 font-mono text-xs tracking-wider rounded-xl border border-white/10 cursor-pointer"
                  >
                    TAP TO ADVANCE...
                  </button>
                ) : (
                  <div className="flex space-x-4">
                    <button
                      onClick={acceptVillageQuest}
                      className="px-6 py-2.5 backdrop-blur-lg bg-emerald-950/30 border-2 border-emerald-500/40 hover:bg-emerald-950 text-emerald-200 font-mono text-xs font-bold tracking-widest rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
                    >
                      "I WILL GO. FOR KHWEZI."
                    </button>
                    {!dialogueRejected ? (
                      <button
                        onClick={rejectVillageQuest}
                        className="px-5 py-2 backdrop-blur-lg bg-[#2d121c]/20 border border-rose-500/20 hover:bg-rose-950/50 text-rose-300 font-mono text-xs tracking-wider rounded-xl cursor-pointer"
                      >
                        "I... I CANNOT."
                      </button>
                    ) : (
                      <p className="text-rose-400 font-serif text-xs italic self-center select-none">
                        "Without your courage, Khwezi's fate is sealed. The village awaits you at the forest threshold..."
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ACTIVE GAME HUD (FOREST / SHRINE) ==================== */}
        {(gameState.activeScene === 'ForestScene' || gameState.activeScene === 'ShrineScene') && (
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none">
            
            {/* Top Bar Health and counters */}
            <div className="flex justify-between items-start w-full">
              
              {/* Left Column Player Health */}
              <div className="flex items-center space-x-3 backdrop-blur-md bg-[#0A0F14]/90 px-4 py-2.5 rounded-xl border border-[#2D7A4F] pointer-events-auto shadow-2xl">
                {/* Character face thumbnail */}
                <div className="w-10 h-10 rounded-lg bg-[#1A4A2E]/20 border border-[#2D7A4F] flex items-center justify-center font-mono font-bold text-[#00FFA3] shadow-md self-center">
                  <User size={18} />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold font-mono text-white/50 mb-0.5">
                      <span>JAMA (HP)</span>
                      <span className="text-[#00FFA3] font-mono">{gameState.health} / {gameState.maxHealth}</span>
                    </div>
                    {/* Outer line framed bar */}
                    <div className="w-36 h-2 bg-[#1A4A2E] rounded-full overflow-hidden border border-[#2D7A4F]">
                      <div 
                        className="h-full bg-[#00FFA3] transition-all duration-150 shadow-[0_0_8px_rgba(0,255,163,0.6)]" 
                        style={{ width: `${(gameState.health / gameState.maxHealth) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold font-mono text-white/50 mb-0.5">
                      <span>LANTERN</span>
                      <span className="font-mono text-[#f5c842]">
                        {Math.max(0, Math.round(gameState.lanternFuel ?? 100))}%
                      </span>
                    </div>
                    {/* Outer line framed bar */}
                    <div className="w-36 h-2 bg-[#1a1a0a] rounded-full overflow-hidden border border-[#2D7A4F]">
                      <div 
                        className={`h-full transition-all duration-150 ${
                          (gameState.lanternFuel ?? 100) < 10 
                            ? 'bg-[#ff0000] animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]' 
                            : (gameState.lanternFuel ?? 100) < 30 
                              ? 'bg-[#ff6600] shadow-[0_0_8px_rgba(255,102,0,0.6)]' 
                              : 'bg-[#f5c842] shadow-[0_0_8px_rgba(245,200,66,0.6)]'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (gameState.lanternFuel ?? 100)))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Column: Artifact Slots or Boss bar */}
              {gameState.activeScene === 'ForestScene' ? (
                <div className="backdrop-blur-md bg-[#0A0F14]/90 px-4 py-2.5 rounded-2xl border border-[#2D7A4F] text-center pointer-events-auto shadow-2xl">
                  <span className="text-[9px] font-mono font-bold text-indigo-300 tracking-[0.2em] block mb-1.5 uppercase">
                    ANCIENT ARTIFACTS
                  </span>
                  <div className="flex space-x-2">
                    {RELICS_SPEC.map((spec, idx) => {
                      const collected = gameState.relicsFound[idx];
                      return (
                        <div 
                          key={spec.name}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center relative shadow-inner transition-all duration-300 ${collected ? 'backdrop-blur-lg bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/10'}`}
                          title={spec.name}
                        >
                          {collected ? (
                            <span className="text-sm shadow-md animate-bounce">{spec.symbol}</span>
                          ) : (
                            <span className="text-white/30 text-xs font-mono">{idx + 1}</span>
                          )}
                          {collected && (
                            <div className="absolute inset-0 bg-amber-500/10 rounded-lg animate-ping" style={{ animationDuration: '3s' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Shrine Level Boss Health Bar Overlay */
                <div className="backdrop-blur-md bg-[#0A0F14]/90 px-5 py-2.5 rounded-2xl border border-[#2D7A4F] text-center pointer-events-auto w-full max-w-sm shadow-2xl">
                  <div className="flex justify-between text-[9px] font-bold font-mono tracking-[0.3em] text-[#FF3A3A] mb-1.5 uppercase">
                    <span>👾 IZITHUNZI ZOBUMNYAMA PRIME</span>
                    <span className="font-bold font-mono text-xs">{gameState.bossHealth} / {gameState.maxBossHealth}</span>
                  </div>

                  {/* Horizontal Bar Segment indicators */}
                  <div className="w-full h-3 bg-[#1A4A2E] border border-[#2D7A4F] rounded-full relative overflow-hidden">
                    <div 
                      className="h-full bg-[#FF3A3A] transition-all duration-120 shadow-[0_0_12px_#FF3A3A]" 
                      style={{ width: `${(gameState.bossHealth / gameState.maxBossHealth) * 100}%` }}
                    />
                    {/* Dividers representing Boss phases */}
                    <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white/20 animate-pulse" />
                    <div className="absolute top-0 bottom-0 left-2/3 w-0.5 bg-white/20 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Right Column: Clock countdown and Mini-map */}
              <div className="flex flex-col items-end gap-2 text-right">
                <div className="backdrop-blur-md bg-[#0A0F14]/90 px-4 py-2.5 rounded-xl border border-[#2D7A4F] pointer-events-auto shadow-2xl">
                  <div className="flex items-center space-x-2">
                    <div>
                      <span className="text-[9px] font-mono block text-[#00FFA3]/50 tracking-wider">RESTORE TIME</span>
                      {gameState.activeScene === 'ForestScene' ? (
                        <span className={`font-mono text-sm sm:text-base font-black ${gameState.timer <= 60 ? 'text-red-500 animate-pulse' : 'text-[#00FFA3]'}`}>
                          {formatTime(gameState.timer)}
                        </span>
                      ) : (
                        <span className="font-mono text-[#00FFA3] text-xs font-bold tracking-widest animate-pulse">ALTAR SACRIFICE</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Relics Minimap HUD overlay */}
                {gameState.activeScene === 'ForestScene' && (
                  <div id="relics-minimap" className="backdrop-blur-md bg-[#0A0F14]/85 p-2 rounded-xl border border-[#2D7A4F] shadow-2xl pointer-events-auto w-32 flex flex-col items-center gap-1.5 transform transition-all hover:scale-105">
                    {/* Mini-map Title Tracker */}
                    <div className="flex items-center justify-between w-full px-1 text-[8px] font-mono font-black tracking-widest text-amber-400">
                      <span>FOREST MAP</span>
                      <span className="animate-pulse text-emerald-400">●</span>
                    </div>

                    {/* Map Area Box */}
                    <div className="relative w-28 h-28 bg-[#0a071c]/60 border border-indigo-500/20 rounded-lg overflow-hidden flex items-center justify-center">
                      {/* Grid overlay lines */}
                      <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "linear-gradient(to right, #4338ca 1px, transparent 1px), linear-gradient(to bottom, #4338ca 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
                      
                      {/* Concentric grid lines for spiritual compass look */}
                      <div className="absolute w-[96px] h-[96px] border border-indigo-500/10 rounded-full" />
                      <div className="absolute w-[64px] h-[64px] border border-indigo-500/10 rounded-full" />
                      <div className="absolute w-[32px] h-[32px] border border-indigo-500/10 rounded-full" />

                      {/* Scanning visual radial indicator */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-500/10 to-transparent animate-spin" style={{ animationDuration: '6s' }} />

                      {/* Map Relics representation */}
                      {[
                        { x: 400, y: 500, color: '#ffb703', symbol: '🪘' },
                        { x: 2200, y: 400, color: '#219ebc', symbol: '🎭' },
                        { x: 1280, y: 2100, color: '#a855f7', symbol: '🗡️' },
                        { x: 2300, y: 2200, color: '#ec4899', symbol: '👑' },
                        { x: 1280, y: 1280, color: '#f97316', symbol: '🍶' }
                      ].map((r, idx) => {
                        const found = gameState.relicsFound[idx];
                        // Coordinate mapping to 112px grid
                        const mapX = (r.x / 2560) * 112;
                        const mapY = (r.y / 2560) * 112;

                        return (
                          <div
                            key={idx}
                            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                            style={{ left: `${mapX}px`, top: `${mapY}px` }}
                          >
                            {found ? (
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full border border-black shadow-[0_0_4px_#34d399]" title="Collected!" />
                            ) : (
                              <div className="relative flex items-center justify-center">
                                <div 
                                  className="absolute w-3.5 h-3.5 rounded-full animate-ping opacity-50"
                                  style={{ backgroundColor: r.color, animationDuration: '2.5s' }}
                                />
                                <div 
                                  className="w-2.5 h-2.5 rounded-full border border-white/30 flex items-center justify-center shadow-lg"
                                  style={{ backgroundColor: r.color }}
                                >
                                  <span className="text-[7px] text-white font-black">{idx + 1}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Player Marker indicator */}
                      {gameState.playerX !== undefined && gameState.playerY !== undefined && (
                        <div 
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-[left,top] duration-300 ease-out"
                          style={{ 
                            left: `${(gameState.playerX / 2560) * 112}px`, 
                            top: `${(gameState.playerY / 2560) * 112}px`,
                            transition: 'left 0.3s cubic-bezier(0.25, 1, 0.5, 1), top 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                          }}
                        >
                          <div className="absolute w-5 h-5 bg-amber-400/25 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
                          <div className="w-3.5 h-3.5 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full border border-black shadow-[0_0_8px_#f59e0b] flex items-center justify-center">
                            <span className="text-[7px] select-none font-bold">👤</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Coordinates readout text */}
                    <div className="text-[7px] font-mono text-white/50 tracking-wide text-center">
                      <span>X: {gameState.playerX ?? 150} | Y: {gameState.playerY ?? 1280}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Panel */}
            <div className="flex justify-between items-end w-full pb-2">
              
              {/* Virtual D-Pad (Bottom-Left) */}
              <div className="pointer-events-auto relative w-44 h-44 flex items-center justify-center bg-transparent rounded-full border border-white/5">
                {/* D-pad Ring Frame background */}
                <div className="absolute inset-4 rounded-full border border-dashed border-white/5 animate-spin" style={{ animationDuration: '24s' }} />
                
                {/* Cross Grid setup for D-Pad arrow buttons */}
                <div className="grid grid-cols-3 grid-rows-3 w-32 h-32 relative z-10">
                  <div />
                  {/* UP BUTTON */}
                  <button
                    onMouseDown={() => toggleDirection('up', true)}
                    onMouseUp={() => toggleDirection('up', false)}
                    onMouseLeave={() => toggleDirection('up', false)}
                    onTouchStart={(e) => { e.preventDefault(); toggleDirection('up', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); toggleDirection('up', false); }}
                    className="backdrop-blur-[2px] bg-[#0A0F14]/85 active:bg-[#1A4A2E]/60 border border-[#2D7A4F] text-[#00FFA3] active:text-[#00FFA3] select-none flex items-center justify-center rounded-xl cursor-pointer transform -translate-y-1.5 shadow-md text-xl transition-all duration-100 hover:bg-[#0A0F14]/95"
                  >
                    ↑
                  </button>
                  <div />

                  {/* LEFT BUTTON */}
                  <button
                    onMouseDown={() => toggleDirection('left', true)}
                    onMouseUp={() => toggleDirection('left', false)}
                    onMouseLeave={() => toggleDirection('left', false)}
                    onTouchStart={(e) => { e.preventDefault(); toggleDirection('left', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); toggleDirection('left', false); }}
                    className="backdrop-blur-[2px] bg-[#0A0F14]/85 active:bg-[#1A4A2E]/60 border border-[#2D7A4F] text-[#00FFA3] active:text-[#00FFA3] select-none flex items-center justify-center rounded-xl cursor-pointer transform -translate-x-1.5 shadow-md text-xl transition-all duration-100 hover:bg-[#0A0F14]/95"
                  >
                    ←
                  </button>
                  <div className="flex items-center justify-center pointer-events-none">
                    <span className="text-[9px] text-[#00FFA3]/50 font-bold font-mono tracking-widest">NAV</span>
                  </div>
                  {/* RIGHT BUTTON */}
                  <button
                    onMouseDown={() => toggleDirection('right', true)}
                    onMouseUp={() => toggleDirection('right', false)}
                    onMouseLeave={() => toggleDirection('right', false)}
                    onTouchStart={(e) => { e.preventDefault(); toggleDirection('right', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); toggleDirection('right', false); }}
                    className="backdrop-blur-[2px] bg-[#0A0F14]/85 active:bg-[#1A4A2E]/60 border border-[#2D7A4F] text-[#00FFA3] active:text-[#00FFA3] select-none flex items-center justify-center rounded-xl cursor-pointer transform translate-x-1.5 shadow-md text-xl transition-all duration-100 hover:bg-[#0A0F14]/95"
                  >
                    →
                  </button>

                  <div />
                  {/* DOWN BUTTON */}
                  <button
                    onMouseDown={() => toggleDirection('down', true)}
                    onMouseUp={() => toggleDirection('down', false)}
                    onMouseLeave={() => toggleDirection('down', false)}
                    onTouchStart={(e) => { e.preventDefault(); toggleDirection('down', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); toggleDirection('down', false); }}
                    className="backdrop-blur-[2px] bg-[#0A0F14]/85 active:bg-[#1A4A2E]/60 border border-[#2D7A4F] text-[#00FFA3] active:text-[#00FFA3] select-none flex items-center justify-center rounded-xl cursor-pointer transform translate-y-1.5 shadow-md text-xl transition-all duration-100 hover:bg-[#0A0F14]/95"
                  >
                    ↓
                  </button>
                  <div />
                </div>
              </div>

              {/* Interactive COLLECT popup (Bottom-Center) */}
              <div className="flex flex-col items-center justify-center">
                {gameState.relicNearIndex !== null && (
                  <button
                    onClick={() => {
                      if ((window as any).triggerPhaserCollect) {
                        (window as any).triggerPhaserCollect();
                      }
                    }}
                    className="backdrop-blur-lg bg-[#1A4A2E] hover:bg-[#1A4A2E]/85 border border-[#2D7A4F] text-[#00FFA3] animate-pulse font-mono font-black text-xs px-6 py-3 rounded-full flex items-center space-x-2 tracking-widest shadow-[0_0_20px_rgba(0,255,163,0.3)] pointer-events-auto hover:scale-105 active:scale-95 cursor-pointer transform -translate-y-4"
                  >
                    <span>🔮 COLLECT ARTIFACT</span>
                  </button>
                )}
              </div>

              {/* Action triangular button cluster (Bottom-Right) */}
              <div className="pointer-events-auto relative w-[280px] h-44 flex items-center justify-center px-4 py-2">
                <div className="relative w-full h-full flex items-center justify-between">
                  
                  {/* ATTACK spear thrust button (Large central) */}
                  <div className="absolute left-[99px] top-[14px]">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if ((window as any).triggerPhaserAttack) (window as any).triggerPhaserAttack(); }}
                      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); if ((window as any).triggerPhaserAttack) (window as any).triggerPhaserAttack(); }}
                      className="w-[82px] h-[82px] bg-[#8B1A1A] border-2 border-[#FF3A3A] rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,58,58,0.35)] hover:scale-105 active:scale-95 text-[#FF3A3A] cursor-pointer select-none font-bold"
                    >
                      <Swords size={26} className="text-[#FF3A3A] animate-pulse" />
                      <span className="text-[10px] font-mono font-extrabold tracking-widest mt-1">SWRI</span>
                    </button>
                  </div>

                  {/* BLOCK button (left-most corner) */}
                  <div className="absolute left-0 bottom-[12px]">
                    <button
                      disabled={gameState.blockCooldownPct ? gameState.blockCooldownPct > 0 : false}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (window.gameInput) { window.gameInput.block = true; setIsBlockingPressed(true); } }}
                      onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); if (window.gameInput) { window.gameInput.block = false; setIsBlockingPressed(false); } }}
                      onMouseLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (window.gameInput) { window.gameInput.block = false; setIsBlockingPressed(false); } }}
                      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); if (window.gameInput) { window.gameInput.block = true; setIsBlockingPressed(true); } }}
                      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); if (window.gameInput) { window.gameInput.block = false; setIsBlockingPressed(false); } }}
                      className={`w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center shadow-lg relative overflow-hidden select-none transition-all duration-150 ${
                        gameState.blockCooldownPct && gameState.blockCooldownPct > 0
                          ? 'opacity-40 cursor-not-allowed bg-stone-900 border border-stone-800 text-stone-600'
                          : isBlockingPressed
                            ? 'bg-blue-900 border-2 border-[#4a9eff] text-white animate-pulse shadow-[0_0_15px_rgba(74,158,255,0.6)]'
                            : 'bg-[#0A0F14]/90 border border-[#2D7A4F] text-[#4a9eff] hover:scale-105 active:scale-95 cursor-pointer hover:bg-blue-950/40'
                      }`}
                    >
                      <Shield size={16} className={isBlockingPressed ? "text-[#4a9eff] scale-110" : "text-[#4a9eff]/70"} />
                      <span className="text-[8px] font-mono mt-0.5 uppercase tracking-wider font-extrabold text-[#4a9eff]">
                        {isBlockingPressed ? 'SHIELD' : 'BLOCK'}
                      </span>
                      {gameState.blockCooldownPct && gameState.blockCooldownPct > 0 && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-[#4a9eff]/20 text-transparent select-none font-bold origin-bottom"
                          style={{ height: `${gameState.blockCooldownPct * 100}%` }}
                        />
                      )}
                    </button>
                  </div>

                  {/* SHIELD BASH button (second from left) */}
                  <div className="absolute left-[74px] bottom-[12px]">
                    <button
                      disabled={gameState.bashCooldownPct ? gameState.bashCooldownPct > 0 : false}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!(gameState.bashCooldownPct && gameState.bashCooldownPct > 0) && (window as any).triggerPhaserBash) (window as any).triggerPhaserBash(); }}
                      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); if (!(gameState.bashCooldownPct && gameState.bashCooldownPct > 0) && (window as any).triggerPhaserBash) (window as any).triggerPhaserBash(); }}
                      className={`w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center shadow-lg relative overflow-hidden select-none transition-all duration-150 ${
                        gameState.bashCooldownPct && gameState.bashCooldownPct > 0
                          ? 'opacity-40 cursor-not-allowed bg-stone-900 border border-stone-850 text-stone-600'
                          : 'bg-[#0A0F14]/90 border border-[#2D7A4F] text-amber-500 hover:scale-105 active:scale-95 cursor-pointer hover:bg-amber-950/40'
                      }`}
                    >
                      <Flame size={16} className="text-amber-500 animate-pulse" />
                      <span className="text-[8px] font-mono mt-0.5 uppercase tracking-wider font-extrabold text-amber-400">BASH</span>
                      
                      {/* Swipe cooldown overlays */}
                      {gameState.bashCooldownPct && gameState.bashCooldownPct > 0 && (
                        <div 
                           className="absolute bottom-0 left-0 right-0 bg-amber-500/25 text-transparent text-[10px] select-none font-bold transition-all duration-75 text-center origin-bottom"
                          style={{ height: `${gameState.bashCooldownPct * 100}%` }}
                        />
                      )}
                    </button>
                  </div>

                  {/* POWER or CROUCH/HIDE button (context-aware, third from left) */}
                  <div className="absolute left-[147px] bottom-[12px]">
                    {gameState.activeScene === 'ForestScene' ? (
                      <button
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); const nextCrouched = !isCrouching; setIsCrouching(nextCrouched); if (window.gameInput) { (window.gameInput as any).crouch = nextCrouched; } }}
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); const nextCrouched = !isCrouching; setIsCrouching(nextCrouched); if (window.gameInput) { (window.gameInput as any).crouch = nextCrouched; } }}
                        className={`w-[61px] h-[61px] rounded-full flex flex-col items-center justify-center shadow-lg relative overflow-hidden select-none transition-all duration-150 ${
                          isCrouching 
                            ? 'bg-[#1A4A2E] border-2 border-[#00FFA3] text-white animate-pulse shadow-[0_0_15px_rgba(0,255,163,0.5)]' 
                            : 'bg-[#0A0F14]/90 border border-[#2D7A4F] text-[#00FFA3] hover:scale-105 active:scale-95 cursor-pointer hover:bg-[#1A4A2E]/40'
                        }`}
                      >
                        <EyeOff size={16} className={isCrouching ? "text-[#00FFA3]" : "text-[#00FFA3]/70"} />
                        <span className="text-[8px] font-mono mt-0.5 uppercase tracking-wider font-extrabold">
                          {isCrouching ? 'SHIELDED' : 'CROUCH'}
                        </span>
                      </button>
                    ) : gameState.activeScene === 'ShrineScene' ? (
                      <button
                        disabled={powerCoolDownPct > 0}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (powerCoolDownPct <= 0) triggerPowerButton(); }}
                        onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); if (powerCoolDownPct <= 0) triggerPowerButton(); }}
                        className={`w-[61px] h-[61px] bg-[#0A0F14]/90 border border-[#2D7A4F] rounded-full flex flex-col items-center justify-center shadow-lg relative overflow-hidden select-none ${powerCoolDownPct > 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
                      >
                        <Award size={16} className="text-[#00FFA3]" />
                        <span className="text-[8px] font-mono mt-0.5 uppercase tracking-wider text-[#00FFA3] font-bold">POWER</span>

                        {/* Cooldown sweep */}
                        {powerCoolDownPct > 0 && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-[#00FFA3]/20 text-transparent select-none font-bold transition-all duration-75 origin-bottom"
                            style={{ height: `${powerCoolDownPct * 100}%` }}
                          />
                        )}
                      </button>
                    ) : (
                      <div className="w-[60px] h-[60px] rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center opacity-30 select-none">
                        <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono">LOCK</span>
                      </div>
                    )}
                  </div>

                  {/* DASH button (right-most corner) */}
                  <div className="absolute left-[220px] bottom-[12px]">
                    <button
                      disabled={dashCoolDownPct > 0}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (dashCoolDownPct <= 0 && (window as any).triggerPhaserDash) (window as any).triggerPhaserDash(); }}
                      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); if (dashCoolDownPct <= 0 && (window as any).triggerPhaserDash) (window as any).triggerPhaserDash(); }}
                      className={`w-[60px] h-[60px] bg-[#0A0F14]/90 border border-[#2D7A4F] rounded-full flex flex-col items-center justify-center shadow-lg relative overflow-hidden select-none ${dashCoolDownPct > 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
                    >
                      <Zap size={16} className="text-[#00FFA3]" />
                      <span className="text-[8px] font-mono mt-0.5 uppercase tracking-wider text-[#00FFA3] font-bold">DASH</span>
                      
                      {/* Swipe cooldown overlays */}
                      {dashCoolDownPct > 0 && (
                        <div 
                           className="absolute bottom-0 left-0 right-0 bg-[#00FFA3]/20 text-transparent text-[10px] select-none font-bold transition-all duration-75 text-center origin-bottom"
                          style={{ height: `${dashCoolDownPct * 100}%` }}
                        />
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== SCREEN 6: ENDING TRIUMPH ==================== */}
        {gameState.activeScene === 'EndingScene' && (
          <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between bg-gradient-to-tr from-[#050512] via-[#101030] to-[#050512] backdrop-blur-md animate-fade-in">
            <div className="flex justify-between items-center backdrop-blur-md bg-black/40 px-4 py-2 rounded-xl border border-white/10 w-full mb-4">
              <span className="text-amber-400 text-xs font-mono font-black tracking-widest uppercase mb-1">
                ☀️ EPILOGUE — THE SUN ROSE BREAKS
              </span>
            </div>

            {/* Story final content visual cards */}
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto p-4 relative z-10 select-text">
              <div className="w-16 h-16 rounded-full backdrop-blur-md bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-4 text-3xl animate-bounce shadow-lg shadow-amber-500/20">
                🌅
              </div>
              
              <h2 className="text-3xl sm:text-4xl text-white font-bold tracking-wide mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Khwezi is Saved!
              </h2>

              <p className="text-white/95 font-serif text-sm sm:text-lg leading-relaxed italic mb-8">
                "Khwezi was saved. The forest fell silent. And for the first time in many seasons, the village of Umbuso welcomed the morning sunrise without fear. You broke their ancient hold on the night."
              </p>

              <div className="flex space-x-4">
                <button
                  onClick={restartCurrentLevel}
                  className="px-6 py-3 backdrop-blur-md bg-indigo-900/40 border-2 border-indigo-400/40 hover:border-indigo-400/80 text-white font-mono text-xs font-bold tracking-widest rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-950/20"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={returnToMainMenu}
                  className="px-6 py-3 backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/30 text-stone-200 font-mono text-xs font-bold tracking-widest rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  MAIN MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 7: GAME OVER SCENE ==================== */}
        {gameState.activeScene === 'GameOverScene' && (
          <div className="absolute inset-0 z-10 flex flex-col justify-center items-center bg-black/60 backdrop-blur-lg p-6 animate-fade-in select-text">
            <div className="w-20 h-20 backdrop-blur-md bg-red-950/20 border-2 border-red-500/30 rounded-full flex items-center justify-center text-2xl text-red-500 animate-pulse mb-6 shadow-2xl shadow-red-500/10">
              💀
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-mono text-red-500 tracking-[0.2em] font-extrabold mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              LOST IN THE DARKNESS
            </h2>

            <p className="text-white/60 text-sm font-serif italic mb-8 max-w-md text-center">
              "You were not fast enough. Khwezi awaits her brother still... The gnarled branches shadow her forever."
            </p>

            <div className="flex space-x-4">
              <button
                onClick={restartCurrentLevel}
                className="px-6 py-3 backdrop-blur-md bg-red-900/40 border-2 border-red-500/40 hover:bg-red-900/60 text-white font-mono text-xs font-bold tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
              >
                RETRY LEVEL
              </button>
              <button
                onClick={returnToMainMenu}
                className="px-6 py-3 backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/30 text-stone-200 font-mono text-xs font-bold tracking-widest rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ==================== HOW TO PLAY MODAL OVERLAY ==================== */}
      {activeModal === 'howToPlay' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-40 flex items-center justify-center p-6 animate-fade-in select-text">
          <div className="backdrop-blur-xl bg-black/55 border border-white/15 p-6 rounded-2xl shadow-2xl max-w-xl w-full text-stone-300 text-sm">
            <h3 className="text-lg font-mono text-indigo-300 font-bold tracking-[0.2em] uppercase mb-4 flex items-center space-x-2">
              <BookOpen size={18} />
              <span>HOW TO SURVIVE THE FOREST</span>
            </h3>

            <div className="space-y-4 leading-relaxed font-serif">
              <p>
                As <strong className="text-white">Jama</strong>, your sole focus is to enter the forbidden forest threshold before dawn and rescue your captured sister, <strong className="text-white">Khwezi</strong>.
              </p>
              
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <p className="font-mono text-xs font-bold text-amber-300 uppercase mb-1">🎮 SURVIVAL DETAILS & CONTROLS</p>
                <p>• <strong>D-Pad Arrow buttons:</strong> Use the direction navigation arrows at the bottom-left map grid to move Jama seamlessly.</p>
                <p>• <strong>🗡️ SWRI (Attack) Button:</strong> Thrusts your sacred woods spear (Space or K key), dealing knockback and damage.</p>
                <p>• <strong>🛡️ SHIELD BLOCK / PARRY:</strong> Hold on-screen button (or L / B keys) to absorb up to 80% damage. Release block for 180ms right as a missile strikes to PARRY reflect the magical orb back at the spectres!</p>
                <p>• <strong>💥 SHIELD BASH:</strong> Tap on-screen button (or I / V keys) to trigger a direct shield-lunge, delivering solid damage and double knockback (4s cooldown).</p>
                <p>• <strong>💨 DASH Button:</strong> Grants instant quick dodge speed bursts (J key). Shares a brief recharge sweep. Provides temporary invincibility frames.</p>
                <p>• <strong>✨ POWER (Radial Burst):</strong> Unleashes spark bursts to severely damage nearby spectres (Unlockable at the Shrine Level).</p>
                <p>• <strong>🔮 COLLECT:</strong> Proximity matches relic artifacts and allows instant recovery.</p>
              </div>

              <div className="space-y-1 text-xs">
                <p>• <span className="text-emerald-400 font-bold">Level 2:</span> Walk the dark floor to gather all 5 Relics before dusk timer runs out.</p>
                <p>• <span className="text-violet-400 font-bold">Level 3:</span> Slay Izithunzi Zobumnyama Prime inside his secure shrine arena.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveModal('none')}
                className="py-2.5 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold rounded-xl border border-white/10 tracking-wider transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer"
              >
                CLOSE OVERVIEW
              </button>
              <button
                onClick={() => {
                  setActiveModal('none');
                  returnToMainMenu();
                }}
                className="py-2.5 backdrop-blur-md bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 hover:text-white font-mono text-xs font-bold rounded-xl border border-indigo-400/30 tracking-wider transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer"
              >
                BACK TO MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREDITS MODAL OVERLAY ==================== */}
      {activeModal === 'credits' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-40 flex items-center justify-center p-6 animate-fade-in select-text">
          <div className="backdrop-blur-xl bg-black/55 border border-white/15 p-6 rounded-2xl shadow-2xl max-w-md w-full text-stone-300 text-sm text-center">
            <h3 className="text-lg font-mono text-indigo-300 font-bold tracking-[0.2em] uppercase mb-4">
              📜 PRODUCTION CREDITS
            </h3>
            
            <div className="space-y-4 font-serif leading-relaxed mb-6">
              <p className="text-white font-bold text-base">THE NIGHT FOREST</p>
              <p className="text-stone-400 text-xs italic">"A dark atmospheric 2D arcade tribute to folklore and family."</p>

              <div className="text-xs space-y-2 font-mono">
                <p className="text-stone-500">ENGINEERING</p>
                <p className="text-stone-300">Phaser 3 HTML5 Arcade Engine</p>
                
                <p className="text-stone-500 mt-2">AUDIO SYNTHESIS</p>
                <p className="text-stone-300">Web Audio API procedural soundboard</p>

                <p className="text-stone-500 mt-2">CREATIVE DIALOGUES</p>
                <p className="text-stone-300">Nosi Notes</p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="w-full py-2.5 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold rounded-xl border border-white/10 tracking-wider transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* ==================== STATISTICS MODAL OVERLAY ==================== */}
      {activeModal === 'stats' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-40 flex items-center justify-center p-6 animate-fade-in select-text">
          <div className="backdrop-blur-xl bg-black/55 border border-white/15 p-6 rounded-2xl shadow-2xl max-w-md w-full text-stone-300 text-sm">
            <h3 className="text-lg font-mono text-indigo-300 font-bold tracking-[0.2em] uppercase mb-5 flex items-center space-x-2">
              <Award size={18} className="text-indigo-400 animate-pulse" />
              <span>HUNTER STATISTICS</span>
            </h3>

            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest">Total Playtime</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {stats.totalPlaytime >= 60 
                      ? `${Math.floor(stats.totalPlaytime / 60)}m ${stats.totalPlaytime % 60}s`
                      : `${stats.totalPlaytime}s`}
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest">Banished Wraiths</p>
                  <p className="text-xl font-bold text-red-400 mt-1 flex items-center gap-1.5">
                    <Skull size={16} className="text-red-500/85 animate-pulse" />
                    <span>{stats.totalEnemies}</span>
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 col-span-2">
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest">Artifacts Recovered</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xl font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🏺</span>
                      <span>{stats.totalArtifacts}</span>
                    </p>
                    <span className="text-[9px] text-stone-400 font-serif italic">Across all playthroughs</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/45 rounded-xl border border-indigo-500/20 space-y-2.5">
                <p className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase mb-1">Spirit Completions</p>
                
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-emerald-400 flex items-center gap-1.5">🟢 WANDERER</span>
                  <span className="text-white font-bold bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px]">
                    {stats.completedWanderer} Wins
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-indigo-300 flex items-center gap-1.5">🔵 WARRIOR</span>
                  <span className="text-white font-bold bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[10px]">
                    {stats.completedWarrior} Wins
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-red-400 flex items-center gap-1.5">🔴 SHADOW</span>
                  <span className="text-white font-bold bg-red-950/40 border border-red-500/20 px-2.5 py-0.5 rounded-full text-[10px]">
                    {stats.completedShadow} Wins
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="mt-6 w-full py-2.5 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold rounded-xl border border-white/10 tracking-wider transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer"
            >
              CLOSE STATISTICS
            </button>
          </div>
        </div>
      )}

      {/* ==================== SCREEN: CHAPTER 1 NARRATIVE INTRO ==================== */}
      {showForestIntro && (
        <div className="absolute inset-0 bg-[#020205] z-50 flex flex-col items-center justify-center p-6 animate-fade-in select-text">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-950/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="max-w-xl w-full text-center space-y-6">
            <p className="text-[#ff3a3a] text-xs font-mono tracking-[0.4em] uppercase animate-pulse">
              — LEVEL 1 —
            </p>
            <h1 
              className="text-4xl sm:text-5xl font-mono text-white tracking-[0.2em] font-bold uppercase drop-shadow-[0_2px_15px_rgba(255,255,255,0.25)]"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              THE FORBIDDEN FOREST
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto" />
            
            <p className="text-stone-300 font-serif leading-relaxed text-sm italic py-4 max-w-md mx-auto">
              "The forest is dense, the shadows are alive. Guide Jama safely into the dark canopy to locate the five ancient relic artifacts and rescue Khwezi..."
            </p>

            <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-left max-w-md mx-auto space-y-2">
              <p className="text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider mb-2">💡 COLD SURVIVAL TIPS:</p>
              <p className="text-stone-400 text-xs">🌲 Stand inside <strong>green shrubs</strong> (undergrowth) & hold Crouch to camouflage completely from the Spirits.</p>
              <p className="text-stone-400 text-xs">🪔 Keep moving! Lantern fuel decays continuously based on your difficulty choice.</p>
              <p className="text-stone-400 text-xs">🛡️ Press Crouch or Block while standing still to passively absorb surrounding energy.</p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setShowForestIntro(false);
                  gameAudio.playSfx('chime');
                  if (typeof (window as any).startForestGameplay === 'function') {
                    (window as any).startForestGameplay();
                  }
                }}
                className="group relative px-10 py-3.5 bg-gradient-to-r from-red-950/40 via-red-900/60 to-red-950/40 border border-[#ff3a3a]/40 hover:border-[#ff3a3a] text-[#ff3a3a] hover:text-white rounded-xl font-mono text-sm font-bold uppercase tracking-[0.25em] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,58,58,0.15)] hover:shadow-[0_0_30px_rgba(255,58,58,0.35)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-[#ff3a3a]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">ENTER THE FOREST</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
