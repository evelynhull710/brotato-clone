import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private gameOverText!: Phaser.GameObjects.Text
  private restartText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'UIScene' })
    console.log('UIScene constructor called')
  }

  create() {
    console.log('UIScene create() called')
    
    // Create UI elements
    this.healthText = this.add.text(16, 16, 'Health: 100', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    })

    this.scoreText = this.add.text(16, 50, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    })

    this.gameOverText = this.add.text(400, 250, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setVisible(false)

    this.restartText = this.add.text(400, 320, 'Press R to restart', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setVisible(false)

    // Listen to game events
    const gameScene = this.scene.get('GameScene')
    gameScene.events.on('playerHealthChanged', this.updateHealth, this)
    gameScene.events.on('scoreChanged', this.updateScore, this)
    gameScene.events.on('gameOver', this.showGameOver, this)

    // Setup restart input
    this.input.keyboard!.on('keydown-R', this.restartGame, this)

    // Instructions
    this.add.text(16, 550, 'WASD/Arrow Keys: Move | Space: Shoot | Mouse: Aim', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    })
  }

  updateHealth(health: number) {
    this.healthText.setText(`Health: ${health}`)
    
    // Change color based on health
    if (health > 60) {
      this.healthText.setColor('#00ff00')
    } else if (health > 30) {
      this.healthText.setColor('#ffff00')
    } else {
      this.healthText.setColor('#ff0000')
    }
  }

  updateScore(score: number) {
    this.scoreText.setText(`Score: ${score}`)
  }

  showGameOver() {
    this.gameOverText.setVisible(true)
    this.restartText.setVisible(true)
  }

  restartGame() {
    this.gameOverText.setVisible(false)
    this.restartText.setVisible(false)
    
    // Restart the game scene
    this.scene.get('GameScene').scene.restart()
    
    // Reset UI
    this.updateHealth(100)
    this.updateScore(0)
  }
}
