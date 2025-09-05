class WaterTracker {
  constructor() {
    this.data = this.loadData()
    this.settings = this.loadSettings()
    this.achievements = this.initializeAchievements()
    this.init()
  }

  init() {
    this.bindEvents()
    this.updateUI()
    this.updateAnalytics()
    this.updateAchievements()
    this.checkReminders()
  }

  loadData() {
    const saved = localStorage.getItem("waterTrackerData")
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      dailyRecords: {},
      totalGlasses: 0,
      longestStreak: 0,
      currentStreak: 0,
    }
  }

  loadSettings() {
    const saved = localStorage.getItem("waterTrackerSettings")
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      dailyGoal: 8,
      glassSize: 250,
      remindersEnabled: false,
    }
  }

  saveData() {
    localStorage.setItem("waterTrackerData", JSON.stringify(this.data))
  }

  saveSettings() {
    localStorage.setItem("waterTrackerSettings", JSON.stringify(this.settings))
  }

  getTodayKey() {
    return new Date().toISOString().split("T")[0]
  }

  getTodayData() {
    const today = this.getTodayKey()
    if (!this.data.dailyRecords[today]) {
      this.data.dailyRecords[today] = {
        glasses: 0,
        timeline: [],
        goalAchieved: false,
      }
    }
    return this.data.dailyRecords[today]
  }

  addGlass(amount = 1) {
    const todayData = this.getTodayData()
    const previousGlasses = todayData.glasses

    todayData.glasses += amount
    todayData.timeline.push({
      timestamp: new Date().toISOString(),
      amount: amount,
    })

    this.data.totalGlasses += amount

    // Check for goal achievement
    if (!todayData.goalAchieved && todayData.glasses >= this.settings.dailyGoal) {
      todayData.goalAchieved = true
      this.updateStreak()
    }

    this.saveData()
    this.updateUI()
    this.checkMilestones(previousGlasses, todayData.glasses)
    this.updateAchievements()
  }

  removeGlass() {
    const todayData = this.getTodayData()
    if (todayData.glasses > 0) {
      todayData.glasses -= 1
      this.data.totalGlasses -= 1

      // Remove from timeline
      if (todayData.timeline.length > 0) {
        todayData.timeline.pop()
      }

      // Check if goal is no longer achieved
      if (todayData.glasses < this.settings.dailyGoal) {
        todayData.goalAchieved = false
      }

      this.saveData()
      this.updateUI()
      this.updateAchievements()
    }
  }

  resetDay() {
    if (confirm("Are you sure you want to reset today's progress?")) {
      const todayData = this.getTodayData()
      this.data.totalGlasses -= todayData.glasses
      todayData.glasses = 0
      todayData.timeline = []
      todayData.goalAchieved = false

      this.saveData()
      this.updateUI()
      this.updateAchievements()
    }
  }

  updateStreak() {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayKey = this.getTodayKey()
    const yesterdayKey = yesterday.toISOString().split("T")[0]

    const todayData = this.data.dailyRecords[todayKey]
    const yesterdayData = this.data.dailyRecords[yesterdayKey]

    if (todayData && todayData.goalAchieved) {
      if (yesterdayData && yesterdayData.goalAchieved) {
        this.data.currentStreak += 1
      } else {
        this.data.currentStreak = 1
      }

      if (this.data.currentStreak > this.data.longestStreak) {
        this.data.longestStreak = this.data.currentStreak
      }
    }
  }

  getProgress() {
    const todayData = this.getTodayData()
    return Math.min((todayData.glasses / this.settings.dailyGoal) * 100, 100)
  }

  checkMilestones(previousGlasses, currentGlasses) {
    const milestones = [
      {
        percentage: 25,
        message: "Great start! Keep the momentum! 💧",
        icon: "fas fa-bolt",
        color: "linear-gradient(135deg, #f59e0b, #d97706)",
      },
      {
        percentage: 50,
        message: "Halfway champion! You're crushing it! 🌊",
        icon: "fas fa-bullseye",
        color: "linear-gradient(135deg, #3b82f6, #06b6d4)",
      },
      {
        percentage: 75,
        message: "Almost there! Final push! 💪",
        icon: "fas fa-tint",
        color: "linear-gradient(135deg, #9333ea, #ec4899)",
      },
      {
        percentage: 100,
        message: "GOAL SMASHED! Hydration hero! 🏆",
        icon: "fas fa-trophy",
        color: "linear-gradient(135deg, #10b981, #059669)",
      },
    ]

    const previousProgress = (previousGlasses / this.settings.dailyGoal) * 100
    const currentProgress = (currentGlasses / this.settings.dailyGoal) * 100

    for (const milestone of milestones) {
      if (currentProgress >= milestone.percentage && previousProgress < milestone.percentage) {
        this.showCelebration(milestone)
        break
      }
    }
  }

  showCelebration(milestone) {
    const modal = document.getElementById("celebration-modal")
    const icon = document.getElementById("celebration-icon")
    const title = document.getElementById("celebration-title")
    const message = document.getElementById("celebration-message")
    const extra = document.getElementById("celebration-extra")

    icon.innerHTML = `<i class="${milestone.icon}"></i>`
    icon.style.background = milestone.color

    if (milestone.percentage === 100) {
      title.textContent = "🎉 GOAL ACHIEVED! 🎉"
      extra.innerHTML = `Streak: ${this.data.currentStreak} days! Keep it up! 🔥`
      extra.style.display = "block"
    } else {
      title.textContent = "🌟 Milestone Reached! 🌟"
      extra.style.display = "none"
    }

    message.textContent = milestone.message

    modal.classList.add("show")

    setTimeout(() => {
      modal.classList.remove("show")
    }, 4000)
  }

  updateUI() {
    const todayData = this.getTodayData()
    const progress = this.getProgress()

    // Update stats
    document.getElementById("glasses-today").textContent = todayData.glasses
    document.getElementById("current-streak").textContent = this.data.currentStreak
    document.getElementById("goal-progress").textContent = Math.round(progress) + "%"

    // Update bottle visualization
    document.getElementById("water-fill").style.height = Math.min(progress, 100) + "%"
    document.getElementById("current-glasses").textContent = todayData.glasses
    document.getElementById("daily-goal").textContent = this.settings.dailyGoal
    document.getElementById("glass-size-display").textContent = this.settings.glassSize

    // Update progress ring
    const circumference = 2 * Math.PI * 45
    const offset = circumference - (progress / 100) * circumference
    document.getElementById("progress-ring").style.strokeDashoffset = offset

    // Update progress bar
    document.getElementById("progress-fill").style.width = Math.min(progress, 100) + "%"

    // Update badges
    document.getElementById("progress-badge").textContent = Math.round(progress) + "% Complete"
    document.getElementById("total-ml-badge").textContent = todayData.glasses * this.settings.glassSize + "ml Total"

    // Update glass number display
    document.getElementById("glass-number").textContent = todayData.glasses

    // Update control buttons
    document.getElementById("remove-glass").disabled = todayData.glasses === 0
    document.getElementById("add-glass").disabled = todayData.glasses >= this.settings.dailyGoal + 5

    // Update motivation card
    this.updateMotivationCard(progress)

    // Update timeline
    this.updateTimeline(todayData.timeline)

    // Update measurement labels
    for (let i = 1; i <= 4; i++) {
      const glasses = Math.round(i * 0.25 * this.settings.dailyGoal)
      document.getElementById(`measure-${i * 25}`).textContent = glasses
    }

    // Update bubbles
    this.updateBubbles(progress)
  }

  updateMotivationCard(progress) {
    const card = document.getElementById("motivation-card")
    const icon = document.getElementById("motivation-icon")
    const message = document.getElementById("motivation-message")
    const sub = document.getElementById("motivation-sub")

    let milestone, iconClass, gradient

    if (progress === 0) {
      milestone = { message: "Ready to start your hydration journey?", icon: "fas fa-bolt" }
      gradient = "linear-gradient(135deg, #f59e0b, #d97706)"
    } else if (progress >= 100) {
      milestone = { message: "GOAL SMASHED! Hydration hero! 🏆", icon: "fas fa-trophy" }
      gradient = "linear-gradient(135deg, #10b981, #059669)"
      sub.textContent = "🎉 Goal achieved! Keep going for bonus hydration!"
    } else if (progress >= 75) {
      milestone = { message: "Almost there! Final push! 💪", icon: "fas fa-tint" }
      gradient = "linear-gradient(135deg, #9333ea, #ec4899)"
      sub.textContent = `${this.settings.dailyGoal - this.getTodayData().glasses} more glasses to reach your goal!`
    } else if (progress >= 50) {
      milestone = { message: "Halfway champion! You're crushing it! 🌊", icon: "fas fa-bullseye" }
      gradient = "linear-gradient(135deg, #3b82f6, #06b6d4)"
      sub.textContent = `${this.settings.dailyGoal - this.getTodayData().glasses} more glasses to reach your goal!`
    } else {
      milestone = { message: "Great start! Keep the momentum! 💧", icon: "fas fa-bolt" }
      gradient = "linear-gradient(135deg, #f59e0b, #d97706)"
      sub.textContent = `${this.settings.dailyGoal - this.getTodayData().glasses} more glasses to reach your goal!`
    }

    icon.innerHTML = `<i class="${milestone.icon}"></i>`
    message.textContent = milestone.message
    card.style.background = gradient
  }

  updateTimeline(timeline) {
    const timelineCard = document.getElementById("timeline-card")
    const timelineContainer = document.getElementById("timeline")

    if (timeline.length === 0) {
      timelineCard.style.display = "none"
      return
    }

    timelineCard.style.display = "block"
    timelineContainer.innerHTML = ""

    const recentEntries = timeline.slice(-5).reverse()

    recentEntries.forEach((entry) => {
      const div = document.createElement("div")
      div.className = "timeline-entry"

      const time = new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })

      div.innerHTML = `
                <span class="timeline-time">${time}</span>
                <div class="timeline-action">
                    <i class="fas fa-tint"></i>
                    <span>+${entry.amount} glass${entry.amount !== 1 ? "es" : ""}</span>
                </div>
            `

      timelineContainer.appendChild(div)
    })
  }

  updateBubbles(progress) {
    const bubblesContainer = document.getElementById("bubbles")
    bubblesContainer.innerHTML = ""

    if (progress > 0) {
      const bubbleCount = Math.min(Math.floor(progress / 10), 6)

      for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement("div")
        bubble.className = "bubble"
        bubble.style.width = `${Math.random() * 8 + 4}px`
        bubble.style.height = bubble.style.width
        bubble.style.top = `${Math.random() * 80 + 10}%`
        bubble.style.left = `${Math.random() * 80 + 10}%`
        bubble.style.animationDelay = `${i * 0.3}s`
        bubble.style.animationDuration = `${2 + Math.random()}s`

        bubblesContainer.appendChild(bubble)
      }
    }
  }

  updateAnalytics() {
    const stats = this.getStats()

    // Update analytics stats
    document.getElementById("avg-daily").textContent = stats.averageDaily.toFixed(1)
    document.getElementById("goals-achieved").textContent = stats.goalsAchieved
    document.getElementById("analytics-streak").textContent = stats.currentStreak
    document.getElementById("total-glasses").textContent = stats.totalGlasses

    // Update weekly view
    this.updateWeeklyView()

    // Update monthly view
    this.updateMonthlyView()

    // Update insights
    this.updateInsights(stats)
  }

  getStats() {
    const records = Object.values(this.data.dailyRecords)
    const goalsAchieved = records.filter((r) => r.goalAchieved).length
    const totalDays = records.length
    const averageDaily = totalDays > 0 ? records.reduce((sum, r) => sum + r.glasses, 0) / totalDays : 0

    // Find best day
    const bestDayRecord = records.reduce(
      (best, current) => (current.glasses > (best?.glasses || 0) ? current : best),
      null,
    )

    const bestDay = bestDayRecord
      ? Object.keys(this.data.dailyRecords).find((key) => this.data.dailyRecords[key] === bestDayRecord)
      : null

    const successRate = totalDays > 0 ? (goalsAchieved / totalDays) * 100 : 0

    return {
      averageDaily,
      goalsAchieved,
      currentStreak: this.data.currentStreak,
      longestStreak: this.data.longestStreak,
      totalGlasses: this.data.totalGlasses,
      bestDay: bestDay ? new Date(bestDay).toLocaleDateString() : "No data yet",
      successRate,
      weeklyGoalsHit: this.getWeeklyGoalsHit(),
      monthlyGoalsHit: this.getMonthlyGoalsHit(),
    }
  }

  getWeeklyGoalsHit() {
    const today = new Date()
    let count = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split("T")[0]

      if (this.data.dailyRecords[key]?.goalAchieved) {
        count++
      }
    }

    return count
  }

  getMonthlyGoalsHit() {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    let count = 0

    Object.keys(this.data.dailyRecords).forEach((key) => {
      const date = new Date(key)
      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        this.data.dailyRecords[key].goalAchieved
      ) {
        count++
      }
    })

    return count
  }

  updateWeeklyView() {
    const weekGrid = document.getElementById("week-grid")
    weekGrid.innerHTML = ""

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const key = date.toISOString().split("T")[0]
      const dayData = this.data.dailyRecords[key]
      const glasses = dayData?.glasses || 0
      const progress = Math.min((glasses / this.settings.dailyGoal) * 100, 100)
      const isToday = key === this.getTodayKey()

      const dayDiv = document.createElement("div")
      dayDiv.className = `week-day ${isToday ? "today" : ""}`

      dayDiv.innerHTML = `
                <div class="week-day-name">${date.toLocaleDateString("en", { weekday: "short" })}</div>
                <div class="week-day-date">${date.getDate()}</div>
                <div class="week-day-glasses">${glasses}</div>
                <div class="week-day-progress">
                    <div class="week-day-progress-fill" style="width: ${progress}%"></div>
                </div>
                ${progress >= 100 ? '<div class="week-day-check">✓</div>' : ""}
            `

      weekGrid.appendChild(dayDiv)
    }
  }

  updateMonthlyView() {
    const monthGrid = document.getElementById("month-grid")
    monthGrid.innerHTML = ""

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    // Get first day of month and calculate start of calendar
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const key = date.toISOString().split("T")[0]
      const dayData = this.data.dailyRecords[key]
      const glasses = dayData?.glasses || 0
      const progress = Math.min((glasses / this.settings.dailyGoal) * 100, 100)
      const isToday = key === this.getTodayKey()
      const isCurrentMonth = date.getMonth() === month

      let className = "month-day"
      if (!isCurrentMonth) className += " other-month"
      if (isToday) className += " today"
      if (isCurrentMonth && progress >= 100) className += " complete"
      else if (isCurrentMonth && progress >= 50) className += " half"
      else if (isCurrentMonth && progress > 0) className += " started"

      const dayDiv = document.createElement("div")
      dayDiv.className = className

      dayDiv.innerHTML = `
                <div class="month-day-number">${date.getDate()}</div>
                ${
                  isCurrentMonth && glasses > 0
                    ? `<div class="month-day-indicator">${progress >= 100 ? "✓" : glasses}</div>`
                    : ""
                }
            `

      monthGrid.appendChild(dayDiv)
    }
  }

  updateInsights(stats) {
    const insightsList = document.getElementById("insights-list")
    insightsList.innerHTML = `
            <p>• Best day: ${stats.bestDay}</p>
            <p>• Longest streak: ${stats.longestStreak} days</p>
            <p>• Success rate: ${stats.successRate.toFixed(1)}%</p>
            <p>• Total hydration: ${((stats.totalGlasses * this.settings.glassSize) / 1000).toFixed(1)}L</p>
        `

    const goalsProgress = document.getElementById("goals-progress")
    const weeklyProgress = (stats.weeklyGoalsHit / 7) * 100
    const monthlyProgress = (stats.monthlyGoalsHit / new Date().getDate()) * 100

    goalsProgress.innerHTML = `
            <div class="goal-item">
                <div class="goal-header">
                    <span>Weekly Goal</span>
                    <span>${stats.weeklyGoalsHit}/7</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${weeklyProgress}%"></div>
                </div>
            </div>
            <div class="goal-item">
                <div class="goal-header">
                    <span>Monthly Goal</span>
                    <span>${stats.monthlyGoalsHit}/${new Date().getDate()}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${monthlyProgress}%"></div>
                </div>
            </div>
        `
  }

  initializeAchievements() {
    const achievements = [
      // Consistency achievements
      {
        id: "first_glass",
        title: "First Drop",
        description: "Log your first glass of water",
        category: "consistency",
        icon: "fas fa-tint",
        target: 1,
        type: "glasses",
      },
      {
        id: "daily_goal",
        title: "Goal Getter",
        description: "Reach your daily goal",
        category: "consistency",
        icon: "fas fa-bullseye",
        target: 1,
        type: "daily_goals",
      },
      {
        id: "streak_3",
        title: "Consistency King",
        description: "Maintain a 3-day streak",
        category: "consistency",
        icon: "fas fa-fire",
        target: 3,
        type: "streak",
      },
      {
        id: "streak_7",
        title: "Week Warrior",
        description: "Maintain a 7-day streak",
        category: "consistency",
        icon: "fas fa-calendar-week",
        target: 7,
        type: "streak",
      },
      {
        id: "streak_30",
        title: "Month Master",
        description: "Maintain a 30-day streak",
        category: "consistency",
        icon: "fas fa-calendar",
        target: 30,
        type: "streak",
      },

      // Volume achievements
      {
        id: "glasses_50",
        title: "Half Century",
        description: "Log 50 total glasses",
        category: "volume",
        icon: "fas fa-tint",
        target: 50,
        type: "total_glasses",
      },
      {
        id: "glasses_100",
        title: "Century Club",
        description: "Log 100 total glasses",
        category: "volume",
        icon: "fas fa-trophy",
        target: 100,
        type: "total_glasses",
      },
      {
        id: "glasses_500",
        title: "Hydration Hero",
        description: "Log 500 total glasses",
        category: "volume",
        icon: "fas fa-medal",
        target: 500,
        type: "total_glasses",
      },
      {
        id: "glasses_1000",
        title: "Aqua Legend",
        description: "Log 1000 total glasses",
        category: "volume",
        icon: "fas fa-crown",
        target: 1000,
        type: "total_glasses",
      },

      // Milestone achievements
      {
        id: "overachiever",
        title: "Overachiever",
        description: "Exceed your daily goal by 50%",
        category: "milestones",
        icon: "fas fa-star",
        target: 1.5,
        type: "daily_multiplier",
      },
      {
        id: "perfect_week",
        title: "Perfect Week",
        description: "Hit your goal every day for a week",
        category: "milestones",
        icon: "fas fa-gem",
        target: 7,
        type: "perfect_streak",
      },
      {
        id: "early_bird",
        title: "Early Bird",
        description: "Log water before 8 AM",
        category: "milestones",
        icon: "fas fa-sun",
        target: 1,
        type: "early_log",
      },

      // Special achievements
      {
        id: "night_owl",
        title: "Night Owl",
        description: "Log water after 10 PM",
        category: "special",
        icon: "fas fa-moon",
        target: 1,
        type: "late_log",
      },
      {
        id: "weekend_warrior",
        title: "Weekend Warrior",
        description: "Hit your goal on both weekend days",
        category: "special",
        icon: "fas fa-calendar-weekend",
        target: 1,
        type: "weekend_goals",
      },
    ]

    // Load saved achievement progress
    const saved = localStorage.getItem("waterTrackerAchievements")
    if (saved) {
      const savedAchievements = JSON.parse(saved)
      return achievements.map((achievement) => {
        const savedAchievement = savedAchievements.find((s) => s.id === achievement.id)
        return savedAchievement || { ...achievement, unlocked: false, progress: 0, current: 0 }
      })
    }

    return achievements.map((achievement) => ({
      ...achievement,
      unlocked: false,
      progress: 0,
      current: 0,
    }))
  }

  updateAchievements() {
    const stats = this.getStats()
    const todayData = this.getTodayData()

    this.achievements.forEach((achievement) => {
      if (achievement.unlocked) return

      let current = 0

      switch (achievement.type) {
        case "glasses":
          current = todayData.glasses
          break
        case "daily_goals":
          current = todayData.goalAchieved ? 1 : 0
          break
        case "streak":
          current = this.data.currentStreak
          break
        case "total_glasses":
          current = this.data.totalGlasses
          break
        case "daily_multiplier":
          current = todayData.glasses / this.settings.dailyGoal
          break
        case "perfect_streak":
          current = this.data.currentStreak
          break
        case "early_log":
          current = this.checkEarlyLog() ? 1 : 0
          break
        case "late_log":
          current = this.checkLateLog() ? 1 : 0
          break
        case "weekend_goals":
          current = this.checkWeekendGoals() ? 1 : 0
          break
      }

      achievement.current = current
      achievement.progress = Math.min((current / achievement.target) * 100, 100)

      if (current >= achievement.target && !achievement.unlocked) {
        achievement.unlocked = true
        achievement.unlockedAt = new Date().toISOString()
        this.showAchievementUnlocked(achievement)
      }
    })

    localStorage.setItem("waterTrackerAchievements", JSON.stringify(this.achievements))
    this.renderAchievements()
  }

  checkEarlyLog() {
    const todayData = this.getTodayData()
    return todayData.timeline.some((entry) => {
      const hour = new Date(entry.timestamp).getHours()
      return hour < 8
    })
  }

  checkLateLog() {
    const todayData = this.getTodayData()
    return todayData.timeline.some((entry) => {
      const hour = new Date(entry.timestamp).getHours()
      return hour >= 22
    })
  }

  checkWeekendGoals() {
    const today = new Date()
    const saturday = new Date(today)
    const sunday = new Date(today)

    // Find last weekend
    const dayOfWeek = today.getDay()
    saturday.setDate(today.getDate() - dayOfWeek + 6)
    sunday.setDate(today.getDate() - dayOfWeek + 7)

    const saturdayKey = saturday.toISOString().split("T")[0]
    const sundayKey = sunday.toISOString().split("T")[0]

    const saturdayData = this.data.dailyRecords[saturdayKey]
    const sundayData = this.data.dailyRecords[sundayKey]

    return saturdayData?.goalAchieved && sundayData?.goalAchieved
  }

  showAchievementUnlocked(achievement) {
    // Simple alert for now - could be enhanced with a modal
    setTimeout(() => {
      alert(`🏆 Achievement Unlocked!\n\n${achievement.title}\n${achievement.description}`)
    }, 1000)
  }

  renderAchievements() {
    const unlockedCount = this.achievements.filter((a) => a.unlocked).length
    document.getElementById("unlocked-count").textContent = unlockedCount

    const categories = [
      { title: "Consistency", icon: "fas fa-fire", color: "linear-gradient(135deg, #f97316, #dc2626)" },
      { title: "Volume", icon: "fas fa-tint", color: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
      { title: "Milestones", icon: "fas fa-trophy", color: "linear-gradient(135deg, #f59e0b, #f97316)" },
      { title: "Special", icon: "fas fa-crown", color: "linear-gradient(135deg, #9333ea, #ec4899)" },
    ]

    const categoriesContainer = document.getElementById("achievement-categories")
    categoriesContainer.innerHTML = ""

    categories.forEach((category) => {
      const categoryAchievements = this.achievements.filter((a) => a.category === category.title.toLowerCase())
      const unlockedInCategory = categoryAchievements.filter((a) => a.unlocked).length

      const categoryDiv = document.createElement("div")
      categoryDiv.className = "card achievement-category"

      categoryDiv.innerHTML = `
                <div class="category-header">
                    <div class="category-icon" style="background: ${category.color}">
                        <i class="${category.icon}"></i>
                    </div>
                    <h3 class="category-title">${category.title}</h3>
                    <span class="category-badge">${unlockedInCategory}/${categoryAchievements.length}</span>
                </div>
                <div class="achievements-grid">
                    ${categoryAchievements
                      .map(
                        (achievement) => `
                        <div class="achievement-item ${achievement.unlocked ? "unlocked" : ""}">
                            <div class="achievement-content">
                                <div class="achievement-icon">
                                    <i class="${achievement.icon}"></i>
                                </div>
                                <div class="achievement-info">
                                    <div class="achievement-header-item">
                                        <h4 class="achievement-title">${achievement.title}</h4>
                                        ${achievement.unlocked ? '<span class="achievement-unlocked-badge">Unlocked!</span>' : ""}
                                    </div>
                                    <p class="achievement-description">${achievement.description}</p>
                                    ${
                                      !achievement.unlocked && achievement.progress !== undefined
                                        ? `
                                        <div class="achievement-progress">
                                            <div class="achievement-progress-header">
                                                <span>Progress</span>
                                                <span>${achievement.current}/${achievement.target}</span>
                                            </div>
                                            <div class="achievement-progress-bar">
                                                <div class="achievement-progress-fill" style="width: ${achievement.progress}%"></div>
                                            </div>
                                        </div>
                                    `
                                        : ""
                                    }
                                    ${
                                      achievement.unlocked && achievement.unlockedAt
                                        ? `
                                        <div class="achievement-date">
                                            Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}
                                        </div>
                                    `
                                        : ""
                                    }
                                </div>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `

      categoriesContainer.appendChild(categoryDiv)
    })

    // Update recent achievements
    this.updateRecentAchievements()
  }

  updateRecentAchievements() {
    const recentAchievements = this.achievements
      .filter((a) => a.unlocked)
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
      .slice(0, 5)

    const recentContainer = document.getElementById("recent-achievements")
    const recentList = document.getElementById("recent-list")

    if (recentAchievements.length === 0) {
      recentContainer.style.display = "none"
      return
    }

    recentContainer.style.display = "block"
    recentList.innerHTML = recentAchievements
      .map(
        (achievement) => `
            <div class="recent-achievement">
                <div class="recent-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="recent-info">
                    <div class="recent-title">${achievement.title}</div>
                    <div class="recent-date">${new Date(achievement.unlockedAt).toLocaleDateString()}</div>
                </div>
                <i class="fas fa-trophy recent-trophy"></i>
            </div>
        `,
      )
      .join("")
  }

  checkReminders() {
    if (!this.settings.remindersEnabled) return

    // Simple hourly reminder (in a real app, you'd use service workers)
    setInterval(() => {
      const now = new Date()
      const hour = now.getHours()

      if (hour >= 8 && hour <= 22 && now.getMinutes() === 0) {
        const todayData = this.getTodayData()
        const progress = (todayData.glasses / this.settings.dailyGoal) * 100

        if (progress < 100) {
          this.showReminder()
        }
      }
    }, 60000) // Check every minute
  }

  showReminder() {
    if (Notification.permission === "granted") {
      new Notification("Water Reminder", {
        body: "Time to drink some water! 💧",
        icon: "/favicon.ico",
      })
    }
  }

  exportData() {
    const exportData = {
      data: this.data,
      settings: this.settings,
      achievements: this.achievements,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `water-tracker-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  importData(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result)

        if (importData.data && importData.settings) {
          this.data = importData.data
          this.settings = importData.settings

          if (importData.achievements) {
            this.achievements = importData.achievements
          }

          this.saveData()
          this.saveSettings()
          localStorage.setItem("waterTrackerAchievements", JSON.stringify(this.achievements))

          this.updateUI()
          this.updateAnalytics()
          this.updateAchievements()

          alert("Data imported successfully!")
        } else {
          alert("Invalid data format!")
        }
      } catch (error) {
        alert("Error importing data: " + error.message)
      }
    }
    reader.readAsText(file)
  }

  resetAllData() {
    if (confirm("Are you sure you want to reset ALL data? This cannot be undone!")) {
      localStorage.removeItem("waterTrackerData")
      localStorage.removeItem("waterTrackerSettings")
      localStorage.removeItem("waterTrackerAchievements")

      this.data = this.loadData()
      this.settings = this.loadSettings()
      this.achievements = this.initializeAchievements()

      this.updateUI()
      this.updateAnalytics()
      this.updateAchievements()

      alert("All data has been reset!")
    }
  }

  bindEvents() {
    // Tab navigation
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab

        // Update active tab
        document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")

        // Show target content
        document.querySelectorAll(".tab-content").forEach((content) => {
          content.classList.remove("active")
        })
        document.getElementById(targetTab).classList.add("active")

        // Update analytics when switching to analytics tab
        if (targetTab === "analytics") {
          this.updateAnalytics()
        }

        // Update achievements when switching to achievements tab
        if (targetTab === "achievements") {
          this.updateAchievements()
        }
      })
    })

    // Water tracking controls
    document.getElementById("add-glass").addEventListener("click", () => this.addGlass())
    document.getElementById("remove-glass").addEventListener("click", () => this.removeGlass())
    document.getElementById("add-half").addEventListener("click", () => this.addGlass(0.5))
    document.getElementById("add-two").addEventListener("click", () => this.addGlass(2))
    document.getElementById("reset-day").addEventListener("click", () => this.resetDay())

    // Settings
    document.getElementById("daily-goal-input").addEventListener("change", (e) => {
      this.settings.dailyGoal = Number.parseInt(e.target.value)
      this.saveSettings()
      this.updateUI()
      this.updateAnalytics()
    })

    document.getElementById("glass-size-input").addEventListener("change", (e) => {
      this.settings.glassSize = Number.parseInt(e.target.value)
      this.saveSettings()
      this.updateUI()
    })

    document.getElementById("reminders-enabled").addEventListener("change", (e) => {
      this.settings.remindersEnabled = e.target.checked
      this.saveSettings()

      if (e.target.checked && Notification.permission === "default") {
        Notification.requestPermission()
      }
    })

    // Data management
    document.getElementById("export-data").addEventListener("click", () => this.exportData())

    document.getElementById("import-data").addEventListener("click", () => {
      document.getElementById("import-file").click()
    })

    document.getElementById("import-file").addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.importData(e.target.files[0])
      }
    })

    document.getElementById("reset-all").addEventListener("click", () => this.resetAllData())

    // Close celebration modal on click
    document.getElementById("celebration-modal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        e.currentTarget.classList.remove("show")
      }
    })

    // Initialize settings UI
    document.getElementById("daily-goal-input").value = this.settings.dailyGoal
    document.getElementById("glass-size-input").value = this.settings.glassSize
    document.getElementById("reminders-enabled").checked = this.settings.remindersEnabled
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new WaterTracker()
})
