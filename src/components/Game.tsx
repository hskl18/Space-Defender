"use client";

import { useState, useEffect, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface GameObject extends Position {
  id: number;
}

interface Bullet extends GameObject {
  speed: number;
  damage: number;
  type: "normal" | "laser" | "plasma";
}

interface Enemy extends GameObject {
  speed: number;
  size: number;
  health: number;
  maxHealth: number;
  type: "asteroid" | "fighter" | "bomber" | "boss";
  shootCooldown?: number;
  lastShot?: number;
  direction?: number;
}

interface PowerUp extends GameObject {
  type: "rapidFire" | "shield" | "multiShot" | "health" | "laser";
  duration?: number;
}

interface Particle extends GameObject {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface EnemyBullet extends GameObject {
  speed: number;
  damage: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const JET_WIDTH = 60;
const JET_HEIGHT = 40;
const BULLET_SPEED = 12;
const ENEMY_BULLET_SPEED = 6;

export default function Game() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [jetPosition, setJetPosition] = useState({
    x: GAME_WIDTH / 2 - JET_WIDTH / 2,
    y: GAME_HEIGHT - 80,
  });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [enemyBullets, setEnemyBullets] = useState<EnemyBullet[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    space: false,
    shift: false,
  });

  // Power-up states
  const [rapidFire, setRapidFire] = useState(false);
  const [shield, setShield] = useState(false);
  const [multiShot, setMultiShot] = useState(false);
  const [laserWeapon, setLaserWeapon] = useState(false);
  const [specialAttack, setSpecialAttack] = useState(false);
  const [shieldTime, setShieldTime] = useState(0);
  const [rapidFireTime, setRapidFireTime] = useState(0);
  const [multiShotTime, setMultiShotTime] = useState(0);
  const [laserTime, setLaserTime] = useState(0);
  const [specialAttackCooldown, setSpecialAttackCooldown] = useState(0);

  const gameLoopRef = useRef<number | null>(null);
  const nextId = useRef(1);
  const lastEnemySpawn = useRef(0);
  const lastShot = useRef(0);
  const lastPowerUpSpawn = useRef(0);
  const lastSpecialAttack = useRef(0);

  const getNextId = () => {
    return nextId.current++;
  };

  const createParticles = (
    x: number,
    y: number,
    color: string,
    count: number = 8
  ) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: getNextId(),
        x: x + Math.random() * 20 - 10,
        y: y + Math.random() * 20 - 10,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        maxLife: 30,
        color,
        size: Math.random() * 4 + 2,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const performSpecialAttack = () => {
    const now = Date.now();
    if (now - lastSpecialAttack.current < 5000) return; // 5 second cooldown

    lastSpecialAttack.current = now;
    setSpecialAttackCooldown(5000);

    // Create massive laser beam across entire screen
    const beamBullets: Bullet[] = [];
    for (let i = 0; i < 15; i++) {
      beamBullets.push({
        id: getNextId(),
        x: jetPosition.x + JET_WIDTH / 2 - 30 + i * 4,
        y: jetPosition.y,
        speed: BULLET_SPEED * 2,
        damage: 8,
        type: "plasma",
      });
    }

    setBullets((prev) => [...prev, ...beamBullets]);
    createParticles(
      jetPosition.x + JET_WIDTH / 2,
      jetPosition.y,
      "#00ff88",
      25
    );

    // Screen shake effect
    document.body.style.animation = "shake 0.5s";
    setTimeout(() => {
      document.body.style.animation = "";
    }, 500);
  };

  const spawnPowerUp = (x: number, y: number) => {
    if (Math.random() < 0.3) {
      // 30% chance
      const types: PowerUp["type"][] = [
        "rapidFire",
        "shield",
        "multiShot",
        "health",
        "laser",
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      setPowerUps((prev) => [
        ...prev,
        {
          id: getNextId(),
          x,
          y,
          type,
        },
      ]);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setGamePaused(false);
    setScore(0);
    setLevel(1);
    setHealth(100);
    setJetPosition({ x: GAME_WIDTH / 2 - JET_WIDTH / 2, y: GAME_HEIGHT - 80 });
    setBullets([]);
    setEnemies([]);
    setEnemyBullets([]);
    setPowerUps([]);
    setParticles([]);
    setRapidFire(false);
    setShield(false);
    setMultiShot(false);
    setLaserWeapon(false);
    setShieldTime(0);
    setRapidFireTime(0);
    setMultiShotTime(0);
    setLaserTime(0);
    setSpecialAttackCooldown(0);
    lastEnemySpawn.current = Date.now();
    lastShot.current = 0;
    lastPowerUpSpawn.current = Date.now();
    lastSpecialAttack.current = 0;
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setGamePaused(false);
    setScore(0);
    setBullets([]);
    setEnemies([]);
    setEnemyBullets([]);
    setPowerUps([]);
    setParticles([]);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
          setKeys((prev) => ({ ...prev, left: true }));
          break;
        case "ArrowRight":
          setKeys((prev) => ({ ...prev, right: true }));
          break;
        case "Space":
          e.preventDefault();
          setKeys((prev) => ({ ...prev, space: true }));
          break;
        case "ShiftLeft":
        case "ShiftRight":
          e.preventDefault();
          setKeys((prev) => ({ ...prev, shift: true }));
          break;
        case "Escape":
          e.preventDefault();
          if (gameStarted && !gameOver) {
            setGamePaused((prev) => !prev);
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowLeft":
          setKeys((prev) => ({ ...prev, left: false }));
          break;
        case "ArrowRight":
          setKeys((prev) => ({ ...prev, right: false }));
          break;
        case "Space":
          setKeys((prev) => ({ ...prev, space: false }));
          break;
        case "ShiftLeft":
        case "ShiftRight":
          setKeys((prev) => ({ ...prev, shift: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || gamePaused) return;

    const gameLoop = () => {
      const now = Date.now();

      // Update special attack cooldown
      if (specialAttackCooldown > 0) {
        setSpecialAttackCooldown((prev) => Math.max(0, prev - 16));
      }

      // Handle special attack
      if (keys.shift && specialAttackCooldown === 0) {
        performSpecialAttack();
      }

      // Update power-up timers
      if (rapidFireTime > 0) {
        setRapidFireTime((prev) => {
          const newTime = prev - 16;
          if (newTime <= 0) setRapidFire(false);
          return Math.max(0, newTime);
        });
      }
      if (shieldTime > 0) {
        setShieldTime((prev) => {
          const newTime = prev - 16;
          if (newTime <= 0) setShield(false);
          return Math.max(0, newTime);
        });
      }
      if (multiShotTime > 0) {
        setMultiShotTime((prev) => {
          const newTime = prev - 16;
          if (newTime <= 0) setMultiShot(false);
          return Math.max(0, newTime);
        });
      }
      if (laserTime > 0) {
        setLaserTime((prev) => {
          const newTime = prev - 16;
          if (newTime <= 0) setLaserWeapon(false);
          return Math.max(0, newTime);
        });
      }

      // Move jet
      setJetPosition((prev) => {
        let newX = prev.x;
        const speed = 7;
        if (keys.left && newX > 0) newX -= speed;
        if (keys.right && newX < GAME_WIDTH - JET_WIDTH) newX += speed;
        return { ...prev, x: newX };
      });

      // Shoot bullets
      if (keys.space) {
        const shootDelay = rapidFire ? 100 : 150;
        if (now - lastShot.current > shootDelay) {
          setBullets((prev) => {
            const newBullets: Bullet[] = [];
            const bulletType = laserWeapon ? "laser" : "normal";
            const damage = laserWeapon ? 3 : 1;

            if (multiShot) {
              // Triple shot
              newBullets.push(
                {
                  id: getNextId(),
                  x: jetPosition.x + JET_WIDTH / 2 - 2,
                  y: jetPosition.y,
                  speed: BULLET_SPEED,
                  damage,
                  type: bulletType,
                },
                {
                  id: getNextId(),
                  x: jetPosition.x + JET_WIDTH / 2 - 10,
                  y: jetPosition.y + 10,
                  speed: BULLET_SPEED,
                  damage,
                  type: bulletType,
                },
                {
                  id: getNextId(),
                  x: jetPosition.x + JET_WIDTH / 2 + 6,
                  y: jetPosition.y + 10,
                  speed: BULLET_SPEED,
                  damage,
                  type: bulletType,
                }
              );
            } else {
              newBullets.push({
                id: getNextId(),
                x: jetPosition.x + JET_WIDTH / 2 - 2,
                y: jetPosition.y,
                speed: BULLET_SPEED,
                damage,
                type: bulletType,
              });
            }

            return [...prev, ...newBullets];
          });
          lastShot.current = now;
        }
      }

      // Move bullets
      setBullets((prev) =>
        prev
          .map((bullet) => ({ ...bullet, y: bullet.y - bullet.speed }))
          .filter((bullet) => bullet.y > -10)
      );

      // Move enemy bullets
      setEnemyBullets((prev) =>
        prev
          .map((bullet) => ({ ...bullet, y: bullet.y + bullet.speed }))
          .filter((bullet) => bullet.y < GAME_HEIGHT + 10)
      );

      // Spawn enemies
      const enemySpawnRate = Math.max(800 - level * 50, 300);
      if (now - lastEnemySpawn.current > enemySpawnRate) {
        setEnemies((prev) => {
          const enemyTypes: Enemy["type"][] = ["asteroid", "fighter", "bomber"];
          if (level >= 5 && Math.random() < 0.1) enemyTypes.push("boss");

          const type =
            enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          let enemy: Enemy;

          switch (type) {
            case "fighter":
              enemy = {
                id: getNextId(),
                x: Math.random() * (GAME_WIDTH - 40),
                y: -40,
                speed: 2 + level * 0.3,
                size: 25,
                health: 2,
                maxHealth: 2,
                type: "fighter",
                shootCooldown: 1500,
                lastShot: 0,
                direction: Math.random() < 0.5 ? -1 : 1,
              };
              break;
            case "bomber":
              enemy = {
                id: getNextId(),
                x: Math.random() * (GAME_WIDTH - 60),
                y: -60,
                speed: 1 + level * 0.2,
                size: 45,
                health: 5,
                maxHealth: 5,
                type: "bomber",
                shootCooldown: 2000,
                lastShot: 0,
              };
              break;
            case "boss":
              enemy = {
                id: getNextId(),
                x: GAME_WIDTH / 2 - 50,
                y: -100,
                speed: 0.5,
                size: 100,
                health: 20,
                maxHealth: 20,
                type: "boss",
                shootCooldown: 800,
                lastShot: 0,
                direction: 1,
              };
              break;
            default: // asteroid
              enemy = {
                id: getNextId(),
                x: Math.random() * (GAME_WIDTH - 40),
                y: -40,
                speed: 2 + level * 0.5 + Math.random() * 2,
                size: 30 + Math.random() * 20,
                health: 1,
                maxHealth: 1,
                type: "asteroid",
              };
          }

          return [...prev, enemy];
        });
        lastEnemySpawn.current = now;
      }

      // Move and update enemies
      setEnemies((prev) =>
        prev
          .map((enemy) => {
            const newEnemy = { ...enemy };

            if (enemy.type === "fighter") {
              // Zigzag movement
              newEnemy.x += (enemy.direction || 1) * 2;
              if (newEnemy.x <= 0 || newEnemy.x >= GAME_WIDTH - enemy.size) {
                newEnemy.direction = -(enemy.direction || 1);
              }
              newEnemy.y += enemy.speed;

              // Shoot at player
              if (now - (enemy.lastShot || 0) > (enemy.shootCooldown || 1500)) {
                setEnemyBullets((prevBullets) => [
                  ...prevBullets,
                  {
                    id: getNextId(),
                    x: enemy.x + enemy.size / 2,
                    y: enemy.y + enemy.size,
                    speed: ENEMY_BULLET_SPEED,
                    damage: 15,
                  },
                ]);
                newEnemy.lastShot = now;
              }
            } else if (enemy.type === "bomber") {
              newEnemy.y += enemy.speed;

              // Shoot spread bullets
              if (now - (enemy.lastShot || 0) > (enemy.shootCooldown || 2000)) {
                setEnemyBullets((prevBullets) => [
                  ...prevBullets,
                  {
                    id: getNextId(),
                    x: enemy.x + enemy.size / 2 - 10,
                    y: enemy.y + enemy.size,
                    speed: ENEMY_BULLET_SPEED,
                    damage: 20,
                  },
                  {
                    id: getNextId(),
                    x: enemy.x + enemy.size / 2,
                    y: enemy.y + enemy.size,
                    speed: ENEMY_BULLET_SPEED,
                    damage: 20,
                  },
                  {
                    id: getNextId(),
                    x: enemy.x + enemy.size / 2 + 10,
                    y: enemy.y + enemy.size,
                    speed: ENEMY_BULLET_SPEED,
                    damage: 20,
                  },
                ]);
                newEnemy.lastShot = now;
              }
            } else if (enemy.type === "boss") {
              // Boss movement
              newEnemy.x += (enemy.direction || 1) * 1;
              if (newEnemy.x <= 0 || newEnemy.x >= GAME_WIDTH - enemy.size) {
                newEnemy.direction = -(enemy.direction || 1);
                newEnemy.y += 20;
              }

              // Boss shooting pattern
              if (now - (enemy.lastShot || 0) > (enemy.shootCooldown || 800)) {
                const bulletCount = 5;
                for (let i = 0; i < bulletCount; i++) {
                  setEnemyBullets((prevBullets) => [
                    ...prevBullets,
                    {
                      id: getNextId(),
                      x: enemy.x + (enemy.size / bulletCount) * i,
                      y: enemy.y + enemy.size,
                      speed: ENEMY_BULLET_SPEED + Math.random() * 2,
                      damage: 25,
                    },
                  ]);
                }
                newEnemy.lastShot = now;
              }
            } else {
              // Asteroid movement
              newEnemy.y += enemy.speed;
            }

            return newEnemy;
          })
          .filter((enemy) => enemy.y < GAME_HEIGHT + 100)
      );

      // Update particles
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 1,
            vx: particle.vx * 0.98,
            vy: particle.vy * 0.98,
          }))
          .filter((particle) => particle.life > 0)
      );

      // Move power-ups
      setPowerUps((prev) =>
        prev
          .map((powerUp) => ({ ...powerUp, y: powerUp.y + 2 }))
          .filter((powerUp) => powerUp.y < GAME_HEIGHT + 50)
      );

      // Spawn power-ups occasionally
      if (now - lastPowerUpSpawn.current > 15000) {
        // Every 15 seconds
        setPowerUps((prev) => [
          ...prev,
          {
            id: getNextId(),
            x: Math.random() * (GAME_WIDTH - 30),
            y: -30,
            type: ["rapidFire", "shield", "multiShot", "health", "laser"][
              Math.floor(Math.random() * 5)
            ] as PowerUp["type"],
          },
        ]);
        lastPowerUpSpawn.current = now;
      }

      // Check collisions between bullets and enemies
      setBullets((prevBullets) => {
        setEnemies((prevEnemies) => {
          const remainingBullets: Bullet[] = [];
          const remainingEnemies: Enemy[] = [];
          let scoreIncrease = 0;

          prevBullets.forEach((bullet) => {
            let bulletHit = false;

            prevEnemies.forEach((enemy) => {
              const dx = bullet.x - (enemy.x + enemy.size / 2);
              const dy = bullet.y - (enemy.y + enemy.size / 2);
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < enemy.size / 2 + 8 && !bulletHit) {
                bulletHit = true;
                enemy.health -= bullet.damage;

                createParticles(
                  enemy.x + enemy.size / 2,
                  enemy.y + enemy.size / 2,
                  "#ff6b6b",
                  4
                );

                if (enemy.health <= 0) {
                  createParticles(
                    enemy.x + enemy.size / 2,
                    enemy.y + enemy.size / 2,
                    "#ffd93d",
                    12
                  );
                  spawnPowerUp(
                    enemy.x + enemy.size / 2,
                    enemy.y + enemy.size / 2
                  );

                  switch (enemy.type) {
                    case "asteroid":
                      scoreIncrease += 10;
                      break;
                    case "fighter":
                      scoreIncrease += 25;
                      break;
                    case "bomber":
                      scoreIncrease += 50;
                      break;
                    case "boss":
                      scoreIncrease += 200;
                      break;
                  }
                } else {
                  remainingEnemies.push(enemy);
                }
              } else {
                const enemyAlreadyAdded = remainingEnemies.some(
                  (e) => e.id === enemy.id
                );
                if (!enemyAlreadyAdded) {
                  remainingEnemies.push(enemy);
                }
              }
            });

            if (!bulletHit) {
              remainingBullets.push(bullet);
            }
          });

          if (scoreIncrease > 0) {
            setScore((prev) => {
              const newScore = prev + scoreIncrease;
              const newLevel = Math.floor(newScore / 500) + 1;
              if (newLevel > level) {
                setLevel(newLevel);
              }
              return newScore;
            });
          }

          return remainingEnemies;
        });

        return prevBullets.filter((bullet) => {
          return !enemies.some((enemy) => {
            const dx = bullet.x - (enemy.x + enemy.size / 2);
            const dy = bullet.y - (enemy.y + enemy.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < enemy.size / 2 + 8;
          });
        });
      });

      // Check collision between jet and enemies
      if (!shield) {
        enemies.forEach((enemy) => {
          const jetCenterX = jetPosition.x + JET_WIDTH / 2;
          const jetCenterY = jetPosition.y + JET_HEIGHT / 2;
          const enemyCenterX = enemy.x + enemy.size / 2;
          const enemyCenterY = enemy.y + enemy.size / 2;

          const dx = jetCenterX - enemyCenterX;
          const dy = jetCenterY - enemyCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < enemy.size / 2 + JET_WIDTH / 3) {
            setHealth((prev) => {
              const newHealth = prev - 30;
              if (newHealth <= 0) {
                setGameOver(true);
                return 0;
              }
              return newHealth;
            });
            createParticles(
              jetPosition.x + JET_WIDTH / 2,
              jetPosition.y + JET_HEIGHT / 2,
              "#ff4757",
              8
            );
          }
        });
      }

      // Check collision between jet and enemy bullets
      if (!shield) {
        setEnemyBullets((prev) => {
          return prev.filter((bullet) => {
            const jetCenterX = jetPosition.x + JET_WIDTH / 2;
            const jetCenterY = jetPosition.y + JET_HEIGHT / 2;
            const dx = jetCenterX - bullet.x;
            const dy = jetCenterY - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < JET_WIDTH / 3 + 5) {
              setHealth((prev) => {
                const newHealth = prev - bullet.damage;
                if (newHealth <= 0) {
                  setGameOver(true);
                  return 0;
                }
                return newHealth;
              });
              createParticles(
                jetPosition.x + JET_WIDTH / 2,
                jetPosition.y + JET_HEIGHT / 2,
                "#ff4757",
                6
              );
              return false;
            }
            return true;
          });
        });
      }

      // Check collision between jet and power-ups
      setPowerUps((prev) => {
        return prev.filter((powerUp) => {
          const jetCenterX = jetPosition.x + JET_WIDTH / 2;
          const jetCenterY = jetPosition.y + JET_HEIGHT / 2;
          const dx = jetCenterX - (powerUp.x + 15);
          const dy = jetCenterY - (powerUp.y + 15);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 25) {
            createParticles(powerUp.x + 15, powerUp.y + 15, "#6c5ce7", 8);

            switch (powerUp.type) {
              case "rapidFire":
                setRapidFire(true);
                setRapidFireTime(8000);
                break;
              case "shield":
                setShield(true);
                setShieldTime(10000);
                break;
              case "multiShot":
                setMultiShot(true);
                setMultiShotTime(12000);
                break;
              case "health":
                setHealth((prev) => Math.min(maxHealth, prev + 30));
                break;
              case "laser":
                setLaserWeapon(true);
                setLaserTime(15000);
                break;
            }
            return false;
          }
          return true;
        });
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    gameStarted,
    gameOver,
    keys,
    jetPosition,
    enemies,
    level,
    shield,
    rapidFire,
    multiShot,
    laserWeapon,
    health,
    rapidFireTime,
    shieldTime,
    multiShotTime,
    laserTime,
    specialAttackCooldown,
    gamePaused,
    spawnPowerUp,
    maxHealth,
    performSpecialAttack,
    createParticles,
  ]);

  if (!gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm p-12 rounded-2xl border border-blue-500/30 shadow-2xl">
            <div className="mb-8">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                SPACE DEFENDER
              </h1>
              <p className="text-xl text-gray-300 font-light">
                Defend Earth from the alien invasion
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 text-left">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
                  <span className="mr-2">🎮</span> Controls
                </h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
                      ←→
                    </kbd>{" "}
                    Move
                  </p>
                  <p>
                    <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
                      SPACE
                    </kbd>{" "}
                    Shoot
                  </p>
                  <p>
                    <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
                      SHIFT
                    </kbd>{" "}
                    Special Attack
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-purple-400 font-semibold mb-2 flex items-center">
                  <span className="mr-2">⚡</span> Power-ups
                </h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    <span className="text-red-400">🔥</span> Rapid Fire
                  </p>
                  <p>
                    <span className="text-blue-400">🛡️</span> Shield
                  </p>
                  <p>
                    <span className="text-purple-400">⚡</span> Multi-Shot
                  </p>
                  <p>
                    <span className="text-green-400">❤️</span> Health{" "}
                    <span className="text-yellow-400">🔫</span> Laser
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-12 py-4 rounded-xl text-xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              <span className="relative z-10">Launch Mission</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-900/20 to-black">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm p-10 rounded-2xl border border-red-500/30 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-5xl font-bold text-red-400 mb-4">
                MISSION FAILED
              </h2>
              <p className="text-gray-400 text-lg">
                Earth&apos;s defenses have been breached
              </p>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-gray-400 text-sm uppercase tracking-wide mb-1">
                    Final Score
                  </p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {score.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm uppercase tracking-wide mb-1">
                    Level Reached
                  </p>
                  <p className="text-3xl font-bold text-blue-400">{level}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="group relative bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span className="relative z-10">Retry Mission</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={resetGame}
                className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-bold transform hover:scale-105 transition-all duration-300"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black min-h-screen flex items-center justify-center">
      {/* Modern HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="max-w-6xl mx-auto">
          {/* Top HUD Bar */}
          <div className="flex justify-between items-center mb-4">
            {/* Left: Score & Level */}
            <div className="flex items-center space-x-8">
              <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-500/30">
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  Score
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-500/30">
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  Wave
                </div>
                <div className="text-2xl font-bold text-blue-400">{level}</div>
              </div>
            </div>

            {/* Right: Health */}
            <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/30">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Hull Integrity
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                  <div
                    className={`h-full transition-all duration-500 ${
                      health > 60
                        ? "bg-gradient-to-r from-green-400 to-green-500"
                        : health > 30
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                        : "bg-gradient-to-r from-red-400 to-red-500"
                    }`}
                    style={{ width: `${(health / maxHealth) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-white min-w-[3rem]">
                  {health}%
                </span>
              </div>
            </div>
          </div>

          {/* Power-ups & Special Attack Status */}
          <div className="flex justify-between items-center">
            {/* Active Power-ups */}
            <div className="flex space-x-2">
              {rapidFire && (
                <div className="bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center border border-red-400/50">
                  <span className="mr-1">🔥</span>
                  <span className="font-mono">
                    {Math.ceil(rapidFireTime / 1000)}s
                  </span>
                </div>
              )}
              {shield && (
                <div className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center border border-blue-400/50">
                  <span className="mr-1">🛡️</span>
                  <span className="font-mono">
                    {Math.ceil(shieldTime / 1000)}s
                  </span>
                </div>
              )}
              {multiShot && (
                <div className="bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center border border-purple-400/50">
                  <span className="mr-1">⚡</span>
                  <span className="font-mono">
                    {Math.ceil(multiShotTime / 1000)}s
                  </span>
                </div>
              )}
              {laserWeapon && (
                <div className="bg-green-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center border border-green-400/50">
                  <span className="mr-1">🔫</span>
                  <span className="font-mono">
                    {Math.ceil(laserTime / 1000)}s
                  </span>
                </div>
              )}
            </div>

            {/* Special Attack Status & Controls */}
            <div className="flex items-center space-x-3">
              <div
                className={`px-4 py-2 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
                  specialAttackCooldown > 0
                    ? "bg-gray-800/80 border-gray-600/50 text-gray-400"
                    : "bg-yellow-600/90 border-yellow-400/50 text-white animate-pulse shadow-lg shadow-yellow-500/25"
                }`}
              >
                <div className="text-xs uppercase tracking-wide opacity-75">
                  Special Attack
                </div>
                <div className="font-bold">
                  {specialAttackCooldown > 0 ? (
                    <span className="font-mono">
                      {Math.ceil(specialAttackCooldown / 1000)}s
                    </span>
                  ) : (
                    <span>READY</span>
                  )}
                </div>
              </div>

              {/* Pause Button */}
              <button
                onClick={() => setGamePaused(true)}
                className="bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 hover:border-gray-500/50 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                title="Pause Game (ESC)"
              >
                <span className="text-lg">⏸️</span>
                <span className="text-xs uppercase tracking-wide">Pause</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex items-center justify-center min-h-screen pt-32 pb-8">
        <div
          className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-black border border-blue-500/50 overflow-hidden shadow-2xl rounded-lg"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Animated Stars background */}
          <div className="absolute inset-0">
            {[...Array(100)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  opacity: Math.random() * 0.8 + 0.2,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 2 + 1}s`,
                }}
              />
            ))}
          </div>

          {/* Pause Overlay */}
          {gamePaused && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-900/90 backdrop-blur-sm p-8 rounded-2xl border border-blue-500/30 shadow-2xl text-center">
                <div className="mb-6">
                  <h2 className="text-4xl font-bold text-white mb-2">
                    GAME PAUSED
                  </h2>
                  <p className="text-gray-400">Mission temporarily suspended</p>
                </div>

                <div className="space-y-4 mb-6">
                  <button
                    onClick={() => setGamePaused(false)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-bold transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Resume Mission
                  </button>
                  <button
                    onClick={() => {
                      setGamePaused(false);
                      setGameStarted(false);
                      setGameOver(false);
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transform hover:scale-105 transition-all duration-300"
                  >
                    Abort Mission
                  </button>
                </div>

                <div className="text-sm text-gray-400">
                  Press{" "}
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
                    ESC
                  </kbd>{" "}
                  to resume
                </div>
              </div>
            </div>
          )}

          {/* Particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: particle.life / particle.maxLife,
              }}
            />
          ))}

          {/* Jet with shield effect */}
          <div
            className="absolute transition-all duration-75"
            style={{
              left: jetPosition.x,
              top: jetPosition.y,
              width: JET_WIDTH,
              height: JET_HEIGHT,
            }}
          >
            {shield && (
              <div className="absolute -inset-2 rounded-full border-2 border-blue-400 animate-pulse bg-blue-400 bg-opacity-20" />
            )}
            <div className="w-full h-full bg-gradient-to-t from-blue-400 to-blue-600 clip-path-triangle relative shadow-lg">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-gradient-to-t from-orange-500 to-yellow-400"></div>
              {/* Engine glow */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-orange-400 opacity-60 blur-sm"></div>
            </div>
          </div>

          {/* Player Bullets */}
          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className={`absolute rounded-full ${
                bullet.type === "laser"
                  ? "w-2 h-6 bg-gradient-to-t from-green-400 to-green-600 shadow-lg shadow-green-400/50"
                  : bullet.type === "plasma"
                  ? "w-3 h-8 bg-gradient-to-t from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-400/50 glow"
                  : "w-1 h-3 bg-gradient-to-t from-yellow-400 to-yellow-600"
              }`}
              style={{ left: bullet.x, top: bullet.y }}
            />
          ))}

          {/* Enemy Bullets */}
          {enemyBullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute w-1 h-3 bg-gradient-to-t from-red-500 to-red-700 rounded-full"
              style={{ left: bullet.x, top: bullet.y }}
            />
          ))}

          {/* Enemies */}
          {enemies.map((enemy) => (
            <div
              key={enemy.id}
              className="absolute"
              style={{
                left: enemy.x,
                top: enemy.y,
                width: enemy.size,
                height: enemy.size,
              }}
            >
              {/* Health bar for damaged enemies */}
              {enemy.health < enemy.maxHealth && (
                <div className="absolute -top-2 left-0 w-full h-1 bg-gray-700 rounded">
                  <div
                    className="h-full bg-red-500 rounded transition-all duration-200"
                    style={{
                      width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* Enemy visual based on type */}
              {enemy.type === "asteroid" && (
                <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded-full border-2 border-gray-400 shadow-lg" />
              )}
              {enemy.type === "fighter" && (
                <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 clip-path-triangle border border-red-400 shadow-lg shadow-red-600/30" />
              )}
              {enemy.type === "bomber" && (
                <div className="w-full h-full bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg border border-orange-400 shadow-lg shadow-orange-600/30" />
              )}
              {enemy.type === "boss" && (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-900 rounded-lg border-2 border-purple-400 shadow-2xl shadow-purple-600/50 relative">
                  <div className="absolute inset-2 bg-purple-700 rounded opacity-50" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          ))}

          {/* Power-ups */}
          {powerUps.map((powerUp) => (
            <div
              key={powerUp.id}
              className="absolute w-8 h-8 rounded-full border-2 animate-pulse shadow-lg"
              style={{
                left: powerUp.x,
                top: powerUp.y,
                backgroundColor:
                  powerUp.type === "rapidFire"
                    ? "#ff6b6b"
                    : powerUp.type === "shield"
                    ? "#4ecdc4"
                    : powerUp.type === "multiShot"
                    ? "#a55eea"
                    : powerUp.type === "health"
                    ? "#26de81"
                    : "#feca57",
                borderColor:
                  powerUp.type === "rapidFire"
                    ? "#ff5252"
                    : powerUp.type === "shield"
                    ? "#26d0ce"
                    : powerUp.type === "multiShot"
                    ? "#8854d0"
                    : powerUp.type === "health"
                    ? "#20bf6b"
                    : "#fd9644",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {powerUp.type === "rapidFire"
                  ? "🔥"
                  : powerUp.type === "shield"
                  ? "🛡️"
                  : powerUp.type === "multiShot"
                  ? "⚡"
                  : powerUp.type === "health"
                  ? "❤️"
                  : "🔫"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900/60 backdrop-blur-sm px-6 py-3 rounded-lg border border-gray-700/50">
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">←→</kbd>
                <span>Move</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
                  SPACE
                </kbd>
                <span>Shoot</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
                  SHIFT
                </kbd>
                <span>Special Attack</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">ESC</kbd>
                <span>Pause</span>
              </div>
              <div className="text-blue-400">
                <span>Collect power-ups to enhance your ship!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
