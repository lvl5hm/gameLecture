import audioMainTheme from './sounds/mainTheme.mp3';
import imgCoin from './sprites/coin.png';
import audioCoin from './sounds/coin.wav';
import audioStomp from './sounds/stomp.wav';
import imgGoomba from './sprites/goomba.png';
import audioJump from './sounds/jump.wav';
import imgMarioRunning from './sprites/marioRunning.png';
import imgMarioIdle from './sprites/marioIdle.png';
import imgMarioJumping from './sprites/marioJumping.png';
import imgQuestionBlock from './sprites/questionBlock.png';
import imgGroundBlock from './sprites/groundBlock.png';

const asstes = {
  sndMainTheme: loadSound(audioMainTheme),
  sndCoin: loadSound(audioCoin),
  sprCoin: loadSprite(imgCoin, 0, 0, 2),
  sndStomp: loadSound(audioStomp),
  sprGoomba: loadSprite(imgGoomba, -8, -16, 2),
  sprMarioRunning: loadSprite(imgMarioRunning, -8, -16, 2),
  sprMarioJumping: loadSprite(imgMarioJumping, -8, -16),
  sprMarioIdle: loadSprite(imgMarioIdle, -8, -16),
  sndJump: loadSound(audioJump),
  sprQuestionBlock: loadSprite(imgQuestionBlock, 0, 0, 1),
  sprGroundBlock: loadSprite(imgGroundBlock, 0, 0)
};

Object.assign(window, asstes);
