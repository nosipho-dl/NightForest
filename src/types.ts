/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'WANDERER' | 'WARRIOR' | 'SHADOW';

export interface GameState {
  difficulty: Difficulty;
  currentDifficulty?: 'easy' | 'medium' | 'hard';
  health: number;
  maxHealth: number;
  timer: number; // remaining seconds
  initialTimer: number; // original seconds for reset
  artifactsCollected: string[];
  relicsFound: boolean[]; // index-based state for the 5 artifacts
  hasPower: boolean; // boss level AoE light burst
  gameCompleted: boolean;
  isGameOver: boolean;
  score: number;
  activeScene: string;
  playerX?: number;
  playerY?: number;
  lanternFuel?: number;
  strikeCooldownPct?: number;
  blockCooldownPct?: number;
  bashCooldownPct?: number;
  dashCooldownPct?: number;
}

export interface GameInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  dash: boolean;
  power: boolean;
  collect: boolean;
  crouch: boolean;
  block: boolean;
  bash: boolean;
}

declare global {
  interface Window {
    gameInput: GameInput;
    gameState: GameState;
    gameAudio: any;
    phaserGame: any;
  }
}
