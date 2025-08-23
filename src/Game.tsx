import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import UIScene from './scenes/UIScene'

const Game: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('Game useEffect running')
    console.log('Container ref:', containerRef.current)
    console.log('Game ref:', gameRef.current)
    
    if (containerRef.current && !gameRef.current) {
      console.log('Creating Phaser game...')
      
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: containerRef.current,
        backgroundColor: '#000000',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        scene: [GameScene, UIScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      }

      try {
        gameRef.current = new Phaser.Game(config)
        console.log('Phaser game created successfully:', gameRef.current)
        
        // Add event listeners to debug what's happening
        gameRef.current.events.on('ready', () => {
          console.log('Phaser game is ready')
        })
        
        gameRef.current.events.on('step', () => {
          console.log('Game step running...')
        })
        
      } catch (error) {
        console.error('Error creating Phaser game:', error)
        if (error instanceof Error) {
          console.error('Error stack:', error.stack)
        }
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '800px', height: '600px' }} />
}

export default Game
