import Phaser from 'phaser'

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private lastFired = 0
  private fireRate = 200
  private enemyHealthBars!: Phaser.GameObjects.Group

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    console.log('GameScene create() called')
    
    // Create simple graphics first
    this.createGraphics()

    // Create player
    this.player = this.physics.add.sprite(400, 300, 'player')
    this.player.setCollideWorldBounds(true)

    // Create groups
    this.enemies = this.physics.add.group()
    this.bullets = this.physics.add.group()
    this.enemyHealthBars = this.add.group()

    // Setup collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, undefined, this)

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys()

    // Create 4 enemies
    this.createEnemies()

    console.log('GameScene setup complete')
  }

  createGraphics() {
    // Create player texture (green circle)
    const playerGraphics = this.add.graphics()
    playerGraphics.fillStyle(0x00ff00)
    playerGraphics.fillCircle(16, 16, 15)
    playerGraphics.generateTexture('player', 32, 32)
    playerGraphics.destroy()

    // Create enemy texture (red circle)
    const enemyGraphics = this.add.graphics()
    enemyGraphics.fillStyle(0xff0000)
    enemyGraphics.fillCircle(12, 12, 12)
    enemyGraphics.generateTexture('enemy', 24, 24)
    enemyGraphics.destroy()

    // Create bullet texture (yellow circle)
    const bulletGraphics = this.add.graphics()
    bulletGraphics.fillStyle(0xffff00)
    bulletGraphics.fillCircle(4, 4, 4)
    bulletGraphics.generateTexture('bullet', 8, 8)
    bulletGraphics.destroy()
  }

  createEnemies() {
    const positions = [
      { x: 50, y: 50 },
      { x: 750, y: 50 },
      { x: 50, y: 550 },
      { x: 750, y: 550 }
    ]

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      console.log(`Creating enemy ${i} at (${pos.x}, ${pos.y})`)

      // Create the enemy sprite first, then use it — avoid TDZ issues
      const enemy = this.physics.add.sprite(pos.x, pos.y, 'enemy') as Phaser.Physics.Arcade.Sprite

      // Initialize health properties on the sprite instance
      ;(enemy as any).health = 100
      ;(enemy as any).maxHealth = 100
      console.log(`Enemy ${i} sprite created`) 

      // Create health bar right after the sprite exists
      console.log(`Creating health bar for enemy ${i}`)
      this.createHealthBar(enemy, i)
      console.log(`Health bar created for enemy ${i}`)

      // Add to enemies group
      this.enemies.add(enemy)
      console.log(`Enemy ${i} added to group`)
    }

    console.log(`Created ${this.enemies.children.entries.length} enemies`)
  }

  createHealthBar(enemySprite: Phaser.Physics.Arcade.Sprite, index: number) {
    try {
      const barWidth = 30
      const barHeight = 4
      
      // Background bar (red)
      const bgBar = this.add.rectangle(enemySprite.x, enemySprite.y - 20, barWidth, barHeight, 0xff0000)
const healthBar = this.add.rectangle(enemySprite.x, enemySprite.y - 20, barWidth, barHeight, 0x00ff00)
      
(enemySprite as any).healthBar = healthBar
(enemySprite as any).bgBar = bgBar
      
      this.enemyHealthBars.add(bgBar)
      this.enemyHealthBars.add(healthBar)
    } catch (error) {
      console.error('Error creating health bar:', error)
    }
  }

  update(time: number) {
    if (!this.player || !this.player.active) return

    // Player movement
    const speed = 200
    this.player.setVelocity(0, 0)

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed)
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed)
    }

    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-speed)
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(speed)
    }

    // Shooting
    if (this.cursors.space?.isDown && time > this.lastFired) {
      console.log('Shooting...')
      this.shoot()
      this.lastFired = time + this.fireRate
    }

    // Move enemies toward player
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active && this.player.active) {
        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)
        if (distance > 20) { // Don't move if too close
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
          const speed = 60
          enemy.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          )
          
          // Move health bars with enemy
          if (enemy.healthBar) {
            enemy.healthBar.x = enemy.x
            enemy.healthBar.y = enemy.y - 20
          }
          if (enemy.bgBar) {
            enemy.bgBar.x = enemy.x
            enemy.bgBar.y = enemy.y - 20
          }
        } else {
          enemy.setVelocity(0, 0)
        }
      }
    })
  }

  shoot() {
    if (!this.player) return
    
    try {
      const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet')
      if (bullet) {
        // Use mouse position for aiming, fallback to player direction if mouse not available
        let targetX = this.player.x + 100
        let targetY = this.player.y
        
        if (this.input.activePointer && this.input.activePointer.worldX !== 0) {
          targetX = this.input.activePointer.worldX
          targetY = this.input.activePointer.worldY
        }
        
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY)
        const speed = 400
        bullet.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        )
        bullet.setLifespan(2000)
      }
    } catch (error) {
      console.error('Error in shoot method:', error)
    }
  }

  bulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) {
    // Destroy the bullet
    bullet.destroy()
    
    // Reduce enemy health
    const enemyData = enemy as any
    enemyData.health -= 25 // Each bullet does 25 damage
    
    // Update health bar
    if (enemyData.healthBar) {
      const healthPercent = enemyData.health / enemyData.maxHealth
      const barWidth = 30
      enemyData.healthBar.width = barWidth * healthPercent
      
      // Change color based on health
      if (healthPercent > 0.6) {
        enemyData.healthBar.fillColor = 0x00ff00 // Green
      } else if (healthPercent > 0.3) {
        enemyData.healthBar.fillColor = 0xffff00 // Yellow
      } else {
        enemyData.healthBar.fillColor = 0xff0000 // Red
      }
    }
    
    // Check if enemy is dead
    if (enemyData.health <= 0) {
      // Remove health bars
      if (enemyData.healthBar) enemyData.healthBar.destroy()
      if (enemyData.bgBar) enemyData.bgBar.destroy()
      
      // Destroy enemy
      enemy.destroy()
      
      console.log('Enemy destroyed!')
    }
  }
}