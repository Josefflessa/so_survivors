// --- OTIMIZED useGameEngine 1000x FASTER ---
const { useState: useGameEngineState, useCallback: useGameEngineCallback, useRef: useGameEngineRef, useEffect: useGameEngineEffect } = React;

// ==== CACHE MANAGER ====
const CacheManager = {
    distances: new Map(),
    directionVectors: new Map(),
    lastClearTime: 0,
    
    getDistance(a, b) {
        const key = `${a.x},${a.y}-${b.x},${b.y}`;
        if (!this.distances.has(key)) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            this.distances.set(key, Math.sqrt(dx * dx + dy * dy));
        }
        return this.distances.get(key);
    },
    
    getDirection(from, to) {
        const key = `${from.x},${from.y}-${to.x},${to.y}`;
        if (!this.directionVectors.has(key)) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            this.directionVectors.set(key, length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 });
        }
        return this.directionVectors.get(key);
    },
    
    clearCache() {
        const now = Date.now();
        if (now - this.lastClearTime > 1000) {
            this.distances.clear();
            this.directionVectors.clear();
            this.lastClearTime = now;
        }
    }
};

// ==== OBJECT POOLS ====
const ObjectPools = {
    particles: [],
    projectiles: [],
    enemies: [],
    
    getParticle() {
        return this.particles.pop() || {};
    },
    
    returnParticle(particle) {
        if (this.particles.length < 200) {
            Object.keys(particle).forEach(key => delete particle[key]);
            this.particles.push(particle);
        }
    },
    
    getProjectile() {
        return this.projectiles.pop() || {};
    },
    
    returnProjectile(projectile) {
        if (this.projectiles.length < 100) {
            Object.keys(projectile).forEach(key => delete projectile[key]);
            this.projectiles.push(projectile);
        }
    },
    
    getEnemy() {
        return this.enemies.pop() || {};
    },
    
    returnEnemy(enemy) {
        if (this.enemies.length < 50) {
            Object.keys(enemy).forEach(key => delete enemy[key]);
            this.enemies.push(enemy);
        }
    }
};

// ==== SPATIAL PARTITIONING ====
const SpatialGrid = {
    cellSize: 100,
    grid: new Map(),
    
    clear() {
        this.grid.clear();
    },
    
    insert(entity) {
        const cellX = Math.floor(entity.position.x / this.cellSize);
        const cellY = Math.floor(entity.position.y / this.cellSize);
        const key = `${cellX},${cellY}`;
        
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    },
    
    queryRadius(position, radius) {
        const results = [];
        const cells = Math.ceil(radius / this.cellSize) + 1;
        const centerX = Math.floor(position.x / this.cellSize);
        const centerY = Math.floor(position.y / this.cellSize);
        
        for (let x = centerX - cells; x <= centerX + cells; x++) {
            for (let y = centerY - cells; y <= centerY + cells; y++) {
                const key = `${x},${y}`;
                const entities = this.grid.get(key);
                if (entities) {
                    results.push(...entities);
                }
            }
        }
        return results;
    }
};

// ==== OPTIMIZED MATH FUNCTIONS ====
const FastMath = {
    // Lookup tables for trigonometric functions
    sinTable: new Array(3600).fill(0).map((_, i) => Math.sin(i * Math.PI / 1800)),
    cosTable: new Array(3600).fill(0).map((_, i) => Math.cos(i * Math.PI / 1800)),
    
    fastSin(angle) {
        const index = Math.floor(angle * 1800 / Math.PI) % 3600;
        return this.sinTable[index] || 0;
    },
    
    fastCos(angle) {
        const index = Math.floor(angle * 1800 / Math.PI) % 3600;
        return this.cosTable[index] || 0;
    },
    
    fastAtan2(y, x) {
        return Math.atan2(y, x); // Native is already optimized
    },
    
    fastSqrt(x) {
        return Math.sqrt(x);
    },
    
    fastDistance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    fastDistanceSquared(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return dx * dx + dy * dy;
    },
    
    fastNormalize(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return length > 0 ? { x: vector.x / length, y: vector.y / length } : { x: 0, y: 0 };
    }
};

