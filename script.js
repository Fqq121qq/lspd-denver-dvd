// Безопасная обертка для localStorage
const safeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { console.warn('localStorage is not available'); } }
};

// Анимация частиц для фона
class ParticleAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        const density = window.innerWidth < 768 ? 40000 : 25000;
        const count = Math.floor((this.canvas.width * this.canvas.height) / density);
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const theme = document.documentElement.getAttribute('data-theme');
        const color = theme === 'light' ? '26, 31, 46' : '212, 175, 55';

        this.particles.forEach(p => {
            p.y -= p.speed;
            if (p.y < -10) { p.y = this.canvas.height + 10; p.x = Math.random() * this.canvas.width; }
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animate());
    }
}

const DVD_DATA = {
    schedule: [
        { category: "ВЕРБОВКА ДИЛЕРОВ", time: "18:15", title: "Прием в академию" },
        { category: "ВЕРБОВКА ДИЛЕРОВ", time: "10:15", title: "Прием в академию" },
        { category: "AIRDROP", time: "23:40", title: "Перехват груза" },
        { category: "ТАЙНИКИ", time: "17:30", title: "Зачистка тайников" }
    ]
};

const DVD = {
    intervals: [],

    init() {
        this.setCurrentYear();
        this.renderStats();
        this.renderSchedule("ALL");
        this.initClock();
        this.initCountdown();
        this.initTheme();
        this.initMusic();
        this.initScrollReveal();
        this.initStatsAnimation();
        this.initNavScroll();
        this.initActiveLinks();
        new ParticleAnimation('bgCanvas');
    },

    destroy() {
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];
    },

    setCurrentYear() {
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    },

    initClock() {
        const formatter = new Intl.DateTimeFormat('ru-RU', {
            timeZone: 'America/Los_Angeles',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });

        const update = () => {
            document.getElementById('currentTime').textContent = formatter.format(new Date()) + ' PST';
        };
        
        this.intervals.push(setInterval(update, 1000));
        update();
    },

    initCountdown() {
        let targetDate = safeStorage.get('dvd-countdown-target');
        const now = new Date().getTime();
        
        let parsedDate = parseInt(targetDate, 10);
        if (!targetDate || isNaN(parsedDate) || now > parsedDate) {
            targetDate = now + (3 * 24 * 60 * 60 * 1000);
            safeStorage.set('dvd-countdown-target', targetDate.toString());
        } else {
            targetDate = parsedDate;
        }

        const elements = {
            days: document.getElementById('days'),
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds')
        };

        let prevValues = { days: '', hours: '', minutes: '', seconds: '' };

        const updateCountdown = () => {
            const currentTime = new Date().getTime();
            const distance = targetDate - currentTime;

            if (distance < 0) {
                const newTarget = new Date().getTime() + (3 * 24 * 60 * 60 * 1000);
                safeStorage.set('dvd-countdown-target', newTarget.toString());
                targetDate = newTarget;
                return;
            }

            const vals = {
                days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0'),
                hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
                minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
                seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0')
            };

            Object.keys(vals).forEach(key => {
                if (vals[key] !== prevValues[key]) {
                    elements[key].textContent = vals[key];
                    elements[key].classList.remove('tick');
                    void elements[key].offsetWidth;
                    elements[key].classList.add('tick');
                    prevValues[key] = vals[key];
                }
            });
        };

        this.intervals.push(setInterval(updateCountdown, 1000));
        updateCountdown();
    },

    initTheme() {
        const btn = document.getElementById('themeToggle');
        const savedTheme = safeStorage.get('dvd-theme') || 'dark';
        
        const updateBtnText = (theme) => {
            btn.textContent = theme === 'light' ? '☀️ Сменить тему' : '🌙 Сменить тему';
        };
        updateBtnText(savedTheme);

        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            safeStorage.set('dvd-theme', newTheme);
            updateBtnText(newTheme);
        });
    },

    initMusic() {
        const audio = document.getElementById('bgMusic');
        const btn = document.getElementById('musicToggle');
        const VOLUME = 0.3; // Тихая громкость (30%)
        
        let isPlaying = false;

        const syncUI = (playing) => {
            isPlaying = playing;
            btn.textContent = playing ? '🔈' : '🔇';
            btn.setAttribute('aria-label', playing ? 'Выключить музыку' : 'Включить музыку');
        };

        // Устанавливаем тихую громкость
        audio.volume = VOLUME;

        // Синхронизация с нативными событиями
        audio.addEventListener('play', () => syncUI(true));
        audio.addEventListener('pause', () => syncUI(false));

        // Автовоспроизведение при загрузке (с muted для обхода блокировки)
        audio.muted = true;
        audio.play().catch(() => {
            // Если не удалось — ничего страшного, попробуем при клике
        });

        // При первом клике снимаем mute и играем с тихой громкостью
        const enableSound = () => {
            if (!isPlaying) {
                audio.muted = false;
                audio.volume = VOLUME;
                audio.play()
                    .then(() => syncUI(true))
                    .catch(() => syncUI(false));
            } else {
                // Если уже играет (muted), снимаем mute
                audio.muted = false;
                audio.volume = VOLUME;
            }
            // Удаляем обработчики после первого клика
            document.removeEventListener('click', enableSound);
            document.removeEventListener('touchstart', enableSound);
        };

        document.addEventListener('click', enableSound, { once: true });
        document.addEventListener('touchstart', enableSound, { once: true });

        // Кнопка управления (вкл/выкл)
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isPlaying) {
                audio.pause();
            } else {
                audio.muted = false;
                audio.volume = VOLUME;
                audio.play().catch(err => console.warn('Audio play failed:', err));
            }
        });
    },

    renderSchedule(filter) {
        const grid = document.getElementById('scheduleGrid');
        grid.innerHTML = DVD_DATA.schedule
            .filter(i => filter === "ALL" || i.category === filter)
            .map(i => `<div class="schedule-card"><h4>${i.title}</h4><p>${i.time}</p></div>`).join('');
    },

    initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { 
                if (entry.isIntersecting && !entry.target.classList.contains('active')) {
                    entry.target.classList.add('active');
                    const children = entry.target.querySelectorAll('.about-card, .schedule-card, .stat-item, .staff-card');
                    children.forEach((child, index) => {
                        child.style.transitionDelay = '0s';
                        void child.offsetWidth; 
                        child.style.transitionDelay = `${index * 0.15}s`;
                    });
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    },

    initStatsAnimation() {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const items = entry.target.querySelectorAll('.stat-item h3');
                    items.forEach(item => {
                        const target = parseInt(item.getAttribute('data-target'), 10);
                        this.animateValue(item, 0, target, 2000);
                    });
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) statsObserver.observe(statsContainer);
    },

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            const current = Math.floor(easeProgress * (end - start) + start);
            obj.textContent = current.toLocaleString('ru-RU');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = end.toLocaleString('ru-RU');
            }
        };
        window.requestAnimationFrame(step);
    },

    initNavScroll() {
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('mainNav');
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        });
    },

    initActiveLinks() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 150;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.removeAttribute('aria-current');
                if (link.getAttribute('href') === `#${current}`) {
                    link.setAttribute('aria-current', 'true');
                }
            });
        });
    },

    renderStats() {
        const container = document.getElementById('statsContainer');
        const stats = [
            { name: 'Дел', value: 1240 }, 
            { name: 'Задержаний', value: 856 }, 
            { name: 'Спецопераций', value: 142 }
        ];
        container.innerHTML = stats.map(s => `
            <div class="stat-item"><h3 data-target="${s.value}">0</h3><p>${s.name}</p></div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => DVD.init());