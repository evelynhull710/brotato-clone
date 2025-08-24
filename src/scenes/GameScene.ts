import Phaser from 'phaser'

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private lastFired = 0
  private fireRate = 500
  private enemyHealthBars!: Phaser.GameObjects.Group
  private playerMaxHealth = 100
  private playerHealth = 100
  private playerBgBar!: Phaser.GameObjects.Rectangle
  private playerHealthBar!: Phaser.GameObjects.Rectangle
  private isGameOver = false
  private lastDamageTime = 0
  private damageCooldown = 500 // ms between damage ticks
  private restartKey!: Phaser.Input.Keyboard.Key
  private gameOverText?: Phaser.GameObjects.Text
  private spawnEvent?: Phaser.Time.TimerEvent
  private bulletsPerShot = 2
  private currentWaveSpeed = 0
  private currentEnemyRadius = 12

  constructor() {
    super({ key: 'GameScene' })
  }

  private onWorldBounds = (body: Phaser.Physics.Arcade.Body) => {
    const go = body.gameObject as Phaser.GameObjects.GameObject
    if (!go) return
    const isPlayerBullet = this.bullets && this.bullets.contains(go as any)
    const isEnemyBullet = this.enemyBullets && this.enemyBullets.contains(go as any)
    if (isPlayerBullet || isEnemyBullet) {
      (go as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy()
    }
  }

  create() {
    console.log('GameScene create() called')
    
    // Reset transient state on restart (scene instances are reused in Phaser)
    this.isGameOver = false
    this.playerHealth = this.playerMaxHealth
    this.lastDamageTime = 0
    this.bulletsPerShot = 2
    this.currentWaveSpeed = 0
    this.currentEnemyRadius = 12
    if (this.playerHealthBar) {
      this.playerHealthBar.width = 160
      this.playerHealthBar.fillColor = 0x00aa00
    }
    if (this.gameOverText) {
      this.gameOverText.destroy()
      this.gameOverText = undefined
    }

    // Create simple graphics first
    this.createGraphics()

    // Create Player UI health bar (fixed on screen)
    this.createPlayerHealthBar()

    // Create player
    this.player = this.physics.add.sprite(400, 300, 'player')
    this.player.setCollideWorldBounds(true)

    // Create groups
    this.enemies = this.physics.add.group()
    this.bullets = this.physics.add.group()
    this.enemyBullets = this.physics.add.group()

    // Auto-destroy bullets when they hit world bounds (fallback cleanup)
    this.physics.world.off('worldbounds', this.onWorldBounds, this)
    this.physics.world.on('worldbounds', this.onWorldBounds, this)

    this.enemyHealthBars = this.add.group()

    // Prevent enemies from overlapping each other (separate on collision)
    this.physics.add.collider(this.enemies, this.enemies)

    // Setup collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, undefined, this)
    // Player takes damage on enemy overlap
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemyOverlap, undefined, this)
    this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, undefined, this)

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    // Create 10 enemies
    this.createEnemies()

    // Spawn 10 new enemies every 10 seconds from map borders
    if (this.spawnEvent) {
      this.spawnEvent.remove(false)
      this.spawnEvent = undefined
    }
    this.spawnEvent = this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => this.spawnEnemiesFromBorders(10)
    })

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

    // Create enemy bullet texture (orange circle)
    const ebulletGraphics = this.add.graphics()
    ebulletGraphics.fillStyle(0xff8800)
    ebulletGraphics.fillCircle(4, 4, 4)
    ebulletGraphics.generateTexture('enemyBullet', 8, 8)
    ebulletGraphics.destroy()
  }

  // Keep the enemy's visual size in sync with its collision radius
  private applyEnemySize(enemy: Phaser.Physics.Arcade.Sprite) {
    // Collision circle uses the current radius
    enemy.setCircle(this.currentEnemyRadius)
    // Visual scale: enemy texture is 24x24 (radius 12), so scale = currentRadius / 12
    const scale = this.currentEnemyRadius / 12
    enemy.setScale(scale)
  }

  createEnemies() {
    const positions = [
      { x: 50, y: 50 },
      { x: 750, y: 50 },
      { x: 50, y: 550 },
      { x: 750, y: 550 },
      { x: 400, y: 50 },
      { x: 400, y: 550 },
      { x: 50, y: 300 },
      { x: 750, y: 300 },
      { x: 200, y: 150 },
      { x: 600, y: 450 }
    ]

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      console.log(`Creating enemy ${i} at (${pos.x}, ${pos.y})`)

      // Create the enemy sprite first, then use it — avoid TDZ issues
      const enemy = this.physics.add.sprite(pos.x, pos.y, 'enemy') as Phaser.Physics.Arcade.Sprite

      // Give circular bodies and mild bounce so they separate on contact
      this.applyEnemySize(enemy)
      enemy.setBounce(0.2, 0.2)
      enemy.setCollideWorldBounds(true)

      // Initialize health properties on the sprite instance
      ;(enemy as any).health = 100
      ;(enemy as any).maxHealth = 100
      ;(enemy as any).nextShotAt = this.time.now + Phaser.Math.Between(800, 2500)
      console.log(`Enemy ${i} sprite created`) 

      // Per-enemy speed bonus: initial batch gets none
      ;(enemy as any).extraSpeed = 0

      // Create health bar right after the sprite exists
      console.log(`Creating health bar for enemy ${i}`)
      this.createHealthBar(enemy, i)
      console.log(`Health bar created for enemy ${i}`)

      // Add to enemies group
      this.enemies.add(enemy)
      console.log(`Enemy ${i} added to group`)
    }

    // Extra 10 fast enemies
    const fastPositions = [
      { x: 100, y: 100 },
      { x: 700, y: 100 },
      { x: 100, y: 500 },
      { x: 700, y: 500 },
      { x: 200, y: 50 },
      { x: 600, y: 50 },
      { x: 200, y: 550 },
      { x: 600, y: 550 },
      { x: 400, y: 150 },
      { x: 400, y: 450 }
    ]
    for (let i = 0; i < fastPositions.length; i++) {
      const pos = fastPositions[i]
      const enemy = this.physics.add.sprite(pos.x, pos.y, 'enemy') as Phaser.Physics.Arcade.Sprite
      this.applyEnemySize(enemy)
      enemy.setBounce(0.2, 0.2)
      enemy.setCollideWorldBounds(true)
      ;(enemy as any).health = 100
      ;(enemy as any).maxHealth = 100
      ;(enemy as any).nextShotAt = this.time.now + Phaser.Math.Between(800, 2500)
      ;(enemy as any).isFast = true
      // Per-enemy speed bonus: initial batch gets none
      ;(enemy as any).extraSpeed = 0
      this.createHealthBar(enemy, i + positions.length)
      this.enemies.add(enemy)
    }

    console.log(`Created ${this.enemies.children.entries.length} enemies`)
  }

  private spawnEnemiesFromBorders(count: number) {
    const worldW = this.physics.world.bounds.width || this.scale.width
    const worldH = this.physics.world.bounds.height || this.scale.height
    const margin = 12 // keep bodies fully inside bounds
    // Increase base wave speed for newly spawned enemies (adds +40 px/s each wave)
    this.currentWaveSpeed += 40
    this.currentEnemyRadius += 4

    for (let i = 0; i < count; i++) {
      // 0: top, 1: bottom, 2: left, 3: right
      const side = Phaser.Math.Between(0, 3)
      let x = 0
      let y = 0

      if (side === 0) {
        x = Phaser.Math.Between(margin, worldW - margin)
        y = margin
      } else if (side === 1) {
        x = Phaser.Math.Between(margin, worldW - margin)
        y = worldH - margin
      } else if (side === 2) {
        x = margin
        y = Phaser.Math.Between(margin, worldH - margin)
      } else {
        x = worldW - margin
        y = Phaser.Math.Between(margin, worldH - margin)
      }

      const enemy = this.physics.add.sprite(x, y, 'enemy') as Phaser.Physics.Arcade.Sprite
      // Match physics properties to existing enemies so collisions work the same
      this.applyEnemySize(enemy)
      enemy.setBounce(0.2, 0.2)
      enemy.setCollideWorldBounds(true)

      ;(enemy as any).health = 100
      ;(enemy as any).maxHealth = 100
      ;(enemy as any).nextShotAt = this.time.now + Phaser.Math.Between(800, 2500)
      // Set per-enemy speed bonus for newly spawned enemies
      ;(enemy as any).extraSpeed = this.currentWaveSpeed

      this.createHealthBar(enemy, this.enemies.children.entries.length)
      this.enemies.add(enemy)
    }

    this.bulletsPerShot += 1
    console.log(`Spawned ${count} enemies from borders. Total: ${this.enemies.children.entries.length}`)
  }

  private enemyShoot(shooter: Phaser.Physics.Arcade.Sprite) {
    if (!shooter.active || this.isGameOver) return

    const projectileSpeed = 200 // half the previous enemy bullet speed
    // Pick a random direction (0..2π) independent of player position
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)

    const b = this.enemyBullets.create(shooter.x, shooter.y, 'enemyBullet') as Phaser.Physics.Arcade.Sprite
    if (!b) return

    b.setCollideWorldBounds(true)
    ;(b.body as Phaser.Physics.Arcade.Body).onWorldBounds = true
    b.setRotation(angle)
    b.setVelocity(Math.cos(angle) * projectileSpeed, Math.sin(angle) * projectileSpeed)

    this.time.delayedCall(3000, () => { if (b && b.active) b.destroy() })
  }

  private enemyBulletHitPlayer = (
    objA: Phaser.Physics.Arcade.Sprite,
    objB: Phaser.Physics.Arcade.Sprite
  ) => {
    // Identify which argument is an enemy bullet via group membership
    const aIsBullet = !!(this.enemyBullets && this.enemyBullets.contains(objA as any))
    const bIsBullet = !!(this.enemyBullets && this.enemyBullets.contains(objB as any))

    const bullet = (aIsBullet ? objA : bIsBullet ? objB : undefined) as Phaser.Physics.Arcade.Sprite | undefined
    const player = (aIsBullet ? objB : objA) as Phaser.Physics.Arcade.Sprite

    // Destroy only the bullet (never the player)
    if (bullet && bullet.active) bullet.destroy()

    // Safety: if target isn't valid, bail
    if (!player || !player.active) return

    // Apply damage with existing cooldown gating
    const now = this.time.now
    if (this.isGameOver) return
    if (now - this.lastDamageTime < this.damageCooldown) return

    this.lastDamageTime = now
    this.playerHealth = Math.max(0, this.playerHealth - 10)
    this.updatePlayerHealthBar()

    if (this.playerHealth <= 0) {
      this.triggerGameOver()
    }
  }

  private createPlayerHealthBar() {
    const barWidth = 160
    const barHeight = 12
    const margin = 12
    const x = margin + barWidth / 2
    const y = margin + barHeight / 2

    this.playerBgBar = this.add.existing(
      new Phaser.GameObjects.Rectangle(this, x, y, barWidth, barHeight, 0x771111)
    ) as Phaser.GameObjects.Rectangle
    this.playerHealthBar = this.add.existing(
      new Phaser.GameObjects.Rectangle(this, x, y, barWidth, barHeight, 0x00aa00)
    ) as Phaser.GameObjects.Rectangle

    this.playerBgBar.setStrokeStyle(2, 0x222222)
    this.playerBgBar.setDepth(100)
    this.playerHealthBar.setDepth(101)
    this.playerBgBar.setScrollFactor(0)
    this.playerHealthBar.setScrollFactor(0)
  }

  private updatePlayerHealthBar() {
    const pct = Phaser.Math.Clamp(this.playerHealth / this.playerMaxHealth, 0, 1)
    const fullWidth = 160
    this.playerHealthBar.width = fullWidth * pct

    // Color shift: green > yellow > red
    if (pct > 0.6) {
      this.playerHealthBar.fillColor = 0x00aa00
    } else if (pct > 0.3) {
      this.playerHealthBar.fillColor = 0xdddd00
    } else {
      this.playerHealthBar.fillColor = 0xaa0000
    }
  }

  private onPlayerEnemyOverlap = (_player: Phaser.GameObjects.GameObject, _enemy: Phaser.GameObjects.GameObject) => {
    const now = this.time.now
    if (this.isGameOver) return
    if (now - this.lastDamageTime < this.damageCooldown) return

    this.lastDamageTime = now
    this.playerHealth = Math.max(0, this.playerHealth - 10)
    this.updatePlayerHealthBar()

    if (this.playerHealth <= 0) {
      this.triggerGameOver()
    }
  }

  createHealthBar(enemySprite: Phaser.Physics.Arcade.Sprite, index: number) {
    try {
      const barWidth = 30
      const barHeight = 4
      
      // Background bar (red)
      const bgBar = this.add.existing(
        new Phaser.GameObjects.Rectangle(this, enemySprite.x, enemySprite.y - 20, barWidth, barHeight, 0xff0000)
      ) as Phaser.GameObjects.Rectangle;
      const healthBar = this.add.existing(
        new Phaser.GameObjects.Rectangle(this, enemySprite.x, enemySprite.y - 20, barWidth, barHeight, 0x00ff00)
      ) as Phaser.GameObjects.Rectangle;
      
      ;(enemySprite as any).healthBar = healthBar
      ;(enemySprite as any).bgBar = bgBar
      
      this.enemyHealthBars.add(bgBar)
      this.enemyHealthBars.add(healthBar)

      bgBar.setDepth(10)
      healthBar.setDepth(11)
    } catch (error) {
      console.error('Error creating health bar:', error)
    }
  }

  private triggerWin() {
    if (this.isGameOver) return
    this.isGameOver = true
    if (this.spawnEvent) {
      this.spawnEvent.remove(false)
      this.spawnEvent = undefined
    }
    this.player.setVelocity(0, 0)
    this.enemies.children.iterate((e: any) => {
      if (e?.body) e.body.stop?.()
      return true
    })
    const cx = this.cameras.main.centerX
    const cy = this.cameras.main.centerY
    this.gameOverText = this.add.text(cx, cy, 'YOU WIN\nPress R to Restart', {
      fontSize: '32px',
      color: '#44ff44',
      align: 'center'
    })
    this.gameOverText.setOrigin(0.5)
    this.gameOverText.setDepth(200)
    this.gameOverText.setScrollFactor(0)
    this.input.once('pointerdown', () => this.scene.restart())
  }

  private triggerGameOver() {
    if (this.isGameOver) return
    this.isGameOver = true
    if (this.spawnEvent) {
      this.spawnEvent.remove(false)
      this.spawnEvent = undefined
    }

    // Stop player/enemy movement
    this.player.setVelocity(0, 0)
    this.enemies.children.iterate((e: any) => {
      if (e?.body) e.body.stop?.()
      return true
    })

    const cx = this.cameras.main.centerX
    const cy = this.cameras.main.centerY
    this.gameOverText = this.add.text(cx, cy, 'GAME OVER\nPress R to Restart', {
      fontSize: '32px',
      color: '#ff4444',
      align: 'center'
    })
    this.gameOverText.setOrigin(0.5)
    this.gameOverText.setDepth(200)
    this.gameOverText.setScrollFactor(0)

    // Also allow mouse click/tap to restart
    this.input.once('pointerdown', () => this.scene.restart())
  }

  // Compute a lead angle to intercept a moving target with a constant-speed projectile.
  // Returns undefined if no valid interception time exists (falls back to direct aim).
  private getLeadAngle(
    shooterX: number,
    shooterY: number,
    target: Phaser.Physics.Arcade.Sprite,
    projectileSpeed: number
  ): number | undefined {
    const body = target.body as Phaser.Physics.Arcade.Body
    const tx = target.x
    const ty = target.y
    const vx = body?.velocity?.x ?? 0
    const vy = body?.velocity?.y ?? 0
    const rx = tx - shooterX
    const ry = ty - shooterY
    const vv = vx * vx + vy * vy
    const ss = projectileSpeed * projectileSpeed
    const rv = rx * vx + ry * vy
    const rr = rx * rx + ry * ry
    // Quadratic: (vv - ss) t^2 + 2*rv t + rr = 0
    const a = vv - ss
    const b = 2 * rv
    const c = rr
    let t: number | undefined
    if (Math.abs(a) < 1e-6) {
      // Linear: 2*rv t + rr = 0
      if (Math.abs(b) > 1e-6) {
        const tlin = -c / b
        if (tlin > 0) t = tlin
      }
    } else {
      const disc = b * b - 4 * a * c
      if (disc >= 0) {
        const sqrt = Math.sqrt(disc)
        const t1 = (-b - sqrt) / (2 * a)
        const t2 = (-b + sqrt) / (2 * a)
        // We need the smallest positive time
        const candidates = [t1, t2].filter((tt) => tt > 0)
        if (candidates.length) t = Math.min(...candidates)
      }
    }
    if (t === undefined) return undefined
    const aimX = tx + vx * t
    const aimY = ty + vy * t
    return Phaser.Math.Angle.Between(shooterX, shooterY, aimX, aimY)
  }

  update(time: number) {
    if (!this.player || !this.player.active) return
    if (this.isGameOver) {
      // Allow quick restart with R
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.scene.restart()
      }
      return
    }

    // Player movement
    const speed = 300
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

    // Automatic shooting
    if (time > this.lastFired) {
      this.shoot()
      this.lastFired = time + this.fireRate
    }

    // Optional: brief red flash on damage (visual cue)
    if (this.time.now - this.lastDamageTime < 100) {
      this.player.setTint(0xff6666)
    } else {
      this.player.clearTint()
    }

    // Move enemies toward player
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active && this.player.active) {
        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)
        if (distance > 20) { // Don't move if too close
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
          const baseSpeed = 60
          let speed = baseSpeed * 1.5 // default enemies
          if ((enemy as any).isFast) {
            speed = baseSpeed * 2.25 // fast enemies
          }
          // Apply per-enemy extra speed (set at spawn time)
          speed += (enemy as any).extraSpeed ?? 0
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
          // Enemy random shooting using same pattern as player
          if (time >= (enemy as any).nextShotAt) {
            this.enemyShoot(enemy as Phaser.Physics.Arcade.Sprite)
            ;(enemy as any).nextShotAt = time + Phaser.Math.Between(1200, 3500)
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
      // Aim at nearest active enemy with predictive lead; fallback to pointer; else forward
      let targetX = this.player.x + 100
      let targetY = this.player.y
      let angle: number | undefined
      const projectileSpeed = 400
      let nearest: Phaser.Physics.Arcade.Sprite | null = null
      let nearestDist = Number.POSITIVE_INFINITY
      this.enemies.children.iterate((e: any) => {
        if (e && e.active) {
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y)
          if (d < nearestDist) {
            nearestDist = d
            nearest = e as Phaser.Physics.Arcade.Sprite
          }
        }
        return true
      })
      if (nearest) {
        // Try predictive lead first
        angle = this.getLeadAngle(this.player.x, this.player.y, nearest, projectileSpeed)
        if (angle === undefined) {
          // Fallback to direct angle if no valid interception time
          angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y)
        }
      } else if (this.input.activePointer) {
        targetX = this.input.activePointer.worldX
        targetY = this.input.activePointer.worldY
        angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY)
      } else {
        angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY)
      }
      // Fire multiple bullets according to bulletsPerShot (increases each spawn wave)
      const n = Math.max(1, this.bulletsPerShot)
      const spreadDeg = 6
      const totalSpread = spreadDeg * (n - 1)
      const speed = projectileSpeed
      for (let i = 0; i < n; i++) {
        const offsetDeg = -totalSpread / 2 + i * spreadDeg
        const shotAngle = (angle as number) + Phaser.Math.DegToRad(offsetDeg)

        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet') as Phaser.Physics.Arcade.Sprite
        if (!bullet) continue

        bullet.setCollideWorldBounds(true)
        ;(bullet.body as Phaser.Physics.Arcade.Body).onWorldBounds = true
        bullet.setRotation(shotAngle)
        bullet.setVelocity(Math.cos(shotAngle) * speed, Math.sin(shotAngle) * speed)

        this.time.delayedCall(2000, () => {
          if (bullet && bullet.active) bullet.destroy()
        })
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
      // Win condition: if no active enemies remain
      if (this.enemies.countActive(true) === 0) {
        this.triggerWin()
      }
    }
  }
}