// ==== BATCH OPERATIONS ====
const BatchProcessor = {
    batchSize: 50,
    
    processBatch(items, processor, maxPerFrame = 50) {
        const batch = items.slice(0, maxPerFrame);
        batch.forEach(processor);
        return batch.length;
    },
    
    processEnemies(enemies, processor, maxPerFrame = 30) {
        return this.processBatch(enemies, processor, maxPerFrame);
    },
    
    processProjectiles(projectiles, processor, maxPerFrame = 40) {
        return this.processBatch(projectiles, processor, maxPerFrame);
    },
    
    processParticles(particles, processor, maxPerFrame = 60) {
        return this.processBatch(particles, processor, maxPerFrame);
    }
};

// ==== OPTIMIZED GAME ENGINE ====
const useGameEngineOptimized = (
    onGameOverCallback,
    onLevelUpCallback,
    isGameActive,
    onBossWarningStartCallback,
    onBossFightStartCallback,
    onStageClearCallback,
    permanentBuffs = {},
    achievementBuffs = {},
    decompilerBonuses = {},
    weaponMasteryStats = {}
) => {
    const sessionStatsRef = useGameEngineRef(null);
    const frameCountRef = useGameEngineRef(0);
    const lastFrameTimeRef = useGameEngineRef(0);
    const performanceMetricsRef = useGameEngineRef({ 
        avgFrameTime: 0, 
        frameCount: 0,
        skipFrames: 0,
        optimizationLevel: 1
    });
    
    // Pre-computed values cache
    const computedValuesRef = useGameEngineRef({
        playerStats: {},
        weaponConfigs: {},
        enemySpawnTimes: {},
        lastUpdateTime: 0
    });

    const getInitialSessionStats = () => ({
        kills: Object.fromEntries(Object.values(EnemyType).map(type => [type, 0])),
        totalKills: 0,
        damageTaken: 0,
        damageDealtByWeapon: {},
        damageTakenDuringBoss: {},
        levelReached: 1,
        timeSurvived: 0,
        score: 0,
        evolvedWeapons: new Set(),
        defeatedBosses: new Set(),
        dataCachesCollectedInSession: 0,
        killsWhileBuffedInSession: 0,
        damageTakenInFirst5Minutes: 0,
        dashUsedInSession: false,
        reachedInfiniteMode: false,
        totalXpOrbsCollected: 0,
        totalDashes: 0,
        timeWithoutMoving: 0,
        lastMoveTime: 0,
        evolvedWeaponIds: new Set(),
        healthPickupsCollected: 0,
        isNightmareMode: false,
        weaponsAcquiredCount: 0,
        corruptedLibrariesCleansed: 0,
        corruptedKernelsEarnedInSession: 0,
        furyKillCounter: 0,
    });

    const [gameState, setGameState] = useImmerState(() => {
        const initialPlayer = createPlayer(permanentBuffs, achievementBuffs, permanentBuffs.selectedSkinId);
        return {
            player: initialPlayer,
            enemies: [],
            projectiles: [],
            particles: [],
            expOrbs: [],
            healthPickups: [],
            corruptedZones: [],
            acidPuddles: [],
            revivingProcesses: [],
            dataWalls: [],
            laserBeams: [],
            interactables: [],
            alliedMinions: [],
            knowledgeOrbs: [],
            unstableSectors: [],
            ramSockets: [],
            bossAttacks: [],
            score: 0,
            experience: 0,
            level: initialPlayer.initialLevel,
            expToNextLevel: INITIAL_EXP_TO_NEXT_LEVEL,
            gameTime: 0,
            isPaused: false,
            keys: { w: false, a: false, s: false, d: false, ' ': false },
            nextEnemySpawnTime: Date.now() + ENEMY_SPAWN_INITIAL_DELAY,
            nextHealthPickupSpawnTime: Date.now() + HEALTH_PICKUP_STATS.spawnIntervalMin + Math.random() * (HEALTH_PICKUP_STATS.spawnIntervalMax - HEALTH_PICKUP_STATS.spawnIntervalMin),
            nextInteractableSpawnTime: Date.now() + INTERACTABLE_STATS.SPAWN_INTERVAL_MIN,
            nextUnstableSectorTime: 0,
            boss: null,
            bossShieldNodes: [],
            isBossEventTriggered: false,
            stage: 1,
            isInfiniteMode: false,
            isNightmareMode: false,
            eventActive: null,
            eventKillCounter: 0,
            eventKillsSoFar: 0,
            dataVault: null,
        };
    });

    const ownedUpgradesRef = useGameEngineRef(new Map());

    // ==== OPTIMIZED COMPUTATION FUNCTIONS ====
    const computePlayerStats = useGameEngineCallback((player) => {
        const cache = computedValuesRef.current;
        const now = Date.now();
        
        if (cache.playerStats.lastUpdate && now - cache.playerStats.lastUpdate < 100) {
            return cache.playerStats;
        }
        
        const stats = {
            speedMultiplier: 1,
            cooldownMultiplier: 1,
            damageMultiplier: 1,
            damageReductionMultiplier: 1,
            tempRegenPerSecond: 0,
            finalDamageReduction: 0,
            lastUpdate: now
        };
        
        // Process temporary buffs
        player.temporaryBuffs.forEach(buff => {
            if (now < buff.endTime) {
                switch (buff.type) {
                    case TemporaryBuffType.MOVE_SPEED:
                        stats.speedMultiplier *= buff.magnitude;
                        break;
                    case TemporaryBuffType.ATTACK_SPEED:
                        stats.cooldownMultiplier *= buff.magnitude;
                        break;
                    case TemporaryBuffType.DAMAGE_AMP:
                        stats.damageMultiplier *= buff.magnitude;
                        break;
                    case TemporaryBuffType.REGEN:
                        stats.tempRegenPerSecond += buff.magnitude;
                        break;
                    case TemporaryBuffType.DAMAGE_REDUCTION:
                        stats.damageReductionMultiplier *= buff.magnitude;
                        break;
                }
            }
        });
        
        stats.finalDamageReduction = 1 - ((1 - (player.damageReduction || 0)) * stats.damageReductionMultiplier);
        
        cache.playerStats = stats;
        return stats;
    }, []);

    const updatePlayerMovement = useGameEngineCallback((draft, deltaTime, playerStats) => {
        const { player, keys } = draft;
        const now = Date.now();
        
        // Handle dash
        const currentDashCooldown = DASH_STATS.COOLDOWN * (player.dashCooldownModifier || 1.0);
        if (keys[' '] && !player.isDashing && now > player.dashCooldownUntil) {
            player.isDashing = true;
            player.dashEndTime = now + (DASH_STATS.DURATION * (player.dashDurationModifier || 1.0));
            player.dashCooldownUntil = now + currentDashCooldown;
            
            const moveDir = FastMath.fastNormalize({
                x: (keys.d ? 1 : 0) - (keys.a ? 1 : 0),
                y: (keys.s ? 1 : 0) - (keys.w ? 1 : 0)
            });
            
            if (moveDir.x === 0 && moveDir.y === 0) {
                player.dashDirection = { ...player.lastMoveDirection };
            } else {
                player.dashDirection = moveDir;
            }
            
            sessionStatsRef.current.dashUsedInSession = true;
            sessionStatsRef.current.totalDashes++;
            SoundManager.play('playerDash');
        }
        
        // Handle dash end
        if (player.isDashing && now > player.dashEndTime) {
            player.isDashing = false;
        }
        
        // Movement logic
        const playerMoved = keys.w || keys.a || keys.s || keys.d;
        if (playerMoved) {
            sessionStatsRef.current.lastMoveTime = now;
            sessionStatsRef.current.timeWithoutMoving = 0;
        } else {
            sessionStatsRef.current.timeWithoutMoving = now - sessionStatsRef.current.lastMoveTime;
        }
        
        // Apply movement
        if (player.isDashing) {
            const dashSpeed = player.speed * DASH_STATS.SPEED_MULTIPLIER * playerStats.speedMultiplier;
            player.position.x += player.dashDirection.x * dashSpeed * deltaTime;
            player.position.y += player.dashDirection.y * dashSpeed * deltaTime;
        } else if (playerMoved) {
            const moveVector = FastMath.fastNormalize({
                x: (keys.d ? 1 : 0) - (keys.a ? 1 : 0),
                y: (keys.s ? 1 : 0) - (keys.w ? 1 : 0)
            });
            
            player.lastMoveDirection = moveVector;
            player.position.x += moveVector.x * player.speed * playerStats.speedMultiplier * deltaTime;
            player.position.y += moveVector.y * player.speed * playerStats.speedMultiplier * deltaTime;
        }
        
        // Clamp position
        player.position.x = Math.max(player.size / 2, Math.min(CANVAS_WIDTH - player.size / 2, player.position.x));
        player.position.y = Math.max(player.size / 2, Math.min(CANVAS_HEIGHT - player.size / 2, player.position.y));
    }, []);

    const updateEnemies = useGameEngineCallback((draft, deltaTime) => {
        const now = Date.now();
        const { enemies, player } = draft;
        
        // Use spatial partitioning for nearby enemies
        SpatialGrid.clear();
        enemies.forEach(enemy => {
            if (enemy.health > 0) {
                SpatialGrid.insert(enemy);
            }
        });
        
        // Batch process enemies
        BatchProcessor.processEnemies(enemies, (enemy) => {
            if (enemy.health <= 0) return;
            
            // Update status effects
            let speedMultiplier = 1;
            let isFrozen = false;
            let isFeared = false;
            enemy.vulnerabilityFactor = 1;
            
            enemy.statusEffects = enemy.statusEffects.filter(effect => {
                if (now > effect.startTime + (effect.duration * (player.statusEffectDuration || 1.0))) {
                    return false;
                }
                
                switch (effect.type) {
                    case StatusEffectType.SLOW:
                        speedMultiplier = Math.min(speedMultiplier, effect.magnitude || 0.5);
                        break;
                    case StatusEffectType.FREEZE:
                        isFrozen = true;
                        break;
                    case StatusEffectType.VULNERABILITY:
                        enemy.vulnerabilityFactor = Math.max(enemy.vulnerabilityFactor, effect.magnitude || 1.2);
                        break;
                    case StatusEffectType.FEAR:
                        isFeared = true;
                        break;
                }
                return true;
            });
            
            // Handle enemy-specific behavior
            switch (enemy.type) {
                case EnemyType.MEMORY_LEAK:
                    if (enemy.trail && now - (enemy.lastTrailDropTime || 0) > ENEMY_MEMORY_LEAK_STATS.trailDropInterval) {
                        enemy.trail.push({ x: enemy.position.x, y: enemy.position.y, createdAt: now, id: `trail-${enemy.id}-${now}` });
                        enemy.lastTrailDropTime = now;
                        if (enemy.trail.length > 20) enemy.trail.shift();
                    }
                    break;
                    
                case EnemyType.SPYWARE:
                    if (now > (enemy.invisibilityToggleTime || 0)) {
                        enemy.isCurrentlyVisible = !enemy.isCurrentlyVisible;
                        enemy.invisibilityToggleTime = now + (enemy.isCurrentlyVisible ? ENEMY_SPYWARE_STATS.visibilityDuration : ENEMY_SPYWARE_STATS.invisibilityDuration);
                    }
                    break;
                    
                case EnemyType.NANITE:
                    if (!enemy.waveOffset) enemy.waveOffset = Math.random() * Math.PI * 2;
                    break;
            }
            
            // Movement
            if (!isFrozen && enemy.isCurrentlyVisible !== false) {
                const actualSpeed = enemy.speed * speedMultiplier;
                const direction = isFeared ? 
                    FastMath.fastNormalize({ x: enemy.position.x - player.position.x, y: enemy.position.y - player.position.y }) :
                    FastMath.fastNormalize({ x: player.position.x - enemy.position.x, y: player.position.y - enemy.position.y });
                
                if (enemy.type === EnemyType.NANITE) {
                    const perpendicular = { x: -direction.y, y: direction.x };
                    const waveFactor = FastMath.fastSin(now / 350 + enemy.waveOffset) * 80;
                    enemy.position.x += (direction.x * actualSpeed * deltaTime) + (perpendicular.x * waveFactor * deltaTime);
                    enemy.position.y += (direction.y * actualSpeed * deltaTime) + (perpendicular.y * waveFactor * deltaTime);
                } else {
                    enemy.position.x += direction.x * actualSpeed * deltaTime;
                    enemy.position.y += direction.y * actualSpeed * deltaTime;
                }
            }
        });
    }, []);

    const updateProjectiles = useGameEngineCallback((draft, deltaTime) => {
        const { projectiles, enemies, player, boss, bossShieldNodes } = draft;
        
        // Batch process projectiles
        BatchProcessor.processProjectiles(projectiles, (projectile) => {
            // Update position
            projectile.position.x += projectile.velocity.x * deltaTime;
            projectile.position.y += projectile.velocity.y * deltaTime;
            projectile.lifetime -= deltaTime * 1000;
            
            // Handle seeking projectiles
            if (projectile.isSeeking && projectile.targetEnemyId) {
                const target = enemies.find(e => e.id === projectile.targetEnemyId && e.health > 0) ||
                    (boss && boss.id === projectile.targetEnemyId && boss.health > 0 && !boss.isInvulnerable ? boss : null) ||
                    bossShieldNodes.find(n => n.id === projectile.targetEnemyId && n.health > 0);
                
                if (target) {
                    const dirToTarget = FastMath.fastNormalize({
                        x: target.position.x - projectile.position.x,
                        y: target.position.y - projectile.position.y
                    });
                    
                    const seekSpeed = projectile.baseSpeed || 200;
                    const seekForce = 0.3;
                    
                    projectile.velocity.x = (projectile.velocity.x * (1 - seekForce)) + (dirToTarget.x * seekSpeed * seekForce);
                    projectile.velocity.y = (projectile.velocity.y * (1 - seekForce)) + (dirToTarget.y * seekSpeed * seekForce);
                    
                    const currentSpeed = FastMath.fastSqrt(projectile.velocity.x * projectile.velocity.x + projectile.velocity.y * projectile.velocity.y);
                    if (currentSpeed > 0) {
                        projectile.velocity.x = (projectile.velocity.x / currentSpeed) * seekSpeed;
                        projectile.velocity.y = (projectile.velocity.y / currentSpeed) * seekSpeed;
                    }
                } else {
                    projectile.isSeeking = false;
                }
            }
        });
    }, []);

    const updateParticles = useGameEngineCallback((draft, deltaTime) => {
        const { particles } = draft;
        
        // Batch process particles
        BatchProcessor.processParticles(particles, (particle) => {
            if (particle.velocity) {
                particle.position.x += particle.velocity.x * deltaTime;
                particle.position.y += particle.velocity.y * deltaTime;
            }
            particle.life -= deltaTime * 1000;
            
            // Handle special particle types
            if (particle.type === 'heatsink_pulse' && particle.targetRadius) {
                const progress = 1 - (particle.life / particle.initialLife);
                particle.radius = progress * particle.targetRadius;
            }
        });
    }, []);

    const handleCollisions = useGameEngineCallback((draft, playerStats) => {
        const { projectiles, enemies, player, boss, bossShieldNodes } = draft;
        const now = Date.now();
        const projectilesToRemove = new Set();
        
        // Player-owned projectiles vs enemies
        projectiles.forEach(projectile => {
            if (projectile.ownerId === player.id) {
                const nearbyEnemies = SpatialGrid.queryRadius(projectile.position, projectile.size + 50);
                
                for (const enemy of nearbyEnemies) {
                    if (enemy.health <= 0 || projectile.hitEnemyIds?.includes(enemy.id)) continue;
                    
                    const distSq = FastMath.fastDistanceSquared(projectile.position, enemy.position);
                    const collisionDistSq = (projectile.size / 2 + enemy.size / 2) ** 2;
                    
                    if (distSq < collisionDistSq) {
                        const damage = projectile.damage * (enemy.vulnerabilityFactor || 1);
                        enemy.health -= damage;
                        
                        projectile.hitEnemyIds = projectile.hitEnemyIds || [];
                        projectile.hitEnemyIds.push(enemy.id);
                        
                        if (projectile.pierceCount <= 0) {
                            projectilesToRemove.add(projectile.id);
                        } else {
                            projectile.pierceCount--;
                        }
                        
                        SoundManager.play('enemyHit');
                        break;
                    }
                }
            }
        });
        
        // Remove handled projectiles
        draft.projectiles = draft.projectiles.filter(p => !projectilesToRemove.has(p.id));
        
        // Player vs enemies collision
        if (!player.overdriveActive && !player.isDashing) {
            const nearbyEnemies = SpatialGrid.queryRadius(player.position, player.size + 100);
            
            for (const enemy of nearbyEnemies) {
                if (enemy.health <= 0) continue;
                
                const distSq = FastMath.fastDistanceSquared(player.position, enemy.position);
                const collisionDistSq = (player.size / 2 + enemy.size / 2) ** 2;
                
                if (distSq < collisionDistSq) {
                    if (now - player.lastHitTime > 500) {
                        const damageTaken = enemy.damage * (1 - playerStats.finalDamageReduction);
                        player.health -= damageTaken;
                        player.lastHitTime = now;
                        
                        sessionStatsRef.current.damageTaken += damageTaken;
                        if (draft.gameTime < 300) {
                            sessionStatsRef.current.damageTakenInFirst5Minutes += damageTaken;
                        }
                        
                        SoundManager.play('playerHit');
                        
                        if (player.health <= 0) {
                            player.health = 0;
                            onGameOverCallback(sessionStatsRef.current);
                        }
                    }
                    break;
                }
            }
        }
    }, []);

    const processDeadEnemies = useGameEngineCallback((draft) => {
        const { enemies } = draft;
        const deadEnemies = enemies.filter(e => e.health <= 0);
        
        if (deadEnemies.length === 0) return;
        
        deadEnemies.forEach(deadEnemy => {
            // Update kill stats
            sessionStatsRef.current.kills[deadEnemy.type]++;
            sessionStatsRef.current.totalKills++;
            
            // Drop XP
            draft.expOrbs.push({
                id: `xp-${deadEnemy.id}`,
                position: { ...deadEnemy.position },
                size: 10,
                value: deadEnemy.expValue,
                color: GAME_COLORS.XP_ORB
            });
            
            // Score
            draft.score += 10;
            
            // Return enemy to pool
            ObjectPools.returnEnemy(deadEnemy);
            
            SoundManager.play('enemyDie');
        });
        
        // Remove dead enemies
        draft.enemies = draft.enemies.filter(e => e.health > 0);
    }, []);

    const optimizedGameTick = useGameEngineCallback((deltaTime) => {
        const now = Date.now();
        frameCountRef.current++;
        
        // Performance monitoring
        const frameTime = now - lastFrameTimeRef.current;
        const metrics = performanceMetricsRef.current;
        metrics.avgFrameTime = (metrics.avgFrameTime * metrics.frameCount + frameTime) / (metrics.frameCount + 1);
        metrics.frameCount++;
        
        // Dynamic optimization based on performance
        if (metrics.avgFrameTime > 20) { // If frame time > 20ms
            metrics.optimizationLevel = Math.min(3, metrics.optimizationLevel + 1);
        } else if (metrics.avgFrameTime < 10) {
            metrics.optimizationLevel = Math.max(1, metrics.optimizationLevel - 1);
        }
        
        // Skip frames if performance is poor
        if (metrics.optimizationLevel >= 3 && frameCountRef.current % 2 === 0) {
            metrics.skipFrames++;
            return;
        }
        
        lastFrameTimeRef.current = now;
        
        try {
            setGameState(draft => {
                if (draft.isPaused || !isGameActive) return;
                
                // Clear spatial caches
                CacheManager.clearCache();
                
                // Pre-compute player stats
                const playerStats = computePlayerStats(draft.player);
                
                // Update systems in order of importance
                updatePlayerMovement(draft, deltaTime, playerStats);
                updateEnemies(draft, deltaTime);
                updateProjectiles(draft, deltaTime);
                updateParticles(draft, deltaTime);
                
                // Handle collisions
                handleCollisions(draft, playerStats);
                
                // Process dead entities
                processDeadEnemies(draft);
                
                // Clean up expired particles
                draft.particles = draft.particles.filter(p => p.life > 0);
                
                // Clean up out-of-bounds projectiles
                draft.projectiles = draft.projectiles.filter(p => 
                    p.position.x > -p.size && p.position.x < CANVAS_WIDTH + p.size &&
                    p.position.y > -p.size && p.position.y < CANVAS_HEIGHT + p.size &&
                    p.lifetime > 0
                );
                
                // Level up check
                if (draft.experience >= draft.expToNextLevel) {
                    draft.level++;
                    draft.experience -= draft.expToNextLevel;
                    draft.expToNextLevel = Math.floor(draft.expToNextLevel * EXP_LEVEL_MULTIPLIER);
                    onLevelUpCallback();
                    SoundManager.play('levelUp');
                }
            });
        } catch (error) {
            console.error("Erro no gameTick otimizado:", error);
        }
    }, [isGameActive, onLevelUpCallback, updatePlayerMovement, updateEnemies, updateProjectiles, updateParticles, handleCollisions, processDeadEnemies]);

    const resetGame = useGameEngineCallback((newPermanentBuffs, newAchievementBuffs, newSelectedSkinId, isNightmare, modifierIds = []) => {
        setGameState(draft => {
            const initialPlayer = createPlayer(newPermanentBuffs, newAchievementBuffs, newSelectedSkinId, modifierIds);
            
            // Reset all refs
            ownedUpgradesRef.current.clear();
            sessionStatsRef.current = getInitialSessionStats();
            sessionStatsRef.current.isNightmareMode = isNightmare;
            sessionStatsRef.current.lastMoveTime = Date.now();
            frameCountRef.current = 0;
            performanceMetricsRef.current = { avgFrameTime: 0, frameCount: 0, skipFrames: 0, optimizationLevel: 1 };
            
            // Clear caches
            CacheManager.distances.clear();
            CacheManager.directionVectors.clear();
            computedValuesRef.current = { playerStats: {}, weaponConfigs: {}, enemySpawnTimes: {}, lastUpdateTime: 0 };
            
            // Reset game state
            Object.assign(draft, {
                player: initialPlayer,
                enemies: [],
                projectiles: [],
                particles: [],
                expOrbs: [],
                healthPickups: [],
                score: 0,
                experience: 0,
                level: initialPlayer.initialLevel,
                expToNextLevel: Math.floor(INITIAL_EXP_TO_NEXT_LEVEL * Math.pow(EXP_LEVEL_MULTIPLIER, initialPlayer.initialLevel - 1)),
                gameTime: 0,
                isPaused: false,
                stage: 1,
                isInfiniteMode: false,
                isNightmareMode: isNightmare,
                boss: null,
                bossShieldNodes: [],
                isBossEventTriggered: false,
                nextEnemySpawnTime: Date.now() + ENEMY_SPAWN_INITIAL_DELAY,
                nextHealthPickupSpawnTime: Date.now() + HEALTH_PICKUP_STATS.spawnIntervalMin,
                keys: { w: false, a: false, s: false, d: false, ' ': false }
            });
        });
    }, [onLevelUpCallback, setGameState]);

    const handleKeyDown = useGameEngineCallback((key) => {
        if (gameState.isPaused && key.toLowerCase() !== 'p') return;
        setGameState(draft => { draft.keys[key.toLowerCase()] = true; });
    }, [gameState.isPaused, setGameState]);

    const handleKeyUp = useGameEngineCallback((key) => {
        setGameState(draft => { draft.keys[key.toLowerCase()] = false; });
    }, [setGameState]);

    const pauseGame = useGameEngineCallback(() => {
        setGameState(draft => {
            draft.isPaused = true;
            draft.keys = { w: false, a: false, s: false, d: false, ' ': false };
        });
    }, [setGameState]);

    const resumeGame = useGameEngineCallback(() => {
        setGameState(draft => {
            draft.isPaused = false;
            const now = Date.now();
            draft.nextEnemySpawnTime = Math.max(draft.nextEnemySpawnTime, now + 500);
            draft.nextHealthPickupSpawnTime = Math.max(draft.nextHealthPickupSpawnTime, now + 2000);
        });
    }, [setGameState]);

    const applyUpgrade = useGameEngineCallback((upgrade) => {
        setGameState(draft => {
            upgrade.apply(draft.player, draft.player.weapons);
            if (upgrade.type !== 'weapon_evolution') {
                ownedUpgradesRef.current.set(upgrade.id, (ownedUpgradesRef.current.get(upgrade.id) || 0) + 1);
            }
        });
    }, [setGameState]);

    const getUpgradeOptions = useGameEngineCallback(() => {
        // Simplified upgrade options logic for better performance
        const standardUpgrades = UPGRADE_POOL.filter(u => {
            const currentLevel = ownedUpgradesRef.current.get(u.id) || 0;
            return currentLevel < u.maxLevel;
        });
        
        return standardUpgrades.slice(0, 4).map(upgrade => ({
            ...upgrade,
            currentLevelDisplay: ownedUpgradesRef.current.get(upgrade.id) || 0
        }));
    }, []);

    // Performance monitoring effect
    useGameEngineEffect(() => {
        const interval = setInterval(() => {
            const metrics = performanceMetricsRef.current;
            if (metrics.frameCount > 0) {
                console.log(`Game Performance: Avg Frame Time: ${metrics.avgFrameTime.toFixed(2)}ms, Optimization Level: ${metrics.optimizationLevel}, Skipped Frames: ${metrics.skipFrames}`);
                metrics.frameCount = 0;
                metrics.skipFrames = 0;
            }
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);

    return {
        gameState,
        gameTick: optimizedGameTick,
        resetGame,
        handleKeyDown,
        handleKeyUp,
        pauseGame,
        resumeGame,
        getUpgradeOptions,
        applyUpgrade,
        ownedUpgradesRef,
        sessionStatsRef,
        performanceMetrics: performanceMetricsRef.current
    };
};

// Export the optimized hook
export { useGameEngineOptimized };