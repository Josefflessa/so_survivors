// ==== EXEMPLO DE INTEGRAÇÃO DO useGameEngineOptimized ====

// 1. Importar o hook otimizado
import { useGameEngineOptimized } from './useGameEngine-optimized.js';

// 2. Configurar o componente principal do jogo
const GameComponent = () => {
    // Configurações padrão
    const permanentBuffs = {
        selectedClassId: 'class_hacker',
        selectedSkinId: 'skin_default',
        shop: {}
    };
    
    const achievementBuffs = {};
    const decompilerBonuses = {};
    const weaponMasteryStats = {};
    
    // Callbacks do jogo
    const handleGameOver = (stats) => {
        console.log('Game Over!', stats);
        // Lógica de game over
    };
    
    const handleLevelUp = (isFreeUpgrade = false) => {
        console.log('Level Up!', isFreeUpgrade);
        // Lógica de level up
    };
    
    const handleBossWarning = (stage) => {
        console.log('Boss Warning for stage:', stage);
        // Lógica de aviso de boss
    };
    
    const handleBossFight = () => {
        console.log('Boss Fight Started!');
        // Lógica de início de boss fight
    };
    
    const handleStageClear = (stage, isNightmare) => {
        console.log('Stage Clear:', stage, 'Nightmare:', isNightmare);
        // Lógica de conclusão de stage
    };
    
    // Usar o hook otimizado
    const {
        gameState,
        gameTick,
        resetGame,
        handleKeyDown,
        handleKeyUp,
        pauseGame,
        resumeGame,
        getUpgradeOptions,
        applyUpgrade,
        ownedUpgradesRef,
        sessionStatsRef,
        performanceMetrics // Nova funcionalidade!
    } = useGameEngineOptimized(
        handleGameOver,
        handleLevelUp,
        true, // isGameActive
        handleBossWarning,
        handleBossFight,
        handleStageClear,
        permanentBuffs,
        achievementBuffs,
        decompilerBonuses,
        weaponMasteryStats
    );
    
    // Monitor de performance em tempo real
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (performanceMetrics) {
                console.log('Performance Metrics:', {
                    avgFrameTime: performanceMetrics.avgFrameTime?.toFixed(2) + 'ms',
                    optimizationLevel: performanceMetrics.optimizationLevel,
                    frameCount: performanceMetrics.frameCount,
                    skipFrames: performanceMetrics.skipFrames
                });
            }
        }, 5000);
        
        return () => clearInterval(interval);
    }, [performanceMetrics]);
    
    // Game loop
    React.useEffect(() => {
        let animationFrameId;
        let lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Usar o gameTick otimizado
            gameTick(deltaTime);
            
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);
        
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [gameTick]);
    
    // Event handlers para teclado
    React.useEffect(() => {
        const handleKeyDownEvent = (e) => handleKeyDown(e.key);
        const handleKeyUpEvent = (e) => handleKeyUp(e.key);
        
        document.addEventListener('keydown', handleKeyDownEvent);
        document.addEventListener('keyup', handleKeyUpEvent);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDownEvent);
            document.removeEventListener('keyup', handleKeyUpEvent);
        };
    }, [handleKeyDown, handleKeyUp]);
    
    // Renderizar o jogo
    return React.createElement('div', {
        style: {
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0d1117'
        }
    }, [
        // Performance indicator
        React.createElement('div', {
            key: 'performance',
            style: {
                position: 'absolute',
                top: '10px',
                right: '10px',
                color: '#00ff00',
                fontFamily: 'monospace',
                fontSize: '12px',
                background: 'rgba(0,0,0,0.7)',
                padding: '5px',
                borderRadius: '3px',
                zIndex: 1000
            }
        }, [
            React.createElement('div', { key: 'fps' }, 
                `FPS: ${performanceMetrics?.avgFrameTime ? (1000 / performanceMetrics.avgFrameTime).toFixed(1) : 'N/A'}`
            ),
            React.createElement('div', { key: 'opt' }, 
                `Opt Level: ${performanceMetrics?.optimizationLevel || 1}`
            ),
            React.createElement('div', { key: 'skip' }, 
                `Skipped: ${performanceMetrics?.skipFrames || 0}`
            )
        ]),
        
        // Canvas do jogo
        React.createElement(GameCanvas, {
            key: 'canvas',
            gameState,
            gameScreen: GameScreenState.PLAYING
        }),
        
        // UI overlay
        React.createElement(UIOverlay, {
            key: 'ui',
            gameState
        }),
        
        // Controles de debug
        React.createElement('div', {
            key: 'debug',
            style: {
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                display: 'flex',
                gap: '10px',
                zIndex: 1000
            }
        }, [
            React.createElement('button', {
                key: 'pause',
                onClick: pauseGame,
                style: {
                    padding: '5px 10px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                }
            }, 'Pause'),
            
            React.createElement('button', {
                key: 'resume',
                onClick: resumeGame,
                style: {
                    padding: '5px 10px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                }
            }, 'Resume'),
            
            React.createElement('button', {
                key: 'reset',
                onClick: () => resetGame(permanentBuffs, achievementBuffs, 'skin_default', false),
                style: {
                    padding: '5px 10px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                }
            }, 'Reset')
        ])
    ]);
};

// 3. Comparação de Performance
const PerformanceComparison = () => {
    const [useOptimized, setUseOptimized] = React.useState(true);
    const [metrics, setMetrics] = React.useState({
        optimized: { avgFrameTime: 0, frameCount: 0 },
        original: { avgFrameTime: 0, frameCount: 0 }
    });
    
    const currentMetrics = useOptimized ? 
        useGameEngineOptimized(/* params */).performanceMetrics :
        useGameEngine(/* params */).performanceMetrics;
    
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (currentMetrics) {
                setMetrics(prev => ({
                    ...prev,
                    [useOptimized ? 'optimized' : 'original']: {
                        avgFrameTime: currentMetrics.avgFrameTime,
                        frameCount: currentMetrics.frameCount
                    }
                }));
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [currentMetrics, useOptimized]);
    
    return React.createElement('div', {
        style: {
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '14px',
            zIndex: 1000
        }
    }, [
        React.createElement('h3', { key: 'title' }, 'Performance Comparison'),
        
        React.createElement('div', { key: 'toggle' }, [
            React.createElement('label', { key: 'label' }, 'Use Optimized: '),
            React.createElement('input', {
                key: 'input',
                type: 'checkbox',
                checked: useOptimized,
                onChange: (e) => setUseOptimized(e.target.checked)
            })
        ]),
        
        React.createElement('div', { key: 'metrics' }, [
            React.createElement('div', { key: 'opt' }, 
                `Optimized: ${metrics.optimized.avgFrameTime?.toFixed(2) || 'N/A'}ms`
            ),
            React.createElement('div', { key: 'orig' }, 
                `Original: ${metrics.original.avgFrameTime?.toFixed(2) || 'N/A'}ms`
            ),
            React.createElement('div', { key: 'improvement' }, 
                `Improvement: ${
                    metrics.original.avgFrameTime && metrics.optimized.avgFrameTime ?
                    ((metrics.original.avgFrameTime - metrics.optimized.avgFrameTime) / metrics.original.avgFrameTime * 100).toFixed(1) + '%' :
                    'N/A'
                }`
            )
        ])
    ]);
};

// 4. Configuração Avançada
const AdvancedGameConfig = () => {
    const [config, setConfig] = React.useState({
        batchSize: 50,
        cacheTimeout: 1000,
        optimizationLevel: 1,
        enableSpatialGrid: true,
        enableObjectPools: true,
        enableFastMath: true
    });
    
    // Configurar os sistemas de otimização
    React.useEffect(() => {
        // Configurar batch processor
        BatchProcessor.batchSize = config.batchSize;
        
        // Configurar cache manager
        const originalClearCache = CacheManager.clearCache;
        CacheManager.clearCache = function() {
            const now = Date.now();
            if (now - this.lastClearTime > config.cacheTimeout) {
                this.distances.clear();
                this.directionVectors.clear();
                this.lastClearTime = now;
            }
        };
        
        return () => {
            CacheManager.clearCache = originalClearCache;
        };
    }, [config]);
    
    return React.createElement('div', {
        style: {
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            zIndex: 1000
        }
    }, [
        React.createElement('h3', { key: 'title' }, 'Advanced Config'),
        
        React.createElement('div', { key: 'batch' }, [
            React.createElement('label', { key: 'label' }, 'Batch Size: '),
            React.createElement('input', {
                key: 'input',
                type: 'range',
                min: 10,
                max: 100,
                value: config.batchSize,
                onChange: (e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))
            }),
            React.createElement('span', { key: 'value' }, config.batchSize)
        ]),
        
        React.createElement('div', { key: 'cache' }, [
            React.createElement('label', { key: 'label' }, 'Cache Timeout: '),
            React.createElement('input', {
                key: 'input',
                type: 'range',
                min: 500,
                max: 5000,
                step: 500,
                value: config.cacheTimeout,
                onChange: (e) => setConfig(prev => ({ ...prev, cacheTimeout: parseInt(e.target.value) }))
            }),
            React.createElement('span', { key: 'value' }, config.cacheTimeout + 'ms')
        ]),
        
        React.createElement('div', { key: 'spatial' }, [
            React.createElement('label', { key: 'label' }, 'Spatial Grid: '),
            React.createElement('input', {
                key: 'input',
                type: 'checkbox',
                checked: config.enableSpatialGrid,
                onChange: (e) => setConfig(prev => ({ ...prev, enableSpatialGrid: e.target.checked }))
            })
        ]),
        
        React.createElement('div', { key: 'pools' }, [
            React.createElement('label', { key: 'label' }, 'Object Pools: '),
            React.createElement('input', {
                key: 'input',
                type: 'checkbox',
                checked: config.enableObjectPools,
                onChange: (e) => setConfig(prev => ({ ...prev, enableObjectPools: e.target.checked }))
            })
        ])
    ]);
};

// 5. Exportar componentes
export {
    GameComponent,
    PerformanceComparison,
    AdvancedGameConfig
};

// 6. Exemplo de uso completo
const App = () => {
    return React.createElement('div', {
        style: {
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }
    }, [
        React.createElement(GameComponent, { key: 'game' }),
        React.createElement(PerformanceComparison, { key: 'comparison' }),
        React.createElement(AdvancedGameConfig, { key: 'config' })
    ]);
};

// Renderizar a aplicação
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));

// 7. Utilitários para análise de performance
const PerformanceAnalyzer = {
    startProfiling() {
        this.startTime = performance.now();
        this.samples = [];
    },
    
    addSample(label, value) {
        this.samples.push({ label, value, timestamp: performance.now() });
    },
    
    generateReport() {
        const endTime = performance.now();
        const totalTime = endTime - this.startTime;
        
        return {
            totalTime,
            samples: this.samples,
            averages: this.samples.reduce((acc, sample) => {
                if (!acc[sample.label]) acc[sample.label] = [];
                acc[sample.label].push(sample.value);
                return acc;
            }, {}),
            summary: {
                avgFrameTime: this.samples.reduce((sum, s) => sum + s.value, 0) / this.samples.length,
                minFrameTime: Math.min(...this.samples.map(s => s.value)),
                maxFrameTime: Math.max(...this.samples.map(s => s.value)),
                sampleCount: this.samples.length
            }
        };
    }
};

// 8. Exemplo de uso do analisador
const runPerformanceTest = () => {
    PerformanceAnalyzer.startProfiling();
    
    // Simular 1000 frames
    for (let i = 0; i < 1000; i++) {
        const start = performance.now();
        
        // Simular processamento do jogo
        const mockGameState = {
            enemies: new Array(100).fill().map(() => ({ position: { x: Math.random() * 1000, y: Math.random() * 1000 } })),
            projectiles: new Array(50).fill().map(() => ({ position: { x: Math.random() * 1000, y: Math.random() * 1000 } }))
        };
        
        // Simular cálculos
        mockGameState.enemies.forEach(enemy => {
            FastMath.fastDistance(enemy.position, { x: 500, y: 500 });
        });
        
        const end = performance.now();
        PerformanceAnalyzer.addSample('frame', end - start);
    }
    
    const report = PerformanceAnalyzer.generateReport();
    console.log('Performance Test Report:', report);
    
    return report;
};

// Export do analisador
export { PerformanceAnalyzer, runPerformanceTest